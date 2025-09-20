import { NextRequest } from 'next/server'
import { checkAdminAccess } from '@/lib/adminAuth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const command = searchParams.get('command') || ''
  const tokenParam = searchParams.get('token') || ''
  if (!command) {
    return new Response('Command is required', { status: 400 })
  }

  const authHeader = req.headers.get('authorization')
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : tokenParam
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const hasAccess = await checkAdminAccess(user.id)
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_PY_SCRIPTS_URL || 'https://pyscripts-production.up.railway.app'
  const target = `${baseUrl.replace(/\/$/, '')}/execute/stream?command=${encodeURIComponent(command)}`

  const upstream = await fetch(target, { method: 'GET', headers: { 'Accept': 'text/event-stream' } })
  if (!upstream.ok) {
    const errTxt = await upstream.text()
    return new Response(errTxt || 'Upstream error', { status: upstream.status })
  }

  const { readable, writable } = new TransformStream()
  upstream.body?.pipeTo(writable)
  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}


