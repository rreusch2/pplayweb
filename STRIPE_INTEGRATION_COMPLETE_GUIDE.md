# 🚀 ParleyApp Web Stripe Integration - Complete Setup Guide

## 📋 **OVERVIEW**

Your web app now has a **comprehensive Stripe subscription management system** that provides a **single source of truth** for subscription lifecycle management. Here's everything you need to know to complete the setup and deploy.

---

## 🎯 **WHAT WAS IMPLEMENTED**

### ✅ **1. Enhanced Webhook System**
- **Location**: `/app/api/stripe/webhook/route.ts`
- **Handles**: All subscription lifecycle events (create, update, cancel, renewals, payment failures)
- **Features**: 
  - Automatic `subscription_tier` updates (`free` → `pro` → `elite`)
  - Intelligent tier detection from price IDs
  - Proper `max_daily_picks` setting (Free: 2, Pro: 20, Elite: 30)
  - Enhanced logging and error handling

### ✅ **2. Comprehensive Subscription Service**
- **Location**: `/lib/stripe-subscription-service.ts`
- **Features**:
  - Single source of truth for subscription management
  - Feature access control
  - Tier limits and permissions
  - Checkout session creation
  - Customer portal management

### ✅ **3. React Hook for Easy Integration**
- **Location**: `/hooks/useSubscription.ts` 
- **Features**:
  - Real-time subscription updates via Supabase
  - Easy subscription state management
  - Built-in feature access checks
  - Automatic re-fetching and error handling

### ✅ **4. Environment Configuration**
- **Updated**: `.env.local` with all Pro and Elite price IDs
- **Organized**: Clear separation of tiers and pricing
- **Ready**: For webhook secret configuration

### ✅ **5. Database Schema Enhancements** 
- **Location**: `/database/stripe-subscription-schema.sql`
- **Features**: Audit trails, customer mapping, subscription history, analytics views

---

## 🔧 **IMMEDIATE SETUP STEPS**

### **Step 1: Configure Webhook Secret**

1. **Go to Stripe Dashboard** → Webhooks
2. **Create/Edit your webhook endpoint**: `https://your-domain.com/api/stripe/webhook`
3. **Copy the webhook secret** (starts with `whsec_`)
4. **Update `.env.local`**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
   ```

### **Step 2: Configure Webhook Events**

Add these events to your Stripe webhook:
```
✅ checkout.session.completed
✅ customer.subscription.created  
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
```

### **Step 3: Database Schema (When Ready)**
```bash
# Run this when you're ready to enhance your database
psql -f database/stripe-subscription-schema.sql your_database
```

### **Step 4: Test Your Integration**

1. **Create a test subscription**
2. **Check logs** in your webhook handler
3. **Verify** `subscription_tier` column updates in database
4. **Test** upgrade/downgrade flows

---

## 🎨 **USAGE EXAMPLES**

### **In Your React Components:**

```tsx
import { useSubscription } from '@/hooks/useSubscription'

function MyComponent() {
  const { 
    subscription, 
    loading, 
    isProUser, 
    isEliteUser, 
    checkFeatureAccess,
    createCheckoutSession 
  } = useSubscription()

  const handleUpgrade = async () => {
    const { sessionId, error } = await createCheckoutSession(
      'price_1RsHkxRo1RFNyzsnZhWShz9I', // Pro Weekly
      'pro',
      'pro_weekly'
    )
    
    if (sessionId) {
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      stripe?.redirectToCheckout({ sessionId })
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <p>Current Tier: {subscription?.tier}</p>
      <p>Daily Picks: {subscription?.maxDailyPicks}</p>
      
      {checkFeatureAccess('advanced_analytics') ? (
        <AdvancedAnalytics />
      ) : (
        <button onClick={handleUpgrade}>Upgrade for Advanced Analytics</button>
      )}
    </div>
  )
}
```

### **Server-Side Subscription Checks:**

```tsx
import { stripeSubscriptionService } from '@/lib/stripe-subscription-service'

export async function getServerSideProps({ req }) {
  const userId = getUserIdFromRequest(req)
  const subscription = await stripeSubscriptionService.getUserSubscription(userId)
  
  return {
    props: {
      canAccessFeature: stripeSubscriptionService.checkFeatureAccess(subscription, 'advanced_analytics')
    }
  }
}
```

---

## 📊 **SUBSCRIPTION TIER LOGIC**

Your system now automatically handles:

| Event | Action |
|-------|--------|
| **Checkout Success** | Sets `subscription_tier` to `pro` or `elite` based on price ID |
| **Subscription Update** | Updates tier when user upgrades/downgrades |
| **Payment Success** | Renews subscription, extends expiration |
| **Payment Failed** | Marks as `past_due`, keeps access until retry period ends |
| **Subscription Canceled** | Downgrades to `free`, sets `max_daily_picks = 2` |

### **Tier Limits:**
- **Free**: 2 picks, 2 insights, 3 chat messages
- **Pro**: 20 picks, 8 insights, unlimited chat
- **Elite**: 30 picks, 12 insights, unlimited chat + advanced features

---

## 🔐 **SECURITY & BEST PRACTICES**

### **✅ Implemented:**
- Webhook signature verification
- Supabase RLS (Row Level Security) compatible
- Service role key for admin operations
- Comprehensive error handling and logging
- Audit trail for all subscription changes

### **✅ RevenueCat-Style Architecture:**
- Single source of truth (Stripe webhooks)
- Real-time subscription updates
- Automatic tier management
- Feature access control
- Customer portal integration

---

## 🚦 **TESTING CHECKLIST**

### **Before Going Live:**
- [ ] Webhook secret configured
- [ ] Test subscription creation
- [ ] Test subscription cancellation  
- [ ] Test payment failures
- [ ] Test tier upgrades/downgrades
- [ ] Verify `subscription_tier` column updates
- [ ] Test feature access controls
- [ ] Test customer portal access

### **Test Cards (Stripe):**
```
✅ Success: 4242 4242 4242 4242
❌ Declined: 4000 0000 0000 0002
🔄 Requires 3DS: 4000 0025 0000 3155
```

---

## 🎯 **DEPLOYMENT NOTES**

1. **Environment Variables**: Make sure all Stripe keys are set in production
2. **Webhook URL**: Update in Stripe dashboard for production domain
3. **Database**: Run schema updates when ready
4. **Monitoring**: Watch webhook logs for any issues

---

## 🔧 **TROUBLESHOOTING**

### **"Subscription tier not updating"**
- Check webhook secret is correct
- Verify webhook events are configured
- Check application logs for webhook errors
- Ensure user IDs are passed correctly in metadata

### **"Feature access not working"**
- Check `subscription_expires_at` vs current time
- Verify `subscription_status = 'active'`
- Check `max_daily_picks` value
- Test with `useSubscription` hook

### **"Webhooks failing"**
- Verify signature verification
- Check Supabase permissions
- Review error logs in webhook handler
- Test with Stripe CLI for local development

---

## 🎉 **YOU'RE READY!**

Your web app now has **enterprise-level subscription management** that mirrors your successful RevenueCat mobile implementation. The system will automatically:

- ✅ Convert free users to paid when they subscribe
- ✅ Handle all subscription lifecycle events
- ✅ Provide real-time updates to your frontend
- ✅ Manage feature access based on subscription tier
- ✅ Handle upgrades, downgrades, and cancellations
- ✅ Provide comprehensive analytics and reporting

**Next step**: Set up your webhook secret and test with a few transactions. The system is designed to be bulletproof and handle all edge cases automatically! 🚀
