#!/bin/bash
# scripts/setup-vercel-env.sh
# Add all email flow environment variables to Vercel

echo "🚀 Setting up Vercel Environment Variables"
echo "=========================================="
echo ""
echo "This script will add all email flow variables to Vercel."
echo "You'll need to confirm each one."
echo ""

# Read from .env.local
source .env.local

# Array of variables to add
declare -a vars=(
  "UNSUBSCRIBE_SECRET"
  "CRON_SECRET"
  "RESEND_API_KEY"
  "RESEND_FROM_EMAIL"
  "MAILERLITE_API_KEY"
  "MAILERLITE_GROUP_SUBSCRIBER"
  "MAILERLITE_GROUP_CUSTOMER"
  "MAILERLITE_GROUP_REPEAT_CUSTOMER"
  "MAILERLITE_FROM_NAME"
  "MAILERLITE_FROM_EMAIL"
  "NEXT_PUBLIC_SITE_URL"
)

# Check which variables exist
echo "Checking environment variables..."
echo ""

for var in "${vars[@]}"; do
  value="${!var}"
  if [ -n "$value" ]; then
    echo "✅ $var is set"
  else
    echo "❌ $var is missing"
  fi
done

echo ""
echo "================================================"
echo "Ready to add these to Vercel?"
echo "================================================"
echo ""
echo "Run these commands manually (or use Vercel dashboard):"
echo ""

for var in "${vars[@]}"; do
  value="${!var}"
  if [ -n "$value" ]; then
    # Mask the value for display
    display_value="${value:0:20}..."
    echo "vercel env add $var"
    echo "  # Value: $display_value"
    echo ""
  fi
done

echo "Or use the Vercel Dashboard:"
echo "1. Go to: https://vercel.com/[your-project]/settings/environment-variables"
echo "2. Add each variable above"
echo "3. Select: Production, Preview, Development"
echo "4. Save"
