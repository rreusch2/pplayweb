# Authentication Best Practices - How Modern Platforms Do It

This document explains how leading platforms handle authentication and how we've implemented those same patterns.

---

## 🌟 Industry Standards

### 1. **Vercel & Next.js Apps**

**What they do:**
- Use middleware for server-side auth checks
- Client-side auth context for UI state
- Aggressive timeouts to prevent hanging
- Clear loading states with escape hatches
- Session stored in httpOnly cookies when possible

**What we implemented:**
```typescript
// Server-side protection (middleware.ts)
export async function middleware(req: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

// Client-side state (SimpleAuthContext.tsx)
const AUTH_INIT_TIMEOUT = 5000 // Never hang more than 5s
setTimeout(() => {
  if (initializing) {
    safeSetAuthState({ initializing: false })
  }
}, AUTH_INIT_TIMEOUT)
```

---

### 2. **Supabase Official Examples**

**What they recommend:**
- Single source of truth for session (getSession + listener)
- Prevent race conditions with initialization flags
- Handle SSR properly (return undefined on server)
- Use PKCE flow for security
- Don't call getSession repeatedly

**What we implemented:**
```typescript
// Single initialization
const hasInitializedRef = useRef(false)
if (hasInitializedRef.current) return
hasInitializedRef.current = true

// Get session once
const { data: { session } } = await supabase.auth.getSession()

// Then listen for changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle changes
})
```

---

### 3. **Stripe Dashboard**

**What they do:**
- Immediate feedback on auth errors
- "Something went wrong?" recovery UI
- Clear session data on critical errors
- Graceful degradation when storage unavailable
- Detailed error logging for support

**What we implemented:**
```typescript
// Recovery UI (LayoutWrapper.tsx)
{showErrorRecovery && (
  <div className="recovery-prompt">
    <p>Taking longer than expected?</p>
    <button onClick={handleRecovery}>
      Reset Session & Continue
    </button>
  </div>
)}

// Automatic error recovery
if (error.includes('timeout')) {
  clearAuthStorage()
}
```

---

### 4. **GitHub**

**What they do:**
- Comprehensive session diagnostics
- Clear error messages (not generic "Something went wrong")
- Multiple retry attempts for transient failures
- Export debugging data for support
- Proactive session refresh before expiry

**What we implemented:**
```typescript
// Diagnostics page (/auth-debug)
const diagnostics = await runAuthDiagnostics()
// Shows storage status, session validity, errors, recommendations

// Smart retries
const fetchUserProfile = async (userId, retryCount = 0) => {
  try {
    return await supabase.from('profiles').select()
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      await delay(1000 * (retryCount + 1))
      return fetchUserProfile(userId, retryCount + 1)
    }
  }
}
```

---

### 5. **Notion**

**What they do:**
- Optimistic UI updates (assume success, rollback on error)
- Background session refresh
- Clear distinction between initializing and loading
- Separate error types (network vs auth vs permission)
- localStorage with fallback to sessionStorage

**What we implemented:**
```typescript
interface AuthState {
  initializing: boolean // First-time setup
  loading: boolean      // Action in progress
  error: Error | null   // What went wrong
}

// Storage with fallback
const storage = (() => {
  try {
    return window.localStorage
  } catch {
    return undefined // Supabase handles in-memory fallback
  }
})()
```

---

### 6. **Firebase (Google)**

**What they do:**
- onAuthStateChanged as single source of truth
- Persistence levels (LOCAL, SESSION, NONE)
- Auto token refresh before expiry
- Clear documentation of auth flow
- Built-in retry logic with exponential backoff

**What we implemented:**
```typescript
// Similar pattern to Firebase
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
      // Update state
      break
    case 'SIGNED_OUT':
      // Clear state
      break
  }
})

// Auto refresh enabled
{ autoRefreshToken: true }
```

---

## 🎯 Key Patterns We Implemented

### 1. **Fail-Fast with Timeouts**

❌ **Anti-pattern:** Wait indefinitely for auth to resolve
```typescript
// BAD - can hang forever
await supabase.auth.getSession()
```

✅ **Best practice:** Timeout and fallback
```typescript
// GOOD - maximum 3 seconds
await Promise.race([
  supabase.auth.getSession(),
  timeout(3000)
])
```

---

### 2. **Single Initialization**

❌ **Anti-pattern:** Multiple overlapping initializations
```typescript
// BAD - runs every render
useEffect(() => {
  initAuth()
}, [router, pathname])
```

✅ **Best practice:** Initialize once
```typescript
// GOOD - ref prevents duplicates
const hasInitializedRef = useRef(false)
useEffect(() => {
  if (hasInitializedRef.current) return
  hasInitializedRef.current = true
  initAuth()
}, []) // Empty deps
```

---

### 3. **Graceful Degradation**

❌ **Anti-pattern:** Crash when storage unavailable
```typescript
// BAD - throws error
window.localStorage.setItem(key, value)
```

✅ **Best practice:** Handle gracefully
```typescript
// GOOD - wrapped with try-catch
try {
  window.localStorage.setItem(key, value)
} catch (error) {
  // Log and continue with in-memory
  console.warn('Storage unavailable')
}
```

---

### 4. **Clear Error Recovery**

❌ **Anti-pattern:** Leave users stuck with no recourse
```typescript
// BAD - just show error
if (error) return <div>Error occurred</div>
```

