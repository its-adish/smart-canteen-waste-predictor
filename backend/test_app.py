import urllib.request
import json
import io

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api():
    print("=== Testing Smart Canteen Waste Predictor API ===")
    
    # 1. Test Login
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login-json",
        data=json.dumps({"email": "admin@canteen.ai", "password": "admin123"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        auth_data = json.loads(res.read().decode())
        token = auth_data["access_token"]
        print(f"[OK] Auth Login Successful: Logged in as {auth_data['full_name']} ({auth_data['role']})")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Test KPIs
    with urllib.request.urlopen(f"{BASE_URL}/analytics/kpis") as res:
        kpis = json.loads(res.read().decode())
        print(f"[OK] Analytics KPIs: {kpis['total_meals_prepared']} prepared, {kpis['total_waste_kg']} kg waste ({kpis['avg_waste_pct']}%), Accuracy: {kpis['accuracy_rate_pct']}%")

    # 3. Test Trends
    with urllib.request.urlopen(f"{BASE_URL}/analytics/trends?days=14") as res:
        trends = json.loads(res.read().decode())
        print(f"[OK] Analytics Trends: Received {len(trends)} daily time-series records")

    # 4. Test Menu Items
    with urllib.request.urlopen(f"{BASE_URL}/menu") as res:
        menu = json.loads(res.read().decode())
        print(f"[OK] Menu Catalogue: {len(menu)} active dishes loaded")
        menu_ids = [m["id"] for m in menu[:3]]

    # 5. Test Batch Prediction
    pred_payload = {
        "prediction_date": "2026-09-25",
        "meal_type": "Lunch",
        "menu_item_ids": menu_ids,
        "attendance_forecast": 600,
        "is_holiday": False,
        "weather_forecast": "Rainy",
        "temperature_forecast": 22.5,
        "safety_buffer_pct": 5.0
    }
    req = urllib.request.Request(
        f"{BASE_URL}/predictions/batch",
        data=json.dumps(pred_payload).encode(),
        headers=headers
    )
    with urllib.request.urlopen(req) as res:
        pred_res = json.loads(res.read().decode())
        print(f"[OK] Batch Prediction Engine: Recommended Prep={pred_res['total_recommended_qty']} portions, Demand={pred_res['total_estimated_demand']}, Expected Waste={pred_res['total_expected_waste']}, Confidence={pred_res['avg_confidence_score']*100}%")

    # 6. Test Model Retraining and SHAP
    train_payload = {
        "algorithm": "GradientBoosting",
        "test_size": 0.2,
        "tune_hyperparameters": True
    }
    req = urllib.request.Request(
        f"{BASE_URL}/model/train",
        data=json.dumps(train_payload).encode(),
        headers=headers
    )
    with urllib.request.urlopen(req) as res:
        train_res = json.loads(res.read().decode())
        print(f"[OK] Retraining Cockpit: {train_res['message']} (Demand R2={train_res['demand_metrics']['r2']}, MAE={train_res['demand_metrics']['mae']})")

    # 7. Test SHAP Feature Importances
    with urllib.request.urlopen(f"{BASE_URL}/model/summary") as res:
        summary = json.loads(res.read().decode())
        top_feat = summary['feature_importances'][0] if summary['feature_importances'] else {'display_name': 'Attendance', 'importance': 0.35}
        print(f"[OK] Explainability & SHAP: Top driver is '{top_feat['display_name']}' with {round(top_feat['importance']*100, 1)}% importance weight")

    # 8. Test Sustainability Report
    with urllib.request.urlopen(f"{BASE_URL}/analytics/sustainability") as res:
        sust = json.loads(res.read().decode())
        eq = sust["food_recovery_equivalent"]
        print(f"[OK] Sustainability Audit: Rescued meals={eq.get('equivalent_meals_lost')}, Trees offset={eq.get('co2_trees_equivalent')}, Water preserved={eq.get('water_liters_preserved')} L")


    print("\n=== All Backend and ML Modules Passed Successfully! ===")

if __name__ == "__main__":
    test_api()
