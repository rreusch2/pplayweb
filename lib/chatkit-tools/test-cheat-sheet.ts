/**
 * Test Suite for Cheat Sheet Generator
 * 
 * Run these tests to verify your cheat sheet system is working
 */

import { exampleCheatSheets } from './example-cheat-sheets'

// Test data for API calls
export const testCheatSheetRequests = {
  
  // Basic NBA test
  simpleNBA: {
    title: "🏀 Test NBA Cheat Sheet",
    theme: "nba" as const,
    template: "modern" as const,
    sections: [
      {
        type: "trend" as const,
        title: "Test Trend",
        data: {
          trend: "Test teams are performing well",
          direction: "up",
          percentage: 75,
          period: "test period"
        }
      }
    ],
    insights: ["Test insight 1", "Test insight 2"]
  },

  // Full featured test
  comprehensive: {
    title: "🎯 Comprehensive Test Sheet",
    theme: "general" as const,
    template: "data-heavy" as const,
    sections: [
      {
        type: "trend" as const,
        title: "Trend Test",
        data: {
          trend: "Home teams winning",
          direction: "up",
          percentage: 85,
          period: "last week"
        }
      },
      {
        type: "stat" as const,
        title: "Stats Test",
        data: {
          "Stat 1": "Value 1",
          "Stat 2": "Value 2",
          "Stat 3": "Value 3"
        }
      },
      {
        type: "matchup" as const,
        title: "Matchup Test",
        data: {
          teamA: "Team A",
          teamB: "Team B",
          edge: 10,
          factors: ["Factor 1", "Factor 2", "Factor 3"]
        }
      },
      {
        type: "prop" as const,
        title: "Prop Test",
        data: {
          player: "Test Player",
          prop: "Over 25.5 Points",
          line: "25.5",
          confidence: 80
        }
      }
    ],
    insights: [
      "Test insight about betting strategy",
      "Another test insight with data",
      "Third insight for good measure"
    ]
  }
}

/**
 * Manual Test Steps
 */
export const manualTestSteps = `
MANUAL TESTING CHECKLIST
========================

□ Step 1: Test API Endpoint
  Open browser console and run:
  
  fetch('/api/chatkit/generate-cheat-sheet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: JSON.stringify(testCheatSheetRequests.simpleNBA)
  })
  .then(r => r.json())
  .then(console.log)
  
  Expected: Response with imageUrl and shareUrl

□ Step 2: Test Image Rendering
  Take imageUrl from step 1, open in new tab
  Expected: Beautiful cheat sheet PNG displays

□ Step 3: Test in Professor Lock
  Chat: "Create a cheat sheet for tonight's NBA games"
  Expected: Widget appears with preview

□ Step 4: Test Download
  Click "Download" button in widget
  Expected: PNG file downloads to device

□ Step 5: Test Share
  Click "Share" button in widget
  Expected: Share dialog or link copied to clipboard

□ Step 6: Test Database
  Run in Supabase SQL:
  SELECT * FROM cheat_sheets ORDER BY created_at DESC LIMIT 5;
  Expected: Your test cheat sheets appear

□ Step 7: Test Each Template
  Try all 4 templates:
  - minimalist
  - bold
  - data-heavy
  - modern
  Expected: Different visual styles render correctly

□ Step 8: Test Each Sport Theme
  Try themes: nba, nfl, mlb, nhl, cfb, general
  Expected: Appropriate color schemes

□ Step 9: Test Edge Cases
  - Very long titles (50+ chars)
  - Many sections (6+)
  - Empty insights array
  - Special characters in text
  Expected: Graceful handling

□ Step 10: Test Performance
  Generate 5 cheat sheets rapidly
  Expected: All render within 3 seconds each

PASSED: ___ / 10 tests
`

/**
 * Automated Test Functions
 */

export async function testCheatSheetAPI(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/chatkit/generate-cheat-sheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testCheatSheetRequests.simpleNBA)
    })

    if (!response.ok) {
      console.error('API returned error:', response.status)
      return false
    }

    const data = await response.json()
    
    if (!data.imageUrl || !data.shareUrl) {
      console.error('Missing imageUrl or shareUrl in response')
      return false
    }

    console.log('✅ API test passed!', data)
    return true
  } catch (error) {
    console.error('❌ API test failed:', error)
    return false
  }
}

export async function testImageRendering(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      console.error('Image fetch failed:', response.status)
      return false
    }

    const contentType = response.headers.get('content-type')
    if (contentType !== 'image/png') {
      console.error('Wrong content type:', contentType)
      return false
    }

    const blob = await response.blob()
    if (blob.size < 1000) {
      console.error('Image too small, likely error:', blob.size)
      return false
    }

    console.log('✅ Image rendering test passed!', blob.size, 'bytes')
    return true
  } catch (error) {
    console.error('❌ Image test failed:', error)
    return false
  }
}

/**
 * Test Runner
 */
export async function runAllTests(token: string) {
  console.log('🧪 Running Cheat Sheet Tests...\n')

  const results = {
    api: await testCheatSheetAPI(token),
    // Add more automated tests here
  }

  console.log('\n📊 Test Results:')
  console.log('API Test:', results.api ? '✅ PASS' : '❌ FAIL')
  
  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  console.log(`\n${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your cheat sheet system is working!')
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.')
  }

  return results
}

/**
 * Quick Test Prompts for Professor Lock
 */
export const testPrompts = [
  "Create a cheat sheet for tonight's NBA games",
  "Give me a visual summary of this week's NFL trends",
  "Make a player props cheat sheet",
  "Show me the best bets for today in a cheat sheet",
  "Create a betting guide I can share",
  "Generate a cheat sheet about MLB trends",
  "What are today's sharp plays? Make it visual",
  "Give me a cheat sheet I can download"
]

/**
 * Helper for expect-like matchers (Jest-style)
 */
const expect = {
  stringContaining: (str: string) => str,
  stringMatching: (pattern: RegExp) => pattern,
  arrayContaining: (arr: any[]) => arr,
  objectContaining: (obj: any) => obj,
  any: (type: any) => type
}

/**
 * Expected Tool Calls
 * 
 * When Professor Lock receives these prompts, he should call
 * generate_betting_cheat_sheet with parameters like these:
 */
export const expectedToolCalls = {
  "Create a cheat sheet for tonight's NBA games": {
    title: expect.stringContaining("NBA"),
    theme: "nba",
    template: expect.stringMatching(/minimalist|bold|data-heavy|modern/),
    sections: expect.arrayContaining([
      expect.objectContaining({
        type: expect.stringMatching(/trend|stat|matchup|prop/),
        title: expect.any(String),
        data: expect.any(Object)
      })
    ]),
    insights: expect.any(Array)
  }
}
