import pandas as pd
import numpy as np
from datetime import date, datetime
from typing import List, Dict, Any, Tuple

# Meal types mapping
MEAL_TYPE_MAP = {"Breakfast": 0, "Lunch": 1, "Dinner": 2, "Snacks": 3}
WEATHER_MAP = {"Sunny": 0, "Cloudy": 1, "Rainy": 2, "Stormy": 3}
CATEGORY_MAP = {"Breakfast": 0, "Lunch": 1, "Dinner": 2, "Snacks": 3}

FEATURE_COLUMNS = [
    "day_of_week",
    "is_weekend",
    "month",
    "day_of_month",
    "meal_type_code",
    "item_category_code",
    "menu_item_id",
    "portion_size_g",
    "cost_per_portion",
    "attendance",
    "is_holiday",
    "weather_code",
    "temperature_c",
    "hist_avg_demand",
    "hist_avg_waste",
    "demand_lag_7d"
]

FEATURE_DISPLAY_NAMES = {
    "day_of_week": "Day of Week (Mon-Sun)",
    "is_weekend": "Weekend Indicator",
    "month": "Month of Year",
    "day_of_month": "Day of Month",
    "meal_type_code": "Meal Type (Breakfast/Lunch/Dinner/Snacks)",
    "item_category_code": "Menu Item Category",
    "menu_item_id": "Specific Menu Item ID",
    "portion_size_g": "Portion Size (grams)",
    "cost_per_portion": "Cost per Portion ($)",
    "attendance": "Expected Attendance / Footfall",
    "is_holiday": "Holiday / Special Event Flag",
    "weather_code": "Weather Condition (Sunny/Rainy/etc.)",
    "temperature_c": "Temperature (°C)",
    "hist_avg_demand": "Historical Average Demand (Lag)",
    "hist_avg_waste": "Historical Average Waste (Lag)",
    "demand_lag_7d": "7-Day Historical Consumption Trend"
}

FEATURE_DESCRIPTIONS = {
    "attendance": "Expected footfall directly scales the total portions needed.",
    "day_of_week": "Consumption patterns vary between mid-week peaks and Friday drops.",
    "hist_avg_demand": "Baseline consumption habit for this specific dish over recent weeks.",
    "is_holiday": "Holidays or campus events lead to sudden drops or spikes in dining hall turnout.",
    "weather_code": "Rain or harsh weather keeps students/staff on campus, boosting canteen attendance.",
    "temperature_c": "Extreme heat or cold shifts meal preference and portion uptake.",
    "meal_type_code": "Lunch serves highest volume compared to breakfast or evening snacks.",
    "item_category_code": "Core entrees experience less demand volatility than specialty desserts.",
    "cost_per_portion": "Premium dishes show distinct choice elasticities.",
    "portion_size_g": "Heavier portion sizes correlate with higher plate leftovers.",
    "demand_lag_7d": "Same-day-of-week consumption history from prior week.",
    "hist_avg_waste": "Dish-specific baseline leftover tendency.",
    "is_weekend": "Significantly reduced campus residential density on weekends.",
    "month": "Semester exams and academic calendar seasonality.",
    "day_of_month": "Monthly allowance and dining cycle patterns.",
    "menu_item_id": "Individual popularity ranking of the recipe."
}

