import React from 'react';
import type { ROIInputs, ChannelType } from '../types';
import { CHANNEL_BENCHMARKS } from '../utils/roiCalculator';
import { Sliders, DollarSign, Users, Clock, Target, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  inputs: ROIInputs;
  onChange: (updated: ROIInputs) => void;
  onReset: () => void;
}

export const SlidersPanel: React.FC<Props> = ({ inputs, onChange, onReset }) => {
  const handleChange = (key: keyof ROIInputs, value: any) => {
    onChange({ ...inputs, [key]: value });
  };

  const channelOptions: { type: ChannelType; label: string; icon: string }[] = [
    { type: 'twitch', label: 'Twitch Live', icon: '🎮' },
    { type: 'youtube_live', label: 'YouTube Live', icon: '▶️' },
    { type: 'live_tv', label: 'Live TV Broadcast', icon: '📺' },
    { type: 'ott_streaming', label: 'OTT / CTV Streaming', icon: '🎬' },
    { type: 'tiktok_live', label: 'TikTok Live', icon: '⚡' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Live Forecast Sliders</h2>
            <p className="text-xs text-slate-400">Adjust variables to see real-time ROI response</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Campaign Name & Channel Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaign Details</label>
        <input
          type="text"
          value={inputs.campaign_name}
          onChange={(e) => handleChange('campaign_name', e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="Campaign Title"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {channelOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleChange('channel_type', opt.type)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                inputs.channel_type === opt.type
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Channel Benchmark Info */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
        <div className="flex justify-between font-medium text-emerald-400">
          <span>{CHANNEL_BENCHMARKS[inputs.channel_type].name} Benchmark</span>
          <span>CPM: {CHANNEL_BENCHMARKS[inputs.channel_type].cpm_range}</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          {CHANNEL_BENCHMARKS[inputs.channel_type].description}
        </p>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-5">
        {/* Ad Spend */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Initial Ad Spend
            </span>
            <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              ${inputs.initial_ad_spend.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="250000"
            step="1000"
            value={inputs.initial_ad_spend}
            onChange={(e) => handleChange('initial_ad_spend', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Viewership Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Avg Viewership
              </span>
              <span className="text-blue-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {inputs.avg_viewership.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={inputs.avg_viewership}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({
                  ...inputs,
                  avg_viewership: val,
                  peak_viewership: Math.max(inputs.peak_viewership, val)
                });
              }}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Peak Viewership
              </span>
              <span className="text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {inputs.peak_viewership.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={inputs.avg_viewership}
              max="1000000"
              step="5000"
              value={inputs.peak_viewership}
              onChange={(e) => handleChange('peak_viewership', Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Broadcast Duration & Conversion Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration (Hours)
              </span>
              <span className="text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {inputs.broadcast_duration_hours} hrs
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.5"
              value={inputs.broadcast_duration_hours}
              onChange={(e) => handleChange('broadcast_duration_hours', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" /> Conversion Rate
              </span>
              <span className="text-purple-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {inputs.conversion_rate_pct}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={inputs.conversion_rate_pct}
              onChange={(e) => handleChange('conversion_rate_pct', Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Average Order Value & Organic Amplification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" /> Avg Order Value
              </span>
              <span className="text-teal-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                ${inputs.avg_order_value}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={inputs.avg_order_value}
              onChange={(e) => handleChange('avg_order_value', Number(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Organic Amplification
              </span>
              <span className="text-pink-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                +{inputs.organically_amplified_reach_pct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={inputs.organically_amplified_reach_pct}
              onChange={(e) => handleChange('organically_amplified_reach_pct', Number(e.target.value))}
              className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
