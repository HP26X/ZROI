# stripe_payment_links

Source: https://docs.stripe.com/payment-links/create

# Create a payment link
Create a custom payment page without code.
Use the [Stripe Dashboard](https://dashboard.stripe.com/payment-links/create) to create a payment link that you can [share](https://docs.stripe.com/payment-links/share.md) with your customers. Stripe redirects customers who open this link to a Stripe-hosted payment page.
You can also create and manage payment links through [Checkout studio](https://docs.stripe.com/payments/checkout-studio.md), which provides a centralized Dashboard hub for configuring and monitoring your Checkout integrations, including Payment Links.

...

## Get started
### Products or subscriptions
1. In the Dashboard, open the [Payment Links](https://dashboard.stripe.com/payment-links/create/standard-pricing) page and click **+New** (or click the plus sign (+) and select **Payment link**).
2. Select an existing product or click **+Add a new product**.
3.
If you’re adding a new product, fill out the product details and click **Add product**.
4. Click **Create link**.

#### Customers choose what to pay
To let your customers choose what to pay, create a payment link by completing the following steps:
1. In the Dashboard, open the [Payment Links](https://dashboard.stripe.com/payment-links/create/customer-chooses-pricing) page and click **New** (or click the plus sign (+) and select **Payment link**).
2. Select **Customers choose what to pay** and add a title, description, and image.
3.
(Optional) Set a suggested preset amount.
4. (Optional) Set minimum and maximum payment amounts. By default, the maximum payment amount is 10,000.00 USD. Contact us using the form at [Stripe support](https://support.stripe.com) to increase this limit.
5. Click **Create link**.

## Get started with the Payment Links API
You can create payment links through the [Payment Links API](https://docs.stripe.com/api/payment-link.md). Use *Products* (Products represent what your business sells—whether that's a good or a service) and *Prices* (Prices define how much and how often to charge for products.
This includes how much the product costs, what currency to use, and the interval if the price is for subscriptions) to sell products or subscriptions.

...

### Products or subscriptions
First, create a product. Then, create a [flat rate](https://docs.stripe.com/products-prices/pricing-models.md#flat-rate) price with a fixed amount, and pass the ID of the existing product in the `product` parameter.
```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d currency=usd \
  -d unit_amount=1000 \
  -d "product={{PRODUCT_ID}}"
```
Next, create a payment link by passing in [line_items](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-line_items).
Each line item contains a [price](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-line_items-price) and [quantity](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-line_items-quantity). You can add up to 20 line items for flat rate prices.
```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1"
```
Use [price_data](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-line_items-price_data) to create a product and price when you create the payment link.
```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][product_data][name]=T-shirt" \
  -d "line_items[0][price_data][product_data][description]=This is a t-shirt" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][unit_amount]=1000" \
  -d "line_items[0][quantity]=1"
```
To create a subscription using a payment link, specify a price with [type=recurring](https://docs.stripe.com/api/prices/object.md#price_object-type) for `line_items`.
Use [subscription_data](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-subscription_data) to specify the configuration for the subscriptions created from the payment link, including trials:
```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d "subscription_data[trial_period_days]=7"
```

#### Customers choose what to pay
Set up [variable pricing](https://docs.stripe.com/products-prices/how-products-and-prices-work.md#variable-pricing) to let your customers choose what to pay for tips, donations, or your product or service.

...

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d currency=usd \
  -d "custom_unit_amount[enabled]=true" \
  -d "product={{PRODUCT_ID}}"
```
Create a payment link using the ID of the `Price` object in [line_items](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-line_items). You can’t add any other line items and the quantity can only be `1`.
```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1"
```

## Payment Links on mobile
If you’re creating a product or subscription, use the [Stripe Dashboard iOS app](https://apps.apple.com/app/apple-store/id978516833?pt=91215812&ct=stripe-mobile-app-docs-plinks&mt=8) to create a payment link on your mobile device.
In the app, go to **Payments** > **Payment Links** to create a payment link (or click the create icon (+) and select **Payment link**). The iOS app doesn’t currently support creating links where your customers choose how much to pay.

...

## Configure payment methods
To specify a different set of payment methods, set the [payment_method_types](https://docs.stripe.com/api/payment-link/create.md#create_payment_link-payment_method_types) parameter when you create the payment link in the API:
```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d "payment_method_types[0]=card" \
  -d "payment_method_types[1]=klarna"
```
Some payment methods, such as bank debits or vouchers, might take between 2 and 14 days to confirm the payment. [Set up webhooks](https://docs.stripe.com/checkout/fulfillment.md#create-payment-event-handler) to send you notifications when the payment clears, so you can begin fulfillment.

...

## Let customers pay in their local currency
With Adaptive Pricing, Stripe uses machine learning to determine the most relevant presentment currency, then automatically calculates the localized price and handles all currency conversion. Adaptive Pricing is always enabled for Payment Links.

## See also
- [Share a payment link](https://docs.stripe.com/payment-links/share.md)
- [Track a payment link](https://docs.stripe.com/payment-links/url-parameters.md)
- [Manage payment links in Checkout studio](https://docs.stripe.com/payments/checkout-studio.md)
