import React, { useState } from 'react';
import { MapPin, Star, Bell, BellRing } from 'lucide-react';
import useStore from '../store/useStore';

export default function CurrentListing({ detection }) {
  const { isWatched, toggleWatch } = useStore();
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState('');

  if (!detection) return null;

  const handleWatchClick = (e) => {
    e.preventDefault();
    if (!isWatched) {
      setShowEmailPrompt(true); // Show the email prompt
    } else {
      toggleWatch(); // Unwatch
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim() === '' || !/\S+@\S+\.\S+/.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    toggleWatch(email); // Pass the email to the toggleWatch function
    setShowEmailPrompt(false);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10">
      {detection.imageUrl ? (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={detection.imageUrl}
            alt={detection.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-20 w-full bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-center text-slate-500 text-xs">
          No image available
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 pr-2">
            {detection.title}
          </h2>
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-semibold shrink-0">
            <Star size={12} className="fill-amber-400" />
            {detection.rating || 'New'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{detection.location || 'Unknown location'}</span>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-400">
              Current Price <span className="capitalize">({detection.site.split('.')[0]})</span>
            </div>
            <button
              onClick={handleWatchClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${isWatched
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
            >
              {isWatched ? <BellRing size={14} className="animate-bounce" /> : <Bell size={14} />}
              {isWatched ? 'Watching' : 'Watch Price'}
            </button>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            {detection.currency} {detection.price?.toLocaleString() || '---'}
          </div>
        </div>
      </div>

      {/* Email Prompt Modal */}
      {showEmailPrompt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                <Bell size={24} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Price Watch</h3>
              <p className="text-sm text-slate-400 mt-1">Enter your email to receive alerts when this price drops.</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                >
                  Start Watching
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPrompt(false)}
                  className="w-full py-2.5 bg-transparent text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
