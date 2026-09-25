# Smart Canteen Waste Predictor
### Product Requirements Document (PRD) & Technical Requirements Document (TRD)

**Status:** Draft — based on literature review phase (39 sources reviewed)
**Owner:** Adish S
**Document version:** 1.0

---

## Part 1 — Product Requirements Document (PRD)

### 1.1 Problem Statement
Canteens routinely over- or under-prepare food because kitchen staff rely on experience and intuition rather than data. This results in:
- **Overproduction** → food waste, financial loss, environmental impact
- **Underproduction** → stockouts, poor student/staff experience

There is currently no system in place that predicts daily food demand and expected waste using historical and contextual data.

### 1.2 Goal
Build a system that predicts:
1. **Expected food demand** for a given day/meal (how much to prepare)
2. **Expected food waste** (how much is likely to be left over), so kitchen staff can adjust preparation quantities proactively

### 1.3 Target Users
| User | Need |
|---|---|
| Canteen/kitchen manager | Daily preparation quantity recommendation |
| Institution administration | Waste and cost trend reports |
| (Stretch) Students/staff | Visibility into sustainability impact |

### 1.4 Success Metrics
- Reduction in measured food waste (kg or % of prepared quantity) vs. a pre-system baseline period
- Prediction accuracy: MAE / RMSE for demand, and for waste quantity, within an agreed tolerance band
- Adoption: % of days kitchen staff actually use the recommended quantity
- (Stretch) Cost savings from reduced overproduction

### 1.5 Scope

**In scope (v1):**
- Predict next-day demand for the canteen's standard meal service
- Predict expected waste quantity/percentage based on predicted demand + contextual features
- Simple dashboard/report showing prediction + recommended preparation quantity
- Historical trend view (demand and waste over time)

**Out of scope (v1):**
- Real-time computer-vision plate-waste detection (flagged as a v2/stretch feature — infrastructure-heavy)
- Menu recommendation or auto-generation
- Inventory/procurement automation
- Multi-canteen / multi-institution deployment

### 1.6 Core Features (v1)

| Feature | Description | Priority |
|---|---|---|
| Demand prediction | Predicts number of meals/portions needed for next day(s), per meal type | Must-have |
| Waste prediction | Predicts expected waste quantity given predicted demand + actual preparation | Must-have |
| Feature inputs | Day-of-week, holiday/event flag, menu type, historical demand (lag), attendance/footfall if available | Must-have |
| Recommendation output | Suggested preparation quantity with confidence range | Must-have |
| Historical dashboard | Charts of demand vs. actual, waste vs. actual, over time | Should-have |
| Manual override + feedback loop | Staff can log actual demand/waste for retraining | Should-have |
| Alerts | Flag days with unusually high predicted waste risk (e.g., holiday mismatch) | Could-have |
| Plate-level CV waste detection | Camera-based per-plate waste % | Won't-have (v1) — future scope |

### 1.7 User Flow (v1)
1. System pulls historical demand/waste data + today's context (day, holidays, known events)
2. Model generates next-day demand and waste prediction
3. Kitchen manager views recommended preparation quantity on a dashboard
4. After the meal, actual demand/waste is logged back into the system
5. Model periodically retrains on the growing dataset

### 1.8 Constraints & Assumptions
- Assumes historical demand/waste records exist or can be collected in a simple loggable format
- No dedicated hardware (cameras/sensors) assumed for v1 — feature engineering relies on tabular/operational data
- Single-canteen deployment for v1; multi-site generalization explicitly out of scope
- Model accuracy will improve as more real (non-synthetic) data accumulates — v1 predictions should be presented with a confidence indicator, not as certainty

### 1.9 Open Questions
- What data does the canteen currently log today (if any), and in what format?
- Is per-meal-type prediction needed (breakfast/lunch/dinner/snacks) or a single daily aggregate?
- Is there a budget/appetite for future camera-based waste measurement (v2)?

---

## Part 2 — Technical Requirements Document (TRD)

### 2.1 System Overview
A supervised machine learning pipeline that ingests historical + contextual data and outputs (a) a demand forecast and (b) a waste estimate, exposed through a simple dashboard.

```
[Data Sources] → [Data Pipeline] → [Feature Store] → [ML Models] → [Prediction API] → [Dashboard]
                                                              ↑
                                                     [Feedback/Retraining Loop]
```

### 2.2 Data Requirements

**Minimum viable historical dataset:**
- Date, meal type, day-of-week
- Quantity prepared
- Quantity actually consumed/ordered (demand)
- Quantity wasted (leftover)
- Holiday/special event flag
- (Optional but valuable) Attendance/footfall count, weather, menu item(s) served

