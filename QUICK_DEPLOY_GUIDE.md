# Quick Deploy Guide - Copy & Paste Ready

## 🎯 Quick Summary

All code is ready! You just need to:
1. ✅ Verify Resend domain (or use test mode)
2. ✅ Copy environment variables to Vercel
3. ✅ Deploy
4. ✅ Test

---

## Step 1: Resend Domain (5 minutes)

### Quick Test Mode (Skip Domain Setup)

Update `.env.local` line 95 temporarily:

```bash
# Change from:
RESEND_FROM_EMAIL=Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>

# To (for testing):
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### OR: Add Your Domain (Production Ready)

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `victoriaflooringoutlet.ca`
4. Add the DNS records they provide to your domain registrar
5. Wait 2-5 minutes, click "Verify"

---

## Step 2: Vercel Environment Variables (Copy & Paste)

### Go to Vercel Dashboard:
https://vercel.com → Your Project → Settings → Environment Variables

### Add These Variables:

**Copy each line and paste as new environment variable:**

```
Name: UNSUBSCRIBE_SECRET
Value: c0b67779ebe8f1598085210709e541a614e84114f5987641410a5150b99e7df1
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: CRON_SECRET
Value: 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: RESEND_API_KEY
Value: re_cpQQdHvi_Lrk9okkpuRmCRquwAefxNf4u
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: RESEND_FROM_EMAIL
Value: Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>
Environments: ✓ Production ✓ Preview ✓ Development
Note: Use "onboarding@resend.dev" if domain not verified yet
```

```
Name: MAILERLITE_API_KEY
Value: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiNjkzYmU0NjI4MTQ1NmVhMjQxZTk2MmZhYzIyMDNlNTEyOTc5NTNlZDQyZjk1MWRhZThlYjEzZjVmMjEwMjExNTM5NDZlYjRiNjI0MzMxMmQiLCJpYXQiOjE3NjkyOTczODYuMzY0MjQ1LCJuYmYiOjE3NjkyOTczODYuMzY0MjQ3LCJleHAiOjQ5MjQ5NzA5ODYuMzU5MDQ4LCJzdWIiOiIyMDc5OTYxIiwic2NvcGVzIjpbXX0.s1_Zt2wQsVSs9gAWYR5WyNRwniGZClMYsJ6QNV4gROTwceGsMmO27HSlnvIjC-Pn7RSH_up0V0apXfbs1fGXerFayhe6bF0e-w68Uxoo6Xaeu4J1_TgmIeLy6JRrJIHkU4BICVLbVhk9wJfn8a6mB7TEr9PcuogD2-nTaa4LzVl15KAJ8CkxwtbAEWQgKtD0dArnstPeGFVlHj0R03FbJy_dVGGb6GG-dEGieR-T6yEzsDpojJb1zfbtOPMEVv0cwxzdfjkH5V2QksCyDmVowsu5Wd2cu61mkkqFhtJTRNzdkYMv6Fyn-loffNKytdX6BWZ31FcRrR2KbKAkjWgiZ9mEK8qZf179eenR0SXiYS_66Xlk_VkKNt1mnzKlrsAsBWENZjBnA_TwDfgVrfUjYkxdwKEq0chILPfcFYlT6AXeQhnYxHyaeFYQivIfTpYjz1UKUeH_DdoNG4Pbeg_NbRb8RydF8Gv6o0wCKC55UAT8-3MptEl_GNJd2oEuuicPZ0V3UJqDdgdcryltPpJwHXzu43s4UXXuMBob4dcP1TbJUiKhhsRKNDJeEJnRvaj5A7R0j3l3Zo1vQEQ4hJo-rj5k27ugUu-hK63XjSi67S-Arps2DOvCYuzGSY9QJWRhTLSeU2kE-E0FvqpQikPh5vzWILj1jgLz6PL7kolPNaY
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: MAILERLITE_GROUP_SUBSCRIBER
Value: 178694947908617854
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: MAILERLITE_GROUP_CUSTOMER
Value: 178694948289250440
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: MAILERLITE_GROUP_REPEAT_CUSTOMER
Value: 178694948601726973
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: MAILERLITE_FROM_NAME
Value: Victoria Flooring Outlet
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: MAILERLITE_FROM_EMAIL
Value: hello@victoriaflooringoutlet.ca
Environments: ✓ Production ✓ Preview ✓ Development
```

### Update Existing Variable:

Find `NEXT_PUBLIC_SITE_URL` and update:
- **Production**: `https://victoriaflooringoutlet.ca` (no trailing slash)
- **Preview**: `https://victoriaflooringoutlet.ca`
- **Development**: `http://localhost:3000`

---

## Step 3: Deploy to Production

### Option A: Git Push (Automatic)

```bash
# From your project directory
git add .
git commit -m "Add email flows: subscriber management, abandoned cart, hard-gate early access"
git push origin main
```

Vercel will automatically detect the push and deploy.

### Option B: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Step 4: Quick Smoke Test (2 minutes)

Once deployed, run these commands:

```bash
# 1. Test subscription
curl -X POST https://victoriaflooringoutlet.ca/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@example.com","source":"test"}'

# 2. Test deal timer  
curl https://victoriaflooringoutlet.ca/api/deal-timer

# 3. Check welcome email in your inbox
# Look for: "Welcome to the VFO Insider Club!"
```

---

## ✅ Success Indicators

After deployment, you should see:

1. **Vercel Dashboard**:
   - ✅ Deployment status: "Ready"
   - ✅ 2 cron jobs configured

2. **MailerLite Dashboard**:
   - ✅ Test subscriber appears in "Subscriber" group
   - ✅ Groups show: Subscriber, Customer, RepeatCustomer

3. **Your Email Inbox**:
   - ✅ Welcome email received
   - ✅ Branding looks correct
   - ✅ Unsubscribe link present

4. **Database**:
   - ✅ Subscriber record created
   - ✅ Consent recorded

---

## 🎉 You're Done!

Once these steps are complete, all email flows are live:
- ✅ Welcome emails on signup
- ✅ Weekly deal drop every Sunday 5 PM
- ✅ Abandoned cart reminders (12hr + 24hr)
- ✅ Auto-subscribe on purchase
- ✅ Post-purchase follow-up (3 days)
- ✅ Hard-gate early access for subscribers
- ✅ CASL compliant with audit trail
