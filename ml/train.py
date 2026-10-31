"""Train, tune, compare and save CKD models.  Usage: python train.py [path/to/kidney_disease.csv]"""
import sys, json, warnings
import numpy as np, pandas as pd, joblib
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.pipeline import Pipeline
from sklearn.impute import KNNImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import (train_test_split, RepeatedStratifiedKFold, cross_validate,
                                     RandomizedSearchCV, cross_val_predict)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
                             confusion_matrix, ConfusionMatrixDisplay, roc_curve, classification_report)
from sklearn.inspection import permutation_importance
from common import get_data, FEATURES, LABELS

warnings.filterwarnings("ignore")
SEED = 42
path = sys.argv[1] if len(sys.argv) > 1 else "data/kidney_disease_cleaned.csv"
df, source = get_data(path)
print(f"Data source: {source} | shape={df.shape} | CKD share={df.target.mean():.2%}")

X, y = df[FEATURES], df["target"]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)


def pipe(clf):  # imputation + scaling are fitted INSIDE each CV fold -> no data leakage
    return Pipeline([("imp", KNNImputer(n_neighbors=5)), ("sc", StandardScaler()), ("clf", clf)])


models = {
    "Logistic Regression": pipe(LogisticRegression(max_iter=3000, class_weight="balanced")),
    "Decision Tree": pipe(DecisionTreeClassifier(max_depth=5, class_weight="balanced", random_state=SEED)),
    "SVM (RBF)": pipe(SVC(probability=True, class_weight="balanced", random_state=SEED)),
    "Random Forest": pipe(RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=SEED)),
    "Gradient Boosting": pipe(GradientBoostingClassifier(random_state=SEED)),
}

# --- hyper-parameter tuning for the two strongest families
tune = {
    "Random Forest": {"clf__n_estimators": [200, 300, 500], "clf__max_depth": [None, 6, 10],
                      "clf__min_samples_leaf": [1, 2, 4], "clf__max_features": ["sqrt", "log2"]},
    "Gradient Boosting": {"clf__n_estimators": [100, 200, 300], "clf__learning_rate": [.03, .05, .1],
                          "clf__max_depth": [2, 3, 4], "clf__subsample": [.7, .85, 1.0]},
}
for name, grid in tune.items():
    s = RandomizedSearchCV(models[name], grid, n_iter=12, scoring="f1", cv=5, random_state=SEED, n_jobs=-1).fit(Xtr, ytr)
    models[name] = s.best_estimator_
    print(f"Tuned {name}: best CV F1={s.best_score_:.4f}  {s.best_params_}")

models["Ensemble (soft vote)"] = VotingClassifier(
    [("lr", models["Logistic Regression"]), ("svm", models["SVM (RBF)"]),
     ("rf", models["Random Forest"]), ("gb", models["Gradient Boosting"])], voting="soft")

# --- repeated stratified CV on the training set
cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=SEED)
scoring = {"acc": "accuracy", "prec": "precision", "rec": "recall", "f1": "f1", "auc": "roc_auc"}
rows = []
for name, m in models.items():
    r = cross_validate(m, Xtr, ytr, cv=cv, scoring=scoring, n_jobs=-1)
    rows.append({"Model": name, **{k.upper(): r[f"test_{k}"].mean() for k in scoring},
                 "F1_std": r["test_f1"].std()})
cvdf = pd.DataFrame(rows).sort_values(["F1", "AUC"], ascending=False)
print("\n=== Cross-validation (train set) ===\n", cvdf.round(4).to_string(index=False))
best_name = cvdf.iloc[0]["Model"]
best = models[best_name]

# --- screening threshold: highest cut-off that still keeps recall >= 98% on out-of-fold predictions
oof = cross_val_predict(best, Xtr, ytr, cv=5, method="predict_proba")[:, 1]
thr = 0.5
for t in np.arange(0.9, 0.05, -0.01):
    if recall_score(ytr, oof >= t) >= 0.98:
        thr = float(round(t, 2)); break
print(f"\nBest model: {best_name} | screening threshold = {thr}")

# --- final fit + hold-out evaluation of every model
fitted, test_rows = {}, []
plt.figure(figsize=(6, 5))
for name, m in models.items():
    m.fit(Xtr, ytr); fitted[name] = m
    p = m.predict_proba(Xte)[:, 1]; pred = (p >= (thr if name == best_name else .5)).astype(int)
    test_rows.append({"Model": name, "Accuracy": accuracy_score(yte, pred), "Precision": precision_score(yte, pred),
                      "Recall": recall_score(yte, pred), "F1": f1_score(yte, pred), "ROC_AUC": roc_auc_score(yte, p)})
    fpr, tpr, _ = roc_curve(yte, p); plt.plot(fpr, tpr, label=f"{name} ({roc_auc_score(yte, p):.3f})")
plt.plot([0, 1], [0, 1], "k--"); plt.xlabel("False positive rate"); plt.ylabel("True positive rate")
plt.title("ROC curves (hold-out test)"); plt.legend(fontsize=7); plt.tight_layout(); plt.savefig("roc_curves.png", dpi=150); plt.close()
test_df = pd.DataFrame(test_rows).sort_values("F1", ascending=False)
print("\n=== Hold-out test ===\n", test_df.round(4).to_string(index=False))

pb = best.predict_proba(Xte)[:, 1]; pb_pred = (pb >= thr).astype(int)
print(f"\n{best_name} report:\n", classification_report(yte, pb_pred, target_names=["Not CKD", "CKD"]))
ConfusionMatrixDisplay(confusion_matrix(yte, pb_pred), display_labels=["Not CKD", "CKD"]).plot(cmap="Blues")
plt.title(best_name); plt.tight_layout(); plt.savefig("confusion_matrix.png", dpi=150); plt.close()

# --- global explainability: permutation importance
pi = permutation_importance(best, Xte, yte, n_repeats=20, scoring="f1", random_state=SEED, n_jobs=-1)
imp = pd.Series(pi.importances_mean, index=[LABELS[f] for f in FEATURES]).sort_values()[-12:]
imp.plot.barh(figsize=(7, 5), color="#2a7de1"); plt.title("Top features (permutation importance)")
plt.tight_layout(); plt.savefig("feature_importance.png", dpi=150); plt.close()

joblib.dump({"model": best, "name": best_name, "features": FEATURES, "threshold": thr,
             "medians": Xtr.median(), "source": source}, "ckd_model.joblib")
cvdf.to_csv("cv_results.csv", index=False); test_df.to_csv("test_results.csv", index=False)
json.dump({"best": best_name, "threshold": thr, "source": source}, open("meta.json", "w"))
print("\nSaved: ckd_model.joblib, cv_results.csv, test_results.csv, roc_curves.png, confusion_matrix.png, feature_importance.png, ckd.db")