✅ **Best practice:** Offer recovery
```typescript
// GOOD - actionable error UI
if (error) {
  return (
    <div>
      <p>Auth error occurred</p>
      <button onClick={clearAndRetry}>
        Clear Session & Retry
      </button>
    </div>
  )
}
```

---

### 5. **Server + Client Protection**

❌ **Anti-pattern:** Client-side auth checks only
```typescript
// BAD - can be bypassed
function ProtectedPage() {
  const { user } = useAuth()
  if (!user) return <Redirect to="/" />
  return <SecretContent />
}
```

✅ **Best practice:** Server-side middleware
```typescript
// GOOD - blocked at server level
export async function middleware(req) {
  const session = await getSession(req)
  if (!session) {
    return redirect('/')
  }
}
```

---

### 6. **Comprehensive Logging**

❌ **Anti-pattern:** Silent failures
```typescript
// BAD - fails silently
try {
  await signIn()
} catch (error) {
  // nothing
}
```

✅ **Best practice:** Log everything
```typescript
// GOOD - detailed logging
try {
  console.log('[Auth] Starting sign in')
  await signIn()
  console.log('[Auth] Sign in successful')
} catch (error) {
  console.error('[Auth] Sign in failed:', error)
  throw error
}
```

---

## 📊 Performance Benchmarks

### Industry Standards
- **Auth initialization:** < 2 seconds
- **Session check:** < 500ms
- **Profile fetch:** < 1 second
- **Total time to interactive:** < 3 seconds

### Our Implementation
- **Auth initialization:** ~1-2 seconds (with 5s timeout)
- **Session check:** ~200-500ms
- **Profile fetch:** ~500ms-1s (with retry)
- **Total time to interactive:** ~2-3 seconds
- **Timeout protection:** 5 seconds maximum

---

## 🔒 Security Best Practices

### 1. **PKCE Flow**
```typescript
{ flowType: 'pkce' } // Prevents CSRF attacks
```

### 2. **No Session in URL**
```typescript
{ detectSessionInUrl: false } // Prevents token leakage
```

### 3. **HttpOnly Cookies (Future)**
Consider upgrading to cookie-based sessions:
```typescript
// Even more secure than localStorage
createServerClient(url, key, {
  cookies: {
    get: (name) => cookies().get(name),
    set: (name, value, options) => cookies().set(name, value, options),
  }
})
```

### 4. **Token Rotation**
```typescript
{ autoRefreshToken: true } // Refresh before expiry
```

---

## 🎨 UX Best Practices

### 1. **Loading States**
```typescript
// Three distinct states
initializing: boolean  // First load
loading: boolean       // Action in progress
error: Error | null    // Something failed
```

### 2. **Error Messages**
```typescript
// Specific, actionable errors
✅ "Session expired. Please sign in again."
✅ "localStorage unavailable. Disable private mode."
❌ "Something went wrong."
❌ "Error 401"
```

### 3. **Recovery Options**
```typescript
// Always offer next steps
<button onClick={retry}>Try Again</button>
<button onClick={clearAndReset}>Reset Session</button>
<a href="/auth-debug">Diagnose Issue</a>
```

---

## 📈 Monitoring & Observability

### What to Track

1. **Auth Success Rate**
   - Sign in success %
   - Session refresh success %
   
2. **Performance Metrics**
   - Time to auth ready
   - Profile fetch time
   
3. **Error Patterns**
   - localStorage unavailable rate
   - Timeout frequency
   - Network failures

4. **User Actions**
   - Recovery button clicks
   - Auth debug page visits
   - Session clears

### Implementation

```typescript
// Example tracking
console.log('[Auth] Initialization time:', Date.now() - startTime, 'ms')

// Send to analytics
analytics.track('auth_initialization', {
  duration_ms: Date.now() - startTime,
  had_session: !!session,
  storage_available: isStorageAvailable()
})
```

---

## 🌐 Cross-Platform Consistency

### Web vs Mobile

| Feature | Mobile (RN) | Web (Next.js) |
|---------|-------------|---------------|
| Storage | AsyncStorage | localStorage |
| Session | In-memory + storage | localStorage + cookies |
| Protection | Navigation guards | Middleware |
| Refresh | onAppStateChange | Page visibility |
| Offline | Queue requests | Service worker |

### Our Approach
We mimic the mobile app's patterns on web for consistency:
- Similar profile fetching logic
- Same error handling approach
- Matching user experience
- Unified API client

---

## ✅ Checklist: Auth Done Right

- [x] Server-side route protection (middleware)
- [x] Client-side state management (context)
- [x] Timeout protection (no infinite waits)
- [x] Clear error states with recovery
- [x] Storage error handling
- [x] Retry logic for transient failures
- [x] Comprehensive logging
- [x] User-facing diagnostics
- [x] Session persistence
- [x] Auto token refresh
- [x] PKCE flow for security
- [x] SSR compatibility
- [x] Race condition prevention
- [x] Graceful degradation
- [x] Documentation

---

## 🚀 Future Improvements

### Considerations for v3

1. **Cookie-based sessions** (more secure)
2. **Service worker** for offline support
3. **Biometric auth** (WebAuthn)
4. **MFA support**
5. **Session analytics dashboard**
6. **A/B test auth flows**
7. **Social auth providers**
8. **Magic link sign in**

---

## 📚 References

- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth/server-side)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [OWASP Auth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Web.dev: Sign-in Form Best Practices](https://web.dev/sign-in-form-best-practices/)

---

**Last Updated:** January 2025  
**Maintained by:** Predictive Play Team

