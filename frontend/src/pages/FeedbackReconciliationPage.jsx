import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Utensils, 
  Trash2,
  Calendar
} from 'lucide-react';
import { feedbackAPI, predictionsAPI } from '../services/api';

export const FeedbackReconciliationPage = () => {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  
  // Local input states for rows { id: { actual_consumed, actual_waste, notes } }
  const [rowInputs, setRowInputs] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        feedbackAPI.getPending(),
        predictionsAPI.getHistory({ limit: 50 })
      ]);
      setPending(pendingRes.data);
      setHistory(historyRes.data.filter(h => h.feedback_submitted));
      
      // Initialize row inputs
      const initialInputs = {};
      pendingRes.data.forEach(p => {
        initialInputs[p.id] = {
          actual_consumed: p.predicted_demand,
          actual_waste: p.predicted_waste,
          notes: ''
        };
      });
      setRowInputs(initialInputs);
    } catch (err) {
      console.error("Error fetching feedback records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (id, field, value) => {
    setRowInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSubmitFeedback = async (predictionId) => {
    const inputs = rowInputs[predictionId];
    if (!inputs) return;

    setSubmittingId(predictionId);
    try {
      await feedbackAPI.submitActuals({
        prediction_id: predictionId,
        actual_consumed: parseFloat(inputs.actual_consumed),
        actual_waste: parseFloat(inputs.actual_waste),
        notes: inputs.notes
      });
      fetchData();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit actual outcome feedback.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2 border border-amber-500/20">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Active Learning & Model Tuning</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Actuals Feedback & Retraining Reconciliation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Record post-shift actual consumed portions and measured leftovers to close the ML feedback loop and improve subsequent forecasts.
        </p>
      </div>

      {/* Pending Reconciliation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pending Kitchen Outcome Logging ({pending.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Awaiting kitchen shift manager input</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/80 rounded-2xl border border-slate-800">
            Loading scheduled predictions...
          </div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-200">All predictions have been reconciled!</p>
            <p className="text-slate-400 mt-0.5">Generate and publish a new meal plan to schedule upcoming shifts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((pred) => {
              const currentInput = rowInputs[pred.id] || { actual_consumed: 0, actual_waste: 0, notes: '' };
              return (
                <div
                  key={pred.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">{pred.menu_item_name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                        {pred.meal_type}
                      </span>
                      <span className="text-xs text-slate-400">({pred.prediction_date})</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Recommended Prep: <strong className="text-cyan-400">{pred.recommended_prep_qty}</strong> portions | Predicted Demand: <strong className="text-emerald-400">{pred.predicted_demand}</strong>
                    </p>
                  </div>

                  {/* Input Form Fields for Actuals */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">Actual Consumed</label>
                      <input
                        type="number"
                        step="1"
                        value={currentInput.actual_consumed}
                        onChange={(e) => handleInputChange(pred.id, 'actual_consumed', e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">Actual Leftover Waste</label>
                      <input
                        type="number"
                        step="0.5"
                        value={currentInput.actual_waste}
                        onChange={(e) => handleInputChange(pred.id, 'actual_waste', e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="self-end">
                      <button
                        onClick={() => handleSubmitFeedback(pred.id)}
                        disabled={submittingId === pred.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-950/40 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{submittingId === pred.id ? "Saving..." : "Log & Verify"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Reconciled Feedback Log */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Recently Reconciled Historical Shifts</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Meal</th>
                <th className="py-2.5 px-3">Dish Name</th>
                <th className="py-2.5 px-3 text-right">Predicted Demand</th>
                <th className="py-2.5 px-3 text-right">Actual Consumed</th>
                <th className="py-2.5 px-3 text-right">Predicted Waste</th>
                <th className="py-2.5 px-3 text-right">Actual Waste</th>
                <th className="py-2.5 px-3 text-center">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-slate-400">
                    No verified shift logs available yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => {
                  const error = Math.abs((h.actual_consumed || 0) - h.predicted_demand);
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-white font-medium">{h.prediction_date}</td>
                      <td className="py-2.5 px-3">{h.meal_type}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{h.menu_item_name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{h.predicted_demand}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{h.actual_consumed}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{h.predicted_waste}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-400">{h.actual_waste}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Verified (Error: ±{error.toFixed(1)})
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
