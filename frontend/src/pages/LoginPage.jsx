import React, { useState } from 'react';
import { Leaf, Lock, Mail, ShieldCheck, ChefHat, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ onLoginSuccess }) => {
  const { login, loginQuick } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res.error);
    }
  };

  const handleDemo = (role) => {
    loginQuick(role);
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-950/60 mb-1">
            <Leaf className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Canteen<span className="text-emerald-400">Waste</span> AI
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to access Demand Forecasting, Waste Analytics & Kitchen Recommendations
          </p>
        </div>

        {/* Quick Demo 1-Click Logins */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            🚀 Quick 1-Click Instant Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('kitchen_manager')}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center space-x-1.5 transition-all"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen Staff</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center space-x-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator</span>
            </button>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="kitchen@canteen.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Canteen AI"}
          </button>
        </form>
      </div>
    </div>
  );
};
