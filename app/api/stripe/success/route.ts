import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const sessionId = searchParams.get('session_id')
    const clientReferenceId = searchParams.get('client_reference_id')
    
    console.log('🎉 Stripe success callback:', { sessionId, clientReferenceId })
    
    if (!sessionId) {
      console.error('❌ No session_id provided')
      return NextResponse.redirect(new URL('/dashboard?error=no_session', request.url))
    }

    // Here you would normally verify the session with Stripe and update user subscription
    // For now, we'll redirect to the dashboard with success indication
    
    console.log('✅ Stripe payment successful, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard?payment=success', request.url))
    
  } catch (error) {
    console.error('❌ Error in Stripe success handler:', error)
    return NextResponse.redirect(new URL('/dashboard?error=payment_error', request.url))
  }
}
