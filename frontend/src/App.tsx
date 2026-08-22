import React, { useState, useEffect, useMemo } from 'react';
import type { ROIInputs, CampaignSnapshot } from './types';
import { computeLocalROI } from './utils/roiCalculator';
import { SlidersPanel } from './components/SlidersPanel';
import { ChartsDashboard } from './components/ChartsDashboard';
import { SnapshotsPanel } from './components/SnapshotsPanel';
import { Activity, Sparkles } from 'lucide-react';

const DEFAULT_INPUTS: ROIInputs = {
  campaign_name: 'Summer Gaming Championship',
  channel_type: 'twitch',
  initial_ad_spend: 25000,
  peak_viewership: 85000,
  avg_viewership: 45000,
  broadcast_duration_hours: 4.0,
  estimated_cpm: 15.0,
  conversion_rate_pct: 2.8,
  avg_order_value: 65,
  repeat_customer_ltv_multiplier: 1.35,
  organically_amplified_reach_pct: 30,
};

export const App: React.FC = () => {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_INPUTS);
  const [snapshots, setSnapshots] = useState<CampaignSnapshot[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  // Compute ROI instantly using local engine (and sync with backend if online)
  const result = useMemo(() => computeLocalROI(inputs), [inputs]);

  // Check backend availability
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

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const handleSaveSnapshot = async (title: string) => {
    const newSnapshot: CampaignSnapshot = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      created_at: new Date().toLocaleString(),
      inputs,
      result,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);

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
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
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
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Live Event & Broadcast ROI Forecasting System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{apiOnline ? 'FastAPI Engine Connected' : 'Local Algorithmic Mode'}</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Docs & Guide
            </a>
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
              Dynamic Live Event ROI Engine
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
    </div>
  );
};

export default App;
