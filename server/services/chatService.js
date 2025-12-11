/**
 * AISLA Chat Service - Production Streaming with Ollama
 * 
 * Real-time token-by-token streaming using Server-Sent Events (SSE)
 * Delivers ChatGPT-like streaming experience with Ollama backend
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Configuration for different use cases
 */
const CONFIG = {
    model: DEFAULT_MODEL,
    options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024,  // Max tokens to generate
        num_ctx: 4096,      // Context window
    }
};

/**
 * System prompt for the AI assistant
 */
const SYSTEM_PROMPT = `You are AISLA, an intelligent AI learning assistant. 
You help students understand concepts, solve problems, and learn effectively.
- Provide clear, accurate, and helpful responses
- Use markdown formatting when appropriate (**bold**, *italic*, \`code\`, lists)
- Be encouraging and educational
- Give complete answers without unnecessary padding`;

/**
 * Stream chat response using Server-Sent Events
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {string} message - User's message
 * @param {Array} history - Conversation history
 */
export const streamChat = async (req, res, message, history = []) => {
    // Build messages array for Ollama
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
        })),
        { role: 'user', content: message }
    ];

    console.log(`\n🚀 [STREAM] Starting with model: ${CONFIG.model}`);
    console.log(`📝 [STREAM] Message: "${message.substring(0, 50)}..."`);

    try {
        // ============================================
        // STEP 1: Set SSE Headers (Critical for streaming)
        // ============================================
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();  // Send headers immediately

        // ============================================
        // STEP 2: Send initial event
        // ============================================
        sendSSE(res, {
            type: 'START',
            model: CONFIG.model,
            timestamp: Date.now()
        });

        // ============================================
        // STEP 3: Call Ollama with streaming enabled
        // ============================================
        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.model,
                messages: messages,
                stream: true,  // Enable streaming
                options: CONFIG.options
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama returned ${ollamaResponse.status}: ${ollamaResponse.statusText}`);
        }

        // ============================================
        // STEP 4: Stream tokens to client
        // ============================================
        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';
        let tokenCount = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });

            // Ollama sends JSON objects separated by newlines
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);

                    // Extract token from response
                    if (data.message?.content) {
                        const token = data.message.content;
                        fullResponse += token;
                        tokenCount++;

                        // Send token immediately to client
                        sendSSE(res, {
                            type: 'TOKEN',
                            content: token,
                            index: tokenCount
                        });
                    }

                    // Check if generation is complete
                    if (data.done === true) {
                        // Send completion event
                        sendSSE(res, {
                            type: 'DONE',
                            model: CONFIG.model,
                            totalTokens: tokenCount,
                            totalLength: fullResponse.length,
                            timestamp: Date.now()
                        });
                    }
                } catch (parseError) {
                    // Skip non-JSON lines
                    continue;
                }
            }
        }

        // ============================================
        // STEP 5: Close connection
        // ============================================
        res.end();
        console.log(`✅ [STREAM] Complete: ${tokenCount} tokens, ${fullResponse.length} chars`);

    } catch (error) {
        console.error(`❌ [STREAM] Error: ${error.message}`);

        // Send error event
        sendSSE(res, {
            type: 'ERROR',
            error: error.message,
            timestamp: Date.now()
        });

        res.end();
    }
};

/**
 * Send a Server-Sent Event
 * 
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 */
function sendSSE(res, data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    res.write(payload);

    // Flush immediately (critical for real-time streaming)
    if (res.flush) {
        res.flush();
    }
}

/**
 * Non-streaming chat (fallback)
 */
export const chat = async (message, history = []) => {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
    ];

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.model,
                messages: messages,
                stream: false,
                options: CONFIG.options
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            response: data.message?.content || '',
            model: CONFIG.model
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            response: 'Failed to connect to Ollama. Please ensure Ollama is running.'
        };
    }
};

/**
 * Check Ollama status
 */
export const checkStatus = async () => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            return {
                online: true,
                models: data.models?.map(m => m.name) || []
            };
        }
        return { online: false };
    } catch {
        return { online: false };
    }
};

export default { streamChat, chat, checkStatus };
