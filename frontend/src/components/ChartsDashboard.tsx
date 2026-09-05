import React, { useState } from 'react';
import type { ROICalculationResult } from '../types';
import { CHANNEL_BENCHMARKS } from '../utils/roiCalculator';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, DollarSign, Eye, ShoppingCart, Award, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface Props {
  result: ROICalculationResult;
}

export const ChartsDashboard: React.FC<Props> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'roi' | 'revenue' | 'conversions'>('roi');

  const isPositiveROI = result.roi_percentage >= 0;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ROI & ROAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ROI / ROAS</span>
            <div className={`p-2 rounded-xl ${isPositiveROI ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className={`text-xl xl:text-2xl font-extrabold truncate ${isPositiveROI ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.roi_percentage > 0 ? '+' : ''}{result.roi_percentage}%
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Net Profit: <span className="font-semibold text-slate-200">{formatCurrency(result.net_profit)}</span></span>
              <span className="text-slate-400">ROAS: <span className="font-semibold text-slate-200">{result.roas.toFixed(2)}x</span></span>
            </div>
            <div className="text-[10px] text-slate-500">
              Payback: {result.payback_month <= 12 ? `Month ${result.payback_month}` : '>12 mo'}
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">12-Mo Revenue</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl xl:text-2xl font-extrabold text-blue-400 truncate">
              {formatCurrency(result.total_revenue)}
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Direct: <span className="font-semibold text-slate-200">{formatCurrency(result.direct_revenue)}</span></span>
              <span className="text-slate-400">LTV: <span className="font-semibold text-slate-200">{formatCurrency(result.ltv_revenue)}</span></span>
            </div>
            {result.brand_lift_total > 0 && (
              <div className="text-[10px] text-amber-400/70">
                Brand lift: {formatCurrency(result.brand_lift_total)}
              </div>
            )}
          </div>
        </div>

        {/* Reach & CPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reach & CPM</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl xl:text-2xl font-extrabold text-purple-400 truncate">
              {result.unique_reach.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">
              Unique viewers (est.)
            </div>
            <div className="text-[10px] text-slate-500">
              eCPM: <span className="font-semibold text-slate-300">${result.effective_cpm}</span> · Impressions: {result.total_impressions.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Conversions & CPA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversions</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl xl:text-2xl font-extrabold text-amber-400 truncate">
              {result.estimated_conversions.toLocaleString()}
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">CPA: <span className="font-semibold text-slate-200">${result.cpa}</span></span>
              <span className="text-slate-400">BE: <span className="font-semibold text-slate-200">{result.breakeven_conversions.toLocaleString()}</span></span>
            </div>
            <div className="text-[10px] text-slate-500">
              {result.estimated_conversions > 0 ? `Acquire ${result.breakeven_conversions.toLocaleString()} to break even` : 'No conversions at current rate'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              12-Month Campaign Forecast Timeline
            </h3>
            <p className="text-xs text-slate-400">Visualized growth and payback trajectory based on channel benchmarks</p>
          </div>

          {/* Chart View Toggles */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('roi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'roi' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ROI % Curve
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'revenue' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Revenue vs Cost
            </button>
            <button
              onClick={() => setActiveTab('conversions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'conversions' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Conversions
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={result.timeline_forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="period_label" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  color: '#f8fafc'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />

              {activeTab === 'roi' && (
                <>
                  <Area type="monotone" dataKey="roi_percentage" name="Cumulative ROI (%)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRoi)" />
                  <Line type="monotone" dataKey="roi_percentage" name="ROI Trend" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} />
                </>
              )}

              {activeTab === 'revenue' && (
                <>
                  <Area type="monotone" dataKey="total_revenue" name="LTV Revenue ($)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Line type="monotone" dataKey="direct_revenue" name="Direct Sales Revenue ($)" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="cumulative_cost" name="Ad Cost ($)" stroke="#f43f5e" strokeWidth={2} />
                </>
              )}

              {activeTab === 'conversions' && (
                <Bar dataKey="projected_conversions" name="Monthly Conversion Volume" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Insights Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Strategic Insight for {result.channel_insights.channel_name}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {result.channel_insights.recommendation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl whitespace-nowrap self-end md:self-auto">
          <AlertCircle className="w-3.5 h-3.5" />
          Viral Factor: {CHANNEL_BENCHMARKS[result.inputs.channel_type].viral_coefficient}x
        </div>
      </div>

      {/* Channel action link + Pro tier callout */}
      {result.channel_insights.action_url && (
        <div className="flex justify-center sm:justify-start">
          <a
            href={result.channel_insights.action_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {result.channel_insights.action_label}
          </a>
        </div>
      )}
      {result.channel_insights.pro_insight && (
        <div className="flex justify-center sm:justify-start">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold mr-1">PRO</span>
            <span className="text-slate-300">{result.channel_insights.pro_insight}</span>
          </div>
        </div>
      )}
    </div>
  );
};
