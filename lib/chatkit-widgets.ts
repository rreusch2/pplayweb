// Custom sports betting widgets for ChatKit

export interface PredictionWidget {
  type: 'Card'
  size: 'lg'
  children: any[]
  status?: {
    text: string
    icon?: string
  }
  confirm?: {
    label: string
    action: {
      type: string
      payload: any
    }
  }
}

export interface PlayerPropWidget {
  playerName: string
  team: string
  propType: string
  line: string
  odds: string
  confidence: number
  reasoning: string
}

export interface ParlayBuilderWidget {
  legs: Array<{
    id: string
    match: string
    pick: string
    odds: string
  }>
  totalOdds: string
  stake?: number
  potentialPayout?: number
}

// Create a player prop pick widget
export function createPlayerPropWidget(prop: PlayerPropWidget): any {
  return {
    type: 'Card',
    size: 'lg',
    padding: { x: 16, y: 12 },
    children: [
      {
        type: 'Row',
        gap: 12,
        children: [
          {
            type: 'Col',
            flex: 1,
            children: [
              {
                type: 'Text',
                value: prop.playerName,
                size: 'lg',
                weight: 'bold'
              },
              {
                type: 'Text',
                value: prop.team,
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              }
            ]
          },
          {
            type: 'Badge',
            label: `${prop.confidence}% Confidence`,
            color: prop.confidence >= 70 ? 'success' : prop.confidence >= 50 ? 'warning' : 'danger',
            variant: 'soft'
          }
        ]
      },
      {
        type: 'Divider',
        spacing: 12
      },
      {
        type: 'Row',
        gap: 16,
        children: [
          {
            type: 'Col',
            children: [
              {
                type: 'Text',
                value: prop.propType,
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              },
              {
                type: 'Text',
                value: prop.line,
                weight: 'semibold'
              }
            ]
          },
          {
            type: 'Col',
            children: [
              {
                type: 'Text',
                value: 'Odds',
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              },
              {
                type: 'Text',
                value: prop.odds,
                weight: 'semibold',
                color: prop.odds.startsWith('+') ? { light: '#059669', dark: '#10b981' } : null
              }
            ]
          }
        ]
      },
      {
        type: 'Box',
        padding: { top: 12 },
        children: [
          {
            type: 'Text',
            value: prop.reasoning,
            size: 'sm',
            maxLines: 3
          }
        ]
      }
    ],
    status: {
      text: '🎯 AI Pick',
      icon: 'sparkle'
    },
    confirm: {
      label: 'Add to Betslip',
      action: {
        type: 'add_to_betslip',
        payload: {
          playerName: prop.playerName,
          propType: prop.propType,
          line: prop.line,
          odds: prop.odds
        }
      }
    }
  }
}

// Create a parlay builder widget
export function createParlayWidget(parlay: ParlayBuilderWidget): any {
  return {
    type: 'Card',
    size: 'full',
    padding: 16,
    background: { light: '#f8f9fa', dark: '#1a1a1a' },
    children: [
      {
        type: 'Row',
        justify: 'between',
        align: 'center',
        children: [
          {
            type: 'Title',
            value: '🎲 Smart Parlay',
            size: 'lg'
          },
          {
            type: 'Badge',
            label: parlay.totalOdds,
            color: 'info',
            variant: 'solid',
            size: 'lg'
          }
        ]
      },
      {
        type: 'Divider',
        spacing: 16
      },
      {
        type: 'Col',
        gap: 12,
        children: parlay.legs.map((leg, index) => ({
          type: 'Row',
          gap: 8,
          align: 'center',
          children: [
            {
              type: 'Badge',
              label: `${index + 1}`,
              color: 'secondary',
              pill: true,
              size: 'sm'
            },
            {
              type: 'Col',
              flex: 1,
              children: [
                {
                  type: 'Text',
                  value: leg.match,
                  size: 'sm',
                  weight: 'medium'
                },
                {
                  type: 'Text',
                  value: `${leg.pick} @ ${leg.odds}`,
                  size: 'sm',
                  color: { light: '#666', dark: '#999' }
                }
              ]
            }
          ]
        }))
      },
      parlay.stake && parlay.potentialPayout ? {
        type: 'Box',
        padding: { top: 16 },
        border: { top: { size: 1, color: { light: '#e5e7eb', dark: '#374151' } } },
        children: [
          {
            type: 'Row',
            justify: 'between',
            children: [
              {
                type: 'Text',
                value: `Stake: $${parlay.stake}`,
                size: 'sm'
              },
              {
                type: 'Text',
                value: `Potential: $${parlay.potentialPayout}`,
                size: 'sm',
                weight: 'bold',
                color: { light: '#059669', dark: '#10b981' }
              }
            ]
          }
        ]
      } : null
    ].filter(Boolean),
    confirm: {
      label: 'Place Bet',
      action: {
        type: 'place_parlay',
        payload: {
          legs: parlay.legs,
          totalOdds: parlay.totalOdds,
          stake: parlay.stake
        }
      }
    },
    cancel: {
      label: 'Clear',
      action: {
        type: 'clear_parlay',
        payload: {}
      }
    }
  }
}

