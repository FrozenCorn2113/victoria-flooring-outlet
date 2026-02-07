# Debug Welcome Email Issue

## The Problem
Subscriber was added to MailerLite, but no welcome email was sent via Resend.

## What to Check

### 1. Check Vercel Logs (Most Important!)

Go to: https://vercel.com/[your-project]/logs

**Filter by**:
- Time: Last 10 minutes
- Search for: `Welcome email` OR `subscribe` OR your email address

**Look for:**
- ✅ `"Welcome email sent to [your-email]"` ← Success message
- ❌ `"Welcome email error:"` ← Error message
- ❌ `"Resend API key not configured"` ← Missing env var
- ❌ `"Failed to send welcome email"` ← Resend API error

### 2. Verify Environment Variables in Vercel

Go to: https://vercel.com/[your-project]/settings/environment-variables

**Check these are set for PRODUCTION:**
- ✅ `RESEND_API_KEY` = `re_cpQQdHvi...`
- ✅ `RESEND_FROM_EMAIL` = `onboarding@resend.dev`

**If missing:** The welcome email code checks for `RESEND_API_KEY` and skips if not found!

### 3. Test Subscribe API Directly

```bash
# This will show any errors in the response
curl -X POST https://www.victoriaflooringoutlet.ca/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test-debug@example.com","source":"debug_test","firstName":"Debug"}' \
  -v
```

Look for errors in the response.

---

## Most Likely Cause

**Environment variables not set for Production environment in Vercel.**

When you added the 10 variables, you need to make sure you checked all 3 boxes:
- ✓ Production ← **This one is critical!**
- ✓ Preview
- ✓ Development

If you only checked "Preview" or "Development", production won't have the keys!

---

## How to Fix

### If Env Vars Are Missing:

1. Go to: https://vercel.com/[your-project]/settings/environment-variables
2. For `RESEND_API_KEY` and `RESEND_FROM_EMAIL`:
   - Click the three dots ⋯
   - Click "Edit"
   - Make sure **Production** is checked ✓
   - Save
3. Redeploy: https://vercel.com/[your-project]/deployments
   - Click the latest deployment
   - Click "Redeploy"

### If Env Vars Are Set:

Check the Vercel logs for the actual error message.

---

## Quick Test After Fix

```bash
curl -X POST https://www.victoriaflooringoutlet.ca/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_REAL_EMAIL@example.com","source":"test","firstName":"Test"}'
```

Check:
1. Your inbox (should receive email within 1 minute)
2. Resend dashboard (should see sent email)
3. Vercel logs (should see "Welcome email sent to...")
