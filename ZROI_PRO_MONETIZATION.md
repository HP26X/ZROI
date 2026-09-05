# ZROI Pro Monetization Setup Guide

**Date:** 2026-09-05
**Status:** Research complete — ready to implement
**Options analyzed:** Lemon Squeezy (primary), Stripe Payment Links (fallback)

---

## 1. Lemon Squeezy — recommended (Merchant of Record)

**Why:** Lemon Squeezy is the Merchant of Record. They collect, remit, and file sales tax/VAT/GST in every jurisdiction. For a GitHub Pages app selling to a global audience with no backend, this is the lowest-friction option. You never touch a tax form for those sales. Fee: 5% + $0.50 per transaction (vs. Stripe's ~2.9% + 30¢ but you own the compliance).

### Step-by-step setup

1. Go to **https://www.lemonsqueezy.com** and sign up.
2. Complete store setup: store name (e.g., "HP26X"), currency (USD), timezone.
3. Navigate to **Products** → **+ Add Product**.
4. Fill in:
   - **Product name:** `ZROI Pro — Live Event ROI Forecasting`
   - **Description:** `Unlock unlimited scenario snapshots, PDF client report export, multi-campaign comparison view, custom channel benchmark editing, and browser snapshot persistence for the ZROI ROI forecaster.`
   - **Type:** Subscription (recurring)
   - **Variant 1 (Monthly):** Price $9.00 USD, billing interval "Month", description "Billed monthly, cancel anytime"
   - **Variant 2 (Annual, optional):** Price $90.00 USD, billing interval "Year", description "Billed annually — save 17%"
   - **Product URL:** leave default or set a custom slug
   - **Image:** upload the ZROI logo or a dashboard screenshot
5. Click **Save Product**.
6. Click the **Share** button on the product page → a panel opens with checkout URL options.
7. Choose:
   - **Hosted checkout** — opens the Lemon Squeezy checkout page in a new tab (simplest, recommended for MVP)
   - **Checkout overlay** — loads checkout over your page (smoother UX, requires overlay JS)
8. Copy the **hosted checkout URL** for the monthly variant. It looks like:
   ```
   https://hp26x-lemonsqueezy-store.lemonsqueezy.com/checkout/buy/[VARIANT_ID]
   ```
8. Paste that URL into `frontend/src/App.tsx` replacing `PRO_CHECKOUT_URL`.

### Optional: use the checkout overlay for in-app feel

Instead of a separate page, embed the overlay:
```html
<button data-ls-checkout-button
  data-ls-variant-id="[VARIANT_ID]"
  data-ls-store-id="[STORE_ID]">
  Upgrade to Pro — $9/month
</button>
<script src="https://assets.lemonsqueezy.com/lemon-squeezy.js"></script>
```
This keeps the user in the ZROI page during checkout. Requires the store ID and variant ID from the LS dashboard.

### Webhooks (for future feature-gating)

When you're ready to actually gate Pro features (verify the user paid), set up a webhook:
- LS dashboard → Settings → Webhooks → + Add Webhook
- Endpoint: your backend URL (e.g., `https://your-backend.example.com/api/lemonsqueezy/webhook`)
- Events to subscribe: `subscription_created`, `subscription_cancelled`, `order_completed`
- The webhook payload includes `customer_email`, `variant_id`, `status`. Your backend stores eligible users and the frontend checks against it.

This requires a backend. For the MVP (today), just use the checkout link — no verification.

## 2. Stripe Payment Links — lower-fee alternative

**Why:** Lower fees (~2.9% + 30¢), but you are the seller of record. You handle sales tax/VAT. Fine if you're US-only and comfortable filing. More setup than LS for global sales.

### Step-by-step setup

1. Go to **https://dashboard.stripe.com** and sign up.
2. Navigate to **Payment Links** → **+New** → **Payment link**.
3. Click **+Add a new product**:
   - **Product name:** `ZROI Pro`
   - **Description:** same as above
   - **Pricing:** Recurring → $9.00 USD → Monthly
   - Click **Add product**
4. Click **Create link**.
5. Stripe gives you a URL like:
   ```
   https://buy.stripe.com/...
   ```
6. Paste that URL into `PRO_CHECKOUT_URL`.

### Stripe tax note

If you sell globally through Stripe, you're responsible for registering, collecting, and remitting VAT/sales tax in each jurisdiction. Stripe Tax (separate product, ~0.5% extra) helps calculate, but you still file. For a solo project at early scale, Lemon Squeezy's MoR model is simpler.

## 3. Which to pick for ZROI right now

| Factor | Lemon Squeezy | Stripe Payment Links |
|---|---|---|
| Setup time | ~10 min | ~15 min |
| Fee | 5% + $0.50 | ~2.9% + 30¢ |
| Global tax handling | ✅ MoR — they file everything | ❌ You handle it |
| Chargeback liability | ✅ LS absorbs it | ❌ You own it |
| Checkout URL format | `/checkout/buy/[VARIANT_ID]` | `buy.stripe.com/...` |
| Overlay embedding | ✅ Yes (LS JS) | ❌ No (redirect only) |
| Webhook for feature-gating | ✅ Yes | ✅ Yes |
| Best for | Global indie SaaS, no backend | US-only, want lowest fees |

**Recommendation: Lemon Squeezy.** The ~2% fee premium over Stripe is the price of not having to register for VAT in 20+ countries. At $9/month, even 100 subscribers ($900/mo) means ~$45/mo in extra LS fees vs. Stripe — worth it to avoid filing returns in every EU country.

## 4. Gating Pro features without a backend (MVP approach)

Today ZROI is a static GitHub Pages site with no backend. There is no server to verify a customer paid. Three options, in order of increasing complexity:

### Option A: Trust + journal (MVP today)
- The checkout link sells the subscription.
- The buyer gets access to Pro features by... using them. There's no technical gate.
- You track sales in the LS dashboard.
- **Pros:** Zero engineering. Today.
- **Cons:** No actual feature restriction. Relies on goodwill / low scale.

### Option B: License key after purchase
- LS dashboard → after purchase, customer receives an email with a "license key" (you can automate this with LS email templates or a Zapier step).
- Add an input field in the Pro modal: "Enter your Pro license key".
- The key unlocks Pro features in the browser (stored in localStorage).
- **Pros:** Simple, works without a backend, feels like real gating.
- **Cons:** Keys can be shared. No revocation. Still trust-based at small scale.

### Option C: Backend with webhook verification (proper gating)
- Deploy a small backend (Render/Railway/Fly.io — a single serverless function is enough).
- LS webhook → backend stores `customer_email → licensed = true`.
- Frontend calls backend API on load: "is this email Pro?" → unlocks features.
- **Pros:** Real gating, revocable, scalable.
- **Cons:** Requires a backend, which is the thing we're avoiding for the MVP.

**Recommendation:** Start with Option A today (checkout link in the modal, no gate). Add Option B (license key) when you have paying customers who expect gating. Add Option C only when you need real enforcement.

## 5. Legal / tax considerations for selling from GitHub Pages

- A static site linking to a hosted checkout is completely normal. Thousands of indie products do this. No special legal setup needed beyond what the payment processor requires.
- **Lemon Squeezy handles:** VAT, GST, sales tax collection and remittance in all supported jurisdictions. You receive a payout net of fees.
- **Stripe:** You're the seller of record. If you sell to the EU, UK, Australia, etc., you may need to register for VAT/GST when you cross thresholds (e.g., €10,000 EU distance-selling threshold). Stripe Tax calculates but doesn't file for you.
- **Refunds:** Both LS and Stripe handle refund requests through their dashboards. Set a clear refund policy on the checkout page (LS lets you add terms; Stripe has a description field).
- **Terms of service / privacy:** Add a link in the Pro modal footer pointing to a simple Terms page (can be a GitHub Pages `/terms` route or a Google Doc). Not strictly required for the MVP but good practice once real money changes hands.

## 6. What to do today

1. Sign up for Lemon Squeezy at https://www.lemonsqueezy.com
2. Create the "ZROI Pro" subscription product with a $9/month variant
3. Copy the hosted checkout URL for that variant
4. Paste it into `frontend/src/App.tsx` line 11 (`PRO_CHECKOUT_URL`)
5. Rebuild the frontend (`cd frontend && node node_modules/vite/bin/vite.js build`)
6. Copy `dist/index.html` + `dist/assets/index-*.js` to the `gh-pages` branch
7. Force push `gh-pages`
8. Verify the live site's PRO button opens a real checkout page

That's the entire integration. No backend changes. No webhooks. No feature gates. Just a working checkout link in the modal.
