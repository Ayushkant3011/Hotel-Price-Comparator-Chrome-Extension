import React from 'react';
import { MapPin, Star, Bell, BellRing } from 'lucide-react';
import useStore from '../store/useStore';

export default function CurrentListing({ detection }) {
  const { isWatched, toggleWatch } = useStore();
  if (!detection) return null;

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
              onClick={(e) => {
                e.preventDefault();
                toggleWatch();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                isWatched 
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
    </div>
  );
}
