# ZROI ROI Algorithm Research — Polished Formula Spec

**Date:** 2026-09-05
**Status:** Research complete — implementing v2 formula
**Sources:** 13 industry pages extracted (PPC formulas, MMM/ROI framework, LTV cohort modeling ×2, CTV vs Linear TV benchmarks, CTV incrementality, Lemon Squeezy docs ×2, Stripe Payment Links, MoR comparison)

---

## 1. What the current formula gets right

| Piece | Current approach | Verdict |
|---|---|---|
| Impressions base | `avg_viewership × duration × turnoverFactor` | ✅ Reasonable structural model for live events. Turnover factor captures viewers-per-concurrent-hour. |
| Peak boost | `(peak − avg) / avg × 0.2` multiplier | ✅ Captures the engagement spike from peak vs. average viewership. |
| Organic amplification | `(organic_pct / 100) × viral_coefficient` multiplier | ✅ Correct structure — viral coefficient per channel is the right primitive. |
| Effective CPM | `ad_spend / impressions × 1000` | ✅ Standard CPM formula, correct. |
| Conversions | `impressions × conversion_rate` | ✅ Right structure. Needs attribution-window context but structurally sound. |
| Direct revenue | `conversions × AOV` | ✅ Correct. |
| 12-month timeline | M1 = 65% direct / 50% LTV, exponential decay | ⚠️ Structurally OK, but decay factors are ad hoc, not channel-calibrated. |

## 2. What the current formula gets wrong / misses

### 2a. LTV is a flat multiplier — the most misleading piece

The current formula does `ltv_revenue = direct_revenue × ltv_multiplier`. This treats LTV as a single scalar — the equivalent of the debunked `LTV = ARPU / churn` formula that assumes a flat exponential retention curve. Real customer retention is **bimodal**:

