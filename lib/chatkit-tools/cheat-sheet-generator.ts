/**
 * Professor Lock Cheat Sheet Generator Tool
 * 
 * This tool allows Professor Lock to create visually stunning, 
 * data-driven betting cheat sheets that users can download and share.
 */

export const cheatSheetGeneratorTool = {
  type: "function" as const,
  name: "generate_betting_cheat_sheet",
  description: `Generate a visually appealing betting cheat sheet with trends, stats, and insights. 
  Use this when a user asks for:
  - A summary of trends or patterns
  - Key betting insights for a sport/game
  - A visual guide or cheat sheet
  - Something to save or share
  
  The cheat sheet will be professionally designed with dynamic backgrounds, 
  clear data visualization, and shareable as an image.`,
  
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Catchy title for the cheat sheet (e.g., 'NBA Betting Trends - Week 12', 'Tonight's Hot Props')"
      },
      theme: {
        type: "string",
        enum: ["nba", "nfl", "mlb", "nhl", "cfb", "general"],
        description: "Sport theme that determines color scheme and styling"
      },
      template: {
        type: "string",
        enum: ["minimalist", "bold", "data-heavy", "modern"],
        description: "Design template: minimalist (clean, simple), bold (high contrast), data-heavy (lots of stats), modern (gradient, sleek)"
      },
      sections: {
        type: "array",
        description: "Array of content sections to include in the cheat sheet",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["trend", "stat", "matchup", "prop", "insight"],
              description: "Type of section: trend (betting pattern), stat (key numbers), matchup (team comparison), prop (player prop), insight (analysis)"
            },
            title: {
              type: "string",
              description: "Section title (e.g., 'Road Team Trends', 'LeBron James Props')"
            },
            data: {
              type: "object",
              description: "Section-specific data object. For trends: {trend, direction, percentage, period}. For stats: {stat_name: value}. For matchups: {teamA, teamB, edge, factors}. For props: {player, prop, line, confidence}"
            }
          },
          required: ["type", "title", "data"]
        }
      },
      insights: {
        type: "array",
        description: "Array of 2-4 key betting insights or tips to highlight",
        items: {
          type: "string"
        }
      }
    },
    required: ["title", "theme", "template", "sections"],
    additionalProperties: false
  },
  strict: true
}

/**
 * Example usage from Professor Lock:
 * 
 * When user asks: "Give me a cheat sheet for tonight's NBA games"
 * 
 * Professor Lock calls:
 * {
 *   title: "🏀 NBA Hot Takes - Dec 22",
 *   theme: "nba",
 *   template: "modern",
 *   sections: [
 *     {
 *       type: "trend",
 *       title: "Home Favorites Crushing",
 *       data: {
 *         trend: "Home teams -7 or more are 15-3 ATS",
 *         direction: "up",
 *         percentage: 83,
 *         period: "last 10 days"
 *       }
 *     },
 *     {
 *       type: "matchup",
 *       title: "Lakers vs Celtics",
 *       data: {
 *         teamA: "Lakers",
 *         teamB: "Celtics",
 *         edge: 12,
 *         factors: [
 *           "Celtics 8-2 at home",
 *           "Lakers missing AD",
 *           "Total trending Under"
 *         ]
 *       }
 *     },
 *     {
 *       type: "prop",
 *       title: "Player Prop Special",
 *       data: {
 *         player: "Jayson Tatum",
 *         prop: "Over 28.5 Points",
 *         line: "28.5",
 *         confidence: 87
 *       }
 *     }
 *   ],
 *   insights: [
 *     "Unders are 12-4 in games with totals over 230",
 *     "Fade public favorites getting 70%+ of bets",
 *     "Look for value in player assists props tonight"
 *   ]
 * }
 */

export interface CheatSheetWidget {
  type: 'card'
  size: 'lg'
  children: any[]
  theme: 'dark'
  status?: {
    text: string
    icon: string
  }
  confirm?: {
    label: string
    action: {
      type: string
      payload: any
      handler: 'client'
    }
  }
}

export function createCheatSheetWidget(
  cheatSheetId: string,
  title: string,
  imageUrl: string,
  shareUrl: string
): CheatSheetWidget {
  return {
    type: 'card',
    size: 'lg',
    theme: 'dark',
    children: [
      {
        type: 'title',
        value: '🎯 Your Cheat Sheet is Ready!',
        size: 'lg',
        color: '#ffd60a'
      },
      {
        type: 'text',
        value: title,
        size: 'md',
        weight: 'semibold',
        color: '#ffffff'
      },
      {
        type: 'box',
        direction: 'column',
        gap: 16,
        padding: { y: 20 },
        children: [
          {
            type: 'image',
            src: imageUrl,
            alt: title,
            radius: 'lg',
            width: '100%',
            aspectRatio: '3/4'
          },
          {
            type: 'row',
            gap: 12,
            justify: 'between',
            children: [
              {
                type: 'button',
                label: '💾 Download',
                style: 'primary',
                color: 'primary',
                variant: 'solid',
                size: 'lg',
                onClickAction: {
                  type: 'download_cheat_sheet',
                  payload: { id: cheatSheetId, imageUrl },
                  handler: 'client'
                }
              },
              {
                type: 'button',
                label: '🔗 Share',
                style: 'secondary',
                color: 'info',
                variant: 'outline',
                size: 'lg',
                onClickAction: {
                  type: 'share_cheat_sheet',
                  payload: { id: cheatSheetId, shareUrl, title },
                  handler: 'client'
                }
              },
              {
                type: 'button',
                label: '🎨 Regenerate',
                style: 'secondary',
                color: 'discovery',
                variant: 'ghost',
                size: 'lg',
                onClickAction: {
                  type: 'regenerate_cheat_sheet',
                  payload: { id: cheatSheetId },
                  handler: 'server'
                }
              }
            ]
          }
        ]
      },
      {
        type: 'divider',
        spacing: 20,
        color: { dark: '#ffffff20', light: '#00000020' }
      },
      {
        type: 'caption',
        value: '💡 Cheat sheets are generated with real-time data and trends from our AI analysis engine.',
        size: 'sm',
        color: '#888888',
        textAlign: 'center'
      }
    ],
    status: {
      text: 'Generated with Professor Lock AI',
      icon: '✨'
    }
  }
}
