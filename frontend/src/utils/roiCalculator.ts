import type { ChannelBenchmark, ChannelType, ROIInputs, ROICalculationResult } from '../types';

export const CHANNEL_BENCHMARKS: Record<ChannelType, ChannelBenchmark> = {
  live_tv: {
    channel_type: 'live_tv',
    name: 'Live Broadcast TV',
    description: 'Mass national & regional reach with high passive brand trust, moderate immediate digital conversions.',
    avg_engagement_rate: 1.2,
    typical_conversion_rate: 1.5,
    cpm_range: '$18 - $35',
    decay_rate: 0.85,
    viral_coefficient: 1.1
  },
  twitch: {
    channel_type: 'twitch',
    name: 'Twitch Live Streaming',
    description: 'Highly interactive gaming & creator community with high real-time chat engagement and high direct digital action.',
    avg_engagement_rate: 5.5,
    typical_conversion_rate: 3.2,
    cpm_range: '$10 - $22',
    decay_rate: 0.70,
    viral_coefficient: 1.4
  },
  youtube_live: {
    channel_type: 'youtube_live',
    name: 'YouTube Live & VOD',
    description: 'High live viewer count combined with long-tail VOD replay value and strong search discoverability.',
    avg_engagement_rate: 4.0,
    typical_conversion_rate: 2.8,
    cpm_range: '$12 - $25',
    decay_rate: 0.92,
    viral_coefficient: 1.3
  },
  ott_streaming: {
    channel_type: 'ott_streaming',
    name: 'OTT / Connected TV',
    description: 'Targeted CTV ads with premium video completion rates and measurable digital cross-device attribution.',
    avg_engagement_rate: 2.5,
    typical_conversion_rate: 2.0,
    cpm_range: '$20 - $40',
    decay_rate: 0.80,
    viral_coefficient: 1.15
  },
  tiktok_live: {
    channel_type: 'tiktok_live',
    name: 'TikTok Live & Social',
    description: 'High viral potential, fast impulse purchasing, shorter viewer retention per stream session.',
    avg_engagement_rate: 7.2,
    typical_conversion_rate: 3.8,
    cpm_range: '$8 - $18',
    decay_rate: 0.60,
    viral_coefficient: 1.6
  }
};

// Turnover factors: viewers-per-concurrent-hour. Higher = more impression turnover.
const TURNOVER_FACTORS: Record<ChannelType, number> = {
  twitch: 2.5,
  youtube_live: 2.8,
  tiktok_live: 3.2,
  live_tv: 1.8,
  ott_streaming: 2.0
};

// 12-month cohort retention curves for repeat-purchase value.
// Each inner array sums to 1.0 — the fraction of repeat pool realized each month.
const LTV_RETENTION_CURVES: Record<ChannelType, number[]> = {
  twitch:      [0.30, 0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01],
  youtube_live:[0.25, 0.17, 0.13, 0.10, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
  tiktok_live: [0.35, 0.20, 0.12, 0.08, 0.06, 0.04, 0.03, 0.03, 0.02, 0.01, 0.01, 0.005],
  live_tv:     [0.15, 0.13, 0.11, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03],
  ott_streaming:[0.18, 0.14, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03]
};

// Brand lift weight curve for TV/CTV (sums to 1.0 across 12 months).
const BRAND_LIFT_WEIGHTS: number[] = [0.08, 0.09, 0.10, 0.10, 0.09, 0.08, 0.08, 0.07, 0.07, 0.06, 0.05, 0.04];

const VIDEO_CHANNELS: ChannelType[] = ['youtube_live', 'live_tv', 'ott_streaming'];

const CHANNEL_LINKS: Record<ChannelType, { label: string; url: string }> = {
  twitch: { label: 'Open Twitch Ad Console', url: 'https://www.twitch.tv/advertise' },
  youtube_live: { label: 'Start a YouTube Video Campaign', url: 'https://ads.google.com/home/' },
  tiktok_live: { label: 'TikTok Business Ads', url: 'https://www.tiktok.com/business/en' },
  live_tv: { label: 'Television advertising overview', url: 'https://en.wikipedia.org/wiki/Television_advertisement' },
  ott_streaming: { label: 'Connected TV advertising overview', url: 'https://en.wikipedia.org/wiki/Connected_TV' }
};

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function cumulativePaybackMonth(
  timeline: { total_revenue: number; cumulative_cost: number }[]
): number {
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].total_revenue >= timeline[i].cumulative_cost) {
      return i + 1;
    }
  }
  return 13; // never pays back within 12 months
}

