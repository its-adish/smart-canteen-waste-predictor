import React, { useState, useEffect } from 'react';
import { 
  TreePine, 
  Droplets, 
  Car, 
  Utensils, 
  Download, 
  Printer, 
  Award, 
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { analyticsAPI } from '../services/api';

export const SustainabilityReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getSustainability();
        setReport(res.data);
      } catch (err) {
        console.error("Error fetching sustainability report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading sustainability metrics...
      </div>
    );
  }

  const { summary, waste_by_category, monthly_trends, food_recovery_equivalent } = report;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
            <TreePine className="w-3.5 h-3.5" />
            <span>UNEP & EPA Environmental Alignment</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Canteen Sustainability & Waste Audit Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quantified carbon emissions abatement, preserved water footprint, and food recovery metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Audit Summary</span>
          </button>
        </div>
      </div>

      {/* UNEP Equivalent Environmental Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg space-y-2">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit">
            <Utensils className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase">Rescued Meal Equivalents</p>
          <h3 className="text-2xl font-bold text-white">{food_recovery_equivalent.equivalent_meals_lost?.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400">Meals preserved from landfill decomposition</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg space-y-2">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 w-fit">
            <TreePine className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase">Tree Offset Equivalent</p>
          <h3 className="text-2xl font-bold text-teal-300">{food_recovery_equivalent.co2_trees_equivalent} trees</h3>
          <p className="text-[11px] text-slate-400">Equivalent yearly carbon absorption</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg space-y-2">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit">
            <Droplets className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase">Preserved Water Footprint</p>
          <h3 className="text-2xl font-bold text-cyan-300">{food_recovery_equivalent.water_liters_preserved?.toLocaleString()} L</h3>
          <p className="text-[11px] text-slate-400">Agricultural water footprint avoided</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg space-y-2">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
            <Car className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase">Avoided Driving Miles</p>
          <h3 className="text-2xl font-bold text-purple-300">{food_recovery_equivalent.car_miles_avoided?.toLocaleString()} miles</h3>
          <p className="text-[11px] text-slate-400">Passenger vehicle GHG emissions avoided</p>
        </div>
      </div>

      {/* Monthly Audit Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Monthly Waste & Cost Audit Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Leftover food mass (kg) and associated ingredient cost lost</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="waste_kg" name="Leftover Food (kg)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost_lost" name="Cost Lost ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Audit Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Category-Level Waste & Carbon Intensity</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-2.5 px-3">Meal Category</th>
                <th className="py-2.5 px-3 text-right">Total Leftover (kg)</th>
                <th className="py-2.5 px-3 text-right">Share of Waste %</th>
                <th className="py-2.5 px-3 text-right">Financial Loss ($)</th>
                <th className="py-2.5 px-3 text-right">Carbon Footprint (kg CO2e)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {waste_by_category.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{cat.category}</td>
                  <td className="py-3 px-3 text-right text-rose-400 font-semibold">{cat.total_waste} kg</td>
                  <td className="py-3 px-3 text-right text-slate-300">{cat.waste_pct}%</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-semibold">${cat.cost_lost.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">{cat.co2_kg.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
