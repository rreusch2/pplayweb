# ChatKit Web Component Implementation for Custom Backend

## The Problem We Solved

ChatKit has **two different integration modes**:

### 1. Hosted Mode (OpenAI-managed backend)
- Uses: `useChatKit()` + `<ChatKit>` React components
- Requires: `getClientSecret()` function
- Backend: OpenAI-hosted

### 2. Custom Backend Mode (Self-hosted)
- Uses: `<openai-chatkit>` Web Component
- Requires: `api-url` attribute pointing to your server
- Backend: Your own Python/Node server

**We were trying to use Hosted Mode APIs with a Custom Backend**, which doesn't work!

## The Solution

For custom backends (like our Railway Python server), we must use the **Web Component** approach:

### Code Structure

```tsx
"use client"

import { useEffect, useState, useRef } from 'react'

// 1. Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'api-url'?: string
        theme?: string
        ref?: React.Ref<HTMLElement>
      }, HTMLElement>
    }
  }
}

export default function ProfessorLockCustom() {
  const chatkitRef = useRef<HTMLElement>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // 2. Load the ChatKit script from CDN
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.async = true
    script.onload = () => setIsScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  // 3. Configure the Web Component after it loads
  useEffect(() => {
    if (!isScriptLoaded || !chatkitRef.current) return

    const element = chatkitRef.current as any

    // Configure custom fetch for headers
    element.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = {
        ...init?.headers,
        'X-User-Id': user?.id || '',
        'X-User-Email': user?.email || '',
        'X-User-Tier': profile?.subscription_tier || 'free',
      }
      return globalThis.fetch(input, { ...init, headers })
    }

    // Configure UI elements
    element.composer = {
      placeholder: "Ask me anything..."
    }

    element.newThreadView = {
      greeting: "Welcome!",
      prompts: [
        { label: "Help", prompt: "How can you help me?", icon: 'star' }
      ]
    }

    // Set up event listeners
    element.addEventListener('chatkit.error', (e: CustomEvent) => {
      console.error('ChatKit error:', e.detail.error)
    })

    element.addEventListener('chatkit.response.start', () => {
      console.log('Response started')
    })
  }, [isScriptLoaded, user, profile])

  // 4. Render the Web Component
  return (
    <openai-chatkit
      ref={chatkitRef}
      api-url="https://your-server.com/chatkit"
      theme="dark"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
```

## Key Differences

| Aspect | Hosted Mode | Custom Backend Mode |
|--------|-------------|---------------------|
| Component | `<ChatKit control={control} />` | `<openai-chatkit api-url="..." />` |
| Hook | `useChatKit(options)` | N/A (direct Web Component) |
| Script | From npm package | From CDN |
| Config | Via `useChatKit()` options | Via element properties |
| Auth | `getClientSecret()` | Custom headers via `fetch` override |
| Events | Via options (`onError`, etc.) | Via DOM event listeners |

## Configuration Options

### Via Element Properties (after mount)

```ts
const element = chatkitRef.current as any

// Custom fetch with auth headers
element.fetch = (input, init) => {
  return globalThis.fetch(input, {
    ...init,
    headers: { ...init?.headers, 'X-User-Id': userId }
  })
}

// Composer configuration
element.composer = {
  placeholder: "Message...",
  attachments: true
}

// Start screen
element.newThreadView = {
  greeting: "Welcome!",
  prompts: [
    { label: "Question", prompt: "...", icon: 'star' }
  ]
}

// Theme
element.theme = 'dark'
```

### Via HTML Attributes

```tsx
<openai-chatkit
  api-url="https://your-server.com/chatkit"
  theme="dark"
  initial-thread="thread-123"
/>
```

## Event Handling

```ts
// Error events
element.addEventListener('chatkit.error', (e: CustomEvent) => {
  console.error('Error:', e.detail.error)
})

// Response lifecycle
element.addEventListener('chatkit.response.start', () => {
  console.log('Response started')
})

element.addEventListener('chatkit.response.end', () => {
  console.log('Response ended')
})

// Thread changes
element.addEventListener('chatkit.thread.change', (e: CustomEvent) => {
  console.log('Thread changed:', e.detail.threadId)
})

// Debug logs
element.addEventListener('chatkit.log', (e: CustomEvent) => {
  console.log('ChatKit log:', e.detail.name, e.detail.data)
})
```

## Custom Backend Requirements

Your backend server must implement the ChatKit protocol:

```python
from openai_chatkit import ChatKitServer

class MyChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        # Your logic here
        yield event
```

Expose via FastAPI/Flask:

```python
@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    result = await server.process(await request.body(), {})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

## Why This Works

1. **Web Component is designed for custom backends** - It expects an `api-url` and makes HTTP requests directly to it
2. **React SDK is for hosted backends** - It expects OpenAI's authentication flow via `getClientSecret()`
3. **Script from CDN** - The Web Component implementation is in the CDN script, not the npm package
4. **Direct configuration** - Properties are set directly on the DOM element, not via React props

## Testing

After deploying, you should see in the console:

```
📦 Loading ChatKit script from CDN...
✅ ChatKit script loaded successfully
⚙️ Configuring ChatKit Web Component
🌐 ChatKit fetch: https://pykit-production.up.railway.app/chatkit
✅ ChatKit Web Component configured
```

And the ChatKit UI should render with your custom greeting and prompts!

## References

- [ChatKit Custom Backend Guide](https://github.com/openai/chatkit-python/blob/main/docs/server.md)
- [ChatKit Web Component Docs](https://openai.github.io/chatkit-js/)
- [Options Reference](https://platform.openai.com/docs/guides/chatkit/advanced-integrations)

