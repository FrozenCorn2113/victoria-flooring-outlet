# Vercel Environment Variables Checklist

## Go to Vercel Dashboard
https://vercel.com → Your Project → Settings → Environment Variables

---

## ✅ Copy-Paste These 10 Variables

For each variable:
1. Click "Add New"
2. Paste Name and Value
3. Check: ✓ Production ✓ Preview ✓ Development
4. Click "Save"

---

### Variable 1: UNSUBSCRIBE_SECRET
```
Name: UNSUBSCRIBE_SECRET
Value: c0b67779ebe8f1598085210709e541a614e84114f5987641410a5150b99e7df1
```

### Variable 2: CRON_SECRET
```
Name: CRON_SECRET
Value: 600cc5971ded64218a4166a3da40e66143b2c837fd0590900d608a9f2462f604
```

### Variable 3: RESEND_API_KEY
```
Name: RESEND_API_KEY
Value: re_cpQQdHvi_Lrk9okkpuRmCRquwAefxNf4u
```

### Variable 4: RESEND_FROM_EMAIL
```
Name: RESEND_FROM_EMAIL
Value: Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>
```

### Variable 5: MAILERLITE_API_KEY
```
Name: MAILERLITE_API_KEY
Value: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiNjkzYmU0NjI4MTQ1NmVhMjQxZTk2MmZhYzIyMDNlNTEyOTc5NTNlZDQyZjk1MWRhZThlYjEzZjVmMjEwMjExNTM5NDZlYjRiNjI0MzMxMmQiLCJpYXQiOjE3NjkyOTczODYuMzY0MjQ1LCJuYmYiOjE3NjkyOTczODYuMzY0MjQ3LCJleHAiOjQ5MjQ5NzA5ODYuMzU5MDQ4LCJzdWIiOiIyMDc5OTYxIiwic2NvcGVzIjpbXX0.s1_Zt2wQsVSs9gAWYR5WyNRwniGZClMYsJ6QNV4gROTwceGsMmO27HSlnvIjC-Pn7RSH_up0V0apXfbs1fGXerFayhe6bF0e-w68Uxoo6Xaeu4J1_TgmIeLy6JRrJIHkU4BICVLbVhk9wJfn8a6mB7TEr9PcuogD2-nTaa4LzVl15KAJ8CkxwtbAEWQgKtD0dArnstPeGFVlHj0R03FbJy_dVGGb6GG-dEGieR-T6yEzsDpojJb1zfbtOPMEVv0cwxzdfjkH5V2QksCyDmVowsu5Wd2cu61mkkqFhtJTRNzdkYMv6Fyn-loffNKytdX6BWZ31FcRrR2KbKAkjWgiZ9mEK8qZf179eenR0SXiYS_66Xlk_VkKNt1mnzKlrsAsBWENZjBnA_TwDfgVrfUjYkxdwKEq0chILPfcFYlT6AXeQhnYxHyaeFYQivIfTpYjz1UKUeH_DdoNG4Pbeg_NbRb8RydF8Gv6o0wCKC55UAT8-3MptEl_GNJd2oEuuicPZ0V3UJqDdgdcryltPpJwHXzu43s4UXXuMBob4dcP1TbJUiKhhsRKNDJeEJnRvaj5A7R0j3l3Zo1vQEQ4hJo-rj5k27ugUu-hK63XjSi67S-Arps2DOvCYuzGSY9QJWRhTLSeU2kE-E0FvqpQikPh5vzWILj1jgLz6PL7kolPNaY
```

### Variable 6: MAILERLITE_GROUP_SUBSCRIBER
```
Name: MAILERLITE_GROUP_SUBSCRIBER
Value: 178694947908617854
```

### Variable 7: MAILERLITE_GROUP_CUSTOMER
```
Name: MAILERLITE_GROUP_CUSTOMER
Value: 178694948289250440
```

### Variable 8: MAILERLITE_GROUP_REPEAT_CUSTOMER
```
Name: MAILERLITE_GROUP_REPEAT_CUSTOMER
Value: 178694948601726973
```

### Variable 9: MAILERLITE_FROM_NAME
```
Name: MAILERLITE_FROM_NAME
Value: Victoria Flooring Outlet
```

### Variable 10: MAILERLITE_FROM_EMAIL
```
Name: MAILERLITE_FROM_EMAIL
Value: hello@victoriaflooringoutlet.ca
```

---

## Update Existing Variable

### NEXT_PUBLIC_SITE_URL
Find this variable (should already exist) and update:

- **Production**: `https://victoriaflooringoutlet.ca` ← Change this
- **Preview**: `https://victoriaflooringoutlet.ca`
- **Development**: `http://localhost:3000` ← Keep this

---

## ✅ Checklist
After adding all variables:
- [ ] 10 new variables added
- [ ] NEXT_PUBLIC_SITE_URL updated for Production
- [ ] All variables set for Production, Preview, Development

Ready to deploy!
