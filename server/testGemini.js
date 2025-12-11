// Quick test for Gemini API
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('Testing Gemini API...\n');
    console.log('API Key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 15) + '...' : 'NOT SET');
    console.log('Full Key Length:', process.env.GEMINI_API_KEY?.length);

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is not set!');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try different model names
        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-2.0-pro', 
            'gemini-2.0',
            'gemini-exp-1206',
            'gemini-exp-1121',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash'
        ];
        
        let success = false;
        for (const modelName of modelsToTry) {
            try {
                console.log(`\nTrying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Say "Hello!" and nothing else.');
                const response = await result.response;
                const text = response.text();
                
                console.log(`✅ SUCCESS with ${modelName}!`);
                console.log('Response:', text);
                success = true;
                break;
            } catch (error) {
                if (error.status === 404) {
                    console.log(`❌ Model ${modelName} not found or not supported`);
                } else {
                    console.log(`❌ Error with ${modelName}: ${error.message.substring(0, 100)}`);
                }
            }
        }
        
        if (!success) {
            console.error('\n❌ None of the models worked. Please check:');
            console.error('1. API key is valid and enabled');
            console.error('2. Billing is enabled for Gemini API');
            console.error('3. Models are available in your region');
        }
    } catch (error) {
        console.error('\n❌ INITIALIZATION ERROR:');
        console.error(error.message);
    }
}

testGemini();
