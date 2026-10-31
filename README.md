# NephroAI – AI-Powered Chronic Kidney Disease Risk Prediction System

Full-stack app: **React + Tailwind** frontend, **Node/Express + MongoDB** API with **JWT (HTTP-only cookie)** auth,
a **scikit-learn** model served through a Python bridge, optional **Google Gemini** plain-language summaries, and PDF reports.

```
NephroAI-mern/
  ml/       Python: train.py (train/tune/compare), predict.py (bridge used by Node), common.py
  server/   Express API: auth, predictions CRUD/search/stats, PDF report, model metrics
  client/   React (Vite) UI: login/signup, dashboard, screening form, result page, patients, model page
```

## Setup (4 terminals-worth of steps)
**Prerequisites:** Node 18+, Python 3.10+, MongoDB (local or free Atlas URI).

1. **Train the model**
   ```
   cd ml
   pip install -r requirements.txt
   # save the UCI CKD dataset as ml/data/kidney_disease.csv
   python train.py
   ```
   (Without the csv it trains on SYNTHETIC demo data and the UI shows a warning banner.)
2. **API**
   ```
   cd server
   cp .env.example .env      # set MONGO_URI, JWT_SECRET, PYTHON_BIN (python / python3 / venv path)
   npm install
   npm run dev
   ```
3. **Frontend**
   ```
   cd client
   npm install
   npm run dev               # http://localhost:5173  (proxies /api to :5000)
   ```
4. Open http://localhost:5173, sign up, click **New screening** (use the "Sample" buttons for a quick demo).

Optional AI summary: put `GEMINI_API_KEY` in `server/.env` (model name via `GEMINI_MODEL`). Leave empty to disable.

## Features
- JWT auth in HTTP-only cookies, protected routes, per-user data isolation
- 24-field clinical form (only age, BP, creatinine, hemoglobin required; blanks are imputed by the model)
- Risk gauge, Low/Moderate/High band, referral flag tuned for >=98% recall
- Per-patient explanation chart ("why this result"), downloadable PDF report, optional Gemini summary
- Patients page with search, risk filter, pagination, delete
- Dashboard analytics (risk distribution, 14-day activity) and Model page (CV/test tables, ROC, confusion matrix, importances)

## API
`POST /api/auth/signup|login|logout`, `GET /api/auth/me`, `POST|GET /api/predictions`, `GET /api/predictions/stats`,
`GET|DELETE /api/predictions/:id`, `GET /api/predictions/:id/report`, `GET /api/model/metrics`

## Deployment
- **Frontend -> Vercel**: root `client`, build `npm run build`, env `VITE_API_URL=https://<your-api>`.
- **API -> Render (Docker)**: use `server/Dockerfile` with the repo root as build context (it bundles Python + Node). Commit `ml/ckd_model.joblib`, `ml/meta.json`, `ml/*.csv/png` outputs (remove them from .gitignore) so the container has the trained model. Env: `MONGO_URI, JWT_SECRET, CLIENT_URL=https://<your-vercel-app>, NODE_ENV=production`. Cookies use `SameSite=None; Secure` in production.

## Notes
- Python is spawned per prediction (about 1 s); fine for a project demo. For heavy traffic, wrap predict.py in a FastAPI service.
- Decision support only, not a diagnosis. The UCI set is small, so near-100% accuracy may be optimistic.
