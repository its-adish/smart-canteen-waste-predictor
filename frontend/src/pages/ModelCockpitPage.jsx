import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  Activity, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Gauge, 
  Sparkles,
  Info
} from 'lucide-react';
import { modelAPI } from '../services/api';

const SHAP_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

export const ModelCockpitPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [algorithm, setAlgorithm] = useState('RandomForest');
  const [testSize, setTestSize] = useState(0.2);
  const [trainMessage, setTrainMessage] = useState(null);

  const fetchModelSummary = async () => {
    setLoading(true);
    try {
      const res = await modelAPI.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Error fetching model summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelSummary();
  }, []);

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainMessage(null);
    try {
      const res = await modelAPI.train({
        algorithm,
        test_size: parseFloat(testSize),
        tune_hyperparameters: true
      });
      setTrainMessage({
        success: true,
        text: res.data.message
      });
      fetchModelSummary();
    } catch (err) {
      setTrainMessage({
        success: false,
        text: err.response?.data?.detail || "Model retraining failed."
      });
    } finally {
      setTraining(false);
    }
  };

  const featureChartData = (summary?.feature_importances || []).slice(0, 8).map(f => ({
    name: f.display_name.length > 22 ? f.display_name.slice(0, 22) + '...' : f.display_name,
    fullName: f.display_name,
    importance: Math.round(f.importance * 100),
    shapValue: f.shap_value,
    description: f.description
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-2 border border-purple-500/20">
          <Cpu className="w-3.5 h-3.5" />
          <span>MLOps & Explainable AI (SHAP)</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Model Training & Feature Explainability Cockpit
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect regression performance metrics, retrain models on accumulated actuals, and explain predictive drivers using SHAP-derived importance weights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Retraining Cockpit */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Model Retraining Pipeline</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Regressor Algorithm</label>
              <div className="space-y-2">
                {[
                  { id: 'RandomForest', name: 'Random Forest Regressor', desc: 'Ensemble of decision trees with bagging (Best overall resilience)' },
                  { id: 'GradientBoosting', name: 'Gradient Boosting (XGBoost)', desc: 'Sequential residual gradient boosting (High precision on non-linear shifts)' },
                  { id: 'LinearRegression', name: 'Ridge Linear Baseline', desc: 'L2-regularized linear baseline for high interpretability' }
                ].map((algo) => (
                  <div
                    key={algo.id}
                    onClick={() => setAlgorithm(algo.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      algorithm === algo.id
                        ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{algo.name}</span>
                      {algorithm === algo.id && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{algo.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Split */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Chronological Test Split:</span>
                <span className="font-bold text-purple-400">{Math.round(testSize * 100)}% Test ({(1 - testSize) * 100}% Train)</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={testSize}
                onChange={(e) => setTestSize(e.target.value)}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <p className="text-[10px] text-slate-400">
                Maintains strict chronological sequence to prevent temporal lookahead data leakage.
              </p>
            </div>

            {/* Retrain Action Button */}
            <button
              onClick={handleTrainModel}
              disabled={training}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-purple-950/60 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Play className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
              <span>{training ? 'Training Model Pipeline...' : 'Train & Deploy Model'}</span>
            </button>

            {trainMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium ${trainMessage.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                {trainMessage.text}
              </div>
            )}
          </div>

          {/* Model Health / Stats */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Model Metadata</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Current Architecture:</span>
                <span className="font-semibold text-white">{summary?.active_algorithm || 'RandomForest'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Training Sample Size:</span>
                <span className="font-semibold text-cyan-400">{summary?.dataset_size || 0} daily records</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Last Trained:</span>
                <span className="font-semibold text-slate-200">
                  {summary?.last_trained ? new Date(summary.last_trained).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Accuracy & SHAP Feature Explainability */}
        <div className="lg:col-span-7 space-y-5">
          {/* Performance Benchmark Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Demand R² Score</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {summary ? (summary.demand_r2 * 100).toFixed(1) + '%' : '...'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Explained variance</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Demand MAE</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                ±{summary ? summary.demand_mae : '...'} <span className="text-xs text-slate-400">portions</span>
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mean absolute error</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Waste R² Score</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {summary ? (summary.waste_r2 * 100).toFixed(1) + '%' : '...'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Leftover accuracy</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Waste MAE</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                ±{summary ? summary.waste_mae : '...'} <span className="text-xs text-slate-400">kg</span>
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Waste tolerance</span>
            </div>
          </div>

          {/* SHAP Feature Importance Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>SHAP Feature Importance & Predictive Weights</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Understand which operational and contextual variables most heavily steer demand forecasts.
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 40]} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(val, name, item) => [`${val}% Contribution weight`, item.payload.fullName]}
                  />
                  <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                    {featureChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SHAP_COLORS[index % SHAP_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Explanations / Insights Cards */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Feature Impact Explanations</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(summary?.feature_importances || []).slice(0, 4).map((f) => (
                <div key={f.feature} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{f.display_name}</span>
                    <span className="font-bold text-emerald-400">{Math.round(f.importance * 100)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
