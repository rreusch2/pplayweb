import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const template = searchParams.get('template') || 'modern'

    if (!id) {
      return new Response('Missing cheat sheet ID', { status: 400 })
    }

    // Fetch cheat sheet data
    const { data: cheatSheet, error } = await supabase
      .from('cheat_sheets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !cheatSheet) {
      return new Response('Cheat sheet not found', { status: 404 })
    }

    // Template color schemes
    const themes = {
      minimalist: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#168aa2' },
      bold: { bg1: '#0f0c29', bg2: '#24243e', accent: '#ffd60a' },
      'data-heavy': { bg1: '#0a0e27', bg2: '#1a1f3a', accent: '#168aa2' },
      modern: { bg1: '#141e30', bg2: '#243b55', accent: '#168aa2' }
    }

    const colors = themes[template as keyof typeof themes] || themes.modern

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${colors.bg1} 0%, ${colors.bg2} 100%)`,
            padding: '60px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
            <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '10px' }}>
              {cheatSheet.data.title || 'Betting Insights'}
            </div>
            <div style={{ fontSize: '32px', color: colors.accent }}>
              {cheatSheet.theme.toUpperCase()} • {new Date(cheatSheet.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '100%',
              height: '4px',
              background: colors.accent,
              marginBottom: '40px'
            }}
          />

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', flex: 1 }}>
            {cheatSheet.data.sections?.slice(0, 3).map((section: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd60a' }}>
                  {section.title}
                </div>
                <div style={{ fontSize: '26px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {section.type === 'trend' && (
                    <>
                      <div style={{ color: section.data.direction === 'up' ? '#4caf50' : '#f44336' }}>
                        {section.data.direction === 'up' ? '📈' : '📉'} {section.data.trend}
                      </div>
                      <div style={{ fontSize: '22px' }}>
                        {section.data.percentage}% over {section.data.period || 'recent games'}
                      </div>
                    </>
                  )}
                  {section.type === 'matchup' && (
                    <>
                      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                        {section.data.teamA} vs {section.data.teamB}
                      </div>
                      {section.data.edge && (
                        <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                          ⚡ {section.data.edge}% Edge
                        </div>
                      )}
                      {section.data.factors?.slice(0, 2).map((factor: string, i: number) => (
                        <div key={i} style={{ fontSize: '22px' }}>• {factor}</div>
                      ))}
                    </>
                  )}
                  {section.type === 'prop' && (
                    <>
                      <div style={{ fontSize: '28px' }}>🏀 {section.data.player}</div>
                      <div style={{ color: colors.accent }}>{section.data.prop}</div>
                      {section.data.confidence && (
                        <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                          {section.data.confidence}% Confidence
                        </div>
                      )}
                    </>
                  )}
                  {section.type === 'stat' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {Object.entries(section.data).slice(0, 4).map(([key, value]: [string, any]) => (
                        <div key={key} style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ color: colors.accent }}>{key}:</span>
                          <span style={{ fontWeight: 'bold' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          {cheatSheet.data.insights && cheatSheet.data.insights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '40px' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd60a' }}>
                💡 Key Insights
              </div>
              {cheatSheet.data.insights.slice(0, 2).map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: '24px' }}>
                  • {insight}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '60px',
              padding: '30px 0',
              borderTop: `2px solid ${colors.accent}`
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '40px', fontWeight: 'bold', color: colors.accent }}>
                🎯 Predictive Play
              </div>
              <div style={{ fontSize: '24px' }}>Powered by Professor Lock AI</div>
            </div>
            <div
              style={{
                width: '100px',
                height: '100px',
                background: '#ffffff20',
                border: `3px solid ${colors.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
            >
              QR
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1600,
      }
    )
  } catch (error) {
    console.error('Cheat sheet rendering error:', error)
    return new Response('Failed to render cheat sheet', { status: 500 })
  }
}
