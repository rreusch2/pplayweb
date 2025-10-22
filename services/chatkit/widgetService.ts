/**
 * ChatKit Widget Service
 * Provides custom widgets for the Professor Lock sports betting assistant
 */

export interface WidgetAction {
  type: string;
  payload?: any;
}

export interface WidgetNode {
  type: string;
  [key: string]: any;
}

export interface WidgetRoot {
  type: 'Card' | 'ListView';
  children?: WidgetNode[];
  [key: string]: any;
}

export class WidgetService {
  /**
   * Creates a Search Progress Widget
   * Shows what the agent is currently searching for with animated progress
   */
  static createSearchProgressWidget(params: {
    status: 'searching' | 'analyzing' | 'complete';
    currentSearch?: string;
    sources?: string[];
    progress?: number;
  }): WidgetRoot {
    const { status, currentSearch, sources = [], progress = 0 } = params;

    const statusConfig = {
      searching: { icon: '🔍', text: 'Searching for data...', color: '#3B82F6' },
      analyzing: { icon: '🤔', text: 'Analyzing results...', color: '#F59E0B' },
      complete: { icon: '✅', text: 'Search complete!', color: '#10B981' }
    };

    const config = statusConfig[status];

    return {
      type: 'Card',
      size: 'md',
      theme: 'dark',
      background: { dark: '#1a1a1a', light: '#ffffff' },
      padding: { x: 16, y: 12 },
      children: [
        {
          type: 'Row',
          gap: 12,
          align: 'center',
          children: [
            {
              type: 'Text',
              value: config.icon,
              size: 'xl'
            },
            {
              type: 'Col',
              flex: 1,
              gap: 4,
              children: [
                {
                  type: 'Text',
                  value: config.text,
                  weight: 'semibold',
                  color: { dark: config.color, light: config.color }
                },
                currentSearch && {
                  type: 'Text',
                  value: currentSearch,
                  size: 'sm',
                  color: { dark: '#9CA3AF', light: '#6B7280' },
                  truncate: true,
                  maxLines: 1
                }
              ].filter(Boolean) as WidgetNode[]
            }
          ]
        },
        progress > 0 && {
          type: 'Box',
          height: 4,
          background: { dark: '#374151', light: '#E5E7EB' },
          radius: 'full',
          margin: { top: 8 },
          children: [
            {
              type: 'Box',
              height: 4,
              width: `${progress}%`,
              background: config.color,
              radius: 'full'
            }
          ]
        },
        sources.length > 0 && {
          type: 'Row',
          gap: 8,
          margin: { top: 8 },
          children: sources.map(source => ({
            type: 'Badge',
            label: source,
            size: 'sm',
            variant: 'soft',
            color: 'info'
          }))
        }
      ].filter(Boolean) as WidgetNode[]
    };
  }

