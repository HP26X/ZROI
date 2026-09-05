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
        decay_rate=0.85,
        viral_coefficient=1.1
    ),
    ChannelType.TWITCH: ChannelBenchmark(
        channel_type=ChannelType.TWITCH,
        name="Twitch Live Streaming",
        description="Highly interactive gaming & creator community with high real-time chat engagement and high direct digital action.",
        avg_engagement_rate=5.5,
        typical_conversion_rate=3.2,
        cpm_range="$10 - $22",
        decay_rate=0.70,
        viral_coefficient=1.4
    ),
    ChannelType.YOUTUBE_LIVE: ChannelBenchmark(
        channel_type=ChannelType.YOUTUBE_LIVE,
        name="YouTube Live & VOD",
        description="High live viewer count combined with long-tail VOD replay value and strong search discoverability.",
        avg_engagement_rate=4.0,
        typical_conversion_rate=2.8,
        cpm_range="$12 - $25",
        decay_rate=0.92,
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
        decay_rate=0.60,
        viral_coefficient=1.6
    ),
}

# Viewer turnover rate per hour — captures how frequently the audience refreshes/rotates.
# YouTube gets the highest turnover (viewer churn is highest on on-demand-adjacent live).
# Live TV has the lowest (same set of viewers watching the full broadcast).
TURNOVER_FACTORS = {
    ChannelType.TWITCH: 2.5,
    ChannelType.YOUTUBE_LIVE: 2.8,
    ChannelType.TIKTOK_LIVE: 3.2,
    ChannelType.LIVE_TV: 1.8,
    ChannelType.OTT_STREAMING: 2.0,
}

