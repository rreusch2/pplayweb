import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/adminAuth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { command } = body as { command?: string }

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ success: false, error: 'Command is required' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized - no token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized - invalid token' }, { status: 401 })
    }

    const hasAccess = await checkAdminAccess(user.id)
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Unauthorized - not an admin' }, { status: 403 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_PY_SCRIPTS_URL || 'https://pyscripts-production.up.railway.app'
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/execute`

    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    })

    const data = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: data?.error || 'Remote execution failed' }, { status: resp.status })
    }

    // Audit log
    await supabase
      .from('admin_logs')
      .insert({
        user_id: user.id,
        command,
        executed_at: new Date().toISOString(),
        success: true,
      })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Predictions run error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}