export function computeLocalROI(inputs: ROIInputs): ROICalculationResult {
  const benchmark = CHANNEL_BENCHMARKS[inputs.channel_type] ?? CHANNEL_BENCHMARKS.twitch;
  const channel = inputs.channel_type;
  const isVideoChannel = VIDEO_CHANNELS.includes(channel);
  const hasBrandLift = channel === 'live_tv' || channel === 'ott_streaming';

  // ── Impressions ──────────────────────────────────────────────────────
  const turnoverFactor = TURNOVER_FACTORS[channel] ?? 2.5;
  const rawImpressions = Math.round(inputs.avg_viewership * inputs.broadcast_duration_hours * turnoverFactor);

  const peakDiff = (inputs.peak_viewership - inputs.avg_viewership) / Math.max(inputs.avg_viewership, 1);
  const peakBoost = Math.min(1 + peakDiff * 0.25, 1.5);

  const organicMultiplier = 1 + (inputs.organically_amplified_reach_pct / 100) * benchmark.viral_coefficient;

  const total_impressions = Math.max(Math.round(rawImpressions * peakBoost * organicMultiplier), 100);
  const effective_cpm = total_impressions > 0
    ? round2((inputs.initial_ad_spend / total_impressions) * 1000)
    : inputs.estimated_cpm;

  // Unique reach estimate: impressions ÷ average frequency
  let frequencyEstimate = 1 + (inputs.broadcast_duration_hours - 1) * 0.3;
  if (channel === 'live_tv' || channel === 'ott_streaming') frequencyEstimate *= 1.5;
  frequencyEstimate = Math.max(frequencyEstimate, 1);
  const unique_reach = Math.round(total_impressions / frequencyEstimate);

  // ── Conversions ──────────────────────────────────────────────────────
  const conversionRate = inputs.conversion_rate_pct / 100;
  const directConversions = Math.round(total_impressions * conversionRate);

  let totalConversions = directConversions;
  if (isVideoChannel) {
    const viewThroughConversions = Math.round(total_impressions * conversionRate * 0.15);
    totalConversions += viewThroughConversions;
  }

  // ── Revenue ──────────────────────────────────────────────────────────
  const direct_revenue = totalConversions * inputs.avg_order_value;

  // Repeat purchase pool = direct_revenue × (ltv_multiplier − 1)
  // ltv_multiplier of 1.4 → 40% of direct value realized as repeat purchases
  const totalRepeatPool = direct_revenue * Math.max(inputs.repeat_customer_ltv_multiplier - 1, 0);
  const retentionCurve = LTV_RETENTION_CURVES[channel] ?? LTV_RETENTION_CURVES.twitch;

  const ltvByMonth = retentionCurve.map(w => round2(totalRepeatPool * w));

  // Brand lift (TV/CTV only): % of ad spend, distributed across 12 months
  let brandLiftTotal = 0;
  const brandLiftByMonth: number[] = [0,0,0,0,0,0,0,0,0,0,0,0];
  if (hasBrandLift) {
    const brandLiftRate = 0.18 + (inputs.organically_amplified_reach_pct / 100) * 0.12;
    brandLiftTotal = round2(inputs.initial_ad_spend * brandLiftRate);
    const weightSum = BRAND_LIFT_WEIGHTS.reduce((a, b) => a + b, 0);
    for (let m = 0; m < 12; m++) {
      brandLiftByMonth[m] = round2(brandLiftTotal * (BRAND_LIFT_WEIGHTS[m] / weightSum));
    }
  }

  // Total repeat + brand per month
  const monthlyExtraRevenue = ltvByMonth.map((rv, i) => round2(rv + brandLiftByMonth[i]));
  const ltv_revenue = round2(direct_revenue + monthlyExtraRevenue.reduce((a, b) => a + b, 0));
  const total_revenue = round2(direct_revenue + monthlyExtraRevenue.reduce((a, b) => a + b, 0));
  const brand_lift_total = round2(brandLiftTotal);

  // ── Bottom line ──────────────────────────────────────────────────────
  const net_profit = round2(total_revenue - inputs.initial_ad_spend);
  const roi_percentage = inputs.initial_ad_spend > 0
    ? round2((net_profit / inputs.initial_ad_spend) * 100)
    : 0;
  const roas = inputs.initial_ad_spend > 0
    ? round2(total_revenue / inputs.initial_ad_spend)
    : 0;
  const cpa = totalConversions > 0
    ? round2(inputs.initial_ad_spend / totalConversions)
    : 0;
  const breakeven_conversions = inputs.avg_order_value > 0
    ? Math.ceil(inputs.initial_ad_spend / inputs.avg_order_value)
    : 0;

  // ── 12-month timeline ───────────────────────────────────────────────
  const timeline_forecast: ROICalculationResult['timeline_forecast'] = [];
  let cumulativeRevenue = 0;

  // Precompute decay weights for months 2-12 so they normalize to 1.0
  const decayWeights: number[] = [];
  for (let m = 1; m <= 12; m++) {
    decayWeights.push(Math.pow(benchmark.decay_rate, m - 1));
  }
  // Weight for M1 direct portion (index 0), and the sum of weights for M2-M12
  const m1DirectWeight = decayWeights[0];
  const remainingWeightsSum = decayWeights.slice(1).reduce((a, b) => a + b, 0);

  for (let month = 1; month <= 12; month++) {
    // Direct revenue: M1 gets heavy portion, M2-M12 share the rest via normalized decay
    let directPortion: number;
    if (month === 1) {
      directPortion = round2(direct_revenue * 0.65);
    } else {
      const idx = month - 1;
      const normalized = remainingWeightsSum > 0
        ? decayWeights[idx] / remainingWeightsSum
        : 1 / 11;
      directPortion = round2(direct_revenue * 0.35 * normalized);
    }

    // Repeat + brand lift portion this month
    const extraPortion = monthlyExtraRevenue[month - 1] ?? 0;

    const monthDirect = directPortion;
    const monthLTV = round2(directPortion + extraPortion);
    const monthTotal = round2(monthDirect + extraPortion);
    cumulativeRevenue += monthTotal;

    const cumCost = inputs.initial_ad_spend;
    const cumROI = cumCost > 0 ? round2(((cumulativeRevenue - cumCost) / cumCost) * 100) : 0;
    const paybackAchieved = cumulativeRevenue >= cumCost;

    // Conversions this month: distribute totalConversions by direct revenue share
    const monthConversions = direct_revenue > 0
      ? Math.round(totalConversions * (monthDirect / direct_revenue))
      : (month === 1 ? Math.max(Math.round(totalConversions * 0.65), 1) : 0);

    // Impressions: M1 = full, rest decay by 1/month
    const monthImpressions = Math.round(total_impressions * (month === 1 ? 1 : 0.1 / month));

    timeline_forecast.push({
      period_label: `M${month}`,
      month,
      direct_revenue: monthDirect,
      ltv_revenue: monthLTV,
      total_revenue: monthTotal,
      cumulative_cost: cumCost,
      roi_percentage: cumROI,
      payback_achieved: paybackAchieved,
      projected_conversions: month === 1 ? Math.max(monthConversions, 1) : monthConversions,
      impressions: monthImpressions
    });
  }

  const payback_month = cumulativePaybackMonth(timeline_forecast);

  return {
    inputs,
    total_impressions,
    unique_reach,
    effective_cpm,
    estimated_conversions: totalConversions,
    direct_revenue: round2(direct_revenue),
    ltv_revenue,
    brand_lift_total,
    total_revenue,
    net_profit,
    roi_percentage,
    roas,
    cpa,
    breakeven_conversions,
    payback_month,
    timeline_forecast,
    channel_insights: {
      channel_name: benchmark.name,
      benchmark_summary: benchmark.description,
      recommendation: `For ${benchmark.name}, target a CPM below ${benchmark.cpm_range} and optimize post-stream retargeting for optimal LTV conversion. Projected payback in ${payback_month <= 12 ? payback_month + ' month' + (payback_month !== 1 ? 's' : '') : '>12 months'}.`,
      action_label: CHANNEL_LINKS[channel]?.label,
      action_url: CHANNEL_LINKS[channel]?.url,
      pro_insight: roi_percentage >= 0
        ? 'Positive ROI projected — upgrade to Pro to export this forecast as a client-ready report and compare multiple scenarios side by side.'
        : 'ROI is currently negative. Adjust ad spend, conversion rate, or order value above to find your breakeven — Pro saves unlimited scenarios and exports client reports.'
    }
  };
}