- A large fraction churn in the first 30–90 days (evaluation, buyer's remorse, failed payments)
- Customers who survive that window churn at dramatically lower rates for years

A flat multiplier can't express this. It either overestimates LTV (if most customers churn early) or underestimates it (if a loyal core stays for years). The research source (rrlabs.online) puts the error range at **30–200%**.

**Fix:** Replace the flat multiplier with a **cohort retention curve** model. The `repeat_customer_ltv_multiplier` input is reinterpreted as "total lifetime repeat value multiplier" — i.e., if `ltv_multiplier = 1.4`, the customer generates 1.4× their first purchase over their lifetime, meaning 0.4× in repeat purchases. We spread that 0.4× across 12 months using a channel-specific retention curve.

### 2b. No distinction between ROAS and ROI

The current formula computes one number and calls it ROI. In practice:

- **ROAS** = Revenue from Ads ÷ Ad Spend — a gross efficiency metric. "For every $1 spent, how many dollars came back?"
- **ROI** = (Incremental Revenue − Fully-Loaded Cost) ÷ Fully-Loaded Cost × 100 — a profit metric. "After everything, am I making money?"

The adlibrary.com practitioner framework and the Ipsos MMA article both stress this gap. A 4× ROAS can be a breakeven account after 30% product margins, creative production, agency fees, and attribution tooling. ZROI currently gives users one number that conflates these.

**Fix:** Surface **ROAS** as a separate metric alongside ROI. ROAS = total_revenue ÷ ad_spend. ROI stays as the profit metric. Both are useful — ROAS for campaign efficiency, ROI for business viability.

### 2c. No brand lift component for TV/CTV

CTV and Linear TV are structurally different from digital channels. As the FusoPoint and eonik.ai sources make clear: CTV has no reliable click-level signal, so measurement defaults to impressions or platform-reported attribution, which undercounts impact. The missing piece is **brand lift** — the incremental brand value that drives future sales indirectly. This is why TV ROAS numbers look worse than digital on a last-click basis but can be more profitable in aggregate.

**Fix:** Add a brand-lift revenue component for `live_tv` and `ott_streaming` channels. Brand lift is modeled as a percentage of ad spend (15–30% depending on channel) realized slowly over 12 months — a long, low decay curve representing sustained brand recall.

### 2d. No payback period

Campaign planners need to know not just "what's the 12-month ROI?" but "when do I break even?" A campaign with 200% 12-month ROI that doesn't pay back until month 8 is very different from one that pays back in month 2.

**Fix:** Add **payback period** (months until cumulative revenue ≥ ad spend) as a reported metric.

### 2e. No view-through conversions for video channels

For YouTube Live, CTV, and Live TV, a portion of conversions come from people who saw the ad but didn't click (view-through conversions). These are real conversions that the current formula misses for video channels. Typical view-through conversion rate is 10–20% of the direct rate.

**Fix:** For video channels (`youtube_live`, `live_tv`, `ott_streaming`), add view-through conversions at ~15% of the direct conversion rate.

### 2f. Timeline decay is ad hoc

The current decay uses `decay_rate ** (month - 1)` divided by arbitrary constants (2.5 for direct, 2.0 for LTV). This doesn't correspond to any real measurement. Channel benchmarks already have decay_rate values — use them as proper half-life parameters in a normalized decay curve.

**Fix:** Calibrate the decay curve so that the channel's decay_rate represents the month-over-month retention of revenue. Normalize so the full 12-month sum equals the total revenue pool.

## 3. Formula v2 — concrete equations

### 3.1 Impressions (improved, mostly same structure)

```
turnoverFactor[channel] = {
  twitch:           2.5,
  youtube_live:     2.8,
  tiktok_live:      3.2,
  live_tv:          1.8,
  ott_streaming:    2.0
}

rawImpressions = avg_viewership × broadcast_duration_hours × turnoverFactor

peakBoost = min(1 + ((peak_viewership − avg_viewership) / max(avg_viewership, 1)) × 0.25, 1.5)

organicMultiplier = 1 + (organically_amplified_reach_pct / 100) × viral_coefficient

totalImpressions = max(rawImpressions × peakBoost × organicMultiplier, 100)
effectiveCPM = (initial_ad_spend / totalImpressions) × 1000

// New: unique reach estimate (impressions ÷ average frequency)
frequencyEstimate = 1 + (broadcast_duration_hours − 1) × 0.3
if channel in [live_tv, ott_streaming]: frequencyEstimate ×= 1.5
uniqueReach = totalImpressions / frequencyEstimate
```

### 3.2 Conversions (add view-through for video channels)

```
conversionRate = conversion_rate_pct / 100

directConversions = round(totalImpressions × conversionRate)

// View-through conversions for video channels (YouTube, TV, CTV)
// View-through rate ≈ 15% of direct rate (industry rule of thumb for video)
if channel in [youtube_live, live_tv, ott_streaming]:
    viewThroughRate = conversionRate × 0.15
    viewThroughConversions = round(totalImpressions × viewThroughRate)
    totalConversions = directConversions + viewThroughConversions
else:
    totalConversions = directConversions
```

### 3.3 Revenue — LTV with cohort retention curve

```
directRevenue = totalConversions × avg_order_value

// Interpret ltv_multiplier as total lifetime value ÷ direct value
// e.g. ltv_multiplier = 1.4 → 0.4 of value comes from repeat purchases
totalRepeatPool = directRevenue × (repeat_customer_ltv_multiplier − 1)

// Channel-specific 12-month retention curves for repeat purchases
// Each array sums to 1.0 — the fraction of total repeat value realized each month
retentionCurves = {
  twitch:      [0.30, 0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01],
  youtube_live:[0.25, 0.17, 0.13, 0.10, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
  tiktok_live: [0.35, 0.20, 0.12, 0.08, 0.06, 0.04, 0.03, 0.03, 0.02, 0.01, 0.01, 0.005],
  live_tv:     [0.15, 0.13, 0.11, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03],
  ott_streaming:[0.18, 0.14, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03]
}

// Distribute the repeat pool across 12 months per the channel curve
repeatRevenueByMonth[1..12] = totalRepeatPool × retentionCurves[channel][month−1]
ltvRevenue = directRevenue + sum(repeatRevenueByMonth)
```

### 3.4 Brand lift (TV/CTV only)

```
// Brand lift: incremental brand value from mass-reach channels
// Realized slowly over 12 months (brand recall persists)
if channel in [live_tv, ott_streaming]:
    // brandLiftRate: 15-30% of ad spend generates brand lift value
    // Higher organic amplification → more brand lift (word of mouth amplifies)
    brandLiftRate = 0.18 + (organically_amplified_reach_pct / 100) × 0.12
    brandLiftTotal = initial_ad_spend × brandLiftRate
    // Distribute with slow decay (brand recall persists)
    brandLiftWeights = [0.08, 0.09, 0.10, 0.10, 0.09, 0.08, 0.08, 0.07, 0.07, 0.06, 0.05, 0.04]
    // normalize weights to sum to 1.0
    brandLiftByMonth[1..12] = brandLiftTotal × (brandLiftWeights[month−1] / sum(brandLiftWeights))
else:
    brandLiftByMonth = [0] × 12
    brandLiftTotal = 0
```

### 3.5 Timeline forecast (12 months)

```
for month = 1 to 12:
    // Direct revenue: M1 captures majority, rest decays by channel decay_rate
    if month == 1:
        directPortion = directRevenue × 0.65
    else:
        // Normalized decay: each month's share of the remaining 35%
        remainingMonths = 11 // months 2-12
        decayWeight = decay_rate^(month−1)
        // Normalize so months 2-12 sum to 1.0
        allDecayWeights = [decay_rate^i for i in 0..11]
        normalizedWeight = decayWeight / sum(allDecayWeights[1..11])  // skip M1 weight
        directPortion = directRevenue × 0.35 × normalizedWeight

    // Repeat/LTV revenue from retention curve
    repeatPortion = repeatRevenueByMonth[month]

    // Brand lift revenue
    brandPortion = brandLiftByMonth[month]

    monthDirectRevenue = directPortion
    monthLTVRevenue = directPortion + repeatPortion + brandPortion
    monthTotalRevenue = monthLTVRevenue
    cumulativeRevenue += monthTotalRevenue

    roiPercentage = (cumulativeRevenue − initial_ad_spend) / initial_ad_spend × 100
    paybackMonth = first month where cumulativeRevenue ≥ initial_ad_spend  // NEW

    timeline[month] = {
        period_label: `M{month}`,
        month: month,
        direct_revenue: round(monthDirectRevenue, 2),
        ltv_revenue: round(monthLTVRevenue, 2),  // now includes repeat + brand lift
        total_revenue: round(monthTotalRevenue, 2),
        cumulative_cost: initial_ad_spend,
        roi_percentage: round(roiPercentage, 2),
        payback_achieved: paybackMonth ≤ month,
        projected_conversions: ...
    }
```

### 3.6 Final metrics

```
totalRevenue = directRevenue + totalRepeatPool + brandLiftTotal
netProfit = totalRevenue − initial_ad_spend
roiPercentage = (netProfit / initial_ad_spend) × 100       // profit metric
roas = totalRevenue / initial_ad_spend                     // efficiency metric (NEW)
cpa = initial_ad_spend / totalConversions                  // cost per acquisition (NEW)
breakevenConversions = ceil(initial_ad_spend / avg_order_value)
paybackMonths = first month where cumulativeRevenue ≥ ad_spend  // NEW
effectiveCPM = (initial_ad_spend / totalImpressions) × 1000
uniqueReach = totalImpressions / frequencyEstimate          // NEW
```

## 4. Updated benchmark parameters

### 4.1 Turnover factors (viewers-per-concurrent-hour)

| Channel | Turnover factor | Rationale |
|---|---|---|
| Twitch Live | 2.5 | High chat engagement, session overlap, consistent with streaming analytics |
| YouTube Live | 2.8 | Balanced live + VOD, higher session overlap than Twitch |
| TikTok Live | 3.2 | Rapid scroll, high churn, massive viral turnover |
| Live TV | 1.8 | Linear broadcast, lower turnover, same viewers see ad multiple times |
| OTT/CTV | 2.0 | Premium streaming, higher engagement than linear TV, lower than interactive |

### 4.2 Decay rates (month-over-month revenue retention)

These are the fraction of revenue retained each subsequent month. A decay_rate of 0.70 means month M+1 gets 70% of month M's residual.

| Channel | Decay rate | Behavior |
|---|---|---|
| Twitch | 0.70 | Sharp drop after event — fast organic decay, high immediate peak |
| YouTube Live | 0.92 | Sustained VOD long-tail — replays drive traffic for weeks |
| TikTok Live | 0.60 | Fast spike and decay unless content is clipped |
| Live TV | 0.85 | Slow decline — brand recall persists, mass reach has long tail |
| OTT/CTV | 0.80 | Moderate decay — premium audiences, targeted, some VOD value |

### 4.3 Channel retention curves for LTV (12-month repeat purchase distribution)

Each array sums to 1.0. These represent how repeat-purchase value from a live event acquisition is distributed across 12 months.

| Month | Twitch | YouTube | TikTok | Live TV | OTT/CTV |
|---|---|---|---|---|---|
| M1 | 0.30 | 0.25 | 0.35 | 0.15 | 0.18 |
| M2 | 0.18 | 0.17 | 0.20 | 0.13 | 0.14 |
| M3 | 0.12 | 0.13 | 0.12 | 0.11 | 0.12 |
| M4 | 0.09 | 0.10 | 0.08 | 0.10 | 0.10 |
| M5 | 0.07 | 0.09 | 0.06 | 0.09 | 0.09 |
| M6 | 0.06 | 0.07 | 0.04 | 0.08 | 0.08 |
| M7 | 0.05 | 0.06 | 0.03 | 0.07 | 0.07 |
| M8 | 0.04 | 0.05 | 0.03 | 0.06 | 0.06 |
| M9 | 0.03 | 0.04 | 0.02 | 0.06 | 0.06 |
| M10 | 0.02 | 0.03 | 0.01 | 0.05 | 0.05 |
| M11 | 0.02 | 0.02 | 0.01 | 0.04 | 0.04 |
| M12 | 0.01 | 0.01 | 0.005 | 0.03 | 0.03 |

Rationale:
- **Twitch**: Heavy M1 repeat (impulse community purchases), fast drop-off — gamers buy during/after event, then churn
- **YouTube**: More sustained — VOD replays drive repeat discovery over months
- **TikTok**: Very heavy M1 (impulse buys during live), rapid drop — fast churn audience
- **Live TV**: Slow, even distribution — brand recall drives gradual repeat purchases over many months
- **OTT/CTV**: Moderate M1, sustained middle — premium audiences with higher loyalty

### 4.4 Brand lift rates

| Channel | Brand lift rate (% of ad spend) | Notes |
|---|---|---|
| Live TV | 18% + (organic_pct × 0.12%) | Mass reach, brand trust, offline lift multiplier |
| OTT/CTV | 18% + (organic_pct × 0.12%) | Premium demographic, QR attribution possible |

For digital channels (Twitch, YouTube, TikTok), brand lift is embedded in the organic amplification multiplier — no separate brand lift line.

## 5. New UI metrics to surface

| Metric | Type | Where |
|---|---|---|
| ROAS | Efficiency ratio | KPI card (replaces or complements "LTV Revenue") |
| Payback Period | Months to breakeven | KPI card or timeline header |
| Cost per Acquisition (CPA) | $ per conversion | KPI card or under Conversions |
| Effective Reach (unique viewers) | Count | Under Impression Reach |
| Brand Lift Value | $ (TV/CTV only) | Strategic Insights box |

## 6. What stays the same

- Input schema (`ROIInputs`) — all 11 fields remain
- Channel benchmarks (`CHANNEL_BENCHMARKS`) — same 5 channels, same structure, updated numeric values
- Output schema (`ROICalculationResult`) — same fields, plus: `roas`, `cpa`, `payback_month`, `unique_reach`, `brand_lift_total`
- Demo scenarios — re-run with new formula, numbers will change (more accurate, not necessarily higher/lower)
- Frontend chart structure — same 3 tabs, same KPI card layout

## 7. Implementation notes

- Both `frontend/src/utils/roiCalculator.ts` and `backend/app/roi_engine.py` must be updated in parallel — they must produce identical results
- The 12-month timeline loop changes significantly: each month now has 3 components (direct decay + repeat curve + brand lift)
- `channel_insights` recommendation text should reference the new metrics (ROAS, payback period)
- Demo scenarios should be re-run and the README screenshot may need updating if numbers change significantly
