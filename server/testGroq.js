// Test Groq AI integration
require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    console.log('\n🚀 Testing Groq AI Integration...\n');
    
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.log('❌ GROQ_API_KEY not set!\n');
        console.log('📝 How to get your FREE Groq API Key:');
        console.log('   1. Go to: https://console.groq.com/');
        console.log('   2. Sign up (free)');
        console.log('   3. Go to API Keys section');
        console.log('   4. Click "Create API Key"');
        console.log('   5. Copy the key');
        console.log('   6. Update .env file:\n');
        console.log('      GROQ_API_KEY=gsk_your_key_here\n');
        return;
    }
    
    console.log('✅ API Key found:', apiKey.substring(0, 15) + '...\n');
    
    try {
        const groq = new Groq({ apiKey });
        
        console.log('📤 Sending test request...\n');
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Say "Hello AISLA! Groq is working!" and nothing else.'
                }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        
        const response = completion.choices[0]?.message?.content || '';
        
        console.log('✅ SUCCESS!\n');
        console.log('Response:', response);
        console.log('\n🎉 Groq AI is working perfectly!');
        console.log('📊 Model: llama-3.3-70b-versatile (70B parameters)');
        console.log('⚡ Speed: BLAZING FAST!');
        console.log('💰 Cost: FREE tier included\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 If you see authentication error:');
        console.log('   - Make sure API key starts with "gsk_"');
        console.log('   - No extra spaces in .env file');
        console.log('   - Key is valid and not revoked\n');
    }
}

testGroq();
