import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shareId = params.id

    if (!shareId) {
      return NextResponse.json({ error: 'Missing share ID' }, { status: 400 })
    }

    // Fetch cheat sheet by share_id
    const { data: cheatSheet, error } = await supabase
      .from('cheat_sheets')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error || !cheatSheet) {
      return NextResponse.json({ error: 'Cheat sheet not found' }, { status: 404 })
    }

    // Use content_json if available, fallback to data column
    const content = cheatSheet.content_json || cheatSheet.data

    return NextResponse.json({
      id: cheatSheet.id,
      title: cheatSheet.title,
      theme: cheatSheet.theme,
      sheet_type: cheatSheet.sheet_type,
      content_json: content,
      user_id: cheatSheet.user_id,
      created_at: cheatSheet.created_at,
    })
  } catch (error) {
    console.error('Error fetching cheat sheet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cheat sheet' },
      { status: 500 }
    )
  }
}
