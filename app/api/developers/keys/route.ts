import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check API key limit (max 5 keys per user)
    const { data: existingKeys, error: countError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (countError) {
      return NextResponse.json({ error: 'Failed to check API key limit' }, { status: 500 })
    }

    if (existingKeys && existingKeys.length >= 5) {
      return NextResponse.json({ 
        error: 'API key limit reached. Maximum 5 active keys per account.' 
      }, { status: 400 })
    }

    // Generate secure API key
    const apiKey = generateAPIKey()
    const keyPrefix = apiKey.substring(0, 12) + '...'

    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: apiKey,
        key_prefix: keyPrefix,
        name: name || 'API Key',
        is_active: true,
        current_month_usage: 0
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({ 
      apiKey: newKey,
      fullKey: apiKey // Only time the full key is returned
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('keyId')
    
    if (!keyId) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id) // Ensure user owns the key
    
    if (error) {
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateAPIKey(): string {
  const prefix = 'pk_live_'
  const randomBytes = crypto.randomBytes(24)
  const base64String = randomBytes.toString('base64')
  // Clean up base64 for URL safety
  const cleanString = base64String.replace(/[+/]/g, '').substring(0, 32)
  return prefix + cleanString
}
