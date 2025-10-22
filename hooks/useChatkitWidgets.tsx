/**
 * Custom hook for ChatKit sports betting widgets
 */

import { useState, useCallback } from 'react';
import { WidgetService } from '@/services/chatkit/widgetService';

interface WidgetConfig {
  type: string;
  params: any;
}

export function useChatkitWidgets() {
  const [activeWidgets, setActiveWidgets] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle widget actions from ChatKit
   */
  const handleWidgetAction = useCallback(async (action: any, sessionId: string) => {
    try {
      // Try to include Supabase access token for authenticated actions
      let token: string | undefined
      if (typeof window !== 'undefined') {
        try {
          const keyPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
          const authRaw = window.localStorage.getItem(`sb-${keyPrefix}-auth-token`)
          const authObj = authRaw ? JSON.parse(authRaw) : null
          token = authObj?.access_token
        } catch (e) {
          // Ignore token parse errors; proceed unauthenticated
        }
      }

      const response = await fetch('/api/chatkit/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, sessionId })
      });

      if (!response.ok) {
        throw new Error('Widget action failed');
      }

      const result = await response.json();
      
      // Update local state based on action type
      switch (action.type) {
        case 'toggle_parlay_pick':
          // Update parlay builder widget
          await updateWidget('parlay_builder', sessionId);
          break;
        
        case 'place_parlay':
          // Show success notification
          console.log('Parlay placed:', result);
          break;
        
        case 'select_prop':
          // Update player card widget
          console.log('Prop selected:', result.prop);
          break;
      }
      
      return result;
    } catch (error) {
      console.error('Widget action error:', error);
      throw error;
    }
  }, []);

  /**
   * Create a new widget
   */
  const createWidget = useCallback((widgetId: string, config: WidgetConfig) => {
    let widget;
    
    switch (config.type) {
      case 'search_progress':
        widget = WidgetService.createSearchProgressWidget(config.params);
        break;
      
      case 'parlay_builder':
        widget = WidgetService.createParlayBuilderWidget(config.params);
        break;
      
      case 'odds_table':
        widget = WidgetService.createOddsTableWidget(config.params);
        break;
      
      case 'player_card':
        widget = WidgetService.createPlayerCardWidget(config.params);
        break;
      
      case 'live_picks':
        widget = WidgetService.createLivePicksTrackerWidget(config.params);
        break;
      
      case 'insights':
        widget = WidgetService.createInsightsWidget(config.params);
        break;
      
      default:
        console.warn('Unknown widget type:', config.type);
        return null;
    }

    setActiveWidgets(prev => new Map(prev).set(widgetId, widget));
    return widget;
  }, []);

  /**
   * Update an existing widget
   */
  const updateWidget = useCallback(async (widgetType: string, sessionId: string) => {
    setIsLoading(true);
    try {
      // Fetch updated widget data from backend
      const response = await fetch(`/api/chatkit/widgets?type=${widgetType}&sessionId=${sessionId}`);
      const { widget } = await response.json();
      
      if (widget) {
        setActiveWidgets(prev => new Map(prev).set(`${widgetType}_${sessionId}`, widget));
      }
    } catch (error) {
      console.error('Failed to update widget:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove a widget
   */
  const removeWidget = useCallback((widgetId: string) => {
    setActiveWidgets(prev => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });
  }, []);

  /**
   * Sample widget creators for common use cases
   */
  const showSearchProgress = useCallback((search: string, progress: number = 0) => {
    return createWidget('search_progress', {
      type: 'search_progress',
      params: {
        status: progress < 100 ? 'searching' : 'complete',
        currentSearch: search,
        sources: ['Supabase', 'ESPN', 'StatMuse'],
        progress
      }
    });
  }, [createWidget]);

  const showParlayBuilder = useCallback((picks: any[]) => {
    return createWidget('parlay_builder', {
      type: 'parlay_builder',
      params: {
        picks,
        totalOdds: calculateParlayOdds(picks),
        stake: 10
      }
    });
  }, [createWidget]);

  const showOddsComparison = useCallback((game: any) => {
    return createWidget('odds_table', {
      type: 'odds_table',
      params: {
        title: `${game.team1} vs ${game.team2} - Odds Comparison`,
        team1: game.team1,
        team2: game.team2,
        odds: game.odds || []
      }
    });
  }, [createWidget]);

  const showPlayerCard = useCallback((player: any) => {
    return createWidget(`player_${player.id}`, {
      type: 'player_card',
      params: {
        name: player.name,
        team: player.team,
        position: player.position,
        image: player.image,
        stats: player.stats || [],
        props: player.props || []
      }
    });
  }, [createWidget]);

  const showBettingInsights = useCallback((insights: any[]) => {
    return createWidget('insights', {
      type: 'insights',
      params: {
        insights,
        title: '💡 Professor Lock\'s Insights'
      }
    });
  }, [createWidget]);

  return {
    activeWidgets: Array.from(activeWidgets.values()),
    isLoading,
    handleWidgetAction,
    createWidget,
    updateWidget,
    removeWidget,
    // Convenience methods
    showSearchProgress,
    showParlayBuilder,
    showOddsComparison,
    showPlayerCard,
    showBettingInsights
  };
}

// Helper function to calculate parlay odds
function calculateParlayOdds(picks: any[]): string {
  const selected = picks.filter(p => p.selected);
  if (selected.length === 0) return '+0';
  
  let totalOdds = 1;
  selected.forEach(pick => {
    const odds = parseFloat(pick.odds?.replace('+', '') || '100') / 100;
    totalOdds *= (1 + odds);
  });
  
  return `+${Math.round((totalOdds - 1) * 100)}`;
}
