# Build Fix - TypeScript Error

## Issue
Build failed with TypeScript error:
```
Type error: Expected 1 arguments, but got 0.
const initTimeoutRef = useRef<NodeJS.Timeout>()
```

## Root Cause
`useRef` in React TypeScript requires an initial value when called. The hooks were declared without initial values:
```typescript
const initTimeoutRef = useRef<NodeJS.Timeout>()
const profileFetchRef = useRef<Promise<UserProfile | null>>()
```

## Fix Applied
Updated to include `undefined` as initial value and in the type:
```typescript
const initTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
const profileFetchRef = useRef<Promise<UserProfile | null> | undefined>(undefined)
```

## File Changed
- `contexts/SimpleAuthContext.tsx` (lines 43-44)

## Status
✅ Fixed - Should build successfully now

## Why This Works
- `useRef<T>()` requires an initial value in TypeScript
- `useRef<T | undefined>(undefined)` is the correct pattern for optional refs
- The code already had null checks (`if (profileFetchRef.current)`) so no logic changes needed

## Next Steps
Push this fix and the build should succeed on Vercel! 🚀

