import { create } from 'zustand';

const useStore = create((set, get) => ({
  status: 'loading', // 'loading', 'requesting', 'done', 'error', 'dev-mode'
  currentDetection: null,
  competitorPrices: [],
  matchCount: 0,

  fetchData: () => {
    set({ status: 'requesting' });

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs && tabs.length > 0 ? tabs[0].id : null;
          // 1. Get detection from background script for the current tab
          chrome.runtime.sendMessage({ type: 'GET_DETECTIONS', tabId }, (resp) => {
            if (chrome.runtime.lastError) {
              console.error('Runtime error:', chrome.runtime.lastError);
              set({ status: 'error' });
              return;
            }

            const detection = resp?.detection;
            
            if (!detection) {
              set({ status: 'done', currentDetection: null, competitorPrices: [] });
              return;
            }

            set({ currentDetection: detection });

            // 2. Fetch competitor prices based on the detected hotel
            if (detection.title) {
              chrome.runtime.sendMessage({ 
                type: 'COMPARE_REQUEST', 
                hotelName: detection.title, 
                location: detection.location 
              }, (compareResp) => {
                if (compareResp && compareResp.ok && compareResp.data) {
                  set({ 
                    status: 'done', 
                    competitorPrices: compareResp.data.matches || [],
                    matchCount: compareResp.data.matchCount || 0
                  });
                } else {
                  set({ status: 'done', competitorPrices: [] });
                }
              });
            } else {
              set({ status: 'done', competitorPrices: [] });
            }
          });
        });
      } else {
        // Not running inside extension (dev server fallback)
        set({ 
          status: 'dev-mode', 
          currentDetection: {
            title: 'Taj Mahal Palace Mumbai',
            location: 'Mumbai, India',
            price: 13200,
            currency: 'INR',
            site: 'airbnb.com',
            rating: 4.8,
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          },
          competitorPrices: [
            { site: 'expedia.com', price: 11800, currency: 'INR', name: 'The Taj Mahal Palace Hotel' },
            { site: 'booking.com', price: 12500, currency: 'INR', name: 'Taj Mahal Palace' },
            { site: 'airbnb.com', price: 13200, currency: 'INR', name: 'Taj Mahal Palace Mumbai' }
          ]
        });
      }
    } catch (err) {
      console.error('Store fetch error', err);
      set({ status: 'error' });
    }
  }
}));

export default useStore;