def extract_record_features(record_dict: Dict[str, Any], hist_stats: Dict[int, Dict[str, float]] = None) -> Dict[str, float]:
    """Convert a single record or prediction input dictionary into numeric feature vectors."""
    d = record_dict.get("date")
    if isinstance(d, str):
        d = datetime.strptime(d, "%Y-%m-%d").date()
    elif isinstance(d, datetime):
        d = d.date()
    
    day_of_week = d.weekday() if d else 2
    is_weekend = 1.0 if day_of_week in (5, 6) else 0.0
    month = d.month if d else 9
    day_of_month = d.day if d else 15
    
    meal_type = record_dict.get("meal_type", "Lunch")
    meal_type_code = float(MEAL_TYPE_MAP.get(meal_type, 1))
    
    cat = record_dict.get("category", record_dict.get("item_category", "Lunch"))
    item_category_code = float(CATEGORY_MAP.get(cat, 1))
    
    menu_item_id = int(record_dict.get("menu_item_id", 1))
    portion_size_g = float(record_dict.get("portion_size_g", 350.0))
    cost_per_portion = float(record_dict.get("cost_per_portion", 2.50))
    
    attendance = float(record_dict.get("attendance", record_dict.get("attendance_expected", record_dict.get("attendance_forecast", 500))))
    is_holiday = 1.0 if record_dict.get("is_holiday", False) else 0.0
    
    weather = record_dict.get("weather_condition", record_dict.get("weather_forecast", "Sunny"))
    weather_code = float(WEATHER_MAP.get(weather, 0))
    temperature_c = float(record_dict.get("temperature_c", record_dict.get("temperature_forecast", 24.0)))
    
    # Historical baseline defaults
    stats = (hist_stats or {}).get(menu_item_id, {})
    hist_avg_demand = float(record_dict.get("hist_avg_demand", stats.get("avg_demand", max(50.0, attendance * 0.45))))
    hist_avg_waste = float(record_dict.get("hist_avg_waste", stats.get("avg_waste", hist_avg_demand * 0.08)))
    demand_lag_7d = float(record_dict.get("demand_lag_7d", stats.get("lag_7d", hist_avg_demand)))
    
    return {
        "day_of_week": float(day_of_week),
        "is_weekend": is_weekend,
        "month": float(month),
        "day_of_month": float(day_of_month),
        "meal_type_code": meal_type_code,
        "item_category_code": item_category_code,
        "menu_item_id": float(menu_item_id),
        "portion_size_g": portion_size_g,
        "cost_per_portion": cost_per_portion,
        "attendance": attendance,
        "is_holiday": is_holiday,
        "weather_code": weather_code,
        "temperature_c": temperature_c,
        "hist_avg_demand": hist_avg_demand,
        "hist_avg_waste": hist_avg_waste,
        "demand_lag_7d": demand_lag_7d
    }

def prepare_dataframe_from_records(records: List[Any], menu_items_map: Dict[int, Any]) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """Convert DB DailyRecord list into Feature Matrix X, Target y_demand, Target y_waste."""
    data_rows = []
    
    # Sort chronologically to preserve time-series order
    sorted_records = sorted(records, key=lambda r: r.date)
    
    # Build historical running averages to avoid lookahead data leakage
    item_history = {} # menu_item_id -> list of past demands
    item_waste_history = {}
    
    for r in sorted_records:
        item = menu_items_map.get(r.menu_item_id)
        portion_size = item.portion_size_g if item else 350.0
        cost_portion = item.cost_per_portion if item else 2.50
        category = item.category.value if item and hasattr(item.category, "value") else (item.category if item else "Lunch")
        
        past_d = item_history.get(r.menu_item_id, [])
        past_w = item_waste_history.get(r.menu_item_id, [])
        
        hist_avg_d = np.mean(past_d[-14:]) if len(past_d) > 0 else (r.attendance_expected * 0.45)
        hist_avg_w = np.mean(past_w[-14:]) if len(past_w) > 0 else (hist_avg_d * 0.08)
        lag_7d = past_d[-7] if len(past_d) >= 7 else hist_avg_d
        
        row_features = extract_record_features({
            "date": r.date,
            "meal_type": r.meal_type,
            "category": category,
            "menu_item_id": r.menu_item_id,
            "portion_size_g": portion_size,
            "cost_per_portion": cost_portion,
            "attendance": r.attendance_actual or r.attendance_expected,
            "is_holiday": r.is_holiday,
            "weather_condition": r.weather_condition,
            "temperature_c": r.temperature_c,
            "hist_avg_demand": hist_avg_d,
            "hist_avg_waste": hist_avg_w,
            "demand_lag_7d": lag_7d
        })
        
        row_features["target_demand"] = float(r.consumed_qty)
        row_features["target_waste"] = float(r.waste_qty)
        data_rows.append(row_features)
        
        # Update history
        item_history.setdefault(r.menu_item_id, []).append(r.consumed_qty)
        item_waste_history.setdefault(r.menu_item_id, []).append(r.waste_qty)
        
    df = pd.DataFrame(data_rows)
    if df.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS), pd.Series(dtype=float), pd.Series(dtype=float)
        
    X = df[FEATURE_COLUMNS]
    y_demand = df["target_demand"]
    y_waste = df["target_waste"]
    return X, y_demand, y_waste
