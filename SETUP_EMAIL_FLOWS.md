# Email Flows Setup Guide

## ✅ Completed Steps

### 1. Database Migration
All tables and columns have been created:
- ✅ `email_consents` - CASL consent tracking
- ✅ `abandoned_carts` - Cart tracking with reminders
- ✅ `deal_timers` - Server-authoritative timing
- ✅ `deal_access` - Hard-gate early access
- ✅ `newsletter_subscribers` - Extended with segmentation fields
- ✅ `orders` - Extended with post-purchase email scheduling

### 2. MailerLite Groups
Created in your MailerLite account (hello@victoriaflooringoutlet.ca):
- ✅ **Subscriber** (ID: 178694947908617854)
- ✅ **Customer** (ID: 178694948289250440)
- ✅ **RepeatCustomer** (ID: 178694948601726973)

---

## 🔧 Required Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and update the following:

#### 1. Email Services (Required)

```bash
# Get your Resend API key from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>

# Get your MailerLite API key from: https://dashboard.mailerlite.com/integrations/api
MAILERLITE_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

**Note**: The Resend "from" email must be from a verified domain. You'll need to:
1. Add DNS records for your domain in Resend
2. Or use Resend's test domain for initial testing

#### 2. Security Secrets (Already Generated)

These are already in `.env.local.example` - just copy them to `.env.local`:

```bash
UNSUBSCRIBE_SECRET=c0b67779ebe8f1598085210709e541a614e84114f5987641410a5150b99e7df1
CRON_SECRET=600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604
```

#### 3. Site Configuration (Update if needed)

```bash
NEXT_PUBLIC_SITE_URL=https://victoriaflooringoutlet.ca
```

#### 4. MailerLite Groups (Already Set)

```bash
MAILERLITE_GROUP_SUBSCRIBER=178694947908617854
MAILERLITE_GROUP_CUSTOMER=178694948289250440
MAILERLITE_GROUP_REPEAT_CUSTOMER=178694948601726973
```

---

## 📝 Vercel Configuration

### 1. Add Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local` (except those already configured by Vercel Postgres/Stripe integrations)
3. Make sure to set them for **Production**, **Preview**, and **Development** environments

### 2. Verify Cron Jobs

In **Settings** → **Cron Jobs**, you should see:

```
/api/cron/sync-harbinger    - Schedule: 5 0 * * 0   (Sunday 12:05 AM PT)
/api/cron/email-jobs         - Schedule: 0 * * * *  (Every hour)
```

### 3. Configure Cron Authentication

Add your `CRON_SECRET` to Vercel:
- The cron jobs will use this to authenticate via the `Authorization: Bearer {CRON_SECRET}` header
- Vercel automatically adds this header when calling cron endpoints

---

## 🧪 Testing Guide

### Test 1: Subscription Flow

1. **Subscribe to newsletter**:
   ```bash
   curl -X POST https://victoriaflooringoutlet.ca/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","source":"test"}'
   ```

2. **Expected results**:
   - ✅ Subscriber added to database
   - ✅ Subscriber added to MailerLite "Subscriber" group
   - ✅ Welcome email sent via Resend
   - ✅ Consent recorded in `email_consents` table
   - ✅ `vfo_subscriber` cookie set

3. **Verify in MailerLite**:
   - Go to **Subscribers** → find test@example.com
   - Should be in "Subscriber" group
   - Check fields: `source`, `first_name`

### Test 2: Abandoned Cart Flow

1. **Add items to cart** at https://victoriaflooringoutlet.ca/cart

