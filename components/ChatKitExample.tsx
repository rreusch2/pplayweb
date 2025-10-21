'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

interface ChatKitExampleProps {
  className?: string;
}

export function ChatKitExample({ className = "h-[600px] w-[400px]" }: ChatKitExampleProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        try {
          // If we have an existing session, try to refresh it
          if (existing) {
            console.log('Refreshing existing ChatKit session...');
          }

          // Get client secret from your backend
          const response = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: getDeviceId(),
              userId: getUserId(), // Optional: get from your auth system
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to get client secret: ${response.status}`);
          }

          const { client_secret } = await response.json();
          console.log('✅ ChatKit session created successfully');
          
          setIsLoading(false);
          setError(null);
          
          return client_secret;
        } catch (err) {
          console.error('❌ ChatKit session error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize ChatKit');
          setIsLoading(false);
          throw err;
        }
      },
    },
    // ChatKit customization options
    theme: {
      colorScheme: "dark",
      color: { 
        accent: { 
          primary: "#168aa2", // Your ParleyApp accent color
          level: 2 
        }
      },
      radius: "pill", // Rounded corners for sports betting feel
      density: "compact",
      typography: { fontFamily: "'Inter', sans-serif" },
    },
    composer: {
      placeholder: "Ask about your sports picks, parlays, or betting strategy...",
    },
    startScreen: {
      greeting: "Welcome to Professor Lock! 🎯",
      prompts: [
        { 
          label: "Analyze Today's Games", 
          prompt: "What are the best betting opportunities for today's games?"
        },
        { 
          label: "Build a Parlay", 
          prompt: "Help me build a smart 3-leg parlay with your latest predictions"
        },
        { 
          label: "Player Props Analysis", 
          prompt: "Show me your highest confidence player props for tonight"
        },
      ],
    },
  });

  // Simple device ID generation (you can use a more sophisticated method)
  function getDeviceId(): string {
    let deviceId = localStorage.getItem('chatkit_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatkit_device_id', deviceId);
    }
    return deviceId;
  }

  // Get user ID from your auth system (replace with your actual auth)
  function getUserId(): string | undefined {
    // TODO: Replace with your actual user authentication
    // return authUser?.id;
    return undefined;
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border`}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️ ChatKit Error</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Initializing Professor Lock...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatkit-container">
      <ChatKit 
        control={control} 
        className={className}
      />
    </div>
  );
}
