import React, { useState } from 'react';
import { X, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState("Food, Anime, Shopping");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setIsLoading(true);
    const endpoint = isSignUp 
      ? `${API_BASE}/api/auth/register` 
      : `${API_BASE}/api/auth/login`;
    const payload = isSignUp 
      ? { username, password, preferences }
      : { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-pink-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-md shadow-violet-500/20 mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp 
              ? "Register to save your travel itineraries and preferences." 
              : "Sign in to access your saved journeys."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition text-slate-200"
              />
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-violet-500 focus:outline-none transition text-slate-200"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Default Travel Interests</label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. Food, Anime, Shopping"
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition text-slate-200"
              />
              <p className="text-[9px] text-slate-500">Comma-separated interests list</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center mt-5 pt-4 border-t border-slate-900 text-xs text-slate-400">
          {isSignUp ? (
            <span>
              Already have an account?{" "}
              <button 
                onClick={() => { setIsSignUp(false); setError(""); }} 
                className="text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{" "}
              <button 
                onClick={() => { setIsSignUp(true); setError(""); }} 
                className="text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                Create One
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
