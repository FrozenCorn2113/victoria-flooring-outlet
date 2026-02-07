# Deployment Steps - Email Flows

## Step 1: Verify Resend Domain ✉️

### Option A: Use Resend Dashboard (Recommended)

1. **Go to Resend Domains**: https://resend.com/domains

2. **Add Domain** (if not already added):
   - Click "Add Domain"
   - Enter: `victoriaflooringoutlet.ca`
   - Click "Add Domain"

3. **Add DNS Records** to your domain registrar:

   Resend will provide records like:
   
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all
   
   Type: TXT  
   Name: resend._domainkey
   Value: p=MIGfMA0GCSq... (long key)
   ```

4. **Verify Domain**:
   - Wait 1-5 minutes for DNS propagation
   - Click "Verify" in Resend dashboard
   - Status should change to "Verified"

### Option B: Use Test Email (For Development)

If you want to test without domain setup, you can use Resend's test domain:

```bash
# Change in .env.local temporarily:
RESEND_FROM_EMAIL=onboarding@resend.dev
```

⚠️ **Note**: Test emails have limitations and may not deliver to all inboxes.

---

## Step 2: Add Environment Variables to Vercel 🔐

### Option A: Vercel Dashboard (Easiest)

1. **Go to your Vercel project**:
   - https://vercel.com/[your-username]/victoria-flooring-outlet

2. **Navigate to Settings** → **Environment Variables**

3. **Add these variables** (copy from `.env.local`):

   | Variable | Value | Environments |
   |----------|-------|--------------|
   | `UNSUBSCRIBE_SECRET` | `c0b67779ebe8f...` | Production, Preview, Development |
   | `CRON_SECRET` | `600cc5971d...` | Production, Preview, Development |
   | `RESEND_API_KEY` | `re_cpQQdHvi...` | Production, Preview, Development |
   | `RESEND_FROM_EMAIL` | `Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>` | Production, Preview, Development |
   | `MAILERLITE_API_KEY` | `eyJ0eXAiOiJK...` | Production, Preview, Development |
   | `MAILERLITE_GROUP_SUBSCRIBER` | `178694947908617854` | Production, Preview, Development |
   | `MAILERLITE_GROUP_CUSTOMER` | `178694948289250440` | Production, Preview, Development |
   | `MAILERLITE_GROUP_REPEAT_CUSTOMER` | `178694948601726973` | Production, Preview, Development |
   | `MAILERLITE_FROM_NAME` | `Victoria Flooring Outlet` | Production, Preview, Development |
   | `MAILERLITE_FROM_EMAIL` | `hello@victoriaflooringoutlet.ca` | Production, Preview, Development |

4. **Update NEXT_PUBLIC_SITE_URL** to production URL:
   - Find existing `NEXT_PUBLIC_SITE_URL` variable
   - Update Production value to: `https://victoriaflooringoutlet.ca`
   - Keep Development as: `http://localhost:3000`

### Option B: Vercel CLI

```bash
# Make sure you're logged in
vercel login

# Link to your project
vercel link

# Add each variable
vercel env add UNSUBSCRIBE_SECRET production preview development
# Paste: c0b67779ebe8f1598085210709e541a614e84114f5987641410a5150b99e7df1

vercel env add CRON_SECRET production preview development
# Paste: 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604

vercel env add RESEND_API_KEY production preview development
# Paste: re_cpQQdHvi_Lrk9okkpuRmCRquwAefxNf4u

vercel env add RESEND_FROM_EMAIL production preview development
# Paste: Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>

vercel env add MAILERLITE_API_KEY production preview development
# Paste: eyJ0eXAiOiJK... (full token from .env.local)

vercel env add MAILERLITE_GROUP_SUBSCRIBER production preview development
# Paste: 178694947908617854

vercel env add MAILERLITE_GROUP_CUSTOMER production preview development
# Paste: 178694948289250440

vercel env add MAILERLITE_GROUP_REPEAT_CUSTOMER production preview development
# Paste: 178694948601726973

vercel env add MAILERLITE_FROM_NAME production preview development
# Paste: Victoria Flooring Outlet

vercel env add MAILERLITE_FROM_EMAIL production preview development
# Paste: hello@victoriaflooringoutlet.ca
```

