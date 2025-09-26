# Wallet Payment Methods Testing Guide

## Pre-Testing Setup

### 1. Stripe Dashboard Configuration
- [ ] Enable Cash App Pay in Payment methods settings
- [ ] Enable PayPal and connect PayPal account
- [ ] Enable Link in Payment methods settings
- [ ] Enable ACH Direct Debit for US Bank Account
- [ ] Apple Pay will auto-enable via automatic_payment_methods

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Each Payment Method

### 🟢 **Cash App Pay Testing**

**Requirements:**
- USD currency only
- US business location

**Test Steps:**
1. Create checkout session with USD pricing
2. Select Cash App Pay at checkout
3. Should redirect to test approval page
4. Click "Approve" or "Decline" to test both flows

**Expected Behavior:**
- Shows "Cash App Pay" option in checkout
- Redirects to test payment page (not real Cash App)
- Returns success/failure based on test selection

### 🍎 **Apple Pay Testing**

**Requirements:**
- Safari browser or iOS device
- Test cards saved in Apple Wallet

**Test Steps:**
1. Use Safari browser or iOS device
2. Add test credit cards to Apple Wallet
3. Create checkout session
4. Apple Pay button should appear automatically
5. Touch ID/Face ID authentication

**Expected Behavior:**
- Apple Pay button appears on compatible devices
- Shows saved test cards from Apple Wallet
- Completes payment with biometric authentication

**Troubleshooting:**
- If Apple Pay doesn't appear, check domain verification
- Ensure you're using Safari or iOS device
- Verify test cards are saved in Apple Wallet

### 💙 **PayPal Testing**

**Requirements:**
- PayPal sandbox account
- Connected to Stripe Dashboard

**Test Steps:**
1. Create checkout session
2. Select PayPal option
3. Redirects to PayPal sandbox
4. Login with test PayPal account
5. Approve payment

**Expected Behavior:**
- PayPal option appears in checkout
- Redirects to sandbox.paypal.com
- Returns to success URL after approval

**Test PayPal Accounts:**
- Buyer: sb-buyer@personal.example.com
- Password: (use PayPal sandbox credentials)

### 🔗 **Link Testing**

**Requirements:**
- No special requirements
- Works with any test payment method

**Test Steps:**
1. Create checkout session
2. Link option should appear automatically
3. Enter test email address
4. Add test payment method to Link
5. Complete payment

**Expected Behavior:**
- Link option appears in checkout
- Saves payment method for future use
- Faster checkout on subsequent purchases

### 🏦 **US Bank Account (ACH) Testing**

**Requirements:**
- USD currency only
- US business location

**Test Steps:**
1. Create checkout session with USD pricing
2. Select "Bank account" option
3. Enter test routing/account numbers
4. Verify micro-deposits (instant in test mode)

**Test Bank Details:**
- Routing: 110000000
- Account: 000123456789
- Account Type: Checking

**Expected Behavior:**
- Bank account option appears
- Accepts test routing/account numbers
- Instant verification in test mode

## Test Scenarios

### Scenario 1: Subscription Purchase
```javascript
// Test with recurring subscription
const sessionId = await createCheckoutSession(
  'price_1234567890', // Monthly subscription price
  'user_123',
  'http://localhost:3000/success',
  'http://localhost:3000/cancel'
)
```

### Scenario 2: One-Time Payment
```javascript
// Test with lifetime/daypass purchase
const sessionId = await createCheckoutSession(
  'price_lifetime_123', // Lifetime price
  'user_123',
  'http://localhost:3000/success',
  'http://localhost:3000/cancel'
)
```

### Scenario 3: Different Currencies
```javascript
// Test PayPal with EUR (if you have EUR prices)
// Cash App Pay and US Bank Account will be hidden for non-USD
```

## Verification Checklist

### ✅ Payment Method Visibility
- [ ] Cash App Pay appears for USD transactions
- [ ] Apple Pay appears on Safari/iOS devices
- [ ] PayPal appears for supported currencies
- [ ] Link appears automatically
- [ ] US Bank Account appears for USD transactions
- [ ] Credit cards always available as fallback

### ✅ Payment Flow Testing
- [ ] Cash App Pay test approval/decline works
- [ ] Apple Pay completes with Touch/Face ID
- [ ] PayPal redirects and returns correctly
- [ ] Link saves payment methods
- [ ] US Bank Account accepts test details
- [ ] All methods redirect to success URL

### ✅ Error Handling
- [ ] Unsupported currencies hide relevant methods
- [ ] Failed payments show appropriate errors
- [ ] Network issues handled gracefully
- [ ] User can retry with different payment method

### ✅ Webhook Processing
- [ ] Successful payments trigger webhooks
- [ ] User subscription status updates correctly
- [ ] Failed payments handled appropriately
- [ ] Refunds process correctly

## Common Issues & Solutions

### Apple Pay Not Showing
- **Issue**: Apple Pay button doesn't appear
- **Solution**: Verify domain in Stripe Dashboard → Apple Pay settings
- **Check**: Using Safari or iOS device

### PayPal Connection Error
- **Issue**: PayPal option not available
- **Solution**: Connect PayPal account in Stripe Dashboard
- **Check**: PayPal account is in sandbox mode for testing

### Cash App Pay Unavailable
- **Issue**: Cash App Pay not showing
- **Solution**: Ensure USD currency and US business location
- **Check**: Stripe Dashboard has Cash App Pay enabled

### Link Not Saving
- **Issue**: Link not remembering payment methods
- **Solution**: Ensure customer email is provided
- **Check**: Link is enabled in Stripe Dashboard

## Production Checklist

Before going live:
- [ ] Switch to live Stripe keys
- [ ] Enable payment methods in live Stripe Dashboard
- [ ] Complete Apple Pay domain verification for production domain
- [ ] Connect live PayPal account (not sandbox)
- [ ] Test with real payment methods in small amounts
- [ ] Monitor webhook processing in production
- [ ] Set up proper error logging and monitoring

## Monitoring & Analytics

Track these metrics:
- Payment method usage distribution
- Conversion rates by payment method
- Failed payment rates by method
- Customer preference patterns
- Geographic usage patterns

Use Stripe Dashboard analytics to monitor:
- Payment success rates
- Popular payment methods
- Revenue by payment method
- Customer retention by payment method
