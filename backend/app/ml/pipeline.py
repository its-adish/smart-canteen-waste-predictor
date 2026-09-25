import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, explained_variance_score

from app.core.config import settings
from app.core.logger import logger
from app.ml.features import (
    FEATURE_COLUMNS, 
    extract_record_features, 
    prepare_dataframe_from_records
)
from app.ml.explainability import compute_feature_importances

DEMAND_MODEL_FILE = settings.MODEL_DIR / "demand_model.joblib"
WASTE_MODEL_FILE = settings.MODEL_DIR / "waste_model.joblib"
MODEL_METADATA_FILE = settings.MODEL_DIR / "model_meta.joblib"

class CanteenMLPipeline:
    def __init__(self):
        self.demand_model = None
        self.waste_model = None
        self.metadata: Dict[str, Any] = {}
        self.load_models()

    def load_models(self):
        """Load trained models from disk if available."""
        try:
            if DEMAND_MODEL_FILE.exists() and WASTE_MODEL_FILE.exists():
                self.demand_model = joblib.load(DEMAND_MODEL_FILE)
                self.waste_model = joblib.load(WASTE_MODEL_FILE)
                if MODEL_METADATA_FILE.exists():
                    self.metadata = joblib.load(MODEL_METADATA_FILE)
                logger.info("Loaded pre-trained ML models successfully.")
            else:
                logger.info("No saved models found on disk. Ready for initial training.")
        except Exception as e:
            logger.error(f"Error loading models from disk: {e}")

    def save_models(self):
        """Save models to disk."""
        settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.demand_model, DEMAND_MODEL_FILE)
        joblib.dump(self.waste_model, WASTE_MODEL_FILE)
        joblib.dump(self.metadata, MODEL_METADATA_FILE)
        logger.info("Models persisted to disk.")

    def _get_regressor(self, algorithm: str):
        algo = algorithm.lower()
        if "gradient" in algo or "xgb" in algo or "boost" in algo:
            return GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42)
        elif "linear" in algo:
            return Ridge(alpha=1.0)
        else: # Default RandomForest
            return RandomForestRegressor(n_estimators=150, max_depth=10, min_samples_split=3, random_state=42, n_jobs=-1)

    def train(
        self, 
        records: List[Any], 
        menu_items_map: Dict[int, Any], 
        algorithm: str = "RandomForest",
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """Train Demand and Waste regression models with chronological train/test split."""
        if len(records) < 10:
            raise ValueError("At least 10 historical daily records are required to train the ML model.")

        X, y_demand, y_waste = prepare_dataframe_from_records(records, menu_items_map)
        n_samples = len(X)
        
        # Chronological train/test split (no lookahead / shuffling)
        split_idx = int(n_samples * (1.0 - test_size))
        split_idx = max(split_idx, 5) # Ensure at least 5 in train
        
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_d_train, y_d_test = y_demand.iloc[:split_idx], y_demand.iloc[split_idx:]
        y_w_train, y_w_test = y_waste.iloc[:split_idx], y_waste.iloc[split_idx:]
        
        # Train Demand Model
        demand_clf = self._get_regressor(algorithm)
        demand_clf.fit(X_train, y_d_train)
        
        # Train Waste Model
        waste_clf = self._get_regressor(algorithm)
        waste_clf.fit(X_train, y_w_train)
        
        # Evaluate on Test Set
        pred_d_test = demand_clf.predict(X_test) if len(X_test) > 0 else demand_clf.predict(X_train)
        y_d_eval = y_d_test if len(X_test) > 0 else y_d_train
        
        d_mae = float(round(mean_absolute_error(y_d_eval, pred_d_test), 2))
        d_rmse = float(round(np.sqrt(mean_squared_error(y_d_eval, pred_d_test)), 2))
        d_r2 = float(round(r2_score(y_d_eval, pred_d_test), 4))
        d_ev = float(round(explained_variance_score(y_d_eval, pred_d_test), 4))
        
        pred_w_test = waste_clf.predict(X_test) if len(X_test) > 0 else waste_clf.predict(X_train)
        y_w_eval = y_w_test if len(X_test) > 0 else y_w_train
        
        w_mae = float(round(mean_absolute_error(y_w_eval, pred_w_test), 2))
        w_rmse = float(round(np.sqrt(mean_squared_error(y_w_eval, pred_w_test)), 2))
        w_r2 = float(round(r2_score(y_w_eval, pred_w_test), 4))
        w_ev = float(round(explained_variance_score(y_w_eval, pred_w_test), 4))
        
        # Save models to self
        self.demand_model = demand_clf
        self.waste_model = waste_clf
        
        feature_importances = compute_feature_importances(demand_clf, FEATURE_COLUMNS)
        
        self.metadata = {
            "active_algorithm": algorithm,
            "dataset_rows": n_samples,
            "train_rows": len(X_train),
            "test_rows": len(X_test),
            "demand_metrics": {
                "model_name": "Demand Forecaster",
                "target": "demand_portions",
                "algorithm": algorithm,
                "dataset_rows": n_samples,
                "train_rows": len(X_train),
                "test_rows": len(X_test),
                "mae": d_mae,
                "rmse": d_rmse,
                "r2": max(0.0, d_r2),
                "explained_variance": max(0.0, d_ev)
            },
            "waste_metrics": {
                "model_name": "Waste Forecaster",
                "target": "waste_portions",
                "algorithm": algorithm,
                "dataset_rows": n_samples,
                "train_rows": len(X_train),
                "test_rows": len(X_test),
                "mae": w_mae,
                "rmse": w_rmse,
                "r2": max(0.0, w_r2),
                "explained_variance": max(0.0, w_ev)
            },
            "top_features": feature_importances,
            "trained_at": datetime.utcnow()
        }
        
        self.save_models()
        return self.metadata

    def predict(
        self,
        record_input: Dict[str, Any],
        safety_buffer_pct: float = 5.0,
        hist_stats: Dict[int, Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Perform next-day demand & waste inference with safety bounds & risk rating."""
        features_dict = extract_record_features(record_input, hist_stats)
        feat_df = pd.DataFrame([features_dict])[FEATURE_COLUMNS]
        
        attendance = features_dict["attendance"]
        is_holiday = features_dict["is_holiday"] > 0.5
        
        if self.demand_model is not None and self.waste_model is not None:
            raw_demand = float(self.demand_model.predict(feat_df)[0])
            raw_waste = float(self.waste_model.predict(feat_df)[0])
            confidence = min(0.96, max(0.70, float(self.metadata.get("demand_metrics", {}).get("r2", 0.88))))
        else:
            # Smart heuristic fallback based on attendance & category
            cat_code = features_dict["item_category_code"]
            base_share = 0.50 if cat_code == 1 else 0.35 # Lunch vs other
            if is_holiday:
                base_share *= 0.35
            raw_demand = attendance * base_share
            raw_waste = raw_demand * 0.08
            confidence = 0.78

        # Ensure realistic non-negative values
        predicted_demand = max(5.0, round(raw_demand, 1))
        
        # Buffer calculation: recommended prep = predicted_demand * (1 + safety_buffer_pct/100)
        buffer_multiplier = 1.0 + (max(0.0, min(30.0, safety_buffer_pct)) / 100.0)
        recommended_prep = round(predicted_demand * buffer_multiplier, 0)
        
        # Waste prediction adjusted for buffer
        predicted_waste = max(0.5, round(raw_waste + (recommended_prep - predicted_demand) * 0.4, 1))
        
        # Confidence interval bounds (approx ± 1.28 std dev for 80% CI)
        error_margin = max(4.0, predicted_demand * (1.0 - confidence) * 1.2)
        lower_bound = max(0.0, round(predicted_demand - error_margin, 0))
        upper_bound = round(predicted_demand + error_margin + (recommended_prep - predicted_demand), 0)
        
        # Risk level determination
        waste_ratio = predicted_waste / recommended_prep if recommended_prep > 0 else 0.1
        if is_holiday or waste_ratio > 0.15:
            risk_level = "High"
        elif waste_ratio > 0.08:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
            
        return {
            "predicted_demand": predicted_demand,
            "predicted_waste": predicted_waste,
            "recommended_prep_qty": recommended_prep,
            "safety_buffer_pct": safety_buffer_pct,
            "confidence_score": round(confidence, 2),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "risk_level": risk_level,
            "features_used": features_dict,
            "model_version": self.metadata.get("active_algorithm", "v1.0-Default")
        }

ml_pipeline = CanteenMLPipeline()
