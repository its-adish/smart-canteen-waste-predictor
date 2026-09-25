import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Utensils, 
  Trash2, 
  DollarSign, 
  Leaf, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';

const CATEGORY_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'];

export const DashboardPage = ({ onNavigateToPredictor }) => {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [wasteCat, setWasteCat] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, catRes, alertRes] = await Promise.all([
        analyticsAPI.getKPIs(timeRange),
        analyticsAPI.getTrends(timeRange),
        analyticsAPI.getWasteByCategory(),
        analyticsAPI.getAlerts()
      ]);
      setKpis(kpiRes.data);
      setTrends(trendRes.data);
      setWasteCat(catRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner & Time Range Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Canteen Operations & Waste Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning demand forecasting, waste minimization, and live preparation recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs font-medium">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === days
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Prepared"
          value={kpis ? `${kpis.total_meals_prepared.toLocaleString()} portions` : '...'}
          subtitle={`${kpis ? kpis.total_meals_consumed.toLocaleString() : '...'} consumed`}
          icon={Utensils}
          color="cyan"
        />
        <StatCard
          title="Food Leftover Waste"
          value={kpis ? `${kpis.total_waste_kg.toLocaleString()} kg` : '...'}
          trend={kpis ? `${kpis.avg_waste_pct}%` : '...'}
          trendLabel="of total prepared"
          icon={Trash2}
          color="rose"
        />
        <StatCard
          title="Financial Loss"
          value={kpis ? `$${kpis.total_cost_lost.toLocaleString()}` : '...'}
          subtitle="Direct leftover ingredient cost"
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Estimated Cost Saved"
          value={kpis ? `$${kpis.cost_saved_estimate.toLocaleString()}` : '...'}
          trend="Saved"
          trendLabel="via ML demand tuning"
          icon={TrendingDown}
          color="emerald"
        />
        <StatCard
          title="Prediction Accuracy"
          value={kpis ? `${kpis.accuracy_rate_pct}%` : '...'}
          subtitle={`CO2 Avoided: ${kpis ? kpis.co2_avoided_estimate_kg.toLocaleString() : '...'} kg`}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Quick Prediction CTA Card & High Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next-Day Fast Predictor Banner */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tomorrow's Service Forecast</span>
            </div>
            <h3 className="text-xl font-bold text-white">Generate Tomorrow's Prep Plan</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Auto-calculate exact batch preparation quantities for Breakfast, Lunch, and Dinner based on expected campus attendance, weather conditions, and day-of-week trends.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={onNavigateToPredictor}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span>Launch Prediction Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High Risk Waste Alerts */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">High Waste Risk Warnings</h3>
            </div>
            <span className="text-xs font-medium text-slate-400">Contextual Anomaly Detection</span>
          </div>

          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200 text-sm">{alert.menu_item_name}</span>
                    <span className="text-xs text-slate-400 font-medium">({alert.meal_type})</span>
                    <RiskBadge risk={alert.severity} />
                  </div>
                  <p className="text-xs text-slate-400">{alert.reason}</p>
                  <p className="text-xs text-emerald-400/90 font-medium">💡 Tip: {alert.action_tip}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-semibold text-rose-400 block">{alert.predicted_waste_pct}% Risk</span>
                  <span className="text-[11px] text-slate-400">{alert.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts: Trends & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Demand vs Consumed vs Waste Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Historical Demand vs Waste Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily Portions Prepared, Consumed, and Leftovers</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Prepared</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Consumed</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Waste</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => val.slice(5)} 
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="prepared" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#prepGrad)" name="Prepared" />
                <Area type="monotone" dataKey="consumed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#consGrad)" name="Consumed" />
                <Area type="monotone" dataKey="waste" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#wasteGrad)" name="Waste (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Breakdown by Meal Category */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Waste Share by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Meal distribution of total leftover food</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteCat}
                  dataKey="total_waste"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {wasteCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(value, name) => [`${value} kg waste`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {wasteCat.map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-100">{cat.total_waste} kg</span>
                  <span className="text-slate-500 ml-1.5">({cat.waste_pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
