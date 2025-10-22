# ChatKit Custom API Mode Setup

## What Changed

Switched from **Hosted Mode** (OpenAI manages everything) to **Custom API Mode** (your Python server on Railway).

### Before (Hosted Mode)
```tsx
// Used getClientSecret() to create sessions with OpenAI
// OpenAI hosted the chat backend
// Limited control over agent behavior
```

### After (Custom API Mode)
```tsx
// Direct connection to https://pykit-production.up.railway.app/chatkit
// Your Python server controls everything
// Full control: widgets, tools, personality
```

## Configuration Required

### 1. Vercel Environment Variables

Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

```env
NEXT_PUBLIC_CHATKIT_SERVER_URL=https://pykit-production.up.railway.app/chatkit
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2
```

### 2. Railway Server Endpoints

Your Python server (`pykit/app.py`) now implements:

- **GET /chatkit** - Handshake/health check
- **OPTIONS /chatkit** - CORS preflight
- **POST /chatkit** - Main ChatKit event stream

All three are required for Custom API mode to work.

## How It Works

### Client → Server Flow

1. **Component Mounts**
   - `ProfessorLockCustom` initializes
   - Passes user context in headers: `X-User-Id`, `X-User-Tier`, etc.

2. **ChatKit Handshake**
   ```
   GET https://pykit-production.up.railway.app/chatkit
   → Server responds: { "status": "ok", "timestamp": "..." }
   ```

3. **User Sends Message**
   ```
   POST https://pykit-production.up.railway.app/chatkit
   Body: { type: "user_message", content: "Build me a parlay" }
   → Server streams back: assistant messages, widgets, tool outputs
   ```

4. **Widgets Display**
   - Your Python server calls `SportsWidgets.parlay_builder()`
   - Widget JSON streams to client
   - ChatKit renders interactive UI

## Key Benefits

✅ **Widgets Work Automatically** - Your Python server injects them  
✅ **Professor Lock Personality** - Full control in `pp_server.py`  
✅ **Custom Tools** - StatMuse, web search, odds lookup built-in  
✅ **Real-time Updates** - Widgets stream updates as data loads  
✅ **User Context** - Server receives tier, preferences via headers  

## Testing

After deploying with env vars set:

1. Open `/professor-lock`
2. Should see "⚡ Live" badge (green)
3. Network tab: `GET /chatkit → 200`, then `POST /chatkit → 200`
4. Railway logs: Requests hitting your server
5. Type a message → should get response with widgets!

## Troubleshooting

### UI is blank/disappears

**Check:**
- ✅ Vercel env vars are set correctly
- ✅ Railway server is running (`GET /chatkit` returns 200)
- ✅ No CORS errors in browser console
- ✅ Domain key matches your ChatKit allowlist

**Railway Logs Should Show:**
```
INFO: GET /chatkit 200 OK
INFO: OPTIONS /chatkit 204 No Content  
INFO: POST /chatkit 200 OK
```

### Network Errors

**Common Issues:**
- Domain key mismatch → Check OpenAI Dashboard allowlist
- CORS blocked → Server needs proper headers (already configured)
- Server offline → Check Railway deployment status

### Control Missing

If console shows "control: Missing":
- Check that both env vars are present
- Verify domain key is valid
- Reload page to reinitialize

## Files Modified

1. **pplayweb/components/professor-lock/ProfessorLockCustom.tsx**
   - Removed `getClientSecret` (hosted mode only)
   - Added `api: { url, domainKey, fetch }`
   - Simplified state management

2. **pykit/app.py**
   - Added `@app.get("/chatkit")` 
   - Added `@app.options("/chatkit")`
   - Already had `@app.post("/chatkit")`

## Next Steps

1. **Set Vercel env vars** (see above)
2. **Redeploy** Vercel (env changes require redeploy)
3. **Test** the connection
4. **Ask Professor Lock** to build you a parlay! 🎯

The UI will look identical to before - same dark theme, same ChatKit interface - but now powered by YOUR server with full widget support! 🚀

