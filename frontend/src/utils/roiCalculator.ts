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

const CHANNEL_LINKS: Record<ChannelType, { label: string; url: string }> = {
  twitch: { label: 'Open Twitch Ad Console', url: 'https://www.twitch.tv/advertise' },
  youtube_live: { label: 'Start a YouTube Video Campaign', url: 'https://ads.google.com/home/' },
  tiktok_live: { label: 'TikTok Business Ads', url: 'https://www.tiktok.com/business/en' },
  live_tv: { label: 'Television advertising overview', url: 'https://en.wikipedia.org/wiki/Television_advertisement' },
  ott_streaming: { label: 'Connected TV advertising overview', url: 'https://en.wikipedia.org/wiki/Connected_TV' },
};

export function computeLocalROI(inputs: ROIInputs): ROICalculationResult {
  const benchmark = CHANNEL_BENCHMARKS[inputs.channel_type] || CHANNEL_BENCHMARKS.twitch;

  const turnoverFactor = (inputs.channel_type === 'live_tv' || inputs.channel_type === 'ott_streaming') ? 1.8 : 2.5;
  const rawImpressions = Math.round(inputs.avg_viewership * inputs.broadcast_duration_hours * turnoverFactor);

  const peakMultiplier = 1.0 + ((inputs.peak_viewership - inputs.avg_viewership) / Math.max(inputs.avg_viewership, 1)) * 0.2;
  const organicMultiplier = 1.0 + (inputs.organically_amplified_reach_pct / 100.0) * benchmark.viral_coefficient;

  const total_impressions = Math.max(Math.round(rawImpressions * peakMultiplier * organicMultiplier), 100);
  const effective_cpm = total_impressions > 0 ? (inputs.initial_ad_spend / total_impressions) * 1000 : inputs.estimated_cpm;

  const conversionRate = inputs.conversion_rate_pct / 100.0;
  const estimated_conversions = Math.round(total_impressions * conversionRate);

  const direct_revenue = estimated_conversions * inputs.avg_order_value;
  const ltv_revenue = direct_revenue * inputs.repeat_customer_ltv_multiplier;

  const net_profit = ltv_revenue - inputs.initial_ad_spend;
  const roi_percentage = inputs.initial_ad_spend > 0 ? (net_profit / inputs.initial_ad_spend) * 100.0 : 0.0;

  const breakeven_conversions = inputs.avg_order_value > 0 ? Math.ceil(inputs.initial_ad_spend / inputs.avg_order_value) : 0;

  const timeline_forecast = [];
  let accumulated_direct = 0;
  let accumulated_ltv = 0;

  for (let month = 1; month <= 12; month++) {
    let month_direct = 0;
    let month_ltv = 0;

    if (month === 1) {
      month_direct = direct_revenue * 0.65;
      month_ltv = ltv_revenue * 0.50;
    } else {
      const decayFactor = Math.pow(benchmark.decay_rate, month - 1);
      month_direct = (direct_revenue * 0.35) * (decayFactor / 2.5);
      month_ltv = (ltv_revenue * 0.50) * (decayFactor / 2.0);
    }

    accumulated_direct += month_direct;
    accumulated_ltv += month_ltv;

    const cum_cost = inputs.initial_ad_spend;
    const cum_roi = cum_cost > 0 ? ((accumulated_ltv - cum_cost) / cum_cost) * 100.0 : 0;
    const month_conversions = Math.round(estimated_conversions * (month_direct / Math.max(direct_revenue, 1.0)));

    timeline_forecast.push({
      period_label: `M${month}`,
      month: month,
      direct_revenue: Number(accumulated_direct.toFixed(2)),
      ltv_revenue: Number(accumulated_ltv.toFixed(2)),
      total_revenue: Number(accumulated_ltv.toFixed(2)),
      cumulative_cost: Number(cum_cost.toFixed(2)),
      roi_percentage: Number(cum_roi.toFixed(2)),
      projected_conversions: month === 1 ? Math.max(month_conversions, 1) : month_conversions,
      impressions: Math.round(total_impressions * (month === 1 ? 1 : (0.1 / month)))
    });
  }

  return {
    inputs,
    total_impressions,
    effective_cpm: Number(effective_cpm.toFixed(2)),
    estimated_conversions,
    direct_revenue: Number(direct_revenue.toFixed(2)),
    ltv_revenue: Number(ltv_revenue.toFixed(2)),
    net_profit: Number(net_profit.toFixed(2)),
    roi_percentage: Number(roi_percentage.toFixed(2)),
    breakeven_conversions,
    timeline_forecast,
    channel_insights: {
      channel_name: benchmark.name,
      benchmark_summary: benchmark.description,
      recommendation: `For ${benchmark.name}, target a CPM below ${benchmark.cpm_range} and optimize post-stream retargeting for optimal LTV conversion.`,
      action_label: CHANNEL_LINKS[inputs.channel_type]?.label,
      action_url: CHANNEL_LINKS[inputs.channel_type]?.url,
      pro_insight: roi_percentage >= 0
        ? 'Positive ROI projected — upgrade to Pro to export this forecast as a client-ready report and compare multiple scenarios side by side.'
        : 'ROI is currently negative. Adjust ad spend, conversion rate, or order value above to find your breakeven — Pro saves unlimited scenarios and exports client reports.'
    }
  };
}
