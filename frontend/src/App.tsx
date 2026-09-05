import React, { useState, useEffect, useMemo } from 'react';
import type { ROIInputs, CampaignSnapshot } from './types';
import { computeLocalROI } from './utils/roiCalculator';
import { getDemoSnapshots } from './utils/demoScenarios';
import { SlidersPanel } from './components/SlidersPanel';
import { ChartsDashboard } from './components/ChartsDashboard';
import { SnapshotsPanel } from './components/SnapshotsPanel';
import { Activity, Sparkles, Layers } from 'lucide-react';

// TODO: replace with your real Stripe/Lemon Squeezy payment link
const PRO_CHECKOUT_URL = 'https://example.com/zroi-pro-checkout-replace-me';

const DEFAULT_INPUTS: ROIInputs = {
  campaign_name: 'Summer Esports Championship',
  channel_type: 'twitch',
  initial_ad_spend: 35000,
  peak_viewership: 120000,
  avg_viewership: 65000,
  broadcast_duration_hours: 5.0,
  estimated_cpm: 15.0,
  conversion_rate_pct: 3.2,
  avg_order_value: 75,
  repeat_customer_ltv_multiplier: 1.4,
  organically_amplified_reach_pct: 35,
};

export const App: React.FC = () => {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_INPUTS);
  const [snapshots, setSnapshots] = useState<CampaignSnapshot[]>(getDemoSnapshots());
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);

  // Compute ROI instantly using local engine (and sync with backend if online)
  const result = useMemo(() => computeLocalROI(inputs), [inputs]);

  // Check backend availability & fetch server snapshots
  useEffect(() => {
    fetch('http://localhost:8000/api/snapshots')
      .then((res) => {
        if (res.ok) {
          setApiOnline(true);
          return res.json();
        }
        return [];
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSnapshots(data);
        }
      })
      .catch(() => {
        setApiOnline(false);
      });
  }, []);

  // Load persisted snapshots from localStorage on mount.
  // On GitHub Pages (no backend) this is what survives a refresh.
  // When the backend is online its snapshot list overrides this later.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zroi_snapshots');
      if (stored) {
        const parsed = JSON.parse(stored) as CampaignSnapshot[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSnapshots((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newOnes = parsed.filter((s) => !existingIds.has(s.id));
            return [...newOnes, ...prev];
          });
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const handleLoadDemos = () => {
    setSnapshots(getDemoSnapshots());
    setInputs(getDemoSnapshots()[0].inputs);
  };

  const handleSaveSnapshot = async (title: string) => {
    const newSnapshot: CampaignSnapshot = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      created_at: new Date().toLocaleString(),
      inputs,
      result,
    };

    setSnapshots((prev) => {
      const next = [newSnapshot, ...prev];
      try { localStorage.setItem('zroi_snapshots', JSON.stringify(next)); } catch {}
      return next;
    });

    // Attempt backend sync
    if (apiOnline) {
      try {
        await fetch('http://localhost:8000/api/snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputs),
        });
      } catch (e) {
        console.error('Snapshot API error:', e);
      }
    }
  };

  const handleLoadSnapshot = (snapshot: CampaignSnapshot) => {
    setInputs(snapshot.inputs);
  };

  const handleDeleteSnapshot = async (id: string) => {
    setSnapshots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem('zroi_snapshots', JSON.stringify(next)); } catch {}
      return next;
    });
    if (apiOnline) {
      try {
        await fetch(`http://localhost:8000/api/snapshots/${id}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.error('Delete API error:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">ZROI</span>
                <button
                  type="button"
                  onClick={() => setShowProModal(true)}
                  className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full hover:bg-amber-500/20 transition-colors shrink-0"
                >
                  PRO
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Live Event & Broadcast ROI Forecasting System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadDemos}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Load Full Demo
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{apiOnline ? 'FastAPI Engine Connected' : 'Local Algorithmic Mode'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Dynamic Live Event ROI Engine (Commercial Demo)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Model real-time sales conversions, organic amplification, and LTV trajectories across Twitch, YouTube Live, TikTok, Live TV, and OTT broadcasts using interactive sliders.
            </p>
          </div>
        </div>

        {/* Core Layout: Left Controls, Right Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <SlidersPanel inputs={inputs} onChange={setInputs} onReset={handleReset} />
          </div>
          <div className="lg:col-span-7 space-y-8">
            <ChartsDashboard result={result} />
          </div>
        </div>

        {/* Scenario Snapshots Panel */}
        <div>
          <SnapshotsPanel
            currentInputs={inputs}
            currentResult={result}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onLoadSnapshot={handleLoadSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          ZROI Brand Marketing Analytics System • Commercial Forecast Platform
        </div>
      </footer>

      {/* Pro tier upgrade modal */}
      {showProModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowProModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 rounded-lg text-slate-950">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-white">ZROI Pro</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              Unlock client-ready reporting and multi-campaign tools for your forecasting workflow.
            </p>

            <div className="space-y-3 mb-6 text-sm">
              {[
                { feature: 'Unlimited scenario snapshots', free: '1 at a time' },
                { feature: 'PDF client report export', free: 'JSON only' },
                { feature: 'Multi-campaign comparison view', free: 'Single view' },
                { feature: 'Custom channel benchmark editing', free: 'Locked to defaults' },
                { feature: 'Browser snapshot persistence', free: 'Session only' },
              ].map((row) => (
                <div key={row.feature} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{row.feature}</span>
                  <span className="text-slate-500">{row.free}</span>
                </div>
              ))}
            </div>

            <a
              href={PRO_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold py-3 rounded-xl text-center transition-colors shadow-lg shadow-emerald-600/20"
            >
              Upgrade to Pro — $9/month
            </a>
            <p className="text-[10px] text-slate-500 text-center mt-3">
              Annual billing and team plans available on request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
