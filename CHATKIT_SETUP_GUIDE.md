# ChatKit Setup Guide

## Quick Setup Checklist

### 1. Environment Variables (.env)
Make sure you have these in your `/web-app/.env` file:

```bash
# Required for ChatKit
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx  # Your OpenAI API key
OPENAI_WORKFLOW_ID=asst_xxxxxxxxxxxxx  # Your Agent Builder workflow ID
```

### 2. Test Your Configuration
Visit: `http://localhost:3000/api/chatkit/test`

You should see:
- ✅ API Key: Set
- ✅ Workflow ID: Set  
- ✅ API Test: Connected
- ✅ ChatKit: Working

### 3. Common Issues & Solutions

#### Issue: "Nothing happens when I type"
**Solution**: Check browser console for errors. Most likely:
- Missing or invalid OPENAI_API_KEY
- Incorrect OPENAI_WORKFLOW_ID
- Workflow not published in Agent Builder

#### Issue: "Failed to create session" 
**Solution**: 
1. Verify your workflow ID in OpenAI Agent Builder dashboard
2. Make sure workflow is published and active
3. Check that your API key has ChatKit beta access

#### Issue: "Unauthorized" error
**Solution**: User needs to be signed in via Supabase auth

## What We've Built

### ✅ Auto-Loading ChatKit
- No "Start session" button - loads automatically
- Shows loading state while initializing
- Graceful error handling with retry option

### ✅ Clean, Minimal UI
- Removed fake stats and misleading information
- Native ChatKit features preserved (resizing, etc.)
- Professional dark theme matching your brand

### ✅ Smart Features
- Tier-based prompts (Free/Pro/Elite)
- Custom placeholders per tier
- Debug mode in development (localhost only)

### ✅ Database Integration Ready
Created schema for persistent conversations:
- `chatkit_conversations` table
- User can have multiple chat sessions
- Tracks message count, last message, etc.

## Files Created/Modified

### New Components:
- `/components/professor-lock/ProfessorLockAutoLoad.tsx` - Main auto-loading component
- `/components/professor-lock/ProfessorLockSimple.tsx` - Simplified version
- `/components/professor-lock/ProfessorLockChatKitV2.tsx` - With conversation history

### API Routes:
- `/app/api/chatkit/session/route.ts` - Creates/retrieves ChatKit sessions
- `/app/api/chatkit/test/route.ts` - Tests configuration (dev only)

### Database:
- `/database/chatkit-conversations-schema.sql` - Schema for persistent chats

## Next Steps

### 1. Run the migration:
```sql
-- In Supabase SQL editor, run:
/database/chatkit-conversations-schema.sql
```

### 2. Get Your Workflow ID:
1. Go to [OpenAI Agent Builder](https://platform.openai.com/agent-builder)
2. Open your workflow
3. Copy the workflow ID (starts with `asst_`)

### 3. Set Environment Variables:
```bash
# In /web-app/.env
OPENAI_API_KEY=your_api_key_here
OPENAI_WORKFLOW_ID=your_workflow_id_here
```

### 4. Restart Dev Server:
```bash
npm run dev
```

### 5. Visit Professor Lock:
`http://localhost:3000/professor-lock`

## Features You Get:

1. **Auto-initialization** - No manual session start
2. **Native ChatKit features** - Resizing, markdown, code blocks
3. **Clean interface** - No distracting wrappers
4. **Error recovery** - Retry button on failures
5. **Debug mode** - See configuration status (localhost only)
6. **Tier support** - Different experiences for Free/Pro/Elite

## Customization Options

### Change Colors:
In `ProfessorLockAutoLoad.tsx`, modify:
```typescript
primary: isElite ? '#FFD700' : isPro ? '#00E5FF' : '#8B5CF6'
```

### Change Prompts:
Modify the `prompts` array in `startScreen` configuration

### Add Persistent Conversations:
Use `ProfessorLockChatKitV2.tsx` instead for conversation history (Pro/Elite only)

## Troubleshooting

### Check Configuration:
```bash
curl http://localhost:3000/api/chatkit/test
```

### View Console Logs:
Open browser DevTools > Console tab
Look for "ChatKit session created successfully" message

### Test Session Creation:
```bash
curl -X POST http://localhost:3000/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "tier": "free"}'
```

## Support

If ChatKit still doesn't work:
1. Check you have ChatKit beta access on your OpenAI account
2. Verify workflow is published in Agent Builder
3. Check browser console for specific error messages
4. Test with the debug endpoint: `/api/chatkit/test`
