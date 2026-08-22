from typing import Dict, List
import math
from app.models import ROIInputs, ROICalculationResult, TimelinePoint, ChannelType, ChannelBenchmark

CHANNEL_BENCHMARKS: Dict[ChannelType, ChannelBenchmark] = {
    ChannelType.LIVE_TV: ChannelBenchmark(
        channel_type=ChannelType.LIVE_TV,
        name="Live Broadcast TV",
        description="Mass national & regional reach with high passive brand trust, moderate immediate digital conversions.",
        avg_engagement_rate=1.2,
        typical_conversion_rate=1.5,
        cpm_range="$18 - $35",
        decay_rate=0.85, # Linear decay over 6 months
        viral_coefficient=1.1
    ),
    ChannelType.TWITCH: ChannelBenchmark(
        channel_type=ChannelType.TWITCH,
        name="Twitch Live Streaming",
        description="Highly interactive gaming & creator community with high real-time chat engagement and high direct digital action.",
        avg_engagement_rate=5.5,
        typical_conversion_rate=3.2,
        cpm_range="$10 - $22",
        decay_rate=0.70, # Steeper drop after event, high immediate peak
        viral_coefficient=1.4
    ),
    ChannelType.YOUTUBE_LIVE: ChannelBenchmark(
        channel_type=ChannelType.YOUTUBE_LIVE,
        name="YouTube Live & VOD",
        description="High live viewer count combined with long-tail VOD replay value and strong search discoverability.",
        avg_engagement_rate=4.0,
        typical_conversion_rate=2.8,
        cpm_range="$12 - $25",
        decay_rate=0.92, # Sustained VOD traffic
        viral_coefficient=1.3
    ),
    ChannelType.OTT_STREAMING: ChannelBenchmark(
        channel_type=ChannelType.OTT_STREAMING,
        name="OTT / Connected TV (Hulu, Peacock, etc.)",
        description="Targeted CTV ads with premium video completion rates and measurable digital cross-device attribution.",
        avg_engagement_rate=2.5,
        typical_conversion_rate=2.0,
        cpm_range="$20 - $40",
        decay_rate=0.80,
        viral_coefficient=1.15
    ),
    ChannelType.TIKTOK_LIVE: ChannelBenchmark(
        channel_type=ChannelType.TIKTOK_LIVE,
        name="TikTok Live / Social Video",
        description="High viral potential, fast impulse purchasing, shorter viewer retention per stream session.",
        avg_engagement_rate=7.2,
        typical_conversion_rate=3.8,
        cpm_range="$8 - $18",
        decay_rate=0.60, # Fast spike and decay unless clipped
        viral_coefficient=1.6
    ),
}

def calculate_roi(inputs: ROIInputs) -> ROICalculationResult:
    benchmark = CHANNEL_BENCHMARKS.get(inputs.channel_type, CHANNEL_BENCHMARKS[ChannelType.TWITCH])

    # 1. Impressions Calculation
    # Base impressions from average concurrent viewers over duration
    # Assume average watch session length varies, estimated concurrent hours = avg_viewership * duration
    # Average viewership turnover factor: ~2.5x per hour for live streams, 1.8x for TV
    turnover_factor = 1.8 if inputs.channel_type in [ChannelType.LIVE_TV, ChannelType.OTT_STREAMING] else 2.5
    raw_impressions = int(inputs.avg_viewership * inputs.broadcast_duration_hours * turnover_factor)

    # Add peak engagement boost & organic amplification
    peak_multiplier = 1.0 + ((inputs.peak_viewership - inputs.avg_viewership) / max(inputs.avg_viewership, 1)) * 0.2
    organic_multiplier = 1.0 + (inputs.organically_amplified_reach_pct / 100.0) * benchmark.viral_coefficient

    total_impressions = max(int(raw_impressions * peak_multiplier * organic_multiplier), 100)

    # Effective CPM calculation based on inputs and impressions
    effective_cpm = (inputs.initial_ad_spend / total_impressions) * 1000 if total_impressions > 0 else inputs.estimated_cpm

    # 2. Conversions & Initial Revenue
    conversion_rate = inputs.conversion_rate_pct / 100.0
    estimated_conversions = int(total_impressions * conversion_rate)

    direct_revenue = estimated_conversions * inputs.avg_order_value
    ltv_revenue = direct_revenue * inputs.repeat_customer_ltv_multiplier

    # 3. Net Profit & Overall ROI
    net_profit = ltv_revenue - inputs.initial_ad_spend
    roi_percentage = (net_profit / inputs.initial_ad_spend * 100.0) if inputs.initial_ad_spend > 0 else 0.0

    # Breakeven conversions required to cover initial ad spend
    breakeven_conversions = math.ceil(inputs.initial_ad_spend / inputs.avg_order_value) if inputs.avg_order_value > 0 else 0

    # 4. 12-Month Timeline Forecast Generation
    timeline_forecast: List[TimelinePoint] = []
    accumulated_direct = 0.0
    accumulated_ltv = 0.0

    # Distribution curve: Month 1 captures majority (e.g. 50-70%), remaining Months decay exponentially
    for month in range(1, 13):
        if month == 1:
            month_direct = direct_revenue * 0.65
            month_ltv = ltv_revenue * 0.50
        else:
            # Exponential decay based on channel decay_rate
            decay_factor = (benchmark.decay_rate ** (month - 1))
            month_direct = (direct_revenue * 0.35) * (decay_factor / 2.5)
            month_ltv = (ltv_revenue * 0.50) * (decay_factor / 2.0)

        accumulated_direct += month_direct
        accumulated_ltv += month_ltv

        cum_cost = inputs.initial_ad_spend
        cum_roi = ((accumulated_ltv - cum_cost) / cum_cost * 100.0) if cum_cost > 0 else 0.0

        month_conversions = int(estimated_conversions * (month_direct / max(direct_revenue, 1.0)))

        timeline_forecast.append(TimelinePoint(
            period_label=f"M{month}",
            month=month,
            direct_revenue=round(accumulated_direct, 2),
            ltv_revenue=round(accumulated_ltv, 2),
            total_revenue=round(accumulated_ltv, 2),
            cumulative_cost=round(cum_cost, 2),
            roi_percentage=round(cum_roi, 2),
            projected_conversions=max(month_conversions, 1) if month == 1 else month_conversions,
            impressions=int(total_impressions * (1 if month == 1 else (0.1 / month)))
        ))

    # Insights commentary
    channel_insights = {
        "channel_name": benchmark.name,
        "benchmark_summary": benchmark.description,
        "recommendation": f"For {benchmark.name}, target a CPM below {benchmark.cpm_range} and optimize post-stream retargeting for optimal LTV conversion."
    }

    return ROICalculationResult(
        inputs=inputs,
        total_impressions=total_impressions,
        effective_cpm=round(effective_cpm, 2),
        estimated_conversions=estimated_conversions,
        direct_revenue=round(direct_revenue, 2),
        ltv_revenue=round(ltv_revenue, 2),
        net_profit=round(net_profit, 2),
        roi_percentage=round(roi_percentage, 2),
        breakeven_conversions=breakeven_conversions,
        timeline_forecast=timeline_forecast,
        channel_insights=channel_insights
    )
