// List available Gemini models
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('Attempting to list available models...\n');
        
        const models = await genAI.listModels();
        console.log('Available Models:\n');
        
        for (const model of models.models) {
            console.log(`- ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Description: ${model.description}`);
            console.log(`  Input Token Limit: ${model.inputTokenLimit}`);
            console.log('');
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