// Create a game analysis widget
export function createGameAnalysisWidget(game: any): any {
  return {
    type: 'Card',
    size: 'lg',
    children: [
      {
        type: 'Row',
        justify: 'between',
        align: 'center',
        children: [
          {
            type: 'Col',
            align: 'center',
            children: [
              {
                type: 'Text',
                value: game.awayTeam,
                weight: 'semibold'
              },
              {
                type: 'Text',
                value: game.awayRecord,
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              }
            ]
          },
          {
            type: 'Text',
            value: '@',
            size: 'sm',
            color: { light: '#666', dark: '#999' }
          },
          {
            type: 'Col',
            align: 'center',
            children: [
              {
                type: 'Text',
                value: game.homeTeam,
                weight: 'semibold'
              },
              {
                type: 'Text',
                value: game.homeRecord,
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              }
            ]
          }
        ]
      },
      {
        type: 'Divider',
        spacing: 12
      },
      {
        type: 'Row',
        gap: 16,
        justify: 'around',
        children: [
          {
            type: 'Col',
            align: 'center',
            children: [
              {
                type: 'Text',
                value: 'Moneyline',
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              },
              {
                type: 'Text',
                value: `${game.awayML} / ${game.homeML}`,
                weight: 'medium'
              }
            ]
          },
          {
            type: 'Col',
            align: 'center',
            children: [
              {
                type: 'Text',
                value: 'Spread',
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              },
              {
                type: 'Text',
                value: `${game.spread}`,
                weight: 'medium'
              }
            ]
          },
          {
            type: 'Col',
            align: 'center',
            children: [
              {
                type: 'Text',
                value: 'Total',
                size: 'sm',
                color: { light: '#666', dark: '#999' }
              },
              {
                type: 'Text',
                value: `O/U ${game.total}`,
                weight: 'medium'
              }
            ]
          }
        ]
      },
      game.analysis ? {
        type: 'Box',
        padding: { top: 12 },
        children: [
          {
            type: 'Markdown',
            value: game.analysis
          }
        ]
      } : null
    ].filter(Boolean),
    status: game.recommendation ? {
      text: `💡 ${game.recommendation}`,
      icon: 'sparkle'
    } : undefined
  }
}

// Create a betting trends widget
export function createTrendsWidget(trends: any): any {
  return {
    type: 'ListView',
    limit: 5,
    children: trends.map((trend: any) => ({
      type: 'ListViewItem',
      children: [
        {
          type: 'Row',
          gap: 12,
          align: 'center',
          children: [
            {
              type: 'Badge',
              label: trend.trend,
              color: trend.trend === 'HOT' ? 'danger' : 'info',
              variant: 'soft',
              pill: true
            },
            {
              type: 'Col',
              flex: 1,
              children: [
                {
                  type: 'Text',
                  value: trend.player,
                  weight: 'medium'
                },
                {
                  type: 'Text',
                  value: trend.stat,
                  size: 'sm',
                  color: { light: '#666', dark: '#999' }
                }
              ]
            },
            {
              type: 'Text',
              value: trend.value,
              weight: 'semibold',
              color: trend.positive ? { light: '#059669', dark: '#10b981' } : { light: '#dc2626', dark: '#ef4444' }
            }
          ]
        }
      ],
      onClickAction: {
        type: 'view_trend_details',
        payload: { player: trend.player, stat: trend.stat }
      }
    })),
    status: {
      text: '📊 Live Trends',
      icon: 'sparkle'
    }
  }
}

// Create an odds movement widget
export function createOddsMovementWidget(movements: any[]): any {
  return {
    type: 'Card',
    size: 'md',
    children: [
      {
        type: 'Title',
        value: '📈 Line Movement',
        size: 'md'
      },
      {
        type: 'Divider',
        spacing: 12
      },
      {
        type: 'Col',
        gap: 8,
        children: movements.map(move => ({
          type: 'Row',
          justify: 'between',
          align: 'center',
          children: [
            {
              type: 'Text',
              value: move.game,
              size: 'sm'
            },
            {
              type: 'Row',
              gap: 8,
              align: 'center',
              children: [
                {
                  type: 'Text',
                  value: move.oldLine,
                  size: 'sm',
                  lineThrough: true,
                  color: { light: '#999', dark: '#666' }
                },
                {
                  type: 'Text',
                  value: '→',
                  size: 'sm',
                  color: { light: '#666', dark: '#999' }
                },
                {
                  type: 'Text',
                  value: move.newLine,
                  size: 'sm',
                  weight: 'semibold',
                  color: move.favorable ? { light: '#059669', dark: '#10b981' } : { light: '#dc2626', dark: '#ef4444' }
                }
              ]
            }
          ]
        }))
      }
    ]
  }
}
