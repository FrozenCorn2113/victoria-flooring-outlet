# Deploy NOW - Quick Start

Your SPF record is taking time to propagate. Let's deploy with test email and fix the domain later.

## Step 1: Build Locally (Verify Everything Works)

```bash
cd /Users/bcarter/VictoriaFlooringOutlet.ca
npm run build
```

If build succeeds → proceed to Step 2

## Step 2: Add Environment Variables to Vercel

Open: https://vercel.com → Your Project → Settings → Environment Variables

Copy all 10 variables from `VERCEL_ENV_CHECKLIST.md` - they're ready to paste!

## Step 3: Deploy

```bash
git add .
git commit -m "Add email flows: subscriber management, abandoned cart, hard-gate early access"
git push origin main
```

## Step 4: Test Everything

After deploy completes (2-3 minutes):

### Test A: Subscribe
```bash
curl -X POST https://victoriaflooringoutlet.ca/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@example.com","source":"test"}'
```

Check your email for the welcome message!

### Test B: Deal Timer
```bash
curl https://victoriaflooringoutlet.ca/api/deal-timer
```

### Test C: Full Flow
1. Visit: https://victoriaflooringoutlet.ca
2. Subscribe with your email
3. Check email inbox
4. Browse the site

---

## Fix Domain Later

After deployment works, you can:
1. Double-check the SPF record in Namecheap shows: `include:amazonses.com`
2. Wait for DNS propagation (can take up to 24 hrs)
3. Verify in Resend dashboard
4. Update `RESEND_FROM_EMAIL` in Vercel to: `Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>`
5. Redeploy

---

## Ready?

Run the build command and let me know if it succeeds!
