import React from 'react';
import { Calendar, DollarSign, Trash2, ArrowUpRight, History } from 'lucide-react';

export default function HistoryDrawer({ historyList, onSelect, onDelete, activeId }) {
  if (!historyList || historyList.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl text-center text-slate-500 italic text-xs">
        <History className="w-5 h-5 mx-auto mb-2 text-slate-600 animate-pulse" />
        No saved journeys yet. Run a plan and save it to history!
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <History className="w-4 h-4 text-violet-400" />
        Saved Journeys ({historyList.length})
      </h3>

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
        {historyList.map((item) => {
          const isActive = activeId === item.id;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition group ${
                isActive 
                  ? "bg-slate-900 border-violet-500/50 shadow shadow-violet-500/10" 
                  : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
              }`}
            >
              <button
                onClick={() => onSelect(item.id)}
                className="flex-1 text-left cursor-pointer mr-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition">
                    {item.destination}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                  <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {item.dates}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> ${Math.round(item.total_cost)}</span>
                </div>
              </button>

              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-950 transition cursor-pointer shrink-0"
                title="Delete saved plan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
