/**
 * Example Cheat Sheet Configurations
 * 
 * These are ready-to-use templates that Professor Lock can reference
 * when generating cheat sheets for different scenarios.
 */

export const exampleCheatSheets = {
  
  // NBA Game Day Cheat Sheet
  nbaGameDay: {
    title: "🏀 NBA Hot Takes - Tonight's Slate",
    theme: "nba" as const,
    template: "modern" as const,
    sections: [
      {
        type: "trend" as const,
        title: "📈 Home Favorites Crushing",
        data: {
          trend: "Home teams -7 or more are 15-3 ATS",
          direction: "up",
          percentage: 83,
          period: "last 10 days"
        }
      },
      {
        type: "matchup" as const,
        title: "🔥 Game of the Night",
        data: {
          teamA: "Lakers",
          teamB: "Celtics",
          edge: 12,
          factors: [
            "Celtics 8-2 at home this season",
            "Lakers missing Anthony Davis",
            "Total trending Under (223.5)",
            "Celtics revenge game from earlier loss"
          ]
        }
      },
      {
        type: "stat" as const,
        title: "📊 Key League Stats",
        data: {
          "Over Rate": "58%",
          "Favorites ATS": "52%",
          "Home Teams": "61% ATS",
          "Road Underdogs": "48% SU"
        }
      }
    ],
    insights: [
      "Unders are 12-4 in games with totals over 230 this week",
      "Fade public favorites getting 70%+ of bets",
      "Look for value in 1H spreads for tight matchups"
    ]
  },

  // NFL Weekly Trends
  nflWeekly: {
    title: "🏈 NFL Week 14 - Sharp Money Moves",
    theme: "nfl" as const,
    template: "bold" as const,
    sections: [
      {
        type: "trend" as const,
        title: "🎯 Division Dogs Barking",
        data: {
          trend: "Division underdogs +7 or more are 11-3 ATS",
          direction: "up",
          percentage: 78,
          period: "Weeks 10-13"
        }
      },
      {
        type: "trend" as const,
        title: "❄️ Weather Impact",
        data: {
          trend: "Outdoor unders in sub-freezing temps",
          direction: "down",
          percentage: 68,
          period: "last 3 seasons"
        }
      },
      {
        type: "matchup" as const,
        title: "Game of the Week",
        data: {
          teamA: "Chiefs",
          teamB: "Bills",
          edge: 8,
          factors: [
            "Bills 6-1 at home in prime time",
            "Chiefs 3-7 ATS as favorites",
            "Weather: 22°F, 15mph winds",
            "Sharp money on Bills +2.5"
          ]
        }
      }
    ],
    insights: [
      "Prime time home underdogs are 18-9 ATS this season",
      "Target player props in dome games for overs",
      "Avoid road favorites in divisional matchups"
    ]
  },

  // Player Props Focus
  playerProps: {
    title: "🎲 Tonight's Lock Props",
    theme: "nba" as const,
    template: "data-heavy" as const,
    sections: [
      {
        type: "prop" as const,
        title: "LeBron James - Points",
        data: {
          player: "LeBron James",
          prop: "Over 28.5 Points",
          line: "28.5",
          confidence: 87
        }
      },
      {
        type: "prop" as const,
        title: "Luka Doncic - Triple Double",
        data: {
          player: "Luka Doncic",
          prop: "To Record Triple-Double",
          line: "+185",
          confidence: 71
        }
      },
      {
        type: "prop" as const,
        title: "Steph Curry - 3-Pointers",
        data: {
          player: "Stephen Curry",
          prop: "Over 4.5 Made 3s",
          line: "4.5",
          confidence: 82
        }
      },
      {
        type: "stat" as const,
        title: "Supporting Stats",
        data: {
          "LeBron vs Celtics": "32.4 PPG (L5)",
          "Luka Triple-Doubles": "3 in last 7 games",
          "Curry Home 3PT%": "41.2%",
          "League Avg 3PM": "3.8"
        }
      }
    ],
    insights: [
      "Target overs against teams ranked 25+ in defense",
      "Assists props safer than points in blowouts",
      "Rebounds spike when pace is 100+ possessions"
    ]
  },

  // MLB Betting Guide (seasonal)
  mlbDaily: {
    title: "⚾ MLB Sharp Plays - June 15",
    theme: "mlb" as const,
    template: "minimalist" as const,
    sections: [
      {
        type: "trend" as const,
        title: "🔥 Hot Starting Pitchers",
        data: {
          trend: "Aces with ERA under 2.50 favored by 1.5+ runs",
          direction: "up",
          percentage: 73,
          period: "last 30 days"
        }
      },
      {
        type: "matchup" as const,
        title: "Pitcher's Duel Alert",
        data: {
          teamA: "Dodgers (Kershaw)",
          teamB: "Giants (Webb)",
          edge: 9,
          factors: [
            "Both pitchers ERA under 2.80",
            "Teams combined 8 runs in last 3 meetings",
            "Wind blowing in at 12mph",
            "Both bullpens top 10 in ERA"
          ]
        }
      },
      {
        type: "stat" as const,
        title: "Run Line Value",
        data: {
          "Home Favorites -1.5": "58% hit rate",
          "Road Dogs +1.5": "66% hit rate",
          "Day Games Under": "54%",
          "Night Games Over": "51%"
        }
      }
    ],
    insights: [
      "Target unders in pitcher's duels before 7.5 runs",
      "Run lines offer value when favorites -180 or higher",
      "First 5 innings bets eliminate bullpen variance"
    ]
  },

  // General Sports Trends
  multiSport: {
    title: "🎯 Today's Cross-Sport Edges",
    theme: "general" as const,
    template: "modern" as const,
    sections: [
      {
        type: "trend" as const,
        title: "NBA: Road Underdog Value",
        data: {
          trend: "Road dogs +8 or more covering spreads",
          direction: "up",
          percentage: 64,
          period: "December"
        }
      },
      {
        type: "trend" as const,
        title: "NHL: Totals Trends",
        data: {
          trend: "Division rivalry games going Under",
          direction: "down",
          percentage: 61,
          period: "last 20 games"
        }
      },
      {
        type: "trend" as const,
        title: "NFL: Primetime Specials",
        data: {
          trend: "Thursday Night unders hitting",
          direction: "down",
          percentage: 58,
          period: "2024 season"
        }
      },
      {
        type: "stat" as const,
        title: "Sharp Money Indicators",
        data: {
          "Line Movement": "Reverse line movement = sharp $",
          "Opening Lines": "Often sharper than closing",
          "Steam Moves": "2+ point swing in minutes",
          "Public %": "Fade 70%+ public sides"
        }
      }
    ],
    insights: [
      "Shop lines across 3+ sportsbooks for best value",
      "Live betting offers edges when public overreacts",
      "Correlate player props in same-game parlays wisely"
    ]
  },

  // Weekend Parlay Builder
  parlayBuilder: {
    title: "💰 Saturday Parlay Special",
    theme: "general" as const,
    template: "bold" as const,
    sections: [
      {
        type: "matchup" as const,
        title: "Leg 1: NBA",
        data: {
          teamA: "Bucks",
          teamB: "Hawks",
          edge: 11,
          factors: [
            "Bucks -4.5 (Open -3)",
            "Sharp money on Bucks",
            "Hawks on B2B road trip"
          ]
        }
      },
      {
        type: "matchup" as const,
        title: "Leg 2: CFB",
        data: {
          teamA: "Alabama",
          teamB: "Auburn",
          edge: 8,
          factors: [
            "Under 52.5 points",
            "Defense-heavy rivalry",
            "Weather: Rain expected"
          ]
        }
      },
      {
        type: "prop" as const,
        title: "Leg 3: NHL Prop",
        data: {
          player: "Connor McDavid",
          prop: "Over 0.5 Points",
          line: "-150",
          confidence: 79
        }
      },
      {
        type: "stat" as const,
        title: "Parlay Analysis",
        data: {
          "Combined Odds": "+485",
          "True Probability": "~24%",
          "Expected Value": "+8.2%",
          "Risk Level": "Moderate"
        }
      }
    ],
    insights: [
      "3-leg parlays offer best risk/reward ratio",
      "Avoid correlating outcomes from same game",
      "Consider hedging if 2 legs hit early"
    ]
  }
}

// Helper function to get a cheat sheet by scenario
export function getCheatSheetTemplate(scenario: keyof typeof exampleCheatSheets) {
  return exampleCheatSheets[scenario]
}

// Helper to customize a template
export function customizeCheatSheet(
  template: typeof exampleCheatSheets[keyof typeof exampleCheatSheets],
  overrides: Partial<typeof template>
) {
  return {
    ...template,
    ...overrides,
    sections: overrides.sections || template.sections,
    insights: overrides.insights || template.insights
  }
}
