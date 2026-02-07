#!/bin/bash
# scripts/add-vercel-env.sh
# Add all environment variables to Vercel (Production, Preview, Development)

set -e

echo "🚀 Adding Email Flow Environment Variables to Vercel"
echo "===================================================="
echo ""
echo "This will add all required variables for email flows."
echo "You'll be prompted to enter the value for each variable."
echo ""

# Read from .env.local (if exists)
if [ -f .env.local ]; then
  echo "✅ Found .env.local - reading values..."
  source .env.local
  echo ""
else
  echo "⚠️  .env.local not found - you'll need to enter values manually"
  echo ""
fi

# Function to add an environment variable to all environments
add_env_var() {
  local var_name=$1
  local var_value=$2
  
  echo "Adding $var_name..."
  
  # Use printf to handle multi-line values (like JWT tokens)
  printf "%s\n%s\n%s\n" "$var_value" "$var_value" "$var_value" | \
    vercel env add "$var_name" production preview development 2>&1 | \
    grep -v "Error: The environment variable" || true
  
  echo "  ✅ $var_name added"
  echo ""
}

# Add each variable
echo "================================================"
echo "Adding variables..."
echo "================================================"
echo ""

add_env_var "UNSUBSCRIBE_SECRET" "$UNSUBSCRIBE_SECRET"
add_env_var "CRON_SECRET" "$CRON_SECRET"
add_env_var "RESEND_API_KEY" "$RESEND_API_KEY"
add_env_var "RESEND_FROM_EMAIL" "$RESEND_FROM_EMAIL"
add_env_var "MAILERLITE_API_KEY" "$MAILERLITE_API_KEY"
add_env_var "MAILERLITE_GROUP_SUBSCRIBER" "$MAILERLITE_GROUP_SUBSCRIBER"
add_env_var "MAILERLITE_GROUP_CUSTOMER" "$MAILERLITE_GROUP_CUSTOMER"
add_env_var "MAILERLITE_GROUP_REPEAT_CUSTOMER" "$MAILERLITE_GROUP_REPEAT_CUSTOMER"
add_env_var "MAILERLITE_FROM_NAME" "$MAILERLITE_FROM_NAME"
add_env_var "MAILERLITE_FROM_EMAIL" "$MAILERLITE_FROM_EMAIL"

echo "================================================"
echo "✅ All variables added!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update NEXT_PUBLIC_SITE_URL in Vercel dashboard for production"
echo "2. Deploy: git push origin main"
echo "3. Test the flows"
