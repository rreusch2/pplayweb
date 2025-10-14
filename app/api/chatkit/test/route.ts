import { NextResponse } from 'next/server'

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const WORKFLOW_ID = process.env.OPENAI_WORKFLOW_ID
  
  // Check if environment variables are set
  const config = {
    hasApiKey: !!OPENAI_API_KEY,
    apiKeyLength: OPENAI_API_KEY?.length || 0,
    apiKeyPrefix: OPENAI_API_KEY?.substring(0, 7) || 'not set',
    hasWorkflowId: !!WORKFLOW_ID,
    workflowId: WORKFLOW_ID || 'not set',
  }

  // Test the OpenAI API connection
  let apiTest = { success: false, message: '', details: null as any }
  
  if (OPENAI_API_KEY) {
    try {
      // Test basic OpenAI API access first
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      })
      
      if (testResponse.ok) {
        apiTest.success = true
        apiTest.message = 'OpenAI API key is valid'
        
        // Now test ChatKit session creation
        try {
          const sessionResponse = await fetch('https://api.openai.com/v1/chatkit/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'chatkit_beta=v1',
            },
            body: JSON.stringify({
              workflow: { 
                id: WORKFLOW_ID 
              },
              user: 'test-user-' + Date.now(),
            }),
          })
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            apiTest.details = {
              chatkitWorking: true,
              sessionId: sessionData.id,
              hasClientSecret: !!sessionData.client_secret,
            }
          } else {
            const errorText = await sessionResponse.text()
            apiTest.details = {
              chatkitWorking: false,
              error: errorText,
              status: sessionResponse.status,
              statusText: sessionResponse.statusText,
            }
          }
        } catch (chatkitError: any) {
          apiTest.details = {
            chatkitWorking: false,
            error: chatkitError.message,
          }
        }
      } else {
        apiTest.success = false
        apiTest.message = `OpenAI API key appears invalid (status: ${testResponse.status})`
      }
    } catch (error: any) {
      apiTest.success = false
      apiTest.message = `Error testing OpenAI API: ${error.message}`
    }
  } else {
    apiTest.message = 'No OpenAI API key configured'
  }

  return NextResponse.json({
    configuration: config,
    apiTest,
    timestamp: new Date().toISOString(),
    instructions: {
      setup: [
        '1. Make sure OPENAI_API_KEY is set in your .env file',
        '2. Make sure OPENAI_WORKFLOW_ID is set to your Agent Builder workflow ID',
        '3. The workflow ID should look like: asst_xxxxxxxxxxxxx',
        '4. Your OpenAI API key needs ChatKit access (beta feature)',
      ],
      troubleshooting: [
        'If API key is valid but ChatKit fails, you may need ChatKit beta access',
        'Check your Agent Builder dashboard for the correct workflow ID',
        'Ensure your workflow is published and active',
      ]
    }
  })
}