2. **Enter email** (don't complete checkout)

3. **Wait 12 hours** (or manually trigger):
   ```bash
   curl https://victoriaflooringoutlet.ca/api/cron/email-jobs \
     -H "Authorization: Bearer {CRON_SECRET}"
   ```

4. **Expected results**:
   - ✅ 12-hour reminder email sent (gentle tone)
   - ✅ Cart record updated: `status='reminded_1'`, `reminder_1_sent_at` set

5. **Wait 24 hours** (12 hours after first reminder):
   - ✅ 24-hour reminder email sent (urgent tone)
   - ✅ Cart record updated: `status='reminded_2'`, `reminder_2_sent_at` set

6. **Complete checkout**:
   - ✅ Cart marked as `purchased`
   - ✅ No more reminders sent

### Test 3: Hard-Gate Early Access

**Prerequisites**: Create a test deal with `deal_access` record:

```sql
-- Assuming you have a weekly_deal with id=1
INSERT INTO deal_access (weekly_deal_id, subscriber_visible_at, public_visible_at)
VALUES (
  1,
  NOW() - INTERVAL '1 hour',  -- Subscriber window started 1 hour ago
  NOW() + INTERVAL '23 hours'  -- Public window starts in 23 hours
);
```

**Test as non-subscriber**:
1. Clear cookies or use incognito
2. Visit homepage
3. **Expected**: Blurred hero image + "Subscribe for Early Access" CTA

**Test as subscriber**:
1. Subscribe using Test 1
2. Visit homepage with `vfo_subscriber` cookie
3. **Expected**: Full hero image + "VIP Early Access" badge

### Test 4: Weekly Email (Sunday 5 PM PT)

**Manual trigger**:
```bash
# Temporarily modify the isSundayEveningPT() function in email-jobs.js to return true
curl https://victoriaflooringoutlet.ca/api/cron/email-jobs \
  -H "Authorization: Bearer {CRON_SECRET}"
```

**Expected results**:
- ✅ Email sent to all subscribers in "Subscriber" group
- ✅ Email contains:
  - THIS WEEK section (current deal with pricing, specs, CTA)
  - NEXT WEEK section (preview of upcoming deal)
- ✅ Campaign recorded in `newsletter_campaigns` table

### Test 5: Post-Purchase Flow

1. **Complete a purchase** (triggers Stripe webhook)

2. **Verify webhook automation**:
   ```sql
   SELECT 
     email,
     status,
     is_customer,
     purchase_count,
     total_spent,
     tags
   FROM newsletter_subscribers
   WHERE email = 'customer@example.com';
   
   SELECT 
     customer_email,
     post_purchase_email_due_at,
     post_purchase_email_sent
   FROM orders
   WHERE customer_email = 'customer@example.com';
   ```

3. **Expected results**:
   - ✅ Customer auto-subscribed (if not already)
   - ✅ Added to "Customer" group in MailerLite
   - ✅ `is_customer=true`, `purchase_count=1` in database
   - ✅ `post_purchase_email_due_at` set to 3 days from now
   - ✅ Abandoned cart marked as `purchased`

4. **Wait 3 days** (or manually trigger):
   ```sql
   -- Force email to be due now
   UPDATE orders 
   SET post_purchase_email_due_at = NOW() 
   WHERE customer_email = 'customer@example.com';
   ```
   
   Then trigger cron:
   ```bash
   curl https://victoriaflooringoutlet.ca/api/cron/email-jobs \
     -H "Authorization: Bearer {CRON_SECRET}"
   ```

5. **Expected results**:
   - ✅ Post-purchase email sent
   - ✅ Email includes next week's deal preview (if available)
   - ✅ Referral bonus section
   - ✅ `post_purchase_email_sent=true` in database

---

## 🔍 Monitoring & Debugging

### Check Email Logs

**Resend Dashboard**: https://resend.com/emails
- View all sent emails
- Check delivery status, opens, clicks
- View email content

**MailerLite Dashboard**: https://dashboard.mailerlite.com/campaigns
- View campaign performance
- Check subscriber lists
- Monitor group assignments

### Database Queries

**Check consent records**:
```sql
SELECT * FROM email_consents 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC;
```

**Check abandoned carts**:
```sql
SELECT 
  id,
  email,
  status,
  created_at,
  reminder_1_sent_at,
  reminder_2_sent_at,
  expires_at
FROM abandoned_carts
WHERE status IN ('active', 'reminded_1', 'reminded_2')
ORDER BY created_at DESC;
```

**Check subscriber segmentation**:
```sql
SELECT 
  email,
  first_name,
  is_customer,
  purchase_count,
  total_spent,
  tags,
  mailerlite_subscriber_id
FROM newsletter_subscribers
WHERE status = 'subscribed'
ORDER BY created_at DESC;
```

**Check cron job execution**:
```bash
# View Vercel logs
vercel logs --follow
```

### Test Unsubscribe Flow

1. **Get unsubscribe link from email** (or generate manually):
   ```bash
   curl https://victoriaflooringoutlet.ca/api/unsubscribe?email=BASE64_EMAIL&token=HMAC_TOKEN
   ```

2. **Expected results**:
   - ✅ All consents withdrawn in `email_consents`
   - ✅ `status='unsubscribed'` in `newsletter_subscribers`
   - ✅ Unsubscribed in MailerLite
   - ✅ `vfo_subscriber` cookie cleared

---

## 🚀 Go-Live Checklist

- [ ] All environment variables configured in Vercel
- [ ] Resend domain verified (DNS records added)
- [ ] MailerLite API key working (test with `/api/subscribe`)
- [ ] Cron jobs scheduled and running
- [ ] Test email delivered successfully
- [ ] Test abandoned cart flow (12hr + 24hr)
- [ ] Test hard-gate with subscriber cookie
- [ ] Test purchase → auto-subscribe → post-purchase email
- [ ] Unsubscribe link working
- [ ] Weekly email tested (manually triggered)
- [ ] MailerLite groups populated correctly
- [ ] Consent tracking verified in database

---

## 📊 Expected Cron Schedule

| Time | Job | Action |
|------|-----|--------|
| **Sunday 12:05 AM PT** | `sync-harbinger` | Scrape products, update weekly deal |
| **Sunday 5:00 PM PT** | `email-jobs` | Send weekly deal email to subscribers |
| **Every hour** | `email-jobs` | Check for abandoned carts, post-purchase emails, cleanup |

---

## 🆘 Troubleshooting

### Emails not sending

1. Check Resend API key: `echo $RESEND_API_KEY`
2. Check Resend dashboard for errors
3. Verify `RESEND_FROM_EMAIL` domain is verified
4. Check Vercel logs: `vercel logs --follow`

### MailerLite campaigns not sending

1. Check MailerLite API key: `echo $MAILERLITE_API_KEY`
2. Verify group IDs are correct: `echo $MAILERLITE_GROUP_SUBSCRIBER`
3. Check MailerLite dashboard for campaign status
4. Test with: `curl /api/cron/send-weekly-sneak -H "Authorization: Bearer $CRON_SECRET"`

### Hard-gate not working

1. Check `vfo_subscriber` cookie is set after subscription
2. Verify `deal_access` record exists for current deal
3. Check `/api/deal-timer` returns correct timestamps
4. Test with browser dev tools → Application → Cookies

### Cron jobs not running

1. Verify schedule in `vercel.json`
2. Check Vercel dashboard → Settings → Cron Jobs
3. Ensure `CRON_SECRET` is set in environment variables
4. Test manually: `curl /api/cron/email-jobs -H "Authorization: Bearer $CRON_SECRET"`

---

## 📝 Notes

- **Vercel Hobby Plan**: Limited to 2 cron jobs (✅ optimized)
- **MailerLite Free Tier**: No automations, campaigns only
- **CASL Compliance**: All consent tracked with unsubscribe links
- **Server-Authoritative**: Countdown timer syncs with server time
- **Price Validation**: Server-side validation prevents price manipulation