---

## Step 3: Deploy to Production 🚀

### Pre-deployment Checklist

- [ ] Resend domain verified (or using test domain)
- [ ] All environment variables added to Vercel
- [ ] Database migration applied (already done ✅)
- [ ] MailerLite groups created (already done ✅)
- [ ] Build passing locally (`npm run build`)

### Deploy

```bash
# Review what will be deployed
git status

# Commit your changes
git add .
git commit -m "Add email flows: subscriber management, abandoned cart, hard-gate early access"

# Push to main branch (triggers automatic Vercel deployment)
git push origin main

# Or deploy manually
vercel --prod
```

### Verify Deployment

1. **Check Vercel Dashboard**:
   - Go to: https://vercel.com/[your-project]/deployments
   - Latest deployment should show "Ready"
   - Click on it to see build logs

2. **Verify Cron Jobs**:
   - Go to: Settings → Cron Jobs
   - Should see:
     - `/api/cron/sync-harbinger` - `5 0 * * 0` (Sunday 12:05 AM)
     - `/api/cron/email-jobs` - `0 * * * *` (Every hour)

3. **Test the APIs**:
   ```bash
   # Test subscription (replace with your production URL)
   curl -X POST https://victoriaflooringoutlet.ca/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","source":"deployment_test"}'
   
   # Test deal timer
   curl https://victoriaflooringoutlet.ca/api/deal-timer
   ```

---

## Step 4: Test the Flows 🧪

### Test A: Subscribe & Welcome Email

1. **Visit**: https://victoriaflooringoutlet.ca
2. **Scroll to email signup** (NextWeekPreviewSection)
3. **Enter your email** and subscribe
4. **Expected results**:
   - ✅ Success message shown
   - ✅ Welcome email arrives within 1 minute
   - ✅ Check MailerLite dashboard - subscriber added to "Subscriber" group
   - ✅ Check database: `SELECT * FROM newsletter_subscribers WHERE email = 'your@email.com'`
   - ✅ Check consents: `SELECT * FROM email_consents WHERE email = 'your@email.com'`

### Test B: Hard-Gate Early Access

**Prerequisites**: Need a deal with `deal_access` record:

```sql
-- Create test deal access (assuming weekly_deal id=1)
INSERT INTO deal_access (weekly_deal_id, subscriber_visible_at, public_visible_at)
VALUES (
  1,
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours'
)
ON CONFLICT (weekly_deal_id) DO UPDATE SET
  subscriber_visible_at = EXCLUDED.subscriber_visible_at,
  public_visible_at = EXCLUDED.public_visible_at;
```

**Test as non-subscriber**:
1. Open incognito window
2. Visit: https://victoriaflooringoutlet.ca
3. **Expected**: Blurred hero image + "Subscribe for Early Access" message

**Test as subscriber**:
1. Subscribe first (Test A above)
2. Visit homepage with cookie
3. **Expected**: Full hero image + "VIP Early Access" badge

### Test C: Abandoned Cart (12hr + 24hr Reminders)

1. **Add items to cart**: https://victoriaflooringoutlet.ca/cart
2. **Calculate shipping** (enter postal code)
3. **Enter email** in the checkout capture form
4. **Don't complete checkout** - close the browser

**Trigger reminders manually** (or wait 12/24 hours):

```bash
# Wait 12 hours, then trigger cron:
curl https://victoriaflooringoutlet.ca/api/cron/email-jobs \
  -H "Authorization: Bearer 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604"

# Check database:
SELECT * FROM abandoned_carts WHERE email = 'your@email.com';

# Wait another 12 hours for 2nd reminder
# Trigger cron again
```

