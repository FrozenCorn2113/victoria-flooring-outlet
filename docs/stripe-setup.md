## Stripe test setup

These steps wire the app to Stripe test mode. When you're ready to go live,
swap the keys for your live business keys and update the webhook secret.

### 1) Create a Stripe account and enable test mode

In the Stripe dashboard, toggle **Test mode**.

### 2) Collect your test API keys

From **Developers → API keys** copy:

- Publishable key (starts with `pk_test_`)
- Secret key (starts with `sk_test_`)

Add them to `.env.local`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3) Configure local webhook forwarding

Install and log in with the Stripe CLI:

```
stripe login
```

Forward events to your local webhook endpoint:

```
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

The CLI prints a webhook signing secret that starts with `whsec_...`. Add it to
`.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4) Set the site URL

Ensure this is set for redirect URLs during checkout:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Switching to live keys later

When ready to go live:

- Replace the `pk_test_`/`sk_test_` values with your live keys
- Create a live-mode webhook endpoint in Stripe and replace `STRIPE_WEBHOOK_SECRET`
- Update `NEXT_PUBLIC_SITE_URL` to your production domain
