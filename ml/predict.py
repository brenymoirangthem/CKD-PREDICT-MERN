"""Bridge used by the Node server.  echo '{...}' | python predict.py     |     python predict.py --metrics"""
import os, sys, json, warnings
warnings.filterwarnings("ignore")
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import joblib, pandas as pd
from common import FEATURES, NUM, CAT, CAT_MAP, add_features, risk_band, explain_patient

if "--metrics" in sys.argv:
    out = {"meta": json.load(open("meta.json"))}
    for k, f in (("cv", "cv_results.csv"), ("test", "test_results.csv")):
        out[k] = pd.read_csv(f).round(4).to_dict("records")
    print(json.dumps(out)); sys.exit()

art = joblib.load("ckd_model.joblib")
rec = json.load(sys.stdin)
blank = lambda v: v is None or str(v).strip() == ""
clean = {c: (None if blank(rec.get(c)) else float(rec[c])) for c in NUM}
clean.update({c: (None if blank(rec.get(c)) else CAT_MAP[c].get(str(rec[c]).strip().lower())) for c in CAT})
row = add_features(pd.DataFrame([clean]).astype(float))[FEATURES]
model = art["model"]
p = float(model.predict_proba(row)[0, 1])
ex = explain_patient(model, row, art["medians"], top=8)
print(json.dumps({"probability": p, "risk": risk_band(p), "flagged": p >= art["threshold"], "threshold": art["threshold"],
                  "model": art["name"], "source": art["source"],
                  "explanation": [{"feature": r.feature, "label": r.label, "impact": round(float(r.impact), 4)} for r in ex.itertuples()]}))
