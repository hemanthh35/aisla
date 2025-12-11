// Test with free tier compatible model
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testFreeTierModel() {
    console.log('Testing with free tier compatible models...\n');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-pro'
    ];
    
    for (const modelName of modelsToTry) {
        try {
            console.log(`\nTrying ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say "Hello AISLA!"');
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log('Response:', text);
            console.log('\n🎉 This model works! Update your code to use:', modelName);
            break;
        } catch (error) {
            console.log(`❌ ${modelName}: ${error.message.substring(0, 80)}...`);
        }
    }
}

testFreeTierModel();
