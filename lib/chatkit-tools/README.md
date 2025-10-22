# Professor Lock Cheat Sheet Generator

## 🎯 Overview

The Cheat Sheet Generator allows Professor Lock to create visually stunning, data-driven betting insights that users can download and share. This is a powerful viral marketing tool that creates shareable content while providing real value.

## 🚀 Setup Instructions

### 1. Install Dependencies

```powershell
cd C:\Users\reidr\parleyapp\pplayweb
npm install canvas
```

### 2. Apply Database Migration

Run the SQL schema to create the cheat_sheets table:

```sql
-- Run this in your Supabase SQL editor
-- File: database/cheat-sheets-schema.sql
```

### 3. Add Tool to Agent Builder

1. Go to your OpenAI Agent Builder dashboard
2. Open your Professor Lock workflow
3. Add a new **Function Tool** with these details:

**Function Name:** `generate_betting_cheat_sheet`

**Description:**
```
Generate a visually appealing betting cheat sheet with trends, stats, and insights. 
Use this when a user asks for:
- A summary of trends or patterns
- Key betting insights for a sport/game
- A visual guide or cheat sheet
- Something to save or share

The cheat sheet will be professionally designed with dynamic backgrounds, 
clear data visualization, and shareable as an image.
```

**Parameters:** (Copy from `lib/chatkit-tools/cheat-sheet-generator.ts`)

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Catchy title for the cheat sheet"
    },
    "theme": {
      "type": "string",
      "enum": ["nba", "nfl", "mlb", "nhl", "cfb", "general"],
      "description": "Sport theme that determines color scheme"
    },
    "template": {
      "type": "string",
      "enum": ["minimalist", "bold", "data-heavy", "modern"],
      "description": "Design template style"
    },
    "sections": {
      "type": "array",
      "description": "Content sections to include",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["trend", "stat", "matchup", "prop", "insight"]
          },
          "title": {
            "type": "string"
          },
          "data": {
            "type": "object"
          }
        },
        "required": ["type", "title", "data"]
      }
    },
    "insights": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Key betting insights to highlight"
    }
  },
  "required": ["title", "theme", "template", "sections"]
}
```

4. **Connect the tool to your backend:**
   - Set the function to call: `/api/chatkit/generate-cheat-sheet`
   - Method: POST
   - The API will handle the rest

### 4. Update Professor Lock Instructions

Add these instructions to your Agent Builder:

```
CHEAT SHEET GENERATION:
When users ask for betting insights, trends, or summaries, offer to create a visual cheat sheet they can save and share.

Example triggers:
- "Give me today's betting trends"
- "What are the hot picks for NBA?"
- "Create a cheat sheet for tonight's games"

Always:
1. Gather real data from available sources
2. Structure it into clear sections (trends, matchups, props, stats)
3. Include 2-4 actionable insights
4. Use the appropriate theme (nba, nfl, etc.)
5. Choose template based on user preference (default: modern)

After generating, present it in a widget with download and share buttons.
```

## 📊 Templates

### Minimalist
Clean, simple design with plenty of white space. Best for:
- Quick reference guides
- Simple trend summaries
- Users who prefer clean aesthetics

### Bold
High contrast, eye-catching design. Best for:
- Social media sharing
- Highlighting strong picks
- Maximum visual impact

### Data-Heavy
Packed with statistics and numbers. Best for:
- Advanced bettors
- Detailed analysis
- Multiple games/props

### Modern
Sleek gradients and contemporary styling. Best for:
- General use
- Professional look
- Versatile content

## 🎨 Example Usage

### Example 1: NBA Trends
```json
{
  "title": "🏀 NBA Betting Trends - Week 12",
  "theme": "nba",
  "template": "modern",
  "sections": [
    {
      "type": "trend",
      "title": "Home Favorites Dominating",
      "data": {
        "trend": "Home teams -7 or more are 15-3 ATS",
        "direction": "up",
        "percentage": 83,
        "period": "last 10 days"
      }
    },
    {
      "type": "stat",
      "title": "Key Stats",
      "data": {
        "Over Rate": "58%",
        "Favorites ATS": "52%",
        "Home Teams": "61% ATS"
      }
    }
  ],
  "insights": [
    "Unders hitting in high-total games (230+)",
    "Fade public favorites getting 70%+ of bets"
  ]
}
```

### Example 2: Player Props
```json
{
  "title": "Tonight's Hot Props 🔥",
  "theme": "nba",
  "template": "bold",
  "sections": [
    {
      "type": "prop",
      "title": "LeBron James - Points",
      "data": {
        "player": "LeBron James",
        "prop": "Over 28.5 Points",
        "line": "28.5",
        "confidence": 87
      }
    },
    {
      "type": "prop",
      "title": "Luka Doncic - Assists",
      "data": {
        "player": "Luka Doncic",
        "prop": "Over 9.5 Assists",
        "line": "9.5",
        "confidence": 82
      }
    }
  ],
  "insights": [
    "Look for overs against weak defenses",
    "Home players trending over in rebounds"
  ]
}
```

## 🔧 API Endpoints

### Generate Cheat Sheet
`POST /api/chatkit/generate-cheat-sheet`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:** See examples above

**Response:**
```json
{
  "success": true,
  "cheatSheet": { /* cheat sheet data */ },
  "imageUrl": "/api/chatkit/render-cheat-sheet?id=cs_123&template=modern",
  "shareUrl": "https://predictiveplay.com/cheat-sheet/cs_123"
}
```

### Render Cheat Sheet Image
`GET /api/chatkit/render-cheat-sheet?id={id}&template={template}`

Returns PNG image (1200x1600px)

## 📈 Analytics

Track cheat sheet performance in the database:
- `share_count`: How many times shared
- `download_count`: How many times downloaded
- `theme`: Which sports are most popular
- `template`: Which designs users prefer

Query the `cheat_sheet_analytics` view for insights.

## 🎯 Marketing Benefits

1. **Viral Sharing**: Users share valuable content with your branding
2. **Social Proof**: Quality insights showcase your AI capabilities
3. **User Retention**: Downloadable content they can reference
4. **Brand Awareness**: Every share includes your watermark and QR code
5. **Lead Generation**: Shared cheat sheets drive new user signups

## 🚨 Important Notes

- Canvas library requires Node.js 14+ for server-side rendering
- Images are cached for performance
- Watermarks and branding are non-removable
- Rate limit: 10 cheat sheets per user per hour (adjust in middleware)
- Elite tier users can generate unlimited cheat sheets

## 🎨 Customization

To add new templates, edit:
- `app/api/chatkit/render-cheat-sheet/route.ts`
- Update gradients, fonts, layouts in the render functions

To add new section types, add handlers in:
- `renderSection()` function with new switch case
