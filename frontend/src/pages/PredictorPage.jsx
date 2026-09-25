import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  CloudSun, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  DollarSign, 
  Leaf, 
  Send,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { menuAPI, predictionsAPI } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export const PredictorPage = () => {
  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTomorrowStr());
  const [mealType, setMealType] = useState('Lunch');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  
  // Context features
  const [attendance, setAttendance] = useState(550);
  const [weather, setWeather] = useState('Sunny');
  const [temp, setTemp] = useState(25.0);
  const [isHoliday, setIsHoliday] = useState(false);
  const [safetyBuffer, setSafetyBuffer] = useState(5.0);

  // States
  const [loadingItems, setLoadingItems] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);

  // Fetch menu items when meal type changes
  useEffect(() => {
    const fetchMenu = async () => {
      setLoadingItems(true);
      try {
        const res = await menuAPI.getAll(mealType);
        setMenuItems(res.data);
        // Default select all items for this meal
        setSelectedItemIds(res.data.map(i => i.id));
      } catch (err) {
        console.error("Error fetching menu items:", err);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchMenu();
  }, [mealType]);

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItemIds(menuItems.map(i => i.id));
  };

  const handleGeneratePrediction = async () => {
    if (selectedItemIds.length === 0) {
      alert("Please select at least one menu item for prediction.");
      return;
    }

    setPredicting(true);
    setPublishStatus(null);
    try {
      const payload = {
        prediction_date: date,
        meal_type: mealType,
        menu_item_ids: selectedItemIds,
        attendance_forecast: parseInt(attendance),
        is_holiday: isHoliday,
        weather_forecast: weather,
        temperature_forecast: parseFloat(temp),
        safety_buffer_pct: parseFloat(safetyBuffer)
      };

      const res = await predictionsAPI.generateBatch(payload);
      setPredictionResult(res.data);
    } catch (err) {
      console.error("Prediction error:", err);
      alert(err.response?.data?.detail || "Failed to generate prediction.");
    } finally {
      setPredicting(false);
    }
  };

  const handlePublishPlan = async () => {
    if (!predictionResult) return;
    try {
      const res = await predictionsAPI.savePlan(predictionResult);
      setPublishStatus({ success: true, message: res.data.message });
      setTimeout(() => setPublishStatus(null), 5000);
    } catch (err) {
      setPublishStatus({ success: false, message: "Failed to publish plan to kitchen schedule." });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-2 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Demand & Waste Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Next-Day Demand Prediction & Batch Recommendation
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Provide upcoming operational parameters to forecast portion requirements with machine learning precision.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Forecasting Parameter Input Studio */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Operational Forecast Inputs</span>
            </h3>

            {/* Date & Meal Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meal Service</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>
            </div>

            {/* Attendance & Weather */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Expected Footfall / Attendance:</span>
                </label>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  {attendance} People
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="10"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>

            {/* Weather & Temp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Weather Forecast</span>
                </label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Sunny">Sunny / Clear</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy (Higher Canteen Footfall)</option>
                  <option value="Stormy">Stormy / Severe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Holiday / Event Flag */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Holiday / Campus Event</span>
                <span className="text-[11px] text-slate-400">Lowers baseline on-campus residential turnout</span>
              </div>
              <input
                type="checkbox"
                checked={isHoliday}
                onChange={(e) => setIsHoliday(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Safety Buffer Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Safety Buffer (Over-prep Tolerance):</span>
                </label>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                  +{safetyBuffer}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(e.target.value)}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (Aggressive Eco)</span>
                <span>5% (Balanced Recommended)</span>
                <span>15%+ (Safe / High Stockout Protection)</span>
              </div>
            </div>

            {/* Menu Items Multi-Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Select Menu Items ({selectedItemIds.length}/{menuItems.length})
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {menuItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-slate-100'
                          : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-emerald-500 rounded pointer-events-none"
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">${item.cost_per_portion.toFixed(2)}/portion</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleGeneratePrediction}
              disabled={predicting || selectedItemIds.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Sparkles className={`w-4 h-4 ${predicting ? 'animate-spin' : ''}`} />
              <span>{predicting ? 'Running Regression Inference...' : 'Generate Prediction Plan'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Results & Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {predictionResult ? (
            <div className="space-y-5">
              {/* Aggregate KPI Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Recommended Kitchen Preparation Plan</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Forecast for {predictionResult.meal_type} on {predictionResult.prediction_date}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs">
                    <span className="text-slate-400">Model Confidence:</span>
                    <span className="font-bold text-emerald-400">
                      {Math.round(predictionResult.avg_confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-400 uppercase">Recommended Prep</span>
                    <p className="text-xl font-bold text-cyan-400 mt-0.5">
                      {predictionResult.total_recommended_qty} <span className="text-xs text-slate-400">portions</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-400 uppercase">Expected Demand</span>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">
                      {predictionResult.total_estimated_demand} <span className="text-xs text-slate-400">portions</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-400 uppercase">Buffer Leftover</span>
                    <p className="text-xl font-bold text-rose-400 mt-0.5">
                      {predictionResult.total_expected_waste} <span className="text-xs text-slate-400">portions</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] font-medium text-slate-400 uppercase">Est. Ingredient Cost</span>
                    <p className="text-xl font-bold text-amber-400 mt-0.5">
                      ${predictionResult.total_cost}
                    </p>
                  </div>
                </div>

                {/* Publish Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    Ready to schedule? Publish directly to kitchen shift log.
                  </span>
                  <button
                    onClick={handlePublishPlan}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to Kitchen Schedule</span>
                  </button>
                </div>

                {publishStatus && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${publishStatus.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                    {publishStatus.message}
                  </div>
                )}
              </div>

              {/* Per-Dish Itemized Breakdown Cards */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider px-1">
                  Itemized Dish Recommendations
                </h4>

                {predictionResult.items.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-base">{item.menu_item_name}</span>
                          <span className="text-xs text-slate-400">({item.menu_item_category})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Cost: ${item.unit_cost.toFixed(2)}/portion • CO2 Footprint: {item.estimated_co2_kg} kg
                        </p>
                      </div>
                      <RiskBadge risk={item.risk_level} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Recommended Batch</span>
                        <span className="text-base font-bold text-cyan-400">{item.recommended_prep_qty} portions</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Expected Demand</span>
                        <span className="text-base font-bold text-emerald-400">{item.predicted_demand} portions</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">80% Confidence Range</span>
                        <span className="text-xs font-semibold text-slate-200">
                          {item.lower_bound} – {item.upper_bound}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Est. Waste Risk</span>
                        <span className="text-base font-bold text-rose-400">{item.predicted_waste} portions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-400">
              <Sparkles className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Ready to Predict</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Configure your attendance estimate and target menu selections on the left, then click <strong>Generate Prediction Plan</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
