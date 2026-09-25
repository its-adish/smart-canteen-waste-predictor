import React from 'react';
import { 
  Leaf, 
  User, 
  LogOut, 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  ChefHat, 
  Calendar,
  CloudSun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, onSelectTab, alertsCount = 3 }) => {
  const { user, logout, loginQuick } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 text-white">
      {/* Brand & Live Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-950/40">
          <Leaf className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-slate-100">
              Canteen<span className="text-emerald-400">Waste</span> AI
            </span>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0 Live
            </span>
          </div>
          <p className="text-xs text-slate-400">Next-Gen Food Demand & Waste Intelligence</p>
        </div>
      </div>

      {/* Center Operational Context Badge */}
      <div className="hidden lg:flex items-center space-x-4 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{todayStr}</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center space-x-1.5">
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Campus Weather: 26°C Sunny</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-medium">Model Online (R² 0.94)</span>
        </div>
      </div>

      {/* User profile & quick switch */}
      <div className="flex items-center space-x-3">
        {/* Switch Role Quick Toggle */}
        <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => loginQuick('kitchen_manager')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'kitchen_manager'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-3 h-3 inline mr-1" /> Kitchen
          </button>
          <button
            onClick={() => loginQuick('admin')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 inline mr-1" /> Admin
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-700/60">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-slate-600 text-slate-200 font-semibold text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-none">{user?.full_name || 'Kitchen Staff'}</p>
            <p className="text-[10px] text-emerald-400 font-medium capitalize">{user?.role?.replace('_', ' ') || 'Staff'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
