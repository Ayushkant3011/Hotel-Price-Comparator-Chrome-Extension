import React from 'react';
import { ExternalLink, Tag } from 'lucide-react';

export default function PriceCard({ competitor, isCheapest }) {
  const formatSiteName = (site) => site.split('.')[0];
  
  // Custom styling based on whether it's the best price
  const baseClasses = "relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 backdrop-blur-sm overflow-hidden group";
  const standardClasses = "bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10";
  const cheapestClasses = "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]";

  return (
    <div className={`${baseClasses} ${isCheapest ? cheapestClasses : standardClasses}`}>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 to-transparent transition-opacity duration-500 pointer-events-none" />

      {isCheapest && (
        <div className="absolute -right-6 top-3 rotate-45 bg-emerald-500 text-white text-[10px] font-bold py-0.5 px-6 shadow-md">
          BEST
        </div>
      )}

      <div className="flex flex-col z-10">
        <div className="flex items-center gap-1.5 mb-1 text-sm font-medium text-slate-300 capitalize">
          {formatSiteName(competitor.site)}
          {isCheapest && <Tag size={12} className="text-emerald-400" />}
        </div>
        <div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={competitor.name}>
          {competitor.name}
        </div>
      </div>

      <div className="flex flex-col items-end z-10">
        <div className={`text-lg font-bold tracking-tight ${isCheapest ? 'text-emerald-400' : 'text-slate-200'}`}>
          {competitor.currency} {competitor.price?.toLocaleString()}
        </div>
        <button className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors mt-1 font-medium">
          View Deal <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
}
