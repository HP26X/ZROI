# ltv_cohort_rrlabs

Source: https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv

`LTV = ARPU / churn` is the most widely used and most misleading formula in SaaS. It works only when churn is constant across the lifetime of a customer, which is never. Ignore this and your LTV is off by 30–200% — the exact range where growth teams either overspend on acquisition or underinvest and hand the market to a competitor.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#why-the-simple-formula-lies) Why the simple formula lies

The formula assumes an exponential retention curve — every customer has the same probability of churning next month, regardless of tenure. Real subscription retention is not exponential. It is _bimodal_:

- A large fraction of new customers churn in the first 30–90 days (evaluation, buyer's remorse, involuntary churn from failed cards).
- The customers who survive that period churn at dramatically lower rates for years.

Fitting a single exponential to a bimodal curve produces a number that describes neither group. It underestimates the LTV of customers who make it past 90 days, and overestimates the LTV of customers who churn in the first month.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#cohort-curves-not-aggregate-churn) Cohort curves, not aggregate churn

The right primitive is the **cohort retention curve** — for each month's signup cohort, what percentage are still paying N months later?

Plot the curves. You will see three phases:

1. **Trial-adjacent churn** (months 0–3): steep, product-fit driven, addressable through onboarding.
2. **Involuntary churn** (ongoing): mostly failed payments, addressable through recovery.
3. **Long-tail survival** (months 12+): the customers who will pay you for years.

LTV should be computed as the **area under this curve** times ARPU, discounted by your cost of capital. Not as `ARPU / churn`.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#the-math-that-actually-works) The math that actually works

For a cohort with retention `r(t)` at month `t` and ARPU `p`:

```text
LTV = Σ p * r(t) * (1 + d)^(-t)   for t from 0 to NCopy
```

Where `d` is your monthly discount rate (typically 0.008–0.012 for SaaS — annualized 10–15%) and `N` is the horizon (typically 36 or 60 months).

If you have data for `r(t)` up to some month `M < N`, extrapolate the tail with a survival function fitted to the observed curve. The Weibull distribution is the standard choice; it handles the "bathtub" shape of real retention curves reasonably well.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#contribution-margin-not-revenue) Contribution margin, not revenue

Compute LTV on **contribution margin**, not gross revenue. That means:

```text
CM_per_month = ARPU - (COGS + variable_support + payment_fees) per userCopy
```

For SaaS with typical 20% gross margin cost, ignoring COGS in LTV inflates the number by 20% — and then every payback calculation you do lies by the same 20%.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#involuntary-churn-is-inside-ltv-not-outside) Involuntary churn is inside LTV, not outside

A common analytical mistake is to compute LTV assuming perfect recovery, then subtract "involuntary churn" as a separate line item. That double-counts. The retention curve already captures involuntary churn — it happened to the cohort, whether the reason was voluntary cancellation or a failed card.

The right way to think about recovery investment is: your recovery program shifts the retention curve upward. Model the counterfactual curve with the current recovery rate and the projected curve with an improved recovery rate. The delta in area under the curve is the LTV lift from the recovery program.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#segment-before-you-aggregate) Segment before you aggregate

An overall LTV number is close to useless. Segment by:

- **Acquisition channel** — organic customers usually have higher LTV than paid.
- **Plan tier** — enterprise customers behave nothing like consumer.
- **Geography** — churn curves differ by 2–5x across markets.
- **Cohort month** — later cohorts often have different curves than earlier ones (product improved, or worsened).

Then compute LTV per segment. A single "our LTV is $840" number aggregates over segments that individually range from $200 to $5,000. That aggregate is the number executives will use to make marketing budget decisions, and it will lead them wrong every time.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#the-ltvcac-ratio-corrected) The LTV:CAC ratio, corrected

The standard 3:1 LTV:CAC benchmark assumes:

- LTV computed on contribution margin.
- CAC includes fully-loaded sales and marketing cost.
- Payback period under 12 months.

If your LTV is on revenue and your CAC is direct-cost-only, your ratio is inflated by 40–80%. Every VC deck we have seen with a 5:1 LTV:CAC has one of those errors.

The honest benchmark: **LTV(CM) / CAC(fully loaded) > 3** with **payback < 18 months**. Anything better is genuinely good; anything worse is investable only if the curve is bending correctly.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#when-the-model-is-wrong) When the model is wrong

You will know your LTV model is wrong if:

- Marketing spends confidently against the LTV and 6 months later cohorts are underperforming.
- Finance's paid retention numbers disagree with product's.
- Reduced churn does not visibly reduce customer acquisition targets.

The fix is not usually a fancier model. The fix is usually more segmentation and better contribution-margin data.

## [\#](https://www.rrlabs.online/blog/modeling-subscription-cohort-ltv\#the-rrlabs-default) The RRLabs default

The Revenue Recovery Labs analytics layer emits the cohort retention curve as first-class output. Every recovery experiment is measured against the curve, not against a rolled-up LTV number. When executives ask "what is our LTV," we hand them a graph. The number underneath the graph is honest — and it is different for every segment they care about.

[Next ArticleMulti-Tenant Billing Architecture: How RRLabs Isolates Every Workspace's Payment Data](https://www.rrlabs.online/blog/multi-tenant-billing-architecture)

[Previous Article 3D Secure 2.2 Without Killing Conversion](https://www.rrlabs.online/blog/3d-secure-2-without-killing-conversion)

## The RRLabs recovery newsletter

One deep piece a week on failed-payment recovery, subscription retention, and billing infrastructure. No spam. Unsubscribe any time.

Email addressSubscribe

## Recommended Reading

[Analytics\\
\\
Aug 11, 2026•1 min\\
\\
**Revenue Recovery Metrics Every SaaS Business Should Monitor** \\
\\
The essential metrics for measuring revenue recovery success.\\
\\
PS\\
\\
Palash Sarker](https://www.rrlabs.online/blog/revenue-recovery-metrics) [Analytics\\
\\
Jun 18, 2026•4 min\\
\\
**Building a Real-Time Revenue Recovery Dashboard** \\
\\
The metrics, event model, and UX rules for a real-time dashboard that helps finance and product teams monitor failed-payment recovery.\\
\\
RE\\
\\
RRLabs Editorial](https://www.rrlabs.online/blog/building-a-real-time-revenue-recovery-dashboard) [Strategy\\
\\
Aug 11, 2026•1 min\\
\\
**How SaaS Companies Can Reduce Involuntary Churn From Failed Payments** \\
\\
Strategies to reduce involuntary churn caused by failed subscription payments.\\
\\
PS\\
\\
Palash Sarker](https://www.rrlabs.online/blog/reduce-involuntary-churn)

Estimate your recoverable revenue

[Calculate now](https://www.rrlabs.online/recovery-audit)

Opens ChatThis icon Opens the chat window.

![Chat attention grabber](https://embed.tawk.to/_s/v4/assets/images/attention-grabbers/168-r-br.svg)
