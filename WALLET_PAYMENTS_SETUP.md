# Wallet Payment Methods Integration

This document outlines the wallet payment methods now integrated into your ParleyApp Stripe checkout.

## Supported Payment Methods

### ✅ **Cash App Pay**
- **Requirements**: USD currency only
- **Business Location**: US only
- **Supported Modes**: Payment, Setup, Subscription
- **Test Mode**: Available with test payment page

### ✅ **Apple Pay**
- **Requirements**: Safari browser or iOS device
- **Business Location**: Worldwide (except India)
- **Supported Modes**: Payment, Setup, Subscription
- **Auto-enabled**: Via `automatic_payment_methods.enabled: true`

### ✅ **PayPal**
- **Requirements**: No specific requirements
- **Business Location**: Worldwide
- **Supported Currencies**: EUR, GBP, USD, CHF, CZK, DKK, NOK, PLN, SEK, AUD, CAD, HKD, NZD, SGD
- **Supported Modes**: Payment, Subscription
- **Refund Window**: 180 days

### ✅ **Link**
- **Requirements**: No specific requirements
- **Business Location**: Worldwide (except India)
- **Supported Modes**: Payment, Setup, Subscription
- **Auto-enabled**: Via `automatic_payment_methods.enabled: true`

### ✅ **US Bank Account (ACH)**
- **Requirements**: USD currency, US business location
- **Supported Modes**: Payment, Setup, Subscription
- **Settlement**: 4-7 business days

## Implementation Details

### Checkout Session Configuration

```typescript
payment_method_types: ['card', 'cashapp', 'us_bank_account', 'link', 'paypal']
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'always'
}
```

### Key Features

1. **Automatic Payment Method Detection**: Stripe automatically shows relevant payment methods based on:
   - Customer location
   - Currency
   - Device capabilities
   - Browser support

2. **Smart Redirects**: `allow_redirects: 'always'` enables redirect-based payment methods like PayPal

3. **Universal Support**: Works for both one-time payments and subscriptions

## Testing

### Test Mode Behavior

- **Cash App Pay**: Shows test payment approval/decline page
- **Apple Pay**: Works with test cards saved in Apple Wallet
- **PayPal**: Redirects to PayPal sandbox environment
- **Link**: Works with test payment methods
- **US Bank Account**: Uses test routing/account numbers

### Test Cards for Apple Pay

You must use real credit card numbers with test API keys. Stripe recognizes the test environment and creates test tokens without charging the card.

## Stripe Dashboard Configuration

### Required Settings

1. **Enable Payment Methods**:
   - Go to Settings → Payment methods
   - Enable: Cash App Pay, Apple Pay, PayPal, Link, ACH Direct Debit

2. **Apple Pay Domain Verification**:
   - Add your domain to Apple Pay settings
   - Download and host the domain verification file

3. **PayPal Configuration**:
   - Connect your PayPal account in Stripe Dashboard
   - Configure settlement preferences (Stripe vs PayPal balance)

## Currency Requirements

- **Cash App Pay**: USD only
- **US Bank Account**: USD only
- **Apple Pay**: All supported Stripe currencies
- **PayPal**: EUR, GBP, USD, CHF, CZK, DKK, NOK, PLN, SEK, AUD, CAD, HKD, NZD, SGD
- **Link**: All supported Stripe currencies

## Error Handling

The integration includes automatic fallbacks:
- If a payment method isn't available, it won't be shown
- Stripe handles compatibility checks automatically
- Users see only payment methods they can actually use

## Security

- All payment methods use Stripe's secure tokenization
- No sensitive payment data touches your servers
- PCI compliance maintained through Stripe

## Next Steps

1. **Test Integration**: Use Stripe test mode to verify all payment methods
2. **Enable in Dashboard**: Activate payment methods in your Stripe Dashboard
3. **Domain Verification**: Complete Apple Pay domain verification
4. **Go Live**: Switch to live keys when ready for production

## Support

- Cash App Pay disputes: Handle through Stripe Dashboard
- PayPal disputes: May require PayPal Dashboard for some cases
- Apple Pay issues: Usually certificate/domain verification related
- Link issues: Contact Stripe support
