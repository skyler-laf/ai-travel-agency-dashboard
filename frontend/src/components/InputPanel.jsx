import React, { useState } from 'react';
import { Compass, Calendar, DollarSign, Heart, Play, AlertCircle } from 'lucide-react';

const PRESET_INTERESTS = [
  "Food", "Anime", "Shopping", "Culture", "Relaxation", "Adventure", "Museums", "Nightlife", "Nature"
];

export default function InputPanel({ onSubmit, isLoading, userPreferences }) {
  const [origin, setOrigin] = useState("New York");
  const [destination, setDestination] = useState("Tokyo");
  const [dates, setDates] = useState("July 10–17");
  const [budget, setBudget] = useState("3000");
  const [selectedInterests, setSelectedInterests] = useState(["Food", "Anime", "Shopping"]);
  const [error, setError] = useState("");

  // Sync preferences when user logs in
  React.useEffect(() => {
    if (userPreferences) {
      const parsed = userPreferences.split(",").map(p => p.trim()).filter(Boolean);
      if (parsed.length > 0) {
        setSelectedInterests(parsed);
      }
    }
  }, [userPreferences]);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || !dates.trim() || !budget.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setError("Please enter a valid budget above $0.");
      return;
    }
    setError("");
    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      dates: dates.trim(),
      budget: numBudget,
      preferences: selectedInterests.join(", ")
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500"></div>
      
      <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
        <Compass className="text-violet-400 w-5 h-5 animate-spin-slow" />
        Configure Your Journey
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Origin & Destination */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Origin</label>
            <div className="relative">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition"
                placeholder="e.g. New York"
              />
              <Compass className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination</label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition"
                placeholder="e.g. Tokyo"
              />
              <Compass className="absolute left-3 top-3 w-4 h-4 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Travel Dates */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Travel Dates</label>
          <div className="relative">
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition"
              placeholder="e.g. July 10–17"
            />
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budget (USD)</label>
          <div className="relative">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition"
              placeholder="e.g. 3000"
            />
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Traveler Preferences */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            Traveler Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_INTERESTS.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={isLoading}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                    active
                      ? "bg-violet-500/20 border-violet-500 text-violet-300"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition duration-300 ${
            isLoading
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/25 active:scale-98"
          }`}
        >
          <Play className={`w-4 h-4 ${isLoading ? '' : 'fill-current'}`} />
          {isLoading ? "Consulting Agents..." : "Plan Trip"}
        </button>
      </form>
    </div>
  );
}
