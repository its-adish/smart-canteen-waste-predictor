import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "emerald" }) => {
  const colorGradients = {
    emerald: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-400",
    rose: "from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 text-rose-400",
    cyan: "from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/20 text-cyan-400",
    purple: "from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 text-purple-400",
  };

  const iconBg = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    rose: "bg-rose-500/20 text-rose-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${colorGradients[color] || colorGradients.emerald} bg-slate-900/60 border backdrop-blur-md shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg[color] || iconBg.emerald}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center space-x-2 text-xs">
          {trend && (
            <span className={`font-semibold ${trend.startsWith('+') || trend.includes('Saved') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
          <span className="text-slate-400">{trendLabel || subtitle}</span>
        </div>
      )}
    </div>
  );
};
