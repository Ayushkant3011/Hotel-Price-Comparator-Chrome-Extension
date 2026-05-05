import React from 'react';
import { BedDouble } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
          <BedDouble size={20} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 tracking-tight">Price Comparator</h1>
          <p className="text-xs text-slate-400">Find the best deal</p>
        </div>
      </div>
      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
    </header>
  );
}
