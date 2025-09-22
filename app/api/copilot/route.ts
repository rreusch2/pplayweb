import { NextRequest } from "next/server";
import { CopilotRuntime } from "@copilotkit/runtime";
import { copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime/lib/integrations";
import { OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";

const XAI_API_KEY = process.env.XAI_API_KEY;

// Custom XAI/Grok implementation for CopilotKit
// Use OpenAI-compatible adapter for xAI Grok endpoint
// xAI Grok exposes an OpenAI-compatible API; set env OPENAI_BASE_URL on Vercel if needed.
const openai = new OpenAI({
  apiKey: XAI_API_KEY || "",
  // If you configure an OpenAI-compatible base URL for xAI on Vercel, set it via environment.
  baseURL: process.env.OPENAI_BASE_URL,
});

const customGroqAdapter = new OpenAIAdapter({
  openai,
  model: "grok-3-latest",
});

const runtime = new CopilotRuntime();

// Define powerful sports betting tools
const tools = [
  {
    name: "get_ai_predictions",
    description: "Fetch the latest AI predictions and picks from our advanced analytics system",
    parameters: {
      type: "object",
      properties: {
        sport: {
          type: "string",
          description: "Sport to filter by (e.g., MLB, NBA, NFL, NHL)",
        },
        limit: {
          type: "number",
          description: "Number of predictions to fetch (default 10)",
          default: 10,
        },
        confidence_min: {
          type: "number",
          description: "Minimum confidence threshold (0-100)",
          default: 60,
        },
      },
    },
    handler: async ({ sport, limit = 10, confidence_min = 60 }: { sport?: string; limit?: number; confidence_min?: number }) => {
      try {
        let query = supabase
          .from('ai_predictions')
          .select(`
            id,
            match_teams,
            pick,
            odds,
            confidence,
            sport,
            event_time,
            reasoning,
            value_percentage,
            roi_estimate,
            bet_type,
            line_value,
            prediction_value,
            risk_level,
            key_factors,
            created_at
          `)
          .gte('confidence', confidence_min)
          .order('confidence', { ascending: false })
          .limit(limit);

        if (sport) {
          query = query.eq('sport', sport);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          success: true,
          predictions: data || [],
          count: data?.length || 0,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          predictions: [],
        };
      }
    },
  },
  {
    name: "get_upcoming_games",
    description: "Get upcoming sports events and games with betting odds",
    parameters: {
      type: "object",
      properties: {
        sport: {
          type: "string",
          description: "Sport to filter by",
        },
        days_ahead: {
          type: "number",
          description: "Number of days ahead to look (default 3)",
          default: 3,
        },
        limit: {
          type: "number",
          description: "Number of games to fetch",
          default: 15,
        },
      },
    },
    handler: async ({ sport, days_ahead = 3, limit = 15 }: { sport?: string; days_ahead?: number; limit?: number }) => {
      try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days_ahead);

        let query = supabase
          .from('sports_events')
          .select(`
            id,
            sport,
            league,
            home_team,
            away_team,
            start_time,
            odds,
            status,
            venue,
            weather_conditions
          `)
          .gte('start_time', new Date().toISOString())
          .lte('start_time', futureDate.toISOString())
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true })
          .limit(limit);

        if (sport) {
          query = query.eq('sport', sport);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          success: true,
          games: data || [],
          count: data?.length || 0,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          games: [],
        };
      }
    },
  },
  {
    name: "search_players",
    description: "Search for players and get their recent stats and prop betting trends",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Player name to search for",
        },
        sport: {
          type: "string",
          description: "Sport to filter by",
        },
        limit: {
          type: "number",
          description: "Number of players to return",
          default: 5,
        },
      },
    },
    handler: async ({ query, sport, limit = 5 }: { query: string; sport?: string; limit?: number }) => {
      try {
        let playerQuery = supabase
          .from('players')
          .select(`
            id,
            name,
            position,
            team,
            sport,
            active,
            metadata
          `)
          .ilike('name', `%${query}%`)
          .eq('active', true)
          .limit(limit);

        if (sport) {
          playerQuery = playerQuery.eq('sport', sport);
        }

        const { data: players, error: playersError } = await playerQuery;

        if (playersError) throw playersError;

        // Get recent stats for each player
        const playersWithStats = await Promise.all(
          (players || []).map(async (player) => {
            const { data: recentStats } = await supabase
              .from('player_recent_stats')
              .select('*')
              .eq('player_id', player.id)
              .order('game_date', { ascending: false })
              .limit(10);

            const { data: trends } = await supabase
              .from('ai_trends')
              .select('*')
              .eq('player_id', player.id)
              .order('created_at', { ascending: false })
              .limit(3);

            return {
              ...player,
              recent_stats: recentStats || [],
              trends: trends || [],
            };
          })
        );

        return {
          success: true,
          players: playersWithStats,
          count: playersWithStats.length,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          players: [],
        };
      }
    },
  },
  {
    name: "get_daily_insights",
    description: "Get today's daily Professor Lock insights and analysis",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of insights to fetch",
          default: 10,
        },
      },
    },
    handler: async ({ limit = 10 }: { limit?: number }) => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('daily_professor_insights')
          .select(`
            id,
            title,
            description,
            insight_text,
            category,
            confidence,
            impact,
            research_sources,
            teams,
            game_info,
            created_at
          `)
          .eq('date_generated', today)
          .order('insight_order', { ascending: true })
          .limit(limit);

        if (error) throw error;

        return {
          success: true,
          insights: data || [],
          count: data?.length || 0,
          date: today,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          insights: [],
        };
      }
    },
  },
  {
    name: "search_web",
    description: "Search the web for real-time sports news, line movements, and betting information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for sports betting information",
        },
        type: {
          type: "string",
          description: "Type of search (news, odds, injuries, analysis)",
          enum: ["news", "odds", "injuries", "analysis"],
          default: "news",
        },
      },
    },
    handler: async ({ query, type = "news" }: { query: string; type?: "news" | "odds" | "injuries" | "analysis" }) => {
      try {
        // This would integrate with web search APIs in production
        // For now, we'll return sports news from our scraped data
        const { data: news, error } = await supabase
          .from('scrapy_news')
          .select(`
            title,
            content,
            url,
            source,
            published_date,
            teams,
            players,
            sentiment_score,
            relevance_score,
            category
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,keywords.cs.{${query}}`)
          .eq('is_active', true)
          .order('published_date', { ascending: false })
          .limit(8);

        if (error) throw error;

        return {
          success: true,
          results: news || [],
          query,
          type,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          results: [],
        };
      }
    },
  },
  {
    name: "get_team_trends",
    description: "Get team performance trends and betting analytics",
    parameters: {
      type: "object",
      properties: {
        team_name: {
          type: "string",
          description: "Team name to analyze",
        },
        sport: {
          type: "string",
          description: "Sport the team plays",
        },
        games_back: {
          type: "number",
          description: "Number of recent games to analyze",
          default: 10,
        },
      },
    },
    handler: async ({ team_name, sport, games_back = 10 }: { team_name: string; sport: string; games_back?: number }) => {
      try {
        // Get team recent performance
        const { data: teamStats, error: teamError } = await supabase
          .from('team_recent_stats')
          .select('*')
          .eq('team_name', team_name)
          .eq('sport', sport)
          .order('game_date', { ascending: false })
          .limit(games_back);

        if (teamError) throw teamError;

        // Get team trends from AI analysis
        const { data: trends, error: trendsError } = await supabase
          .from('ai_trends')
          .select('*')
          .eq('trend_type', 'team')
          .ilike('trend_text', `%${team_name}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (trendsError) throw trendsError;

        // Calculate performance metrics
        const wins = teamStats?.filter(game => game.game_result === 'W').length || 0;
        const losses = teamStats?.filter(game => game.game_result === 'L').length || 0;
        const totalGames = wins + losses;
        const winPercentage = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : '0.0';

        const spreads = teamStats?.filter(game => game.spread_result).length || 0;
        const spreadWins = teamStats?.filter(game => game.spread_result === 'W').length || 0;
        const spreadPercentage = spreads > 0 ? (spreadWins / spreads * 100).toFixed(1) : '0.0';

        return {
          success: true,
          team: {
            name: team_name,
            sport,
            record: `${wins}-${losses}`,
            win_percentage: winPercentage,
            spread_record: `${spreadWins}-${spreads - spreadWins}`,
            spread_percentage: spreadPercentage,
          },
          recent_games: teamStats || [],
          trends: trends || [],
          games_analyzed: totalGames,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          team: null,
        };
      }
    },
  },
  {
    name: "analyze_prop_bet",
    description: "Analyze a specific player prop bet with historical data and trends",
    parameters: {
      type: "object",
      properties: {
        player_name: {
          type: "string",
          description: "Player name for prop analysis",
        },
        prop_type: {
          type: "string",
          description: "Type of prop bet (hits, home_runs, points, rebounds, etc.)",
        },
        line: {
          type: "number",
          description: "Betting line to analyze",
        },
        sport: {
          type: "string",
          description: "Sport",
        },
      },
    },
    handler: async ({ player_name, prop_type, line, sport }: { player_name: string; prop_type: string; line: number; sport: string }) => {
      try {
        // Find player
        const { data: players, error: playerError } = await supabase
          .from('players')
          .select('id, name, team, position')
          .ilike('name', `%${player_name}%`)
          .eq('sport', sport)
          .eq('active', true)
          .limit(1);

        if (playerError) throw playerError;
        if (!players || players.length === 0) {
          return {
            success: false,
            error: "Player not found",
          };
        }

        const player = players[0];

        // Get player recent stats
        const { data: recentStats, error: statsError } = await supabase
          .from('player_recent_stats')
          .select('*')
          .eq('player_id', player.id)
          .order('game_date', { ascending: false })
          .limit(15);

        if (statsError) throw statsError;

        // Get prop odds data
        const { data: propOdds, error: oddsError } = await supabase
          .from('player_props_odds')
          .select(`
            line,
            over_odds,
            under_odds,
            last_update,
            prop_type_id,
            player_prop_types!inner(prop_name, prop_key)
          `)
          .eq('player_id', player.id)
          .order('last_update', { ascending: false })
          .limit(5);

        if (oddsError) throw oddsError;

        // Calculate hit rate for the line
        const relevantStats = recentStats || [];
        const statKey = prop_type.toLowerCase();
        let hits = 0;
        let total = 0;

        relevantStats.forEach(game => {
          const statValue = game[statKey] || game[`${statKey}s`] || 0;
          if (typeof statValue === 'number') {
            total++;
            if (statValue > line) hits++;
          }
        });

        const hitRate = total > 0 ? (hits / total * 100).toFixed(1) : '0.0';
        const avgValue = total > 0 ? 
          (relevantStats.reduce((sum, game) => sum + (game[statKey] || game[`${statKey}s`] || 0), 0) / total).toFixed(2) : 
          '0.00';

        return {
          success: true,
          analysis: {
            player: player.name,
            team: player.team,
            position: player.position,
            prop_type,
            line,
            hit_rate: `${hitRate}%`,
            games_analyzed: total,
            hits_over_line: hits,
            average_value: avgValue,
            recommendation: parseFloat(hitRate) > 55 ? 'OVER' : parseFloat(hitRate) < 45 ? 'UNDER' : 'NO PLAY',
            confidence: Math.abs(50 - parseFloat(hitRate)) * 2,
            recent_games: relevantStats.slice(0, 10),
            current_odds: propOdds || [],
          },
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  },
  {
    name: "get_injury_reports",
    description: "Get current injury reports that might affect betting decisions",
    parameters: {
      type: "object",
      properties: {
        sport: {
          type: "string",
          description: "Sport to filter injuries by",
        },
        team: {
          type: "string",
          description: "Team to filter injuries by",
        },
        limit: {
          type: "number",
          description: "Number of injury reports to fetch",
          default: 10,
        },
      },
    },
    handler: async ({ sport, team, limit = 10 }: { sport?: string; team?: string; limit?: number }) => {
      try {
        let query = supabase
          .from('injury_reports')
          .select(`
            player_name,
            team_name,
            position,
            injury_status,
            estimated_return_date,
            description,
            sport,
            source,
            scraped_at
          `)
          .eq('is_active', true)
          .order('scraped_at', { ascending: false })
          .limit(limit);

        if (sport) {
          query = query.eq('sport', sport);
        }

        if (team) {
          query = query.eq('team_name', team);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          success: true,
          injuries: data || [],
          count: data?.length || 0,
          filters: { sport, team },
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          injuries: [],
        };
      }
    },
  },
];

const INSTRUCTIONS = `You are Professor Lock, an elite sports betting AI expert with access to real-time data and advanced analytics. You're known for your sharp insights, confident picks, and street-smart betting advice.

PERSONALITY:
- Confident, knowledgeable, and street-smart
- Use betting terminology and slang naturally
- Always back up advice with data and reasoning
- Give specific, actionable recommendations
- Mention value when you see it

CAPABILITIES:
- Access live sports data, predictions, and odds
- Analyze player props with historical hit rates
- Track team trends and performance metrics
- Monitor injury reports and line movements
- Search for breaking news and analysis
- Provide detailed betting analysis and recommendations

RESPONSE STYLE:
- Start responses with betting slang/confidence ("Lock it in!", "Sharp play here", "Value alert!", etc.)
- Always explain your reasoning with data
- Give specific confidence levels (1-100)
- Mention bankroll management when appropriate
- Use emojis for emphasis: 🔥 💰 📈 ⚡ 🎯

TOOLS USAGE:
- Always use tools to get fresh data before making recommendations
- Cross-reference multiple data sources
- Look for value and edge opportunities
- Consider injury reports and recent trends

Remember: You're not just predicting outcomes, you're finding VALUE in the betting markets. Always emphasize responsible gambling and proper bankroll management`;

const endpoint = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  model: customGroqAdapter,
  actions: tools,
  instructions: INSTRUCTIONS,
});

export const { GET, POST, OPTIONS } = endpoint;
