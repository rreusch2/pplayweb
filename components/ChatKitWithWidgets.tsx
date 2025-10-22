'use client';

/**
 * Enhanced ChatKit Component with Sports Betting Widgets
 */

import React, { useEffect, useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useChatkitWidgets } from '@/hooks/useChatkitWidgets';

interface ChatKitWithWidgetsProps {
  className?: string;
  theme?: 'dark' | 'light';
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

export function ChatKitWithWidgets({ 
  className = "h-[600px] w-full",
  theme = 'dark',
  onSessionStart,
  onSessionEnd 
}: ChatKitWithWidgetsProps) {
  const { user, profile, session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    activeWidgets,
    handleWidgetAction,
    showSearchProgress,
    showParlayBuilder,
    showOddsComparison,
    showPlayerCard,
    showBettingInsights
  } = useChatkitWidgets();

  // Enhanced ChatKit configuration with widget support
  const options = {
    api: {
      async getClientSecret(existing: any) {
        try {
          if (existing) {
            console.log('Refreshing ChatKit session...');
          }

          const token = session?.access_token;
          
          if (!token) {
            throw new Error('No access token available');
          }
          
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              theme: theme,
              features: ['widgets', 'sports_betting']
            })
          });

          if (!res.ok) {
            throw new Error('Failed to get ChatKit session');
          }

          const { client_secret } = await res.json();
          onSessionStart?.();
          return client_secret;
        } catch (error) {
          console.error('ChatKit session error:', error);
          setError('Failed to connect to Professor Lock');
          throw error;
        }
      },
    },
    theme: {
      colorScheme: 'dark' as const,
      radius: 'pill' as const,
      density: 'normal' as const,
      color: {
        grayscale: {
          hue: 0,
          tint: 0 as const
        },
        accent: {
          primary: '#10B981', // Updated to green for sports betting theme
          level: 1 as const
        },
        surface: {
          background: '#0f172a',
          foreground: '#1E293B'
        }
      },
      typography: {
        baseSize: 16 as const,
        fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      }
    },
    composer: {
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760 // 10MB
      },
      placeholder: "Ask about games, odds, injuries, or build a parlay...",
      tools: [
        {
          id: 'parlay_builder',
          label: '🎯 Build Parlay',
          icon: 'sparkle',
          shortLabel: 'Parlay',
          placeholderOverride: 'Describe the picks you want to combine',
          pinned: true
        },
        {
          id: 'odds_lookup',
          label: '📊 Find Odds',
          icon: 'search',
          shortLabel: 'Odds',
          placeholderOverride: 'Which game or bet are you looking for?',
          pinned: true
        },
        {
          id: 'player_stats',
          label: '🏀 Player Stats',
          icon: 'profile-card',
          shortLabel: 'Stats',
          placeholderOverride: 'Which players are you interested in?',
          pinned: true
        },
        {
          id: 'insights',
          label: '💡 Get Insights',
          icon: 'lightbulb',
          shortLabel: 'Insights',
          placeholderOverride: 'What insights do you need?',
          pinned: false
        }
      ],
    },
    startScreen: {
      greeting: 'Let\'s find some winning picks! 💰',
      prompts: [
        {
          icon: 'star-filled',
          label: 'What are today\'s best bets?',
          prompt: 'Analyze today\'s games and give me your top 3 confident picks with reasoning',
        },
        {
          icon: 'plus',
          label: 'Build me a smart parlay',
          prompt: 'Build me a 3-leg parlay with good value and reasonable risk for tonight',
        },
        {
          icon: 'bolt',
          label: 'Show me hot player props',
          prompt: 'Which player props offer the best value tonight? Show me the data',
        },
        {
          icon: 'chart',
          label: 'Compare odds for a game',
          prompt: 'Show me odds comparison across sportsbooks for tonight\'s featured game',
        }
      ],
    },
    // Widget handling configuration
    widgets: {
      async onAction(action: any, item: any) {
        console.log('Widget action received:', action);
        
        try {
          const result = await handleWidgetAction(action, 'current-session');
          
          // Handle specific widget action responses
          switch (action.type) {
            case 'search_started':
              showSearchProgress(action.query || 'Searching for best picks...', 10);
              break;
              
            case 'search_progress':
              showSearchProgress(action.query, action.progress || 50);
              break;
              
            case 'search_complete':
              showSearchProgress(action.query, 100);
              setTimeout(() => showSearchProgress('', 100), 2000);
              break;
              
            case 'show_parlay':
              showParlayBuilder(action.picks || []);
              break;
              
            case 'show_odds':
              showOddsComparison(action.game);
              break;
              
            case 'show_player':
              showPlayerCard(action.player);
              break;
              
            case 'show_insights':
              showBettingInsights(action.insights || []);
              break;
          }
          
          return result;
        } catch (error) {
          console.error('Failed to handle widget action:', error);
        }
      }
    }
  } as any;

  const { control } = useChatKit(options);

  useEffect(() => {
    // Load ChatKit script
    if (!document.querySelector('script[src*="chatkit.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        // Show initial demo widgets after load
        setTimeout(() => {
          showBettingInsights([
            {
              icon: '🔥',
              title: 'Widget System Ready',
              description: 'Advanced sports betting widgets are now active and ready to use',
              confidence: 100
            }
          ]);
        }, 1000);
      };
      script.onerror = () => {
        setError('Failed to load ChatKit');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
    }

    return () => {
      onSessionEnd?.();
    };
  }, [onSessionEnd, showBettingInsights]);

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-lg text-slate-300">Please log in to use Professor Lock with Widgets</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock with Widgets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="mb-4 text-lg text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main ChatKit Component */}
      <div className="flex-1 chatkit-container rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
        <ChatKit control={control} className={className} />
      </div>
      
      {/* Widget Status Bar */}
      <div className="px-4 py-2 text-xs bg-slate-800 text-gray-400 rounded-b-2xl border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Sports Betting Widgets Active</span>
            <span className="text-green-400">({activeWidgets.length} widgets loaded)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tools: Parlay Builder • Odds Lookup • Player Stats • Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
