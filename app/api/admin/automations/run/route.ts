import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminAuth'

type RunBody = {
  flow_key: string
  payload?: any
}

function getWebhookUrl(flowKey: string): string | null {
  const specific = process.env[`N8N_WEBHOOK_URL_${flowKey.toUpperCase()}`]
  if (specific) return specific

  const base = process.env.N8N_WEBHOOK_BASE_URL
  if (!base) return null
  // Default n8n webhook path convention
  const prefix = process.env.N8N_WEBHOOK_PATH_PREFIX || '/webhook'
  return `${base.replace(/\/$/, '')}${prefix}/${flowKey}`
}

function signPayload(secret: string, payload: object): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('hex')
}

export async function POST(req: NextRequest) {
  try {
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

    const body = (await req.json()) as RunBody
    const { flow_key, payload } = body || {}
    if (!flow_key) {
      return NextResponse.json({ success: false, error: 'flow_key is required' }, { status: 400 })
    }

    const webhookUrl = getWebhookUrl(flow_key)
    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: 'n8n webhook URL not configured' }, { status: 500 })
    }

    const signingSecret = process.env.N8N_SIGNING_SECRET || ''
    const startedAt = Date.now()

    // Create a run record (best-effort)
    let runId: string | null = null
    try {
      const { data: runRow } = await supabase
        .from('automation_runs')
        .insert({
          flow_key,
          status: 'started',
          payload_json: payload ?? null,
          created_by: user.id,
        })
        .select('id')
        .single()
      runId = runRow?.id ?? null
    } catch (_) {
      // Table might not exist yet; ignore
    }

    const requestPayload = {
      flow_key,
      requested_by: user.id,
      requested_at: new Date(startedAt).toISOString(),
      payload: payload ?? null,
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (signingSecret) {
      headers['x-signature'] = signPayload(signingSecret, requestPayload)
    }

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    })

    const durationMs = Date.now() - startedAt
    const resJson = await (async () => {
      try { return await webhookRes.json() } catch { return { status: webhookRes.status } }
    })()

    // Update run record (best-effort)
    if (runId) {
      try {
        await supabase
          .from('automation_runs')
          .update({
            status: webhookRes.ok ? 'success' : 'failed',
            ended_at: new Date().toISOString(),
            duration_ms: durationMs,
            error_text: webhookRes.ok ? null : (typeof resJson?.error === 'string' ? resJson.error : JSON.stringify(resJson)),
          })
          .eq('id', runId)
      } catch (_) {
        // ignore
      }
    }

    if (!webhookRes.ok) {
      return NextResponse.json({ success: false, error: 'n8n webhook failed', details: resJson }, { status: 502 })
    }

    return NextResponse.json({ success: true, data: resJson, run_id: runId, duration_ms: durationMs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}


