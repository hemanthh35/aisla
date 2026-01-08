/**
 * AISLA Chat Routes - SSE Streaming Endpoints
 * 
 * Provides real-time streaming chat using Server-Sent Events
 */

import express from 'express';
import { streamChat, chat, checkStatus } from '../services/chatService.js';

const router = express.Router();

/**
 * POST /api/chat/stream
 * 
 * Streaming chat endpoint using Server-Sent Events
 * Opens a persistent connection and streams tokens as they're generated
 * 
 * Request body:
 * {
 *   "message": "User's question",
 *   "history": [{ "role": "user|assistant", "content": "..." }]
 * }
 * 
 * SSE Events:
 * - START: Stream initialized
 * - TOKEN: Individual token/word
 * - DONE: Generation complete
 * - ERROR: Error occurred
 */
router.post('/stream', async (req, res) => {
    const { message, history } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            error: 'Message is required',
            code: 'INVALID_MESSAGE'
        });
    }

    console.log(`\n📨 [API] Stream request: "${message.substring(0, 40)}..."`);

    // Handle client disconnect
    req.on('close', () => {
        console.log('🔌 [API] Client disconnected');
    });

    // Stream the response
    await streamChat(req, res, message.trim(), history || []);
});

/**
 * POST /api/chat
 * 
 * Non-streaming chat endpoint (fallback)
 */
router.post('/', async (req, res) => {
    const { message, history } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const result = await chat(message.trim(), history || []);
    res.json(result);
});

/**
 * GET /api/chat/status
 * 
 * Check if Ollama is running and list available models
 */
router.get('/status', async (req, res) => {
    const status = await checkStatus();
    res.json(status);
});

/**
 * GET /api/chat/health
 * 
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AISLA Chat',
        timestamp: new Date().toISOString()
    });
});

export default router;
