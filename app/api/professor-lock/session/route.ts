import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { enqueueProfessorLockSession } from '@/lib/professorLockQueue'

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, preferences } = await req.json()

    if (!userId || !tier) {
      return NextResponse.json({ error: 'userId and tier are required' }, { status: 400 })
    }

    // Check if supabaseAdmin is properly initialized
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not initialized - check SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'SUPABASE_SERVICE_ROLE_KEY missing'
      }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('professor_lock_sessions')
      .insert({
        user_id: userId,
        tier,
        status: 'pending',
        preferences_snapshot: preferences ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create professor lock session', error)
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: error.message 
      }, { status: 500 })
    }

    await enqueueProfessorLockSession({
      sessionId: data.id,
      userId,
      tier,
      preferences: preferences ?? null,
    })

    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    console.error('Professor Lock session error', error)
    return NextResponse.json({ error: 'Unexpected error creating session' }, { status: 500 })
  }
}
