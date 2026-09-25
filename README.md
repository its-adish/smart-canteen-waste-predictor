# 🍽️ Smart Canteen Waste Predictor & Demand Optimizer

An AI-powered full-stack web application designed to reduce food waste, optimize kitchen preparation quantities, and deliver actionable sustainability analytics for institutional canteens.

---

## 🌟 Key Features

- **🤖 Machine Learning Demand & Waste Forecasting**: Uses Random Forest and Gradient Boosting models trained on operational, temporal, and contextual indicators.
- **📊 Real-time Kitchen Operations Dashboard**: Live KPIs tracking meal preparation, food waste percentage, target variance, and model accuracy.
- **🔮 Batch Meal Preparation Predictor**: Generates portion recommendations with confidence intervals and weather/holiday contextual weighting.
- **⚖️ Explainability Engine (SHAP-style Feature Importance)**: Highlights why a recommendation was made (footfall, previous waste lag, menu category, day of week).
- **🌱 Environmental & ESG Sustainability Audit**: Quantifies meals rescued, CO₂ emissions averted, trees offset, and water preserved.
- **🔄 Staff Feedback & Closed-Loop Retraining**: Kitchen managers log actual outcomes, triggering automated continuous model retraining.
- **🔐 Role-Based Access Control**: Tailored workflows for Kitchen Managers and Institutional Administrators with JWT + Firebase integration.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Firebase Client SDK
- **Backend**: FastAPI (Python 3.11+ / 3.14), SQLAlchemy, Pydantic v2, Scikit-Learn, Pandas, NumPy, Joblib
- **Database**: SQLite (default local) / PostgreSQL (production upgradeable)
- **Deployment**: Vercel-ready serverless architecture (`vercel.json` + `api/index.py`) and unified local single-process server (`run.py`).

---

## 🚀 Quick Start (Local Development)

### 1. Run Combined Server (Frontend + Backend)
You can run the entire full-stack application on a single port with one command using the virtual environment:

```powershell
# Using the Windows batch launcher
.\run.bat

# Or directly with Python in the venv
.\venv\Scripts\python.exe run.py
```

- **Web App (UI)**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Firebase Config**: [http://localhost:8000/api/firebase-config](http://localhost:8000/api/firebase-config)

### 2. Frontend Standalone Dev (Optional)
If you want hot-reloading for frontend UI development:
```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Deploying to Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. Vercel automatically detects `vercel.json` for:
   - Compiling the React Vite frontend into `frontend/dist`
   - Deploying Python serverless functions via `api/index.py`
3. Add the following **Environment Variables** in your Vercel project settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `SECRET_KEY`

---

## 📄 License
MIT License.
