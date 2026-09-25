import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Database, 
  Cpu, 
  CheckCircle2, 
  UtensilsCrossed, 
  TreePine, 
  FileText
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & KPIs',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400'
    },
    {
      id: 'predictor',
      label: 'Demand Predictor',
      icon: Sparkles,
      badge: 'ML Engine',
      badgeColor: 'bg-cyan-500/20 text-cyan-400'
    },
    {
      id: 'records',
      label: 'Data Entry & Logs',
      icon: Database,
      badge: null
    },
    {
      id: 'feedback',
      label: 'Actuals Feedback',
      icon: CheckCircle2,
      badge: 'Retrain Loop',
      badgeColor: 'bg-amber-500/20 text-amber-400'
    },
    {
      id: 'model',
      label: 'Model & SHAP XAI',
      icon: Cpu,
      badge: 'Explainable',
      badgeColor: 'bg-purple-500/20 text-purple-400'
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: UtensilsCrossed,
      badge: null
    },
    {
      id: 'sustainability',
      label: 'Sustainability Audit',
      icon: TreePine,
      badge: 'Reports',
      badgeColor: 'bg-emerald-500/20 text-emerald-300'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between py-5 px-3 select-none">
      <div>
        <div className="px-3 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations & ML Suite
          </p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600/90 to-teal-700/80 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sustainable Impact Footer Mini Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-800/40 to-slate-900/60 border border-emerald-500/20 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
          <TreePine className="w-4 h-4" />
          <span>Eco Efficiency</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Predictive batch planning saves an estimated <span className="text-emerald-300 font-medium">~28% unnecessary food waste</span> weekly.
        </p>
      </div>
    </aside>
  );
};