# 12-month cohort retention curves (sum to 1.0).
# Fraction of the repeat-purchase pool realized each month.
# Digital-native channels earn more repeat in early months; TV/CTV spreads value across the year.
LTV_RETENTION_CURVES = {
    ChannelType.TWITCH:      [0.30, 0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01],
    ChannelType.YOUTUBE_LIVE:[0.25, 0.17, 0.13, 0.10, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
    ChannelType.TIKTOK_LIVE: [0.35, 0.20, 0.12, 0.08, 0.06, 0.04, 0.03, 0.03, 0.02, 0.01, 0.01, 0.005],
    ChannelType.LIVE_TV:     [0.15, 0.13, 0.11, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03],
    ChannelType.OTT_STREAMING:[0.18, 0.14, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03],
}

# Brand-lift weight curve for video channels (TV and OTT/CTV).
# Sum-to-1.0 distribution of the brand lift value across 12 months.
# TV brand lift is front-loaded but persists; CTV is similar with a slightly sharper early peak.
BRAND_LIFT_WEIGHTS = [0.08, 0.09, 0.10, 0.10, 0.09, 0.08, 0.08, 0.07, 0.07, 0.06, 0.05, 0.04]

VIDEO_CHANNELS = {ChannelType.YOUTUBE_LIVE, ChannelType.LIVE_TV, ChannelType.OTT_STREAMING}
BRAND_LIFT_CHANNELS = {ChannelType.LIVE_TV, ChannelType.OTT_STREAMING}


def _cumulative_payback_month(timeline: List[TimelinePoint]) -> int:
    for i, point in enumerate(timeline):
        if point.total_revenue >= point.cumulative_cost:
            return i + 1
    return 13


def calculate_roi(inputs: ROIInputs) -> ROICalculationResult:
    benchmark = CHANNEL_BENCHMARKS.get(inputs.channel_type, CHANNEL_BENCHMARKS[ChannelType.TWITCH])
    channel = inputs.channel_type
    is_video = channel in VIDEO_CHANNELS
    has_brand_lift = channel in BRAND_LIFT_CHANNELS

    # ── 1. Impressions ──────────────────────────────────────────────────
    turnover_factor = TURNOVER_FACTORS.get(channel, 2.5)
    raw_impressions = int(inputs.avg_viewership * inputs.broadcast_duration_hours * turnover_factor)

    peak_diff = (inputs.peak_viewership - inputs.avg_viewership) / max(inputs.avg_viewership, 1)
    peak_boost = min(1 + peak_diff * 0.25, 1.5)

    organic_multiplier = 1 + (inputs.organically_amplified_reach_pct / 100) * benchmark.viral_coefficient

    total_impressions = max(int(raw_impressions * peak_boost * organic_multiplier), 100)

    effective_cpm = round((inputs.initial_ad_spend / total_impressions) * 1000, 2) if total_impressions > 0 else inputs.estimated_cpm

    # Unique reach: impressions ÷ average frequency
    frequency_estimate = 1 + (inputs.broadcast_duration_hours - 1) * 0.3
    if channel in {ChannelType.LIVE_TV, ChannelType.OTT_STREAMING}:
        frequency_estimate *= 1.5
    frequency_estimate = max(frequency_estimate, 1)
    unique_reach = int(total_impressions / frequency_estimate)

    # ── 2. Conversions ──────────────────────────────────────────────────
    conversion_rate = inputs.conversion_rate_pct / 100.0
    direct_conversions = int(total_impressions * conversion_rate)

    total_conversions = direct_conversions
    if is_video:
        # View-through conversions: 15% of the impression×conversion-rate pool
        view_through = int(total_impressions * conversion_rate * 0.15)
        total_conversions += view_through

    # ── 3. Revenue ──────────────────────────────────────────────────────
    direct_revenue = total_conversions * inputs.avg_order_value

    # Repeat pool: the *incremental* value beyond the first purchase
    # ltv_multiplier of 1.4 → 40% of direct_revenue is realized as repeat purchases
    total_repeat_pool = direct_revenue * max(inputs.repeat_customer_ltv_multiplier - 1, 0)
    retention_curve = LTV_RETENTION_CURVES.get(channel, LTV_RETENTION_CURVES[ChannelType.TWITCH])

    ltv_by_month = [round(total_repeat_pool * w, 2) for w in retention_curve]

    # Brand lift (TV/CTV only): brand lift rate × ad spend
    brand_lift_total = 0.0
    brand_lift_by_month = [0.0] * 12
    if has_brand_lift:
        brand_lift_rate = 0.18 + (inputs.organically_amplified_reach_pct / 100) * 0.12
        brand_lift_total = round(inputs.initial_ad_spend * brand_lift_rate, 2)
        weight_sum = sum(BRAND_LIFT_WEIGHTS)
        for m in range(12):
            brand_lift_by_month[m] = round(brand_lift_total * (BRAND_LIFT_WEIGHTS[m] / weight_sum), 2)

    # Monthly extra = repeat portion + brand lift portion
    monthly_extra = [round(ltv_by_month[i] + brand_lift_by_month[i], 2) for i in range(12)]
    ltv_revenue = round(direct_revenue + sum(monthly_extra), 2)
    total_revenue = round(direct_revenue + sum(monthly_extra), 2)
    brand_lift_total = round(brand_lift_total, 2)

    # ── 4. Bottom line ──────────────────────────────────────────────────
    net_profit = round(total_revenue - inputs.initial_ad_spend, 2)
    roi_percentage = round((net_profit / inputs.initial_ad_spend) * 100, 2) if inputs.initial_ad_spend > 0 else 0.0
    roas = round(total_revenue / inputs.initial_ad_spend, 2) if inputs.initial_ad_spend > 0 else 0.0
    cpa = round(inputs.initial_ad_spend / total_conversions, 2) if total_conversions > 0 else 0.0
    breakeven_conversions = math.ceil(inputs.initial_ad_spend / inputs.avg_order_value) if inputs.avg_order_value > 0 else 0

    # ── 5. 12-Month Timeline ───────────────────────────────────────────
    timeline_forecast: List[TimelinePoint] = []
    cumulative_revenue = 0.0

    # Precompute decay weights so M2-M12 normalize to 1.0 total
    decay_weights = []
    for m in range(1, 13):
        decay_weights.append(math.pow(benchmark.decay_rate, m - 1))

    m1_weight = decay_weights[0]
    remaining_weights_sum = sum(decay_weights[1:])

    for month in range(1, 13):
        if month == 1:
            direct_portion = round(direct_revenue * 0.65, 2)
        else:
            idx = month - 1
            if remaining_weights_sum > 0:
                normalized = decay_weights[idx] / remaining_weights_sum
            else:
                normalized = 1 / 11
            direct_portion = round(direct_revenue * 0.35 * normalized, 2)

        extra_portion = monthly_extra[month - 1]
        month_direct = direct_portion
        month_ltv = round(direct_portion + extra_portion, 2)
        month_total = round(month_direct + extra_portion, 2)
        cumulative_revenue += month_total

        cum_cost = inputs.initial_ad_spend
        cum_roi = round(((cumulative_revenue - cum_cost) / cum_cost) * 100, 2) if cum_cost > 0 else 0.0
        payback_achieved = cumulative_revenue >= cum_cost

        if direct_revenue > 0:
            month_conversions = int(total_conversions * (month_direct / direct_revenue))
        else:
            month_conversions = int(total_conversions * 0.65) if month == 1 else 0

        if month == 1:
            month_conversions = max(month_conversions, 1)

        month_impressions = int(total_impressions * (1 if month == 1 else 0.1 / month))

        timeline_forecast.append(TimelinePoint(
            period_label=f"M{month}",
            month=month,
            direct_revenue=month_direct,
            ltv_revenue=month_ltv,
            total_revenue=month_total,
            cumulative_cost=round(cum_cost, 2),
            roi_percentage=cum_roi,
            payback_achieved=payback_achieved,
            projected_conversions=month_conversions,
            impressions=month_impressions
        ))

    payback_month = _cumulative_payback_month(timeline_forecast)

    # ── 6. Insights ─────────────────────────────────────────────────────
    payback_text = f"{payback_month} month{'s' if payback_month != 1 else ''}" if payback_month <= 12 else ">12 months"
    channel_insights = {
        "channel_name": benchmark.name,
        "benchmark_summary": benchmark.description,
        "recommendation": (
            f"For {benchmark.name}, target a CPM below {benchmark.cpm_range} "
            f"and optimize post-stream retargeting for optimal LTV conversion. "
            f"Projected payback in {payback_text}."
        ),
        "action_label": "",
        "action_url": "",
        "pro_insight": (
            "Positive ROI projected — upgrade to Pro to export this forecast as a "
            "client-ready report and compare multiple scenarios side by side."
            if roi_percentage >= 0
            else "ROI is currently negative. Adjust ad spend, conversion rate, or order value above to find your breakeven — Pro saves unlimited scenarios and exports client reports."
        )
    }

    return ROICalculationResult(
        inputs=inputs,
        total_impressions=total_impressions,
        unique_reach=unique_reach,
        effective_cpm=effective_cpm,
        estimated_conversions=total_conversions,
        direct_revenue=round(direct_revenue, 2),
        ltv_revenue=ltv_revenue,
        brand_lift_total=brand_lift_total,
        total_revenue=total_revenue,
        net_profit=net_profit,
        roi_percentage=roi_percentage,
        roas=roas,
        cpa=cpa,
        breakeven_conversions=breakeven_conversions,
        payback_month=payback_month,
        timeline_forecast=timeline_forecast,
        channel_insights=channel_insights
    )