**Data volume:** Literature suggests even 30–180 days of clean daily records can support a working baseline; more (6+ months) meaningfully improves reliability, especially across seasonal/holiday cycles.

**Data source options (choose one for MVP):**
- Manually logged spreadsheet/form filled by canteen staff (fastest to start)
- Existing canteen billing/POS system export, if one exists
- Public benchmark dataset (e.g., Genpact/Kaggle Food Demand Forecasting) for early model development and testing before real data is available

### 2.3 Feature Engineering Requirements
| Feature | Type | Source |
|---|---|---|
| Day of week | Categorical | Derived from date |
| Holiday/event flag | Binary | Institutional calendar |
| Historical demand (lag 1, 7, 14 days) | Numeric | Historical logs |
| Menu type/category | Categorical | Menu schedule |
| Attendance/footfall (if available) | Numeric | Manual count / ID scans |
| Previous waste level | Numeric | Historical logs |
| Weather (optional, stretch) | Numeric | Public weather API |

### 2.4 Model Requirements

**Baseline models (v1):**
- Random Forest Regressor or Gradient Boosting (XGBoost/LightGBM) — for demand and waste regression
- Simple Linear Regression as an interpretable fallback/sanity baseline

**Candidate upgrade (v1.x, if data volume/sequence quality supports it):**
- LSTM for demand forecasting, if enough continuous daily time-series data accumulates

**Evaluation metrics:**
- MAE, RMSE for demand prediction
- MAE, RMSE, R² for waste quantity prediction
- Explicit train/test split respecting chronological order (no random shuffling of time-series data)
- **Data leakage check required** before reporting accuracy — verify no feature is mechanically derived from the target (e.g., don't use same-day "actual orders" to predict same-day waste)

**Explainability requirement:**
- Feature importance output (e.g., SHAP or built-in tree-based importances) so kitchen managers can understand *why* a prediction was made, not just the number

### 2.5 System Components

| Component | Requirement |
|---|---|
| Data ingestion | Script/form to log daily demand + waste (CSV/spreadsheet acceptable for v1) |
| Data storage | Lightweight database (SQLite/PostgreSQL) or structured spreadsheet for v1 |
| Model training pipeline | Python (scikit-learn / XGBoost / TensorFlow-Keras for LSTM), retrainable on a schedule (e.g., weekly) |
| Prediction service | Simple API (Flask/FastAPI) or scheduled batch job producing next-day predictions |
| Dashboard | Web dashboard (e.g., Streamlit) showing predictions, recommendations, and historical trends |
| Feedback loop | Mechanism for staff to log actual outcomes, feeding back into retraining data |

### 2.6 Non-Functional Requirements
- **Usability:** Kitchen staff should be able to read the recommendation without ML expertise (plain numbers + simple confidence indicator, not raw model output)
- **Latency:** Predictions only need to run once daily (batch), so real-time inference is not required
- **Reliability:** System should degrade gracefully — if a feature (e.g., attendance count) is missing for a day, the model should still produce a prediction using available features
- **Maintainability:** Retraining pipeline should be simple enough to re-run manually or on a schedule as new data accumulates
- **Data privacy:** No personally identifiable student/staff data required for the core prediction task; footfall/attendance should be aggregate counts, not individual-level records

### 2.7 Tech Stack (proposed)
- **Language:** Python
- **ML libraries:** scikit-learn, XGBoost/LightGBM, (optional) TensorFlow/Keras for LSTM
- **Explainability:** SHAP
- **Data storage:** SQLite (v1) → PostgreSQL (if scaling)
- **API layer:** FastAPI or Flask
- **Dashboard:** Streamlit (fast to build, matches skill set from prior projects)
- **Deployment:** Local/on-prem for v1 (single canteen); AWS EC2 (already familiar) if hosting becomes necessary

### 2.8 Milestones (suggested)
1. **M1 — Data collection setup:** Logging mechanism live, first 2–4 weeks of real data collected (or public dataset substituted for early development)
2. **M2 — Baseline model:** Random Forest/XGBoost demand + waste model trained and evaluated with leakage-checked metrics
3. **M3 — Dashboard MVP:** Predictions + recommendations visible to kitchen manager
4. **M4 — Feedback loop:** Actual outcomes logged and used for retraining
5. **M5 — Evaluation:** Compare measured waste reduction against baseline period

---

*This document is a working draft intended to guide implementation planning. Data availability (Section 2.2) should be validated with the canteen before finalizing model and feature choices.*
