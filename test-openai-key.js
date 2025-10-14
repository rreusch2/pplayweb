// Quick test to verify OpenAI API key works
const fetch = require('node-fetch');

async function testOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set');
    return;
  }
  
  console.log('🔑 Testing OpenAI API key:', apiKey.substring(0, 20) + '...');
  
  // Test 1: Basic API call
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ OpenAI API key is valid');
    } else {
      console.error('❌ OpenAI API key is invalid:', response.status, await response.text());
      return;
    }
  } catch (error) {
    console.error('❌ Error testing API key:', error.message);
    return;
  }
  
  // Test 2: ChatKit API call
  try {
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
      },
      body: JSON.stringify({
        workflow: { id: 'wf_test' },
        user: 'test-user',
      }),
    });
    
    if (response.status === 404) {
      console.log('✅ ChatKit API is accessible (404 = workflow not found, which is expected)');
    } else if (response.status === 401) {
      console.error('❌ ChatKit API returned 401 - Your API key does not have ChatKit beta access');
      console.error('   Go to https://platform.openai.com/settings/organization/limits to check');
    } else {
      console.log(`ℹ️  ChatKit API returned status ${response.status}:`, await response.text());
    }
  } catch (error) {
    console.error('❌ Error testing ChatKit API:', error.message);
  }
}

testOpenAIKey();
