# ls_subscriptions

Source: https://docs.lemonsqueezy.com/guides/developer-guide/managing-subscriptions

# Guides: Subscription Management using the Lemon Squeezy API â¢ Lemon Squeezy
URL: https://docs.lemonsqueezy.com/guides/developer-guide/managing-subscriptions

Guides: Subscription Management using the Lemon Squeezy API â¢ Lemon Squeezy

This guide covers essential subscription management tasks using the Lemon Squeezy Subscriptions API. Youâll learn how to programmatically change subscription plans, handle cancellations, implement pausing and resuming functionality, and manage other key aspects of your subscription-based service.

## Creating subscriptions

Read theâTaking paymentsâ guide to learn how to create checkouts and let customers sign up to your subscription products.

## Saving product data in your database

To enable plan switching within your app, you need to store your Lemon Squeezy product data locally. This builds on the information covered in theâSaving checkout and subscription data in your databaseâ section of theâTaking paymentsâ guide, where we discussed essential data to store in your app.

Make a`GET` request to the list all variants endpoint to return a list of all Variants.

To populate your app with product and variant data, you have two main options:

- Manually call the list all variants endpoint whenever you edit or add products.
- Set up a background job to fetch this data regularly.

We recommend storing the following key information for each variant:

- `product_id`
- `variant_id`
- `name`
- `price`

Storing these details allows you to easily display and manage product information within your app.

## Changing plans

To change a subscriptionâs plan (variant):

1. Send a`PATCH` request to the specific subscription endpoint
2. Include the new variant ID in the request body.

```
curl -X "PATCH" "https://api.lemonsqueezy.com/v1/subscriptions/{subscription_id}" \
     -H 'Accept: application/vnd.api+json' \
     -H 'Content-Type: application/vnd.api+json' \
     -H 'Authorization: Bearer {api_key}' \
     -d '{
  "data": {
    "type": "subscriptions",
    "id": "{subscription_id}",
    "attributes": {
      "variant_id": {variant_id}
    }
  }
}'
```

The subscription will be instantly moved to the new product variant and you will be able to verify this by checking the response (which will contain a Subscription object).

You can also manage subscription plans in the dashboard.

## Handling proration

When changing a subscriptionâs plan (variant), proration occurs by default.

âProrationâ is the term used for calculating the price difference between plans, ensuring customers are charged correctly for the time spent on each plan.

For example:

- A customer moves from a $19/month plan to a $99/month plan
- A prorated amount is charged based on the time already spent on the $19 plan
- By default, this extra amount is added to the next renewal

You have two options to control how proration is handled:

1. `"invoice_immediately": true`

- Creates a new invoice during the plan change
- If the new plan is cheaper, the invoice total will be zero
- If the new plan is more expensive, an immediate payment for the difference is attempted

1. `"disable_prorations": true`

- Completely disa
