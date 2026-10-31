"""Shared data loading, cleaning, feature engineering and explanation helpers."""
from pathlib import Path
import numpy as np
import pandas as pd

NUM = ["age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc", "rc"]
CAT_MAP = {
    "rbc": {"normal": 0, "abnormal": 1}, "pc": {"normal": 0, "abnormal": 1},
    "pcc": {"notpresent": 0, "present": 1}, "ba": {"notpresent": 0, "present": 1},
    "htn": {"no": 0, "yes": 1}, "dm": {"no": 0, "yes": 1}, "cad": {"no": 0, "yes": 1},
    "appet": {"good": 0, "poor": 1}, "pe": {"no": 0, "yes": 1}, "ane": {"no": 0, "yes": 1},
}
CAT = list(CAT_MAP)
ENG = ["bu_sc_ratio", "sc_hemo_ratio"]          # engineered clinical ratios
FEATURES = NUM + CAT + ENG
LABELS = {
    "age": "Age (years)", "bp": "Blood pressure (mm Hg)", "sg": "Specific gravity", "al": "Albumin (0-5)",
    "su": "Sugar (0-5)", "bgr": "Blood glucose random (mg/dL)", "bu": "Blood urea (mg/dL)",
    "sc": "Serum creatinine (mg/dL)", "sod": "Sodium (mEq/L)", "pot": "Potassium (mEq/L)",
    "hemo": "Hemoglobin (g/dL)", "pcv": "Packed cell volume", "wc": "WBC count (cells/cumm)",
    "rc": "RBC count (millions/cmm)", "rbc": "Red blood cells", "pc": "Pus cell", "pcc": "Pus cell clumps",
    "ba": "Bacteria", "htn": "Hypertension", "dm": "Diabetes mellitus", "cad": "Coronary artery disease",
    "appet": "Appetite", "pe": "Pedal edema", "ane": "Anemia",
    "bu_sc_ratio": "Urea/Creatinine ratio", "sc_hemo_ratio": "Creatinine/Hemoglobin ratio",
}


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["bu_sc_ratio"] = df["bu"] / df["sc"].replace(0, np.nan)
    df["sc_hemo_ratio"] = df["sc"] / df["hemo"].replace(0, np.nan)
    return df


def load_clean(path) -> pd.DataFrame:
    """Load the UCI CKD csv (handles '?', tabs, stray spaces, typos) -> numeric dataframe + 'target'."""
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.rename(columns={
    "wbcc": "wc",
    "rbcc": "rc",
    "class": "classification"
})
    df = df.drop(columns=["id"], errors="ignore")
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].astype(str).str.strip().str.lower().replace({"?": np.nan, "nan": np.nan, "": np.nan})
    for c in NUM:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    for c, m in CAT_MAP.items():
        df[c] = df[c].map(m)
    df["target"] = df["classification"].map({"ckd": 1, "notckd": 0})
    df = df.dropna(subset=["target"]).drop(columns=["classification"])
    df["target"] = df["target"].astype(int)
    return add_features(df)[FEATURES + ["target"]].reset_index(drop=True)


def make_synthetic(n=400, seed=42) -> pd.DataFrame:
    """Fallback demo data (NOT real) so the code runs without the UCI file."""
    r = np.random.default_rng(seed)
    y = (r.random(n) < 0.625).astype(int)
    g = lambda a, b, s: np.where(y == 1, r.normal(a, s, n), r.normal(b, s, n))
    d = pd.DataFrame({
        "age": np.clip(g(57, 46, 15), 2, 90), "bp": np.clip(g(79, 72, 12), 50, 180),
        "sg": np.clip(g(1.013, 1.021, .005), 1.005, 1.025).round(3), "al": np.clip(np.round(g(2, .2, 1.2)), 0, 5),
        "su": np.clip(np.round(g(.8, 0, .9)), 0, 5), "bgr": np.clip(g(150, 108, 45), 70, 490),
        "bu": np.clip(g(72, 33, 30), 10, 390), "sc": np.clip(g(4, .9, 2.5), .4, 20),
        "sod": np.clip(g(135, 141, 5), 100, 160), "pot": np.clip(g(4.6, 4.3, .8), 2.5, 8),
        "hemo": np.clip(g(10.5, 15, 2.2), 3.1, 17.8), "pcv": np.clip(g(32, 46, 7), 9, 54),
        "wc": np.clip(g(8800, 7500, 2500), 2200, 26000), "rc": np.clip(g(3.8, 5.2, .7), 2.1, 8),
    })
    for c in CAT:
        p = {"rbc": .4, "pc": .45, "pcc": .2, "ba": .1, "htn": .6, "dm": .5, "cad": .15, "appet": .35, "pe": .4, "ane": .3}[c]
        d[c] = (r.random(n) < np.where(y == 1, p, p * .08)).astype(float)
    d = add_features(d)[FEATURES]
    d = d.mask(r.random(d.shape) < 0.08)           # ~8% missing like the real set
    d["target"] = y
    return d


def get_data(path="data/kidney_disease.csv"):
    if Path(path).exists():
        return load_clean(path), "UCI CKD dataset"
    print(f"[!] {path} not found -> using SYNTHETIC demo data. Download the real UCI CKD csv for real results.")
    return make_synthetic(), "SYNTHETIC demo data"


def risk_band(p: float) -> str:
    return "LOW" if p < 0.30 else "MODERATE" if p < 0.70 else "HIGH"


def explain_patient(model, row: pd.DataFrame, medians: pd.Series, top=6) -> pd.DataFrame:
    """Model-agnostic local explanation: replace each feature by its median and see how P(CKD) moves."""
    base = model.predict_proba(row[FEATURES])[0, 1]
    out = []
    for f in FEATURES:
        r2 = row[FEATURES].copy()
        r2[f] = medians[f]
        if f in ("sc", "hemo", "bu"):             # keep engineered ratios consistent
            r2 = add_features(r2.drop(columns=ENG))[FEATURES]
        out.append((f, LABELS[f], base - model.predict_proba(r2)[0, 1]))
    df = pd.DataFrame(out, columns=["feature", "label", "impact"])
    return df.reindex(df.impact.abs().sort_values(ascending=False).index).head(top).reset_index(drop=True)
