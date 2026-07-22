import React from 'react';
import { DollarSign, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

export default function BudgetBreakdown({ breakdown, totalBudget }) {
  if (!breakdown) return null;

  const {
    is_under_budget,
    total_estimated_cost,
    flight_cost,
    hotel_cost,
    activity_cost,
    misc_cost,
    reasoning,
    suggestions_for_adjustment
  } = breakdown;

  const percentage = Math.min(100, (total_estimated_cost / totalBudget) * 100);
  const remaining = totalBudget - total_estimated_cost;
  const isOver = total_estimated_cost > totalBudget;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500"></div>

      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        Budget Analysis & Breakdown
      </h3>

      {/* Main Budget Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs text-slate-400 font-medium">Estimated Expenses</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-200">
                ${total_estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500">/ ${totalBudget.toLocaleString()} budget</span>
            </div>
          </div>

          <div className="text-right">
            {isOver ? (
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Over Budget by ${(total_estimated_cost - totalBudget).toLocaleString()}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Under Budget by ${remaining.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isOver 
                ? "bg-gradient-to-r from-rose-500 to-red-600" 
                : percentage > 90 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600" 
                  : "bg-gradient-to-r from-emerald-400 to-teal-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 block uppercase">Flights</span>
          <span className="text-base font-bold text-slate-300 mt-1 block">
            ${flight_cost.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 block uppercase">Lodging</span>
          <span className="text-base font-bold text-slate-300 mt-1 block">
            ${hotel_cost.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 block uppercase">Activities</span>
          <span className="text-base font-bold text-slate-300 mt-1 block">
            ${activity_cost.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 block uppercase">Daily Food/Misc</span>
          <span className="text-base font-bold text-slate-300 mt-1 block">
            ${misc_cost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Budget Agent Reasoning */}
      <div className="space-y-4 pt-4 border-t border-slate-900">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Agent Reasoning</span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{reasoning}</p>
        </div>

        {isOver && suggestions_for_adjustment && (
          <div className="flex gap-2.5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300">Optimization Feedback Required</span>
              <p className="text-xs text-rose-400/90 leading-relaxed">{suggestions_for_adjustment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
