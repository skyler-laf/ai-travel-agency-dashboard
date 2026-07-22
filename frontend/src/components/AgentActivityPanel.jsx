import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, CloudSun, Plane, Home, Sparkles, DollarSign, ListTodo, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const AGENTS = [
  { id: "coordinator", name: "Travel Coordinator Agent", icon: Shield, color: "text-violet-400 border-violet-500/20 bg-violet-500/5", desc: "Orchestrator" },
  { id: "weather", name: "Weather Agent", icon: CloudSun, color: "text-sky-400 border-sky-500/20 bg-sky-500/5", desc: "Climate Analyst" },
  { id: "flight", name: "Flight Agent", icon: Plane, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5", desc: "Route Matcher" },
  { id: "hotel", name: "Hotel Agent", icon: Home, color: "text-pink-400 border-pink-500/20 bg-pink-500/5", desc: "Lodging Hunter" },
  { id: "activity", name: "Activity Agent", icon: Sparkles, color: "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5", desc: "Activity Curator" },
  { id: "budget", name: "Budget Agent", icon: DollarSign, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", desc: "Financial Checker" },
  { id: "itinerary", name: "Itinerary Agent", icon: ListTodo, color: "text-amber-400 border-amber-500/20 bg-amber-500/5", desc: "Schedule Assembler" }
];

export default function AgentActivityPanel({ logs, activeAgent, agentStatuses }) {
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Agents Roster */}
      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Agent Workforce</h3>
        <div className="space-y-2">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const status = agentStatuses[agent.id] || "idle"; // idle, running, completed, error
            const isActive = activeAgent === agent.id;

            return (
              <div
                key={agent.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? "bg-slate-900 border-violet-500/50 shadow-md shadow-violet-500/10 scale-102"
                    : "bg-slate-900/40 border-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${agent.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400">{agent.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === "idle" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                      Idle
                    </span>
                  )}
                  {status === "running" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800/40 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Active
                    </span>
                  )}
                  {status === "completed" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Done
                    </span>
                  )}
                  {status === "error" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/40 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Alert
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="lg:col-span-7 flex flex-col h-[320px] lg:h-auto min-h-[300px]">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-x border-slate-800 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-300">collaborative_activity.log</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
          </div>
        </div>
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-b-xl p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-y-auto max-h-[350px] terminal-glow relative scanline">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              Waiting for agent orchestration signals...
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start hover:bg-emerald-500/5 py-0.5 rounded">
                  <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                  <span className="text-slate-400 shrink-0 select-none">[{log.agent}]</span>
                  <span className={log.agent === "Budget Agent" && log.text.includes("OVER BUDGET") ? "text-amber-300" : "text-emerald-300"}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
