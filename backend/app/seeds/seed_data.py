import random
import json
from datetime import date, timedelta, datetime
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.menu import MenuItem, MealCategory
from app.models.record import DailyRecord
from app.models.prediction import DailyPrediction
from app.models.model_metric import ModelTrainingLog
from app.ml.pipeline import ml_pipeline

def seed_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users if not present
        if db.query(User).count() == 0:
            print("Seeding demo users...")
            admin_user = User(
                email="admin@canteen.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="Dr. Eleanor Vance (Admin)",
                role=UserRole.ADMIN,
                is_active=True
            )
            kitchen_user = User(
                email="kitchen@canteen.ai",
                hashed_password=get_password_hash("kitchen123"),
                full_name="Chef Marco Rossi (Kitchen Manager)",
                role=UserRole.KITCHEN_MANAGER,
                is_active=True
            )
            db.add(admin_user)
            db.add(kitchen_user)
            db.commit()

        # 2. Seed Menu Items
        if db.query(MenuItem).count() == 0:
            print("Seeding menu items...")
            menu_data = [
                # Breakfast
                {"name": "Sunrise Scrambled Eggs & Toast", "category": MealCategory.BREAKFAST, "portion_size_g": 300, "cost_per_portion": 1.80, "co2_per_kg": 1.9, "description": "Free-range scrambled eggs with whole grain toast and herb butter."},
                {"name": "Warm Berry Oatmeal Porridge", "category": MealCategory.BREAKFAST, "portion_size_g": 350, "cost_per_portion": 1.40, "co2_per_kg": 0.8, "description": "Steel cut oats topped with honey, chia seeds, and fresh berries."},
                {"name": "Breakfast Burrito Bowl", "category": MealCategory.BREAKFAST, "portion_size_g": 400, "cost_per_portion": 2.20, "co2_per_kg": 2.3, "description": "Black beans, scrambled eggs, cheddar, roasted salsa, and avocado slices."},
                
                # Lunch
                {"name": "Mediterranean Grilled Chicken Bowl", "category": MealCategory.LUNCH, "portion_size_g": 450, "cost_per_portion": 3.60, "co2_per_kg": 2.6, "description": "Herb-marinated chicken breast over basmati rice with cucumber tzatziki and hummus."},
                {"name": "Tuscan White Bean & Veggie Stew", "category": MealCategory.LUNCH, "portion_size_g": 400, "cost_per_portion": 2.40, "co2_per_kg": 0.9, "description": "Slow-cooked white cannellini beans with kale, carrots, and rosemary in tomato broth."},
                {"name": "Classic Beef Bolognese Pasta", "category": MealCategory.LUNCH, "portion_size_g": 420, "cost_per_portion": 3.80, "co2_per_kg": 5.8, "description": "Penne pasta with slow-simmered beef ragu and grated parmesan cheese."},
                {"name": "Crispy Tofu Teriyaki Bowl", "category": MealCategory.LUNCH, "portion_size_g": 380, "cost_per_portion": 2.70, "co2_per_kg": 1.1, "description": "Glazed tofu cubes with steamed broccoli, jasmine rice, and toasted sesame seeds."},
                
                # Dinner
                {"name": "Honey Mustard Baked Salmon", "category": MealCategory.DINNER, "portion_size_g": 420, "cost_per_portion": 4.50, "co2_per_kg": 3.2, "description": "Oven-roasted wild salmon fillet with quinoa pilaf and garlic asparagus."},
                {"name": "Moroccan Spiced Chickpea Tagine", "category": MealCategory.DINNER, "portion_size_g": 400, "cost_per_portion": 2.60, "co2_per_kg": 1.0, "description": "Fragrant chickpea stew with apricots, almonds, and fluffy couscous."},
                {"name": "Homestyle Roasted Turkey & Gravy", "category": MealCategory.DINNER, "portion_size_g": 450, "cost_per_portion": 3.90, "co2_per_kg": 2.8, "description": "Carved turkey breast with mashed potatoes, cranberry compote, and green beans."},
                
                # Snacks
                {"name": "Artisan Caprese Panini", "category": MealCategory.SNACKS, "portion_size_g": 250, "cost_per_portion": 2.10, "co2_per_kg": 1.7, "description": "Fresh mozzarella, vine tomatoes, basil pesto on toasted sourdough."},
                {"name": "Spiced Baked Falafel Wrap", "category": MealCategory.SNACKS, "portion_size_g": 280, "cost_per_portion": 1.90, "co2_per_kg": 0.9, "description": "Baked herb falafels with shredded red cabbage and lemon tahini dressing."}
            ]
            
            for item in menu_data:
                mi = MenuItem(**item)
                db.add(mi)
            db.commit()

        # 3. Seed 90 Days of Realistic Historical Daily Records
        if db.query(DailyRecord).count() == 0:
            print("Seeding 90 days of realistic daily canteen records...")
            menu_items = db.query(MenuItem).all()
            today = date.today()
            
            weathers = ["Sunny", "Sunny", "Cloudy", "Rainy", "Sunny", "Rainy", "Stormy"]
            
            for d_offset in range(90, 0, -1):
                rec_date = today - timedelta(days=d_offset)
                day_of_week = rec_date.weekday() # 0=Mon, 6=Sun
                is_weekend = day_of_week in (5, 6)
                
                # Baseline campus footfall
                if is_weekend:
                    base_attendance = random.randint(180, 260)
                elif day_of_week in (1, 2, 3): # Tue, Wed, Thu peak
                    base_attendance = random.randint(580, 680)
                else: # Mon, Fri
                    base_attendance = random.randint(480, 560)
                    
                # Holiday check (e.g. 1 in 25 days)
                is_holiday = random.random() < 0.05
                if is_holiday:
                    base_attendance = int(base_attendance * 0.35)
                    
                weather = random.choice(weathers)
                temp = round(random.uniform(18.0, 32.0), 1)
                
                # If rainy, attendance is slightly more concentrated in canteen
                if weather in ("Rainy", "Stormy"):
                    base_attendance = int(base_attendance * 1.08)
                    
                # For each menu item, simulate meal service
                for item in menu_items:
                    # Item share of meal
                    cat = item.category.value if hasattr(item.category, 'value') else str(item.category)
                    
                    if cat == "Breakfast":
                        meal_share = 0.45
                        prep_base = base_attendance * 0.40
                    elif cat == "Lunch":
                        meal_share = 0.85
                        prep_base = base_attendance * 0.42
                    elif cat == "Dinner":
                        meal_share = 0.60
                        prep_base = base_attendance * 0.35
                    else: # Snacks
                        meal_share = 0.35
                        prep_base = base_attendance * 0.25
                        
                    # Target consumed portions
                    popularity_factor = random.uniform(0.85, 1.15)
                    consumed = max(10, int(prep_base * popularity_factor))
                    
                    # Overproduction without ML model is typically 8% to 22%
                    overprep_margin = random.uniform(0.06, 0.18)
                    prepared = int(consumed * (1.0 + overprep_margin))
                    waste = max(0, prepared - consumed)
                    
                    waste_pct = round((waste / prepared * 100.0) if prepared > 0 else 0.0, 2)
                    cost_lost = round(waste * item.cost_per_portion, 2)
                    co2_impact = round(waste * (item.portion_size_g / 1000.0) * item.co2_per_kg, 2)
                    
                    rec = DailyRecord(
                        date=rec_date,
                        meal_type=cat,
                        menu_item_id=item.id,
                        prepared_qty=float(prepared),
                        consumed_qty=float(consumed),
                        waste_qty=float(waste),
                        waste_pct=waste_pct,
                        attendance_expected=base_attendance,
                        attendance_actual=base_attendance + random.randint(-15, 15),
                        is_holiday=is_holiday,
                        special_event="Campus Seminar" if (d_offset % 14 == 0) else "None",
                        weather_condition=weather,
                        temperature_c=temp,
                        cost_lost=cost_lost,
                        co2_impact_kg=co2_impact,
                        notes=f"Service on {rec_date.strftime('%A')}",
                        is_verified=True
                    )
                    db.add(rec)
                    
            db.commit()
            print("Successfully seeded 90 days of daily canteen records.")

        # 4. Train Initial ML Models
        print("Training initial Random Forest model...")
        all_records = db.query(DailyRecord).all()
        menu_items_map = {item.id: item for item in db.query(MenuItem).all()}
        
        train_res = ml_pipeline.train(all_records, menu_items_map, algorithm="RandomForest")
        
        # Log to ModelTrainingLog
        d_metrics = train_res["demand_metrics"]
        w_metrics = train_res["waste_metrics"]
        
        db.query(ModelTrainingLog).delete()
        log_d = ModelTrainingLog(
            model_name="Demand Forecaster",
            target_variable="demand",
            algorithm="RandomForest",
            dataset_rows=d_metrics["dataset_rows"],
            mae=d_metrics["mae"],
            rmse=d_metrics["rmse"],
            r2=d_metrics["r2"],
            feature_importance_json=json.dumps(train_res["top_features"]),
            is_active=True
        )
        log_w = ModelTrainingLog(
            model_name="Waste Forecaster",
            target_variable="waste",
            algorithm="RandomForest",
            dataset_rows=w_metrics["dataset_rows"],
            mae=w_metrics["mae"],
            rmse=w_metrics["rmse"],
            r2=w_metrics["r2"],
            feature_importance_json=json.dumps(train_res["top_features"]),
            is_active=True
        )
        db.add(log_d)
        db.add(log_w)
        db.commit()
        print(f"ML Models trained! Demand MAE: {d_metrics['mae']}, R²: {d_metrics['r2']} | Waste MAE: {w_metrics['mae']}, R²: {w_metrics['r2']}")

        # 5. Seed upcoming next-day sample predictions
        if db.query(DailyPrediction).count() == 0:
            print("Generating initial sample predictions for tomorrow...")
            tomorrow = today + timedelta(days=1)
            menu_items = db.query(MenuItem).all()
            
            for item in menu_items:
                cat = item.category.value if hasattr(item.category, 'value') else str(item.category)
                pred_out = ml_pipeline.predict({
                    "date": tomorrow,
                    "meal_type": cat,
                    "category": cat,
                    "menu_item_id": item.id,
                    "portion_size_g": item.portion_size_g,
                    "cost_per_portion": item.cost_per_portion,
                    "attendance": 550,
                    "is_holiday": False,
                    "weather_forecast": "Sunny",
                    "temperature_forecast": 25.0
                }, safety_buffer_pct=5.0)
                
                dp = DailyPrediction(
                    prediction_date=tomorrow,
                    meal_type=cat,
                    menu_item_id=item.id,
                    predicted_demand=pred_out["predicted_demand"],
                    predicted_waste=pred_out["predicted_waste"],
                    recommended_prep_qty=pred_out["recommended_prep_qty"],
                    safety_buffer_pct=5.0,
                    confidence_score=pred_out["confidence_score"],
                    lower_bound=pred_out["lower_bound"],
                    upper_bound=pred_out["upper_bound"],
                    risk_level=pred_out["risk_level"],
                    attendance_forecast=550,
                    is_holiday=False,
                    weather_forecast="Sunny",
                    temperature_forecast=25.0,
                    model_version="RandomForest-v1.0"
                )
                db.add(dp)
            db.commit()
            print("Sample predictions seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
