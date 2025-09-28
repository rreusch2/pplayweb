import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Create or update a RevenueCat customer
 * This establishes the user ID mapping for web users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { app_user_id } = body;

    if (!app_user_id) {
      return NextResponse.json(
        { error: 'app_user_id is required' },
        { status: 400 }
      );
    }

    // Get RevenueCat secret API key from environment
    const revenueCatSecretKey = process.env.REVENUECAT_SECRET_KEY;
    
    if (!revenueCatSecretKey) {
      console.error('❌ RevenueCat secret key not configured');
      return NextResponse.json(
        { error: 'RevenueCat not configured' },
        { status: 500 }
      );
    }

    console.log('🔗 Creating RevenueCat customer for user:', app_user_id);

    // Create/update customer via RevenueCat REST API
    const revenueCatResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${app_user_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${revenueCatSecretKey}`,
        'Content-Type': 'application/json',
        'X-Platform': 'web',
      },
      body: JSON.stringify({
        app_user_id: app_user_id,
        // Add any additional customer attributes if needed
        attributes: {
          '$email': null, // Will be set later when we have it
          '$displayName': null,
          'platform': 'web'
        }
      }),
    });

    if (!revenueCatResponse.ok) {
      const errorText = await revenueCatResponse.text();
      console.error('❌ RevenueCat API error:', {
        status: revenueCatResponse.status,
        statusText: revenueCatResponse.statusText,
        error: errorText
      });
      
      // Don't fail if customer already exists
      if (revenueCatResponse.status === 409) {
        console.log('✅ RevenueCat customer already exists for user:', app_user_id);
        return NextResponse.json({ 
          success: true, 
          message: 'Customer already exists',
          app_user_id 
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to create RevenueCat customer', details: errorText },
        { status: revenueCatResponse.status }
      );
    }

    const customerData = await revenueCatResponse.json();
    console.log('✅ RevenueCat customer created successfully:', app_user_id);

    return NextResponse.json({
      success: true,
      customer: customerData,
      app_user_id
    });

  } catch (error) {
    console.error('❌ Error creating RevenueCat customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for checking customer status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const app_user_id = searchParams.get('app_user_id');

    if (!app_user_id) {
      return NextResponse.json(
        { error: 'app_user_id is required' },
        { status: 400 }
      );
    }

    const revenueCatSecretKey = process.env.REVENUECAT_SECRET_KEY;
    
    if (!revenueCatSecretKey) {
      return NextResponse.json(
        { error: 'RevenueCat not configured' },
        { status: 500 }
      );
    }

    // Get customer info from RevenueCat
    const revenueCatResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${app_user_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${revenueCatSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!revenueCatResponse.ok) {
      if (revenueCatResponse.status === 404) {
        return NextResponse.json({ exists: false });
      }
      throw new Error(`RevenueCat API error: ${revenueCatResponse.status}`);
    }

    const customerData = await revenueCatResponse.json();
    
    return NextResponse.json({
      exists: true,
      customer: customerData
    });

  } catch (error) {
    console.error('❌ Error checking RevenueCat customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
