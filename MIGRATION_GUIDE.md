# Migration Guide: Direct Supabase Architecture

## Overview
We're migrating from the overcomplicated Railway backend architecture to a simple, direct Supabase approach that mirrors your mobile app.

## What Changed

### Before (Overcomplicated)
- Web app → Railway Backend → Supabase
- Rate limiting issues
- Duplicate requests
- Complex auth loops
- Unnecessary API calls

### After (Simple - Like Mobile)
- Web app → Supabase (Direct)
- No rate limiting
- Single source of truth
- Clean auth flow
- Fast and reliable

## Architecture Changes

### 1. Authentication
**Old:** `contexts/AuthContext.tsx` - Calls Railway backend for profiles
**New:** `contexts/SimpleAuthContext.tsx` - Direct Supabase queries

### 2. Predictions
**Old:** `shared/services/aiService.ts` - Calls Railway backend API
**New:** `services/directPredictionService.ts` - Direct Supabase queries

### 3. Subscription Logic
**Old:** Complex backend API calls to determine tiers
**New:** Simple `subscription_tier` column check in profiles table

## Migration Steps

### Step 1: Update Layout Provider
Replace in `app/layout.tsx`:
```tsx
// Old
import { AuthProvider } from '@/contexts/AuthContext'

// New  
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'

// Update the provider
<SimpleAuthProvider>
  {/* Your app */}
</SimpleAuthProvider>
```

### Step 2: Update Components Using Auth
Replace in all components:
```tsx
// Old
import { useAuth } from '@/contexts/AuthContext'

// New
import { useAuth } from '@/contexts/SimpleAuthContext'
```

### Step 3: Update Prediction Hooks
Replace in components using predictions:
```tsx
// Old
import { usePredictions } from '@/shared/hooks/usePredictions'

// New
import { useDirectPredictions } from '@/hooks/useDirectPredictions'
```

### Step 4: Update Prediction Service Calls
```tsx
// Old - Complex with Railway backend
const predictions = await aiService.getTodaysPredictions(userId, tier)

// New - Direct Supabase
const predictions = await predictionService.getPredictions(userId, tier)
```

## Tier Logic (Same as Mobile)

### Free Tier
- 2 daily picks (most recent from ai_predictions)
- Welcome bonus: 5 picks for 24 hours
- Basic UI

### Pro Tier  
- 20 daily picks
- Advanced filters
- High confidence picks
- Better UI

### Elite Tier
- 30 daily picks (15 team, 15 props)
- Custom preferences
- Pick distribution
- Premium UI features

## Benefits of New Architecture

1. **No Rate Limiting** - Direct Supabase queries have much higher limits
2. **Faster** - No middleman backend hop
3. **Simpler** - Same architecture as mobile app
4. **Reliable** - No Railway backend to maintain
5. **Cost Effective** - Less infrastructure to manage

## Environment Variables
You can remove these Railway-related variables:
- `NEXT_PUBLIC_BACKEND_URL`
- Any Railway API keys

Keep only:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing
1. Sign out and sign in - Should be instant
2. Check predictions - Should load immediately
3. No more 429 errors!

## Notes
- RevenueCat integration can be added later if needed for web payments
- The Railway backend can still be used for special operations if needed
- This matches your mobile app architecture exactly