**Expected results**:
- ✅ Email 1 (12hr): Gentle reminder with cart recap
- ✅ Email 2 (24hr): Urgent reminder with countdown
- ✅ Click link in email → Cart restored with all items

### Test D: Purchase & Auto-Subscribe

1. **Complete a purchase** on the site
2. **Check Stripe webhook logs** in Vercel
3. **Verify in database**:

```sql
-- Check subscriber was auto-subscribed
SELECT 
  email, 
  is_customer, 
  purchase_count, 
  total_spent, 
  tags,
  post_purchase_email_due_at
FROM newsletter_subscribers 
WHERE email = 'customer@example.com';

-- Check order record
SELECT 
  customer_email,
  total,
  post_purchase_email_due_at,
  post_purchase_email_sent
FROM orders 
WHERE customer_email = 'customer@example.com';

-- Check abandoned cart was marked purchased
SELECT status, purchased_at 
FROM abandoned_carts 
WHERE email = 'customer@example.com';
```

**Expected results**:
- ✅ Customer auto-subscribed (if not already)
- ✅ Added to "Customer" group in MailerLite
- ✅ `is_customer = true`, `purchase_count = 1`
- ✅ `post_purchase_email_due_at` set to 3 days from now
- ✅ Abandoned cart marked as `purchased`

### Test E: Post-Purchase Email (3 days later)

**Trigger manually** (or wait 3 days):

```sql
-- Force post-purchase email to be due now
UPDATE orders 
SET post_purchase_email_due_at = NOW() 
WHERE customer_email = 'customer@example.com';
```

Then trigger cron:
```bash
curl https://victoriaflooringoutlet.ca/api/cron/email-jobs \
  -H "Authorization: Bearer 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604"
```

**Expected results**:
- ✅ Post-purchase email delivered
- ✅ Includes thank you message
- ✅ Shows next week's deal preview (if available)
- ✅ Referral bonus section
- ✅ `post_purchase_email_sent = true` in database

### Test F: Weekly Deal Drop Email (Sunday 5 PM PT)

**Manual trigger**:

```bash
# The cron checks if it's Sunday 5 PM PT
# To test, you can temporarily modify the isSundayEveningPT() function
# Or just trigger the old send-weekly-sneak endpoint:

curl https://victoriaflooringoutlet.ca/api/cron/send-weekly-sneak \
  -H "Authorization: Bearer 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604"
```

**Expected results**:
- ✅ Email sent to all subscribers in "Subscriber" group
- ✅ Email has 2 sections:
  - THIS WEEK: Current deal with pricing, specs, "Shop Now" CTA
  - NEXT WEEK: Preview of upcoming deal
- ✅ Campaign recorded in MailerLite dashboard
- ✅ Record created in `newsletter_campaigns` table

---

## 📊 Monitoring Dashboard

After deployment, monitor:

1. **Resend**: https://resend.com/emails
   - View all transactional emails
   - Check delivery rates

2. **MailerLite**: https://dashboard.mailerlite.com/campaigns
   - View weekly campaign performance
   - Monitor subscriber lists

3. **Vercel Logs**: https://vercel.com/[your-project]/logs
   - Filter by cron jobs
   - Check for errors

4. **Database Queries** (see SETUP_EMAIL_FLOWS.md):
   - Monitor consent records
   - Track abandoned carts
   - Verify subscriber segmentation

---

## 🆘 Quick Troubleshooting

**Emails not sending?**
```bash
# Check Vercel logs
vercel logs --follow

# Verify environment variables
vercel env ls

# Test Resend API
curl https://api.resend.com/domains \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY"
```

**Cron not running?**
- Check Vercel Dashboard → Settings → Cron Jobs
- Verify `CRON_SECRET` is set
- Check cron logs: `vercel logs --follow | grep cron`

**Hard-gate not working?**
- Verify `vfo_subscriber` cookie is set after subscription
- Check `/api/deal-timer` returns correct data
- Ensure `deal_access` record exists for current deal
