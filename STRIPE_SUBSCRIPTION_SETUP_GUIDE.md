# Stripe Subscription Integration Setup Guide

## Overview
This guide covers the complete setup and deployment of the enhanced Stripe subscription management system for ParleyApp's web-app, including webhook handling, subscription status checking, and automated maintenance.

## 🚀 Quick Start Checklist

### 1. Environment Variables Setup

Add these environment variables to your deployment (Railway, Vercel, etc.):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ... # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Service role key (admin access)

# Cron Job Security (Optional but recommended)
CRON_SECRET=your-random-secret-here

# Environment
NODE_ENV=production # or development
```

### 2. Stripe Dashboard Configuration

1. **Create Webhook Endpoint** in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe/webhook-enhanced`
   - Events to send:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`

2. **Copy Webhook Secret** from Stripe Dashboard and set as `STRIPE_WEBHOOK_SECRET`

3. **Configure Products/Prices** in Stripe Dashboard:
   - Create subscription products (Pro Weekly, Pro Monthly, Pro Yearly, Elite, etc.)
   - Create one-time products (Day Pass, Lifetime, etc.)
   - Note the Price IDs for your checkout session creation

### 3. Supabase Database Setup

The `profiles` table should have these subscription-related columns:

```sql
-- Check if columns exist, add if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan_type VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_source VARCHAR DEFAULT 'stripe';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_daily_picks INTEGER DEFAULT 2;

-- Optional: Create cron logs table for monitoring
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  summary JSONB,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📡 API Endpoints

### Enhanced Webhook Handler
- **Endpoint**: `/api/stripe/webhook-enhanced`
- **Purpose**: Processes Stripe webhooks with improved error handling
- **Features**:
  - Signature verification
  - Comprehensive logging
  - User profile updates
  - Handles all subscription lifecycle events

### Subscription Status API
- **Endpoint**: `/api/subscription/status`
- **Methods**: GET, POST
- **Purpose**: Check and manage user subscription status

#### GET Examples:
```bash
# Check current user (with auth token)
curl -H "Authorization: Bearer USER_JWT_TOKEN" \
  https://your-domain.com/api/subscription/status

# Check specific user by ID
curl "https://your-domain.com/api/subscription/status?userId=USER_ID"

# Force fresh check against Stripe
curl "https://your-domain.com/api/subscription/status?userId=USER_ID&forceCheck=true"
```

#### POST Examples:
```bash
# Refresh specific user's subscription
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"refresh","userId":"USER_ID"}' \
  https://your-domain.com/api/subscription/status

# Batch check multiple users
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"batch_check","userIds":["USER_ID_1","USER_ID_2"]}' \
  https://your-domain.com/api/subscription/status
```

### Debug Endpoint
- **Endpoint**: `/api/stripe/debug`
- **Purpose**: Troubleshoot subscription issues
- **Methods**: GET (inspection), POST (actions)

### Subscription Maintenance Cron
- **Endpoint**: `/api/subscription/cron`
- **Purpose**: Automated subscription maintenance
- **Trigger**: Scheduled or manual

## 🔧 Cron Job Setup

### Option 1: Railway Cron (Recommended)

Create `railway.json` in your project root:

```json
{
  "name": "parley-web-app",
  "services": {
    "web": {
      "cron": [
        {
          "command": "curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" https://your-domain.com/api/subscription/cron",
          "schedule": "0 6 * * *"
        }
      ]
    }
  }
}
```

### Option 2: External Cron Service

Set up with services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Example cron command:
```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/subscription/cron
```

**Recommended Schedule**: `0 6 * * *` (6 AM daily)

### Option 3: Vercel Cron (if using Vercel)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/subscription/cron",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## 🧪 Testing Guide

### 1. Webhook Testing

#### Test with Stripe CLI:
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/stripe/webhook-enhanced

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

#### Test with curl:
```bash
# Test webhook endpoint (use test webhook secret)
curl -X POST https://your-domain.com/api/stripe/webhook-enhanced \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: WEBHOOK_SIGNATURE" \
  -d @test-webhook.json
```

### 2. Subscription Status Testing

