/**
 * Enhanced ChatKit Component with Sports Betting Widgets
 */

import React, { useEffect, useRef, useState } from 'react';
import chatkit from '@openai/chatkit';
import { useChatkitWidgets } from '@/hooks/useChatkitWidgets';

interface ChatKitWithWidgetsProps {
  sessionId?: string;
  theme?: 'dark' | 'light';
}

export function ChatKitWithWidgets({ sessionId, theme = 'dark' }: ChatKitWithWidgetsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  
  const {
    activeWidgets,
    handleWidgetAction,
    showSearchProgress,
    showParlayBuilder,
    showOddsComparison,
    showPlayerCard,
    showBettingInsights
  } = useChatkitWidgets();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize ChatKit with custom configuration
    const initChatKit = async () => {
      try {
        // Create or get session
        let activeSessionId = currentSessionId;
        
        if (!activeSessionId) {
          const response = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              theme: theme,
              features: ['widgets', 'sports_betting']
            })
          });
          
          const { sessionId: newSessionId, clientSecret } = await response.json();
          activeSessionId = newSessionId;
          setCurrentSessionId(newSessionId);
          
          // Initialize ChatKit with session
          chatkit.mount({
            node: containerRef.current!,
            clientSecret
          });
        }

        // Configure ChatKit options with widget support
        chatkit.setOptions({
          theme: {
            mode: theme,
            colors: theme === 'dark' ? {
              primary: '#10B981',
              secondary: '#3B82F6',
              background: '#0f172a',
              surface: '#1E293B',
              text: '#ffffff',
              textSecondary: '#94A3B8'
            } : undefined
          },
          
          // Widget configuration
          widgets: {
            // Handle widget actions
            async onAction(action: any, item: any) {
              console.log('Widget action received:', action);
              
              try {
                const result = await handleWidgetAction(action, activeSessionId!);
                
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
                    setTimeout(() => {
                      // Clear search progress after completion
                      showSearchProgress('', 100);
                    }, 2000);
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
            },
            
            // Custom widget renderer
            renderWidget(widget: any) {
              // This allows custom rendering of widgets if needed
              console.log('Rendering widget:', widget);
              return widget;
            }
          },
          
          // Message handling
          messages: {
            // Intercept messages to detect widget patterns
            onMessage(message: any) {
              console.log('Message received:', message);
              
              // Check if message contains widget data
              if (message.widgets) {
                message.widgets.forEach((widget: any) => {
                  // Process each widget in the message
                  if (widget.type === 'search_progress') {
                    showSearchProgress(widget.search, widget.progress);
                  } else if (widget.type === 'parlay_builder') {
                    showParlayBuilder(widget.picks);
                  }
                  // ... handle other widget types
                });
              }
            }
          },
          
          // Custom commands
          commands: {
            '/parlay': {
              description: 'Build a parlay',
              handler: async (args: string) => {
                // Trigger parlay builder
                chatkit.sendMessage(`Build me a parlay with ${args || 'today\'s best picks'}`);
              }
            },
            '/odds': {
              description: 'Compare odds for a game',
              handler: async (args: string) => {
                chatkit.sendMessage(`Show me odds comparison for ${args}`);
              }
            },
            '/player': {
              description: 'View player stats and props',
              handler: async (args: string) => {
                chatkit.sendMessage(`Show me player card for ${args}`);
              }
            },
            '/insights': {
              description: 'Get betting insights',
              handler: async () => {
                chatkit.sendMessage('Give me your best betting insights for today');
              }
            }
          }
        });

        // Set ready state
        setIsReady(true);
        
        // Send initial greeting with widget examples
        setTimeout(() => {
          // Show initial search progress widget
          showSearchProgress('Loading today\'s best picks...', 30);
          
          // Simulate loading completion
          setTimeout(() => {
            showSearchProgress('Loading today\'s best picks...', 100);
            
            // Show sample insights after loading
            showBettingInsights([
              {
                icon: '🔥',
                title: 'Hot Streak Alert',
                description: 'Lakers have covered the spread in 7 of their last 8 games',
                confidence: 85
              },
              {
                icon: '💰',
                title: 'Value Pick',
                description: 'Knicks +4.5 showing strong value against tired Celtics team',
                confidence: 72
              },
              {
                icon: '⚡',
                title: 'Player Prop Edge',
                description: 'LeBron James Over 7.5 assists hitting 75% last 10 games',
                confidence: 78
              }
            ]);
          }, 2000);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to initialize ChatKit:', error);
      }
    };

    initChatKit();

    // Cleanup
    return () => {
      chatkit.unmount();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ChatKit Container */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000'
        }}
      />
      
      {/* Widget Display Area (optional - widgets can also appear inline) */}
      {activeWidgets.length > 0 && (
        <div className="p-4 border-t border-gray-800 bg-slate-900 space-y-4 max-h-96 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Active Widgets
          </h3>
          {activeWidgets.map((widget, index) => (
            <div key={index} className="widget-container">
              {/* Widgets will be rendered by ChatKit internally */}
              {/* This is just for debugging/preview */}
              <pre className="text-xs text-gray-500">
                {JSON.stringify(widget, null, 2).substring(0, 200)}...
              </pre>
            </div>
          ))}
        </div>
      )}
      
      {/* Status Bar */}
      <div className={`px-4 py-2 text-xs ${theme === 'dark' ? 'bg-slate-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <span>{isReady ? 'Professor Lock is ready' : 'Initializing...'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Commands: /parlay /odds /player /insights</span>
            <span>Session: {currentSessionId?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
