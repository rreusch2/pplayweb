import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage, registerFont } from 'canvas'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const template = searchParams.get('template') || 'modern'

    if (!id) {
      return NextResponse.json({ error: 'Missing cheat sheet ID' }, { status: 400 })
    }

    // Fetch cheat sheet data
    const { data: cheatSheet, error } = await supabase
      .from('cheat_sheets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !cheatSheet) {
      return NextResponse.json({ error: 'Cheat sheet not found' }, { status: 404 })
    }

    // Generate image based on template
    const imageBuffer = await renderCheatSheetImage(cheatSheet, template)

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="predictive-play-cheatsheet-${id}.png"`
      }
    })
  } catch (error) {
    console.error('Cheat sheet rendering error:', error)
    return NextResponse.json(
      { error: 'Failed to render cheat sheet' },
      { status: 500 }
    )
  }
}

async function renderCheatSheetImage(cheatSheet: any, template: string): Promise<Buffer> {
  const width = 1200
  const height = 1600
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background gradients based on template
  const gradients = {
    minimalist: ['#1a1a2e', '#16213e'],
    bold: ['#0f0c29', '#302b63', '#24243e'],
    'data-heavy': ['#0a0e27', '#1a1f3a'],
    modern: ['#141e30', '#243b55']
  }

  const colors = gradients[template as keyof typeof gradients] || gradients.modern

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[colors.length - 1])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Add subtle pattern overlay
  ctx.globalAlpha = 0.03
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 100 + 50
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, size, 2)
  }
  ctx.globalAlpha = 1

  // Header Section
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Arial'
  ctx.fillText(cheatSheet.data.title || 'Betting Insights', 60, 100)

  // Subtitle with theme
  ctx.fillStyle = '#168aa2'
  ctx.font = '32px Arial'
  const themeText = `${cheatSheet.theme.toUpperCase()} • ${new Date(cheatSheet.created_at).toLocaleDateString()}`
  ctx.fillText(themeText, 60, 150)

  // Divider line
  ctx.strokeStyle = '#168aa2'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(60, 180)
  ctx.lineTo(width - 60, 180)
  ctx.stroke()

  let yPosition = 240

  // Render sections
  for (const section of cheatSheet.data.sections || []) {
    yPosition = await renderSection(ctx, section, 60, yPosition, width - 120, template)
    yPosition += 60 // Spacing between sections
  }

  // Insights section
  if (cheatSheet.data.insights && cheatSheet.data.insights.length > 0) {
    ctx.fillStyle = '#ffd60a'
    ctx.font = 'bold 36px Arial'
    ctx.fillText('💡 Key Insights', 60, yPosition)
    yPosition += 50

    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    for (const insight of cheatSheet.data.insights.slice(0, 3)) {
      const lines = wrapText(ctx, `• ${insight}`, width - 140)
      for (const line of lines) {
        ctx.fillText(line, 80, yPosition)
        yPosition += 35
      }
    }
  }

  // Footer watermark
  yPosition = Math.max(yPosition + 80, height - 100)
  
  // Predictive Play branding
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.fillRect(0, height - 120, width, 120)
  
  ctx.fillStyle = '#168aa2'
  ctx.font = 'bold 40px Arial'
  ctx.fillText('🎯 Predictive Play', 60, height - 65)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = '24px Arial'
  ctx.fillText('Powered by Professor Lock AI', 60, height - 30)

  // QR code placeholder (right side of footer)
  ctx.strokeStyle = '#168aa2'
  ctx.lineWidth = 3
  ctx.strokeRect(width - 180, height - 110, 100, 100)
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px Arial'
  ctx.fillText('Scan to', width - 170, height - 20)
  ctx.fillText('Get App', width - 170, height - 5)

  return canvas.toBuffer('image/png')
}

async function renderSection(
  ctx: any,
  section: any,
  x: number,
  y: number,
  maxWidth: number,
  template: string
): Promise<number> {
  let currentY = y

  // Section header
  ctx.fillStyle = '#ffd60a'
  ctx.font = 'bold 32px Arial'
  ctx.fillText(section.title, x, currentY)
  currentY += 45

  // Section content based on type
  ctx.fillStyle = '#ffffff'
  ctx.font = '26px Arial'

  switch (section.type) {
    case 'trend':
      currentY = renderTrendSection(ctx, section.data, x, currentY, maxWidth)
      break
    case 'stat':
      currentY = renderStatSection(ctx, section.data, x, currentY, maxWidth)
      break
    case 'matchup':
      currentY = renderMatchupSection(ctx, section.data, x, currentY, maxWidth)
      break
    case 'prop':
      currentY = renderPropSection(ctx, section.data, x, currentY, maxWidth)
      break
    default:
      currentY = renderGenericSection(ctx, section.data, x, currentY, maxWidth)
  }

  return currentY
}

function renderTrendSection(ctx: any, data: any, x: number, y: number, maxWidth: number): number {
  let currentY = y

  if (data.trend) {
    const trendEmoji = data.direction === 'up' ? '📈' : '📉'
    ctx.fillStyle = data.direction === 'up' ? '#4caf50' : '#f44336'
    ctx.font = 'bold 28px Arial'
    ctx.fillText(`${trendEmoji} ${data.trend}`, x + 20, currentY)
    currentY += 40
  }

  if (data.percentage) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText(`${data.percentage}% over last ${data.period || '10 games'}`, x + 20, currentY)
    currentY += 35
  }

  return currentY + 20
}

function renderStatSection(ctx: any, data: any, x: number, y: number, maxWidth: number): number {
  let currentY = y

  // Stats in two columns
  const stats = Object.entries(data)
  const half = Math.ceil(stats.length / 2)

  for (let i = 0; i < half; i++) {
    // Left column
    if (stats[i]) {
      const [key, value] = stats[i]
      ctx.fillStyle = '#168aa2'
      ctx.font = '22px Arial'
      ctx.fillText(`${key}:`, x + 20, currentY)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(String(value), x + 200, currentY)
    }

    // Right column
    if (stats[i + half]) {
      const [key, value] = stats[i + half]
      ctx.fillStyle = '#168aa2'
      ctx.font = '22px Arial'
      ctx.fillText(`${key}:`, x + maxWidth / 2, currentY)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(String(value), x + maxWidth / 2 + 180, currentY)
    }

    currentY += 38
  }

  return currentY + 10
}

function renderMatchupSection(ctx: any, data: any, x: number, y: number, maxWidth: number): number {
  let currentY = y

  // Team A vs Team B
  ctx.font = 'bold 32px Arial'
  ctx.fillStyle = '#ffffff'
  const matchupText = `${data.teamA || 'Team A'} vs ${data.teamB || 'Team B'}`
  ctx.fillText(matchupText, x + 20, currentY)
  currentY += 50

  // Edge/advantage
  if (data.edge) {
    ctx.fillStyle = '#4caf50'
    ctx.font = 'bold 26px Arial'
    ctx.fillText(`⚡ ${data.edge}% Edge`, x + 20, currentY)
    currentY += 40
  }

  // Key factors
  if (data.factors) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '22px Arial'
    for (const factor of data.factors) {
      ctx.fillText(`• ${factor}`, x + 30, currentY)
      currentY += 32
    }
  }

  return currentY + 15
}

function renderPropSection(ctx: any, data: any, x: number, y: number, maxWidth: number): number {
  let currentY = y

  if (data.player) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial'
    ctx.fillText(`🏀 ${data.player}`, x + 20, currentY)
    currentY += 45
  }

  if (data.prop) {
    ctx.fillStyle = '#168aa2'
    ctx.font = '24px Arial'
    ctx.fillText(data.prop, x + 30, currentY)
    currentY += 40
  }

  if (data.line) {
    ctx.fillStyle = '#ffd60a'
    ctx.font = 'bold 26px Arial'
    ctx.fillText(`Line: ${data.line}`, x + 30, currentY)
    currentY += 35
  }

  if (data.confidence) {
    const confColor = data.confidence >= 80 ? '#4caf50' : data.confidence >= 60 ? '#ffd60a' : '#ff9800'
    ctx.fillStyle = confColor
    ctx.font = 'bold 24px Arial'
    ctx.fillText(`${data.confidence}% Confidence`, x + 30, currentY)
    currentY += 35
  }

  return currentY + 15
}

function renderGenericSection(ctx: any, data: any, x: number, y: number, maxWidth: number): number {
  let currentY = y

  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const lines = wrapText(ctx, text, maxWidth - 40)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = '24px Arial'
  
  for (const line of lines) {
    ctx.fillText(line, x + 20, currentY)
    currentY += 35
  }

  return currentY + 15
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
