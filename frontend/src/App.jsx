import React, { useState, useEffect } from 'react';
import { 
  Compass, Shield, Download, MapPin, 
  Sparkles, Calendar, DollarSign, ListTodo, FileText,
  User, LogOut, Save, Check, Loader2, AlertCircle, History
} from 'lucide-react';
import InputPanel from './components/InputPanel';
import AgentActivityPanel from './components/AgentActivityPanel';
import ItineraryViewer from './components/ItineraryViewer';
import BudgetBreakdown from './components/BudgetBreakdown';
import LoginModal from './components/LoginModal';
import HistoryDrawer from './components/HistoryDrawer';
import { downloadPDF } from './utils/pdfGenerator';

const getAgentId = (agentName) => {
  if (agentName.includes("Coordinator")) return "coordinator";
  if (agentName.includes("Weather")) return "weather";
  if (agentName.includes("Flight")) return "flight";
  if (agentName.includes("Hotel")) return "hotel";
  if (agentName.includes("Activity")) return "activity";
  if (agentName.includes("Budget")) return "budget";
  if (agentName.includes("Itinerary")) return "itinerary";
  return "coordinator";
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary"); // itinerary, budget, logs
  const [agentStatuses, setAgentStatuses] = useState({
    coordinator: "idle",
    weather: "idle",
    flight: "idle",
    hotel: "idle",
    activity: "idle",
    budget: "idle",
    itinerary: "idle"
  });

  // Authentication & History States
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, success, error

  // Load user session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      fetchHistory(parsed.id);
    } else {
      // Automatically pop up the login modal on first load if not logged in
      setIsLoginOpen(true);
    }
  }, []);

  const fetchHistory = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/itineraries?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    fetchHistory(user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHistoryList([]);
    setActiveHistoryId(null);
    setItinerary(null);
    setLogs([]);
    localStorage.removeItem('currentUser');
    setActiveTab("itinerary");
  };

  const handlePlanTrip = (formData) => {
    setIsLoading(true);
    setItinerary(null);
    setLogs([]);
    setActiveAgent("coordinator");
    setActiveTab("logs"); // Switch to console logs during planning
    setSaveStatus("idle");
    setActiveHistoryId(null);
    
    const initialStatuses = {
      coordinator: "running",
      weather: "idle",
      flight: "idle",
      hotel: "idle",
      activity: "idle",
      budget: "idle",
      itinerary: "idle"
    };
    setAgentStatuses(initialStatuses);
    
    const { origin, destination, dates, budget, preferences } = formData;
    const url = `${API_BASE}/api/plan-trip?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&dates=${encodeURIComponent(dates)}&budget=${budget}&preferences=${encodeURIComponent(preferences)}`;
    
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (payload.type === 'progress') {
          const { agent, message } = payload;
          const agentId = getAgentId(agent);
          
          setLogs(prev => [...prev, { time: timeStr, agent, text: message }]);
          setActiveAgent(agentId);
          setAgentStatuses(prev => {
            const next = { ...prev };
            next[agentId] = "running";
            
            if (agentId === "weather") next.coordinator = "completed";
            if (agentId === "flight") { next.weather = "completed"; next.coordinator = "completed"; }
            if (agentId === "hotel") { next.flight = "completed"; next.coordinator = "completed"; }
            if (agentId === "activity") { next.hotel = "completed"; next.coordinator = "completed"; }
            if (agentId === "budget") { next.activity = "completed"; next.coordinator = "completed"; }
            if (agentId === "itinerary") { next.budget = "completed"; next.coordinator = "completed"; }
            
            return next;
          });
        } else if (payload.type === 'result') {
          setItinerary(payload.data);
          setAgentStatuses({
            coordinator: "completed",
            weather: "completed",
            flight: "completed",
            hotel: "completed",
            activity: "completed",
            budget: "completed",
            itinerary: "completed"
          });
          setActiveAgent(null);
          setIsLoading(false);
          setActiveTab("itinerary");
          eventSource.close();
        } else if (payload.type === 'error') {
          setLogs(prev => [...prev, { time: timeStr, agent: "System", text: `Error: ${payload.message}` }]);
          setAgentStatuses(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
              if (next[k] === "running") next[k] = "error";
            });
            return next;
          });
          setIsLoading(false);
          eventSource.close();
        }
      } catch (e) {
        console.error("Error parsing event payload:", e);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
      setIsLoading(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [...prev, { time: timeStr, agent: "System", text: "Connection error. Make sure backend service is running." }]);
    };
  };

  // Save the compiled itinerary to database
  const handleSaveItinerary = async () => {
    if (!itinerary || !currentUser) return;
    setIsSaving(true);
    setSaveStatus("saving");
    
    try {
      const res = await fetch(`${API_BASE}/api/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          destination: itinerary.destination,
          dates: itinerary.dates,
          total_cost: itinerary.total_cost,
          itinerary_data: itinerary
        })
      });
      
      if (res.ok) {
        setSaveStatus("success");
        fetchHistory(currentUser.id);
        // Clear success notification after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved itinerary instantly from SQLite
  const handleSelectHistoryItem = async (itineraryId) => {
    setIsLoading(true);
    setItinerary(null);
    setLogs([]);
    setActiveHistoryId(itineraryId);
    
    try {
      const res = await fetch(`${API_BASE}/api/itineraries/${itineraryId}`);
      if (res.ok) {
        const data = await res.json();
        setItinerary(data);
        setActiveTab("itinerary");
      }
    } catch (err) {
      console.error("Failed to load historical itinerary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an itinerary record
  const handleDeleteHistoryItem = async (itineraryId) => {
    try {
      const res = await fetch(`${API_BASE}/api/itineraries/${itineraryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (activeHistoryId === itineraryId) {
          setItinerary(null);
          setActiveHistoryId(null);
        }
        fetchHistory(currentUser.id);
      }
    } catch (err) {
      console.error("Failed to delete itinerary:", err);
    }
  };

  const handleDownloadPDF = () => {
    if (itinerary) {
      downloadPDF(itinerary);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Decorative Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 px-6 py-4 border-b border-slate-900 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight font-heading">
              Voyager<span className="text-violet-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Multi-Agent Travel Planner</p>
          </div>
        </div>

        {/* Auth status header section */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 p-1.5 px-3 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Hi, <strong className="text-slate-100">{currentUser.username}</strong></span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-900 hover:bg-slate-950 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-violet-500/15"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {itinerary && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-violet-500 text-slate-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow shadow-black"
            >
              <Download className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Sidebar Controls */}
        <section className="xl:col-span-4 h-fit xl:sticky xl:top-[88px] z-20 space-y-4">
          <InputPanel 
            onSubmit={handlePlanTrip} 
            isLoading={isLoading} 
            userPreferences={currentUser?.preferences} 
          />
          
          {currentUser && (
            <HistoryDrawer 
              historyList={historyList} 
              onSelect={handleSelectHistoryItem} 
              onDelete={handleDeleteHistoryItem} 
              activeId={activeHistoryId} 
            />
          )}
        </section>

        {/* Dashboard Display Area */}
        <section className="xl:col-span-8 space-y-6">
          {!itinerary && !isLoading ? (
            <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center text-center space-y-5 min-h-[500px]">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full blur opacity-30 animate-pulse"></div>
                <div className="relative p-6 bg-slate-950 border border-slate-900 rounded-full text-violet-400">
                  <Compass className="w-10 h-10 animate-spin-slow" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold font-heading text-slate-200">Start Planning Your Next Trip</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Enter your destination details, budget, and dates. Watch specialized AI agents collaborate to build a complete custom travel guide and financial report.
                </p>
              </div>

              {!currentUser && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl text-xs text-violet-300 max-w-md">
                  💡 <strong>Tip:</strong> Click <strong>"Sign In"</strong> in the top-right header to create an account and unlock automatic preference syncing and travel history storage!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full pt-4">
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-center space-y-1">
                  <Shield className="w-5 h-5 text-violet-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">Coordinator</h4>
                  <p className="text-[10px] text-slate-500">Orchestrates workflows</p>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-center space-y-1">
                  <DollarSign className="w-5 h-5 text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">Budget Agent</h4>
                  <p className="text-[10px] text-slate-500">Controls expenditures</p>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-center space-y-1">
                  <ListTodo className="w-5 h-5 text-amber-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">Itinerary Agent</h4>
                  <p className="text-[10px] text-slate-500">Assembles schedules</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Navigation & Save Controls */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-900 gap-3">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("itinerary")}
                    disabled={!itinerary}
                    className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${
                      activeTab === "itinerary"
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Itinerary Timeline
                  </button>
                  <button
                    onClick={() => setActiveTab("budget")}
                    disabled={!itinerary}
                    className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${
                      activeTab === "budget"
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Budget Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${
                      activeTab === "logs"
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Agent Activity Console
                  </button>
                </div>

                {/* Save Itinerary Button */}
                {itinerary && (
                  <div className="pb-2 sm:pb-0 pr-2">
                    {currentUser ? (
                      <button
                        onClick={handleSaveItinerary}
                        disabled={isSaving || saveStatus === "success"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          saveStatus === "success"
                            ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                            : saveStatus === "error"
                              ? "bg-rose-950 border-rose-500 text-rose-300"
                              : "bg-slate-900 border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-slate-100"
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saveStatus === "success" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Save className="w-3.5 h-3.5 text-violet-400" />
                        )}
                        <span>
                          {saveStatus === "success" ? "Saved to History" :
                           saveStatus === "error" ? "Save Failed" :
                           isSaving ? "Saving..." : "Save to History"}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic block text-right">
                        💡 <button onClick={() => setIsLoginOpen(true)} className="text-violet-400 hover:underline font-semibold cursor-pointer">Sign in</button> to save this itinerary!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tab Contents */}
              <div className="transition-all duration-300">
                {activeTab === "itinerary" && itinerary && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-violet-400 w-4 h-4" />
                      <h2 className="text-lg font-bold text-slate-200">
                        {itinerary.destination} Itinerary Overview
                      </h2>
                    </div>
                    <ItineraryViewer itinerary={itinerary} />
                  </div>
                )}

                {activeTab === "budget" && itinerary && (
                  <BudgetBreakdown 
                    breakdown={itinerary.budget_breakdown} 
                    totalBudget={itinerary.total_budget} 
                  />
                )}

                {activeTab === "logs" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-300">Multi-Agent Event Stream</h2>
                      {isLoading && (
                        <div className="flex items-center gap-2 text-xs text-violet-400">
                          <LoaderIcon />
                          Orchestrating...
                        </div>
                      )}
                    </div>
                    <AgentActivityPanel 
                      logs={logs} 
                      activeAgent={activeAgent} 
                      agentStatuses={agentStatuses} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Login & Signup Modal Overlay */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />

      {/* Footer */}
      <footer className="glass-panel py-6 text-center text-xs text-slate-500 border-t border-slate-900 mt-auto">
        VoyagerAI Travel Planner © 2026. Made with Google Antigravity & Gemini.
      </footer>
    </div>
  );
}

function LoaderIcon() {
  return (
    <svg className="animate-spin h-4.5 w-4.5 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
