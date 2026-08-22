import React, { useState } from 'react';
import type { CampaignSnapshot, ROIInputs, ROICalculationResult } from '../types';
import { BookmarkPlus, Trash2, Download, ArrowUpRight, History } from 'lucide-react';

interface Props {
  currentInputs: ROIInputs;
  currentResult: ROICalculationResult;
  snapshots: CampaignSnapshot[];
  onSaveSnapshot: (title: string) => void;
  onLoadSnapshot: (snapshot: CampaignSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
}

export const SnapshotsPanel: React.FC<Props> = ({
  currentInputs,
  currentResult,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot
}) => {
  const [snapshotTitle, setSnapshotTitle] = useState('');

  const handleSave = () => {
    const title = snapshotTitle.trim() || `${currentInputs.campaign_name} Snapshot`;
    onSaveSnapshot(title);
    setSnapshotTitle('');
  };

  const handleExportJSON = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      current_model: {
        inputs: currentInputs,
        result: currentResult
      },
      saved_snapshots: snapshots
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zroi_campaign_forecast_${currentInputs.campaign_name.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Campaign Scenario Snapshots</h3>
            <p className="text-xs text-slate-400">Save and compare multiple forecasting scenarios</p>
          </div>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export Model JSON
        </button>
      </div>

      {/* Save Snapshot Form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={snapshotTitle}
          onChange={(e) => setSnapshotTitle(e.target.value)}
          placeholder={`Name snapshot (e.g., "${currentInputs.campaign_name} Optimistic")`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-colors shrink-0"
        >
          <BookmarkPlus className="w-4 h-4" />
          Save Snapshot
        </button>
      </div>

      {/* List of Saved Snapshots */}
      {snapshots.length === 0 ? (
        <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
          No saved snapshots yet. Save a snapshot above to compare different ad spend and viewership models.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {snapshots.map((snap) => {
            const isPositive = snap.result.roi_percentage >= 0;
            return (
              <div
                key={snap.id}
                className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate max-w-[180px]">{snap.title}</h4>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {snap.result.roi_percentage}% ROI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{snap.created_at}</p>
                </div>

                <div className="text-xs text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                  <div className="flex justify-between">
                    <span>Ad Spend:</span>
                    <span className="font-semibold text-slate-200">${snap.inputs.initial_ad_spend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LTV Revenue:</span>
                    <span className="font-semibold text-blue-400">${snap.result.ltv_revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onLoadSnapshot(snap)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Load Model</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
