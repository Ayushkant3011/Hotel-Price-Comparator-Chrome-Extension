import React, { useEffect } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import CurrentListing from './components/CurrentListing';
import PriceCard from './components/PriceCard';
import PriceChart from './components/PriceChart';

export default function Popup() {
  const { status, currentDetection, competitorPrices, fetchData } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Find the minimum price to highlight the best deal
  const validPrices = competitorPrices.filter(p => p.price != null);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices.map(p => p.price)) : null;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-200 font-sans p-5 selection:bg-blue-500/30">
      <div className="max-w-md mx-auto">
        <Header />

        {status === 'loading' || status === 'requesting' ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">Scanning for best prices...</p>
          </div>
        ) : status === 'error' ? (
          <div className="py-10 text-center">
            <div className="text-red-400 mb-2">⚠️ Something went wrong</div>
            <p className="text-sm text-slate-500">Failed to connect to the background service.</p>
          </div>
        ) : !currentDetection ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center text-2xl">
              🏨
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">No Hotel Detected</h2>
            <p className="text-sm text-slate-400 px-6">
              Visit a hotel listing on Booking.com, Airbnb, or Expedia to see price comparisons.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* The hotel the user is currently looking at */}
            <CurrentListing detection={currentDetection} />

            {/* Competitor Prices List */}
            {competitorPrices.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Other Deals Found
                </h3>
                {competitorPrices.map((competitor, idx) => (
                  <PriceCard 
                    key={`${competitor.site}-${idx}`} 
                    competitor={competitor} 
                    isCheapest={competitor.price === minPrice} 
                  />
                ))}
              </div>
            )}

            {/* Visual Comparison Chart */}
            <PriceChart prices={competitorPrices} />
          </div>
        )}

        {status === 'dev-mode' && (
          <div className="mt-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center">
            Running in Development Mode (Mock Data)
          </div>
        )}
      </div>
    </div>
  );
}
