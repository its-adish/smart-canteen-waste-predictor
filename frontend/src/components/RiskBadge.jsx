import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export const RiskBadge = ({ risk }) => {
  const normalized = (risk || 'Low').toLowerCase();

  if (normalized === 'high') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <AlertTriangle className="w-3 h-3" />
        <span>High Waste Risk</span>
      </span>
    );
  }

  if (normalized === 'moderate' || normalized === 'medium') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <AlertCircle className="w-3 h-3" />
        <span>Moderate Risk</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <CheckCircle className="w-3 h-3" />
      <span>Low Risk</span>
    </span>
  );
};
