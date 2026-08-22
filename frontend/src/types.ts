export type ChannelType = 'live_tv' | 'twitch' | 'youtube_live' | 'ott_streaming' | 'tiktok_live';

export interface ROIInputs {
  campaign_name: string;
  channel_type: ChannelType;
  initial_ad_spend: number;
  peak_viewership: number;
  avg_viewership: number;
  broadcast_duration_hours: number;
  estimated_cpm: number;
  conversion_rate_pct: number;
  avg_order_value: number;
  repeat_customer_ltv_multiplier: number;
  organically_amplified_reach_pct: number;
}

export interface TimelinePoint {
  period_label: string;
  month: number;
  direct_revenue: number;
  ltv_revenue: number;
  total_revenue: number;
  cumulative_cost: number;
  roi_percentage: number;
  projected_conversions: number;
  impressions: number;
}

export interface ROICalculationResult {
  inputs: ROIInputs;
  total_impressions: number;
  effective_cpm: number;
  estimated_conversions: number;
  direct_revenue: number;
  ltv_revenue: number;
  net_profit: number;
  roi_percentage: number;
  breakeven_conversions: number;
  timeline_forecast: TimelinePoint[];
  channel_insights: {
    channel_name: string;
    benchmark_summary: string;
    recommendation: string;
  };
}

export interface CampaignSnapshot {
  id: string;
  title: string;
  created_at: string;
  inputs: ROIInputs;
  result: ROICalculationResult;
}

export interface ChannelBenchmark {
  channel_type: ChannelType;
  name: string;
  description: string;
  avg_engagement_rate: number;
  typical_conversion_rate: number;
  cpm_range: string;
  decay_rate: number;
  viral_coefficient: number;
}
