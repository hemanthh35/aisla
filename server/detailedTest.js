// Detailed error diagnostic for Gemini API
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function detailedTest() {
    console.log('🔍 DETAILED GEMINI API DIAGNOSTIC\n');
    console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
    console.log('Key Length:', process.env.GEMINI_API_KEY?.length);
    console.log('');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ No API key found!');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Test with the simplest model name
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        console.log('📤 Sending request to gemini-2.0-flash-exp...\n');
        
        const result = await model.generateContent('Say "Hello"');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ SUCCESS!');
        console.log('Response:', text);
        console.log('\n🎉 API is working perfectly!\n');
        
    } catch (error) {
        console.log('❌ DETAILED ERROR INFORMATION:\n');
        console.log('Error Type:', error.constructor.name);
        console.log('Status Code:', error.status || 'N/A');
        console.log('Status Text:', error.statusText || 'N/A');
        console.log('\nFull Error Message:');
        console.log(error.message);
        
        if (error.message.includes('API key not valid')) {
            console.log('\n💡 SOLUTION: The API key is invalid or revoked.');
            console.log('   1. Go to https://aistudio.google.com/app/apikey');
            console.log('   2. Delete the old key');
            console.log('   3. Create a NEW API key');
            console.log('   4. Update .env file');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            console.log('\n💡 SOLUTION: Rate limit reached.');
            console.log('   - Wait a few minutes and try again');
            console.log('   - Or enable billing for higher limits');
        } else if (error.message.includes('404') || error.message.includes('not found')) {
            console.log('\n💡 SOLUTION: Model not available with this API key.');
            console.log('   - The model may require billing enabled');
            console.log('   - Check if "Generative Language API" is enabled');
            console.log('   - Go to: https://console.cloud.google.com/apis/library');
        } else if (error.message.includes('403') || error.message.includes('permission')) {
            console.log('\n💡 SOLUTION: Permission denied.');
            console.log('   1. Go to Google Cloud Console');
            console.log('   2. Enable "Generative Language API"');
            console.log('   3. Make sure billing is enabled');
        }
        
        console.log('\n📋 Quick Checklist:');
        console.log('   ☐ API key is from https://aistudio.google.com/app/apikey');
        console.log('   ☐ Key is less than 24 hours old');
        console.log('   ☐ No extra spaces in .env file');
        console.log('   ☐ Server restarted after updating .env');
        console.log('');
    }
}

detailedTest();