```bash
# Test status endpoint
curl "https://your-domain.com/api/subscription/status?userId=test-user-id"

# Test forced refresh
curl "https://your-domain.com/api/subscription/status?userId=test-user-id&forceCheck=true"
```

### 3. Debug Endpoint Testing

```bash
# Check user subscription data
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"get_user_data","email":"user@example.com"}' \
  https://your-domain.com/api/stripe/debug
```

### 4. Cron Job Testing

```bash
# Manual trigger (development)
curl -X GET https://your-domain.com/api/subscription/cron

# Production trigger (with auth)
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/subscription/cron
```

## 🔍 Monitoring & Troubleshooting

### 1. Webhook Monitoring
- Check Railway/Vercel logs for webhook processing
- Verify webhook signatures are valid
- Monitor Stripe Dashboard webhook logs

### 2. Database Monitoring
```sql
-- Check recent subscription updates
SELECT id, email, subscription_tier, subscription_status, 
       subscription_expires_at, updated_at 
FROM profiles 
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- Check cron job logs
SELECT * FROM cron_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Common Issues

#### Webhook Not Working:
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook URL in Stripe Dashboard
3. Ensure endpoint returns 200 status
4. Check server logs for errors

#### Subscription Status Not Updating:
1. Check Stripe customer has correct email
2. Verify webhook events are being sent
3. Run manual status refresh via API
4. Check Supabase permissions

#### Cron Job Failures:
1. Verify `CRON_SECRET` if using auth
2. Check Stripe API rate limits
3. Monitor database connection issues
4. Review cron_logs table for details

## 🔐 Security Considerations

### 1. Webhook Security
- Always verify Stripe signatures
- Use HTTPS endpoints only
- Rotate webhook secrets periodically

### 2. API Security
- Implement proper authentication for sensitive endpoints
- Use service role keys only for admin operations
- Set up rate limiting for public endpoints

### 3. Cron Security
- Use `CRON_SECRET` for production cron jobs
- Limit cron job access to specific IPs if possible
- Monitor cron job execution logs

## 🚀 Deployment Steps

### 1. Deploy Code
```bash
# Push enhanced webhook and subscription management code
git add .
git commit -m "Add enhanced Stripe subscription management"
git push origin main
```

### 2. Update Environment Variables
- Set all required environment variables in your hosting platform
- Test environment variables are loaded correctly

### 3. Configure Stripe Webhooks
- Update webhook endpoint URL to production domain
- Test webhook delivery from Stripe Dashboard

### 4. Set Up Cron Job
- Configure automated subscription maintenance
- Test cron job execution manually

### 5. Monitor Initial Operation
- Watch logs for first few webhook events
- Verify subscription status updates work correctly
- Test end-to-end subscription flow

## 📊 Expected Behavior

### Successful Subscription Flow:
1. User completes Stripe checkout
2. Webhook received and verified
3. User profile updated in Supabase
4. Subscription status reflects in frontend
5. Daily cron maintains consistency

### Subscription Cancellation:
1. User cancels in Stripe or payment fails
2. Webhook updates subscription status
3. User automatically downgraded to free tier
4. Access restrictions applied immediately

### Maintenance Cron:
1. Runs daily at 6 AM
2. Checks all active subscriptions against Stripe
3. Updates expired subscriptions to free tier
4. Logs results for monitoring

## ✅ Success Verification

Your subscription system is working correctly when:
- [ ] Webhooks process without errors
- [ ] Subscription status API returns accurate data  
- [ ] Cron job runs successfully daily
- [ ] User subscriptions sync properly between Stripe and Supabase
- [ ] Frontend reflects correct subscription tiers and features
- [ ] Failed payments properly downgrade users
- [ ] Debug endpoint provides useful troubleshooting data

## 🆘 Support

If you encounter issues:
1. Check server logs for specific error messages
2. Use the debug endpoint to inspect subscription data
3. Verify Stripe webhook delivery in Stripe Dashboard
4. Test with Stripe CLI for local development
5. Monitor Supabase database directly for data consistency

The enhanced subscription system provides robust error handling, comprehensive logging, and automated maintenance to ensure reliable subscription management for your ParleyApp web application.
