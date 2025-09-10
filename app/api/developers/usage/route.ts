import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Get user subscription info
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('api_subscription_tier, api_monthly_limit, api_current_usage')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Get usage data for current month
    const { data: usageData, error: usageError } = await supabase
      .from('api_usage') 
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .order('timestamp', { ascending: false })
    
    if (usageError) {
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // Process daily usage for last 7 days
    const dailyUsage = processDailyUsage(usageData || [])
    
    // Get top endpoints
    const endpointStats = processEndpointStats(usageData || [])

    return NextResponse.json({
      currentUsage: userData?.api_current_usage || 0,
      monthlyLimit: userData?.api_monthly_limit || 1000,
      subscriptionTier: userData?.api_subscription_tier || 'free',
      dailyUsage,
      endpointStats,
      totalCalls: usageData?.length || 0
    })

  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function processDailyUsage(usageData: any[]) {
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayUsage = usageData.filter(call => 
      call.timestamp?.startsWith(dateStr)
    ).length
    
    last7Days.push({
      date: dateStr,
      calls: dayUsage,
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' })
    })
  }
  return last7Days
}

function processEndpointStats(usageData: any[]) {
  const endpointCounts = usageData.reduce((acc, call) => {
    const endpoint = call.endpoint || '/v1/query'
    acc[endpoint] = (acc[endpoint] || 0) + 1
    return acc
  }, {})

  return Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 5) // Top 5 endpoints
}
