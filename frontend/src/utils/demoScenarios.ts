import type { CampaignSnapshot, ROIInputs } from '../types';
import { computeLocalROI } from '../utils/roiCalculator';

export const DEMO_CAMPAIGNS: ROIInputs[] = [
  {
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
    organically_amplified_reach_pct: 35
  },
  {
    campaign_name: 'National Championship TV Spot',
    channel_type: 'live_tv',
    initial_ad_spend: 150000,
    peak_viewership: 850000,
    avg_viewership: 600000,
    broadcast_duration_hours: 3.5,
    estimated_cpm: 28.0,
    conversion_rate_pct: 1.2,
    avg_order_value: 120,
    repeat_customer_ltv_multiplier: 1.25,
    organically_amplified_reach_pct: 15
  },
  {
    campaign_name: 'Viral TikTok Live Product Drop',
    channel_type: 'tiktok_live',
    initial_ad_spend: 15000,
    peak_viewership: 95000,
    avg_viewership: 40000,
    broadcast_duration_hours: 2.0,
    estimated_cpm: 10.0,
    conversion_rate_pct: 4.5,
    avg_order_value: 45,
    repeat_customer_ltv_multiplier: 1.5,
    organically_amplified_reach_pct: 60
  },
  {
    campaign_name: 'Flagship Keynote YouTube Stream',
    channel_type: 'youtube_live',
    initial_ad_spend: 50000,
    peak_viewership: 250000,
    avg_viewership: 140000,
    broadcast_duration_hours: 2.5,
    estimated_cpm: 18.0,
    conversion_rate_pct: 2.5,
    avg_order_value: 95,
    repeat_customer_ltv_multiplier: 1.3,
    organically_amplified_reach_pct: 40
  }
];

export function getDemoSnapshots(): CampaignSnapshot[] {
  return DEMO_CAMPAIGNS.map((inputs, idx) => ({
    id: `demo-${idx + 1}`,
    title: inputs.campaign_name,
    created_at: 'Pre-loaded Demo Scenario',
    inputs,
    result: computeLocalROI(inputs)
  }));
}
