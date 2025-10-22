# Cheat Sheet Components

Visual components for rendering betting cheat sheets with real AI data.

## Components

### DailyCheatSheet.tsx

Renders a daily picks digest with:
- Header with title, date, and stats
- Top pick highlight card
- Confidence distribution chart (Recharts)
- Sports breakdown
- List of all picks with odds and confidence
- Themeable with `dark_glass`, `blue_blaze`, or `team_colors`

**Props**:
```typescript
interface DailyCheatSheetProps {
  content: DailyDigestContent  // From composeDailyDigest()
  theme?: 'dark_glass' | 'blue_blaze' | 'team_colors'
  watermark?: boolean  // Show "PREDICTIVE PLAY" watermark
  className?: string
}
```

**Usage**:
```tsx
import DailyCheatSheet from '@/components/cheatsheets/DailyCheatSheet'
import { composeDailyDigest } from '@/lib/cheatSheetData'

const content = await composeDailyDigest(userId, {
  sports: ['MLB', 'NBA'],
  picksLimit: 10,
  minConfidence: 60
})

<DailyCheatSheet 
  content={content}
  theme="dark_glass"
  watermark={false}
/>
```

## Themes

### dark_glass (Default)
- Dark slate gradient background
- White/10 borders (glass effect)
- Blue accents (#3b82f6)
- Backdrop blur

### blue_blaze (Elite)
- Deep blue/indigo gradient
- Cyan accents (#06b6d4)
- Premium feel

### team_colors (Elite)
- Gray/emerald gradient
- Emerald accents (#10b981)
- Sport-specific vibes

## Data Structure

The component expects `DailyDigestContent` from `lib/cheatSheetData.ts`:

```typescript
interface DailyDigestContent {
  title: string
  summary: string
  sport: string
  picks: CheatSheetPick[]
  topPick: CheatSheetPick | null
  confidenceDistribution: { range: string; count: number }[]
  avgConfidence: number
  totalValue: number
  sportsBreakdown: { sport: string; count: number }[]
  generatedAt: string
}
```

## Styling

Uses:
- **Tailwind CSS** for layout and styling
- **Recharts** for confidence distribution chart
- **Lucide React** for icons (TrendingUp, Target, Zap, Clock)

Responsive:
- Mobile-first design
- Grid layouts adjust on smaller screens
- Chart scales with container

## Export

The component is designed to be exported as PNG using `lib/htmlExport.ts`:

```typescript
import { exportToPNG } from '@/lib/htmlExport'

const sheetRef = useRef<HTMLDivElement>(null)

await exportToPNG(sheetRef.current, {
  filename: 'my-cheat-sheet',
  backgroundColor: '#000000',
  quality: 0.95
})
```

## Future Components (Phase 2+)

- `PlayerPropCheatSheet.tsx` - Player prop snapshot with last-10 chart
- `GameMatchupCheatSheet.tsx` - Team vs team analysis
- `ParlayBlueprintCheatSheet.tsx` - Multi-leg parlay strategy

## Dependencies

- `react` + `react-dom`
- `recharts` - For charts
- `lucide-react` - For icons
- `tailwindcss` - For styling
- `@/lib/cheatSheetData` - Data composition
- `@/lib/htmlExport` - PNG export (optional)
