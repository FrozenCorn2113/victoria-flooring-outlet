# Test Your Deployment

## Check Deployment Status

Go to: https://vercel.com/[your-project]/deployments

Look for the latest deployment (just now) - it should show "Building..." then "Ready"

Build typically takes 2-3 minutes.

---

## Once Deployment is "Ready" - Run These Tests

### Test 1: Subscribe & Welcome Email ✉️

```bash
curl -X POST https://victoriaflooringoutlet.ca/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@example.com","source":"deployment_test","firstName":"Test"}'
```

**Expected:**
- ✅ Response: `{"success":true,"message":"..."}`
- ✅ Welcome email arrives in inbox within 60 seconds
- ✅ Check MailerLite dashboard - subscriber appears in "Subscriber" group

### Test 2: Deal Timer API ⏰

```bash
curl https://victoriaflooringoutlet.ca/api/deal-timer
```

**Expected:**
```json
{
  "serverTime": "2026-02-07T...",
  "dealEndsAt": "2026-02-10T...",
  "remainingMs": 123456,
  "dealActive": true,
  "isSubscriberWindow": false
}
```

### Test 3: Visit the Site 🌐

1. **Go to**: https://victoriaflooringoutlet.ca
2. **Subscribe** using the email form
3. **Check the hero section**:
   - Should see countdown timer
   - If during early access window: VIP badge (if subscribed) or "Subscribe for Early Access" (if not)

### Test 4: Cart & Email Capture 🛒

1. **Add a product to cart**
2. **Go to cart**: https://victoriaflooringoutlet.ca/cart
3. **Enter email** in the capture form
4. **Check**: Should see "Email saved" message
5. **Don't checkout** - abandon the cart

**In 12 hours**, you should receive an abandoned cart reminder email.

### Test 5: Check Database 📊

```sql
-- Check subscriber was added
SELECT email, first_name, is_customer, tags, created_at 
FROM newsletter_subscribers 
WHERE email = 'YOUR_EMAIL@example.com';

-- Check consent was recorded
SELECT email, consent_type, consent_source, created_at 
FROM email_consents 
WHERE email = 'YOUR_EMAIL@example.com';

-- Check abandoned cart (if you did Test 4)
SELECT email, status, reminder1_sent, reminder2_sent, created_at 
FROM abandoned_carts 
WHERE email = 'YOUR_EMAIL@example.com';
```

---

## Verify Cron Jobs

Go to: https://vercel.com/[your-project]/settings/cron-jobs

**Should see 2 cron jobs:**

1. `/api/cron/sync-harbinger`
   - Schedule: `5 0 * * 0` (Sunday 12:05 AM)
   - Status: Active ✅

2. `/api/cron/email-jobs`
   - Schedule: `0 * * * *` (Every hour)
   - Status: Active ✅

---

## Check Email Deliverability

### Resend Dashboard
https://resend.com/emails

- View all sent emails
- Check delivery status
- See open/click rates

### MailerLite Dashboard
https://dashboard.mailerlite.com

- **Groups**: Should see Subscriber, Customer, RepeatCustomer groups
- **Subscribers**: Your test subscriber should appear
- **Campaigns**: Weekly emails will appear here (sent Sunday 5 PM PT)

---

## ✅ Success Checklist

After running tests above:

- [ ] Welcome email received
- [ ] Subscriber added to MailerLite
- [ ] Consent recorded in database
- [ ] Deal timer API returns valid data
- [ ] Homepage loads without errors
- [ ] Countdown timer displays correctly
- [ ] Email capture works on cart page
- [ ] Cron jobs are active in Vercel
- [ ] Resend dashboard shows sent emails

---

## 🎉 You're Live!

All email flows are now deployed and running:

✅ **Welcome emails** - Instant on signup  
✅ **Weekly deal drops** - Every Sunday 5 PM PT  
✅ **Abandoned cart recovery** - 12hr + 24hr reminders  
✅ **Post-purchase emails** - 3 days after purchase  
✅ **Hard-gate early access** - 24hr head start for subscribers  
✅ **CASL compliant** - Full audit trail  

---

## Fix Domain Later (Optional)

Once your SPF record propagates (check in 1-24 hours):

```bash
# Check DNS
dig +short victoriaflooringoutlet.ca TXT | grep amazonses
```

If you see the amazonses include:

1. Go to Resend → Domains
2. Click "Verify Domain" on victoriaflooringoutlet.ca
3. Once verified, update Vercel env var:
   - `RESEND_FROM_EMAIL` → `Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>`
4. Redeploy

For now, test domain works perfectly!
