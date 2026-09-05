# ls_taking_payments

Source: https://docs.lemonsqueezy.com/guides/developer-guide/taking-payments

# Taking Payments

Learn how to integrate Lemon Squeezy’s checkout system into your app or product, from creating checkout URLs to handling post-purchase processes and managing customer data.

---

Taking payments with Lemon Squeezy means sending customers to a checkout. Our checkout pages let your customers purchase one-off and subscription products using [various payment methods](/help/checkout/payment-methods) including cards, PayPal and Apple Pay.

Integrating with Lemon Squeezy involves two key steps: directing customers to a checkout page, and then capturing and storing customer and order data in your system once the payment is processed.

## Checkout URLs

For each product and variant in your Lemon Squeezy store, you can generate unique checkout URLs.

Let’s consider an example: imagine you have a subscription product with two variants - a monthly plan and an annual plan. Each variant will have its own distinct checkout URL. You’ll direct customers to the appropriate URL to complete their purchase.

The structure of a checkout URL is as follows:

```
https://[STORE].lemonsqueezy.com/checkout/buy/[VARIANT_ID]
```

When sharing a checkout URL you can specify whether you want to use a [hosted checkout](/help/checkout/hosted-checkout), which loads the checkout in a browser window, or our [checkout overlay](/help/checkout/checkout-overlay), which will load the checkout over the current page. When integrating into apps, the checkout overlay keeps the experience more streamlined.

Shareable checkout URLs always contain `/checkout/buy/` in the link.

When a customer opens a checkout URL in their browser, it’s converted to a “cart” URL:

- The URL changes to contain `/checkout/?cart=`
- This cart URL is unique to that customer and single-use only!
- Cart URLs **cannot be shared or reused**. They will not work for other customers.
Important

Always share the original checkout URL (with `/checkout/buy/`), not the converted cart URL.

## How to create checkouts

There are two ways to create checkouts for your products:

- From the Lemon Squeezy dashboard
- Using the Lemon Squeezy API

### Creating checkouts from the Lemon Squeezy dashboard

1. Log into your Lemon Squeezy dashboard and navigate to [Products](https://app.lemonsqueezy.com/products).
2. Click on the “Share” link when viewing a product and you’ll see a panel containing options for creating a checkout URL.
![Lemon Squeezy: Share Product Panel](/_next/image?url=%2Fcontent%2Fguides%2F02-developer-guide%2Fshare-product.webp&w=3840&q=75)
You can select between using the hosted and overlay checkouts plus show and hide different parts of the page. When you’re done, copy the URL and use it in your app or website.

### Creating checkouts using the Lemon Squeezy API

The second way to create a checkout URL is by using the [Checkouts API](/api/checkouts/create-checkout) endpoint. By using our API, you can create checkouts on-demand and with more flexibility.

To create a checkout with the API, send a `POST` request with your desired configuration. You have the same options as in the “Share Product” panel, plus [a range of customization options](/api/checkouts/create-checkout#checkout_options).

The most basic request contains required `relationships` to the store and variant.

The following request will create a checkout for a specified variant:

```
curl -X "POST" "https://api.lemonsqueezy.com/v1/checkouts" \
     -H 'Accept: application/vnd.api+json' \
     -H 'Content-Type: application/vnd.api+json' \
     -H 'Authorization: Bearer {api_key}' \
     -d $'{
  "data": {
    "type": "checkouts",
    "relationships": {
      "store": {
        "data": {
          "type": "stores",
          "id": "2"
        }
      },
      "variant": {
        "data": {
          "type": "variants",
          "id": "2"
        }
      }
    }
  }
}'
```

The response to this request is a [Checkout object](/api/checkouts/the-checkout-object).

The `data.attributes.url` in the response is the **unique URL for your specific checkout request**.

A common flow for using a checkout URL would be to send an API request to generate a checkout when a customer clicks a “Buy” button in your app. After receiving the response, you could then redirect the customer to the URL.

Alternatively, you could create a checkout during or right after page load and insert the URL in a “Buy” button, ready for the customer to click. However, we don’t recommend doing this on high-traffic pages unless you are caching the response.

## Advanced checkouts

Our checkout system offers additional customization and personalization options. You can apply these customizations in two ways:

- By adding query parameters to checkout URLs
- By including additional attributes when using the Checkouts API
Lemon Squeezy offers two checkout display options:

- [Hosted Checkout](/help/checkout/hosted-checkout) (Default): Checkout URLs generated from your dashboard’s Share option or via the API open in a new browser tab.
- [Checkout Overlay](/help/checkout/checkout-overlay): This option displays the checkout process in an iframe, over your existing website or application, keeping customers on your page.
To implement the “Checkout Overlay” from your Lemon Squeezy Dashboard:

1. From your Lemon Squeezy dashboard, navigate to the product sharing settings.
2. Select the “Checkout Overlay” option.
3. Copy the provided code snippet.
4. Paste this code into your web page.
![Lemon Squeezy: Checkout Overlay Copy Code](/_next/image?url=%2Fcontent%2Fguides%2F02-developer-guide%2Fcheckout-overlay.webp&w=3840&q=75)
This code includes [Lemon.js](/help/lemonjs/what-is-lemonjs), our mini JS library for handling checkout actions. Whenever a link with the CSS class `lemonsqueezy-button` is clicked, the checkout will appear over the current page instead of opening in the full browser window, making it feel a part of your site.


[... middle omitted — see footer ...]


### For subscriptions

For subscriptions, you could listen for `subscription_created` and `subscription_updated` webhook events and store subscription `id`s. (Handily, the `subscription_created` event will return the `order_id`, so there’s no need to listen to the `order_created` event if you’re selling subscriptions and also want to store the order ID).

You should also record the `product_id` and `variant_id`, which will help should you need to change subscription plans in the future.

Store the `first_subscription_item.id` if you are using [usage-based billing](/help/products/usage-based-billing), so you can create [usage records](/api/usage-records). It’s also recommended to store `first_subscription_item.quantity` so you can show your customers their current usage.

Store the `customer_id` if you want to query customer data in the future.

For the best user experience, store and display the `status`, `trial_ends_at`, `renews_at`, `ends_at`, `card_brand` and `card_last_four` values from a [Subscription object](/api/subscriptions#the-subscription-object) so that you can display up-to-date information about a subscription in your user’s billing page.

We also recommended to store a subscription object’s `urls.update_payment_method` value, which provides a simple URL for customers to update their payment method during their subscription.

---

That’s all. By following this guide, you’ll be well-equipped to integrate Lemon Squeezy’s checkout system into your app or product, ensuring a smooth, customizable, and efficient payment process for your customers.

Looking for SDKs?

Lemon Squeezy offers official SDKs for several programming languages to make API integration even easier. Check out our [available SDKs](/api#sdks) to find one that suits your development needs.

──────── [TRUNCATED] ────────
Showing 5,903 chars (head) + 1,797 chars (tail) of 18,779 total clean characters.
Full text saved to: C:\Users\GP540\AppData\Local\hermes\cache\web\docs.lemonsqueezy.com-59bb0ee99c.md
To read the omitted middle: read_file path="C:\Users\GP540\AppData\Local\hermes\cache\web\docs.lemonsqueezy.com-59bb0ee99c.md" offset=113 limit=200  (the file is the complete page; raise/lower offset to page through it).
─────────────────────────────