  /**
   * Creates a Parlay Builder Widget
   * Interactive tool for building multi-bet parlays
   */
  static createParlayBuilderWidget(params: {
    picks: Array<{
      id: string;
      team: string;
      bet: string;
      odds: string;
      selected?: boolean;
    }>;
    totalOdds?: string;
    potentialPayout?: string;
    stake?: number;
  }): WidgetRoot {
    const { picks, totalOdds = '+0', potentialPayout, stake = 10 } = params;
    const selectedPicks = picks.filter(p => p.selected);

    return {
      type: 'Card',
      size: 'lg',
      theme: 'dark',
      background: { dark: '#111827', light: '#ffffff' },
      padding: 16,
      children: [
        {
          type: 'Row',
          justify: 'between',
          align: 'center',
          margin: { bottom: 12 },
          children: [
            {
              type: 'Title',
              value: '🎯 Parlay Builder',
              size: 'lg',
              weight: 'bold',
              color: { dark: '#ffffff', light: '#000000' }
            },
            selectedPicks.length > 0 && {
              type: 'Badge',
              label: `${selectedPicks.length} picks`,
              color: 'success',
              variant: 'solid'
            }
          ].filter(Boolean) as WidgetNode[]
        },
        {
          type: 'Col',
          gap: 8,
          children: picks.map(pick => ({
            type: 'Box',
            padding: 12,
            background: pick.selected 
              ? { dark: '#1E3A5F', light: '#DBEAFE' }
              : { dark: '#1F2937', light: '#F9FAFB' },
            radius: 'md',
            border: pick.selected 
              ? { size: 2, color: { dark: '#3B82F6', light: '#2563EB' } }
              : { size: 1, color: { dark: '#374151', light: '#E5E7EB' } },
            children: [
              {
                type: 'Row',
                justify: 'between',
                align: 'center',
                children: [
                  {
                    type: 'Col',
                    flex: 1,
                    gap: 2,
                    children: [
                      {
                        type: 'Text',
                        value: pick.team,
                        weight: 'semibold',
                        color: { dark: '#ffffff', light: '#111827' }
                      },
                      {
                        type: 'Text',
                        value: pick.bet,
                        size: 'sm',
                        color: { dark: '#9CA3AF', light: '#6B7280' }
                      }
                    ]
                  },
                  {
                    type: 'Col',
                    align: 'end',
                    gap: 4,
                    children: [
                      {
                        type: 'Text',
                        value: pick.odds,
                        weight: 'bold',
                        color: { dark: '#10B981', light: '#059669' }
                      },
                      {
                        type: 'Button',
                        label: pick.selected ? 'Remove' : 'Add',
                        size: 'xs',
                        variant: pick.selected ? 'outline' : 'solid',
                        color: pick.selected ? 'danger' : 'primary',
                        onClickAction: {
                          type: 'toggle_parlay_pick',
                          pickId: pick.id
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }))
        },
        selectedPicks.length > 0 && {
          type: 'Box',
          margin: { top: 12 },
          padding: 12,
          background: { dark: '#1E293B', light: '#F3F4F6' },
          radius: 'md',
          children: [
            {
              type: 'Col',
              gap: 8,
              children: [
                {
                  type: 'Row',
                  justify: 'between',
                  children: [
                    {
                      type: 'Text',
                      value: 'Stake:',
                      color: { dark: '#9CA3AF', light: '#6B7280' }
                    },
                    {
                      type: 'Text',
                      value: `$${stake}`,
                      weight: 'semibold'
                    }
                  ]
                },
                {
                  type: 'Row',
                  justify: 'between',
                  children: [
                    {
                      type: 'Text',
                      value: 'Total Odds:',
                      color: { dark: '#9CA3AF', light: '#6B7280' }
                    },
                    {
                      type: 'Text',
                      value: totalOdds,
                      weight: 'bold',
                      color: { dark: '#F59E0B', light: '#D97706' }
                    }
                  ]
                },
                {
                  type: 'Divider',
                  spacing: 8,
                  color: { dark: '#374151', light: '#E5E7EB' }
                },
                {
                  type: 'Row',
                  justify: 'between',
                  children: [
                    {
                      type: 'Text',
                      value: 'Potential Payout:',
                      weight: 'semibold'
                    },
                    {
                      type: 'Text',
                      value: potentialPayout || `$${(stake * 2.5).toFixed(2)}`,
                      size: 'lg',
                      weight: 'bold',
                      color: { dark: '#10B981', light: '#059669' }
                    }
                  ]
                }
              ]
            }
          ]
        },
        selectedPicks.length > 0 && {
          type: 'Row',
          margin: { top: 12 },
          gap: 8,
          children: [
            {
              type: 'Button',
              label: 'Place Parlay',
              style: 'primary',
              block: true,
              onClickAction: {
                type: 'place_parlay',
                picks: selectedPicks.map(p => p.id)
              }
            },
            {
              type: 'Button',
              label: 'Clear',
              variant: 'outline',
              color: 'secondary',
              onClickAction: {
                type: 'clear_parlay'
              }
            }
          ]
        }
      ].filter(Boolean) as WidgetNode[]
    };
  }

  /**
   * Creates an Odds Comparison Table Widget
   */
  static createOddsTableWidget(params: {
    title: string;
    odds: Array<{
      book: string;
      team1Odds: string;
      team2Odds: string;
      overUnder?: string;
      spread?: string;
    }>;
    team1: string;
    team2: string;
  }): WidgetRoot {
    const { title, odds, team1, team2 } = params;

    return {
      type: 'Card',
      size: 'full',
      theme: 'dark',
      padding: 16,
      background: { dark: '#0f172a', light: '#ffffff' },
      children: [
        {
          type: 'Title',
          value: title,
          size: 'lg',
          weight: 'bold',
          margin: { bottom: 12 }
        },
        {
          type: 'Row',
          padding: { bottom: 8 },
          border: { bottom: { size: 1, color: { dark: '#334155', light: '#E5E7EB' } } },
          children: [
            {
              type: 'Text',
              value: 'Sportsbook',
              weight: 'semibold',
              size: 'sm',
              color: { dark: '#94A3B8', light: '#6B7280' },
              width: '20%'
            },
            {
              type: 'Text',
              value: team1,
              weight: 'semibold',
              size: 'sm',
              color: { dark: '#94A3B8', light: '#6B7280' },
              width: '20%',
              textAlign: 'center'
            },
            {
              type: 'Text',
              value: team2,
              weight: 'semibold',
              size: 'sm',
              color: { dark: '#94A3B8', light: '#6B7280' },
              width: '20%',
              textAlign: 'center'
            },
            {
              type: 'Text',
              value: 'O/U',
              weight: 'semibold',
              size: 'sm',
              color: { dark: '#94A3B8', light: '#6B7280' },
              width: '20%',
              textAlign: 'center'
            },
            {
              type: 'Text',
              value: 'Spread',
              weight: 'semibold',
              size: 'sm',
              color: { dark: '#94A3B8', light: '#6B7280' },
              width: '20%',
              textAlign: 'center'
            }
          ]
        },
        {
          type: 'Col',
          gap: 4,
          margin: { top: 8 },
          children: odds.map((row, index) => ({
            type: 'Row',
            padding: 8,
            background: index % 2 === 0 
              ? { dark: '#1E293B', light: '#F9FAFB' }
              : { dark: 'transparent', light: 'transparent' },
            radius: 'sm',
            children: [
              {
                type: 'Text',
                value: row.book,
                weight: 'medium',
                width: '20%'
              },
              {
                type: 'Badge',
                label: row.team1Odds,
                color: 'info',
                variant: 'soft',
                size: 'sm'
              },
              {
                type: 'Badge',
                label: row.team2Odds,
                color: 'info',
                variant: 'soft',
                size: 'sm'
              },
              {
                type: 'Text',
                value: row.overUnder || '-',
                textAlign: 'center',
                width: '20%'
              },
              {
                type: 'Text',
                value: row.spread || '-',
                textAlign: 'center',
                width: '20%'
              }
            ]
          }))
        }
      ]
    };
  }

  /**
   * Creates a Player Card Widget
   */
  static createPlayerCardWidget(params: {
    name: string;
    team: string;
    position: string;
    image?: string;
    stats: Array<{ label: string; value: string }>;
    props?: Array<{
      market: string;
      line: string;
      over: string;
      under: string;
      recommendation?: 'over' | 'under';
    }>;
  }): WidgetRoot {
    const { name, team, position, image, stats, props = [] } = params;

    return {
      type: 'Card',
      size: 'lg',
      theme: 'dark',
      background: { dark: '#0f172a', light: '#ffffff' },
      padding: 16,
      children: [
        {
          type: 'Row',
          gap: 16,
          margin: { bottom: 16 },
          children: [
            image && {
              type: 'Image',
              src: image,
              alt: name,
              size: 80,
              radius: 'full',
              frame: true
            },
            {
              type: 'Col',
              flex: 1,
              justify: 'center',
              gap: 4,
              children: [
                {
                  type: 'Title',
                  value: name,
                  size: 'xl',
                  weight: 'bold'
                },
                {
                  type: 'Row',
                  gap: 8,
                  children: [
                    {
                      type: 'Badge',
                      label: team,
                      color: 'info',
                      variant: 'soft'
                    },
                    {
                      type: 'Badge',
                      label: position,
                      color: 'secondary',
                      variant: 'outline'
                    }
                  ]
                }
              ]
            }
          ].filter(Boolean) as WidgetNode[]
        },
        {
          type: 'Row',
          gap: 12,
          margin: { bottom: 16 },
          children: stats.map(stat => ({
            type: 'Box',
            flex: 1,
            padding: 8,
            background: { dark: '#1E293B', light: '#F3F4F6' },
            radius: 'md',
            children: [
              {
                type: 'Col',
                align: 'center',
                gap: 2,
                children: [
                  {
                    type: 'Caption',
                    value: stat.label,
                    color: { dark: '#94A3B8', light: '#6B7280' }
                  },
                  {
                    type: 'Text',
                    value: stat.value,
                    weight: 'bold',
                    size: 'lg'
                  }
                ]
              }
            ]
          }))
        },
        props.length > 0 && {
          type: 'Col',
          gap: 8,
          children: [
            {
              type: 'Text',
              value: 'Player Props',
              weight: 'semibold',
              margin: { bottom: 8 }
            },
            ...props.map(prop => ({
              type: 'Box',
              padding: 12,
              background: { dark: '#1E293B', light: '#F9FAFB' },
              radius: 'md',
              border: prop.recommendation 
                ? { size: 2, color: { dark: '#10B981', light: '#059669' } }
                : { size: 1, color: { dark: '#334155', light: '#E5E7EB' } },
              children: [
                {
                  type: 'Row',
                  justify: 'between',
                  align: 'center',
                  children: [
                    {
                      type: 'Col',
                      gap: 2,
                      children: [
                        {
                          type: 'Text',
                          value: prop.market,
                          weight: 'semibold'
                        },
                        {
                          type: 'Text',
                          value: `Line: ${prop.line}`,
                          size: 'sm',
                          color: { dark: '#94A3B8', light: '#6B7280' }
                        }
                      ]
                    },
                    {
                      type: 'Row',
                      gap: 8,
                      children: [
                        {
                          type: 'Button',
                          label: `O ${prop.over}`,
                          size: 'sm',
                          variant: prop.recommendation === 'over' ? 'solid' : 'outline',
                          color: prop.recommendation === 'over' ? 'success' : 'secondary',
                          onClickAction: {
                            type: 'select_prop',
                            player: name,
                            market: prop.market,
                            selection: 'over',
                            odds: prop.over
                          }
                        },
                        {
                          type: 'Button',
                          label: `U ${prop.under}`,
                          size: 'sm',
                          variant: prop.recommendation === 'under' ? 'solid' : 'outline',
                          color: prop.recommendation === 'under' ? 'success' : 'secondary',
                          onClickAction: {
                            type: 'select_prop',
                            player: name,
                            market: prop.market,
                            selection: 'under',
                            odds: prop.under
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }))
          ]
        }
      ].filter(Boolean) as WidgetNode[]
    };
  }

  /**
   * Creates a Live Picks Tracker Widget
   */
  static createLivePicksTrackerWidget(params: {
    picks: Array<{
      id: string;
      game: string;
      pick: string;
      odds: string;
      confidence: number;
      status: 'pending' | 'winning' | 'losing' | 'won' | 'lost' | 'push';
      stake?: number;
      potentialWin?: number;
    }>;
    totalStake?: number;
    totalPotentialWin?: number;
  }): WidgetRoot {
    const { picks, totalStake = 0, totalPotentialWin = 0 } = params;

    const statusConfig = {
      pending: { icon: '⏳', color: '#6B7280' },
      winning: { icon: '📈', color: '#10B981' },
      losing: { icon: '📉', color: '#EF4444' },
      won: { icon: '✅', color: '#10B981' },
      lost: { icon: '❌', color: '#EF4444' },
      push: { icon: '➖', color: '#F59E0B' }
    };

    return {
      type: 'Card',
      size: 'full',
      theme: 'dark',
      padding: 16,
      children: [
        {
          type: 'Row',
          justify: 'between',
          align: 'center',
          margin: { bottom: 12 },
          children: [
            {
              type: 'Title',
              value: '📊 Live Picks Tracker',
              size: 'lg',
              weight: 'bold'
            },
            {
              type: 'Row',
              gap: 12,
              children: [
                {
                  type: 'Col',
                  align: 'end',
                  children: [
                    {
                      type: 'Caption',
                      value: 'Total Stake'
                    },
                    {
                      type: 'Text',
                      value: `$${totalStake.toFixed(2)}`,
                      weight: 'bold'
                    }
                  ]
                },
                {
                  type: 'Col',
                  align: 'end',
                  children: [
                    {
                      type: 'Caption',
                      value: 'Potential Win'
                    },
                    {
                      type: 'Text',
                      value: `$${totalPotentialWin.toFixed(2)}`,
                      weight: 'bold',
                      color: { dark: '#10B981', light: '#059669' }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'Col',
          gap: 8,
          children: picks.map(pick => {
            const config = statusConfig[pick.status];
            return {
              type: 'Box',
              padding: 12,
              background: { dark: '#1E293B', light: '#F9FAFB' },
              radius: 'md',
              border: pick.status === 'winning' || pick.status === 'won'
                ? { size: 2, color: { dark: '#10B981', light: '#059669' } }
                : pick.status === 'losing' || pick.status === 'lost'
                ? { size: 2, color: { dark: '#EF4444', light: '#DC2626' } }
                : { size: 1, color: { dark: '#334155', light: '#E5E7EB' } },
              children: [
                {
                  type: 'Row',
                  justify: 'between',
                  align: 'start',
                  children: [
                    {
                      type: 'Col',
                      flex: 1,
                      gap: 4,
                      children: [
                        {
                          type: 'Row',
                          gap: 8,
                          align: 'center',
                          children: [
                            {
                              type: 'Text',
                              value: config.icon,
                              size: 'lg'
                            },
                            {
                              type: 'Col',
                              children: [
                                {
                                  type: 'Text',
                                  value: pick.game,
                                  weight: 'semibold'
                                },
                                {
                                  type: 'Text',
                                  value: pick.pick,
                                  size: 'sm',
                                  color: { dark: '#94A3B8', light: '#6B7280' }
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: 'Row',
                          gap: 12,
                          margin: { top: 8 },
                          children: [
                            {
                              type: 'Badge',
                              label: `${pick.confidence}% confidence`,
                              color: pick.confidence >= 80 ? 'success' : pick.confidence >= 60 ? 'warning' : 'secondary',
                              variant: 'soft',
                              size: 'sm'
                            },
                            {
                              type: 'Text',
                              value: pick.odds,
                              weight: 'bold',
                              color: { dark: '#F59E0B', light: '#D97706' }
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'Col',
                      align: 'end',
                      gap: 4,
                      children: [
                        {
                          type: 'Badge',
                          label: pick.status.toUpperCase(),
                          color: pick.status === 'won' || pick.status === 'winning' ? 'success' 
                            : pick.status === 'lost' || pick.status === 'losing' ? 'danger'
                            : pick.status === 'push' ? 'warning' : 'secondary',
                          variant: 'solid'
                        },
                        pick.potentialWin && {
                          type: 'Text',
                          value: `+$${pick.potentialWin.toFixed(2)}`,
                          size: 'sm',
                          weight: 'semibold',
                          color: { dark: '#10B981', light: '#059669' }
                        }
                      ].filter(Boolean) as WidgetNode[]
                    }
                  ]
                }
              ]
            };
          })
        }
      ]
    };
  }

  /**
   * Creates a Betting Insights Widget
   */
  static createInsightsWidget(params: {
    title?: string;
    insights: Array<{
      icon?: string;
      title: string;
      description: string;
      confidence?: number;
      action?: WidgetAction;
    }>;
  }): WidgetRoot {
    const { title = '💡 Key Insights', insights } = params;

    return {
      type: 'Card',
      size: 'md',
      theme: 'dark',
      background: { dark: '#0f172a', light: '#ffffff' },
      padding: 16,
      children: [
        {
          type: 'Title',
          value: title,
          size: 'lg',
          weight: 'bold',
          margin: { bottom: 12 }
        },
        {
          type: 'Col',
          gap: 12,
          children: insights.map(insight => ({
            type: 'Box',
            padding: 12,
            background: { dark: '#1E293B', light: '#F9FAFB' },
            radius: 'md',
            children: [
              {
                type: 'Row',
                gap: 12,
                align: 'start',
                children: [
                  insight.icon && {
                    type: 'Text',
                    value: insight.icon,
                    size: 'xl'
                  },
                  {
                    type: 'Col',
                    flex: 1,
                    gap: 4,
                    children: [
                      {
                        type: 'Row',
                        justify: 'between',
                        align: 'center',
                        children: [
                          {
                            type: 'Text',
                            value: insight.title,
                            weight: 'semibold'
                          },
                          insight.confidence && {
                            type: 'Badge',
                            label: `${insight.confidence}%`,
                            color: insight.confidence >= 80 ? 'success' : insight.confidence >= 60 ? 'warning' : 'info',
                            variant: 'soft',
                            size: 'sm'
                          }
                        ].filter(Boolean) as WidgetNode[]
                      },
                      {
                        type: 'Text',
                        value: insight.description,
                        size: 'sm',
                        color: { dark: '#94A3B8', light: '#6B7280' }
                      },
                      insight.action && {
                        type: 'Button',
                        label: 'View Details',
                        size: 'xs',
                        variant: 'outline',
                        color: 'primary',
                        margin: { top: 8 },
                        onClickAction: insight.action
                      }
                    ].filter(Boolean) as WidgetNode[]
                  }
                ].filter(Boolean) as WidgetNode[]
              }
            ]
          }))
        }
      ]
    };
  }
}
