# Home Page Highlights Update - Complete ✅

**Date:** February 6, 2026  
**Status:** Live on home page

---

## What Changed

### BEFORE (Generic fallback bullets):
```
• Commercial-grade Harbinger flooring
• Shipped direct to your door in Victoria  
• Limited weekly stock
```
**Problem:** Too vague, doesn't describe the actual product

---

### AFTER (Product-specific bullets for Coventry Spice):
```
• Heavy-traffic durability with 4S scratch and stain protection
• Realistic embossed wood grain texture
• Glue-down install on any grade level
```
**Win:** Describes actual product features, more compelling

---

## Files Modified

### 1. Database: `vendor_products` table
**Updated Coventry Spice (ID 165):**
```json
{
  "deal_content": {
    "highlights": [
      "Heavy-traffic durability with 4S scratch and stain protection",
      "Realistic embossed wood grain texture",
      "Glue-down install on any grade level"
    ]
  }
}
```

### 2. Code: `lib/harbinger/sync.js`
**Added highlights extraction to 3 functions:**
- `getWeeklyDealFromDb()` - line 682
- `getLatestWeeklyDealFromDb()` - line 759
- `getNextWeeklyDealFromDb()` - line 824

**Change made:**
```javascript
// Added this line to all 3 functions:
highlights: row.deal_content?.highlights || null,
```

This spreads `deal_content.highlights` to the top level so `HomeHero.js` can access it as `weeklyDeal.highlights`.

---

## How It Works

### Data Flow:
1. **Database** → `vendor_products.deal_content.highlights` stores the bullets
2. **Sync function** → Flattens to `weeklyDeal.highlights`
3. **HomeHero component** → Displays bullets (lines 92-98)

### Fallback Behavior:
- If `highlights` exists → Show product-specific bullets
- If `highlights` is null → Show generic fallback bullets

---

## For Future Weekly Deals

When setting up a new weekly deal, add highlights to the product:

```sql
UPDATE vendor_products 
SET deal_content = jsonb_build_object(
  'highlights', jsonb_build_array(
    'Bullet point 1 about the product',
    'Bullet point 2 about the product', 
    'Bullet point 3 about the product'
  )
)
WHERE id = [product_id];
```

### Tips for writing highlights:
- **Keep them short** (under 10 words)
- **Lead with the benefit** (durability, ease of install, style)
- **Avoid generic claims** (use product-specific features from specs)
- **3 bullets total** (home hero only shows 3)

---

## Current Live Product

**Coventry Spice** (Feb 1-8, 2026)
- ✅ Description: "Rich spiced wood with warm amber undertones adds depth to interiors. Heavy-traffic vinyl with 4S protection."
- ✅ Highlights: Product-specific bullets (shown above)
- ✅ Specs: Full technical details in collapsed accordion

---

## Status: Ready to Ship Next Deal

When the next weekly deal goes live, just add `deal_content.highlights` to that product's row and the home page will automatically show the new bullets.

No code changes needed for future deals! 🎯
