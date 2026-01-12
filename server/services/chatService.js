/**
 * AISLA Chat Service - Multi-Provider Streaming Support
 * 
 * Supports both:
 * - Ollama (Local/Offline AI)
 * - Gemini API (Google Cloud AI)
 * 
 * Admin can switch between providers dynamically via settings
 */

import Settings from '../models/Settings.js';

// Default configuration (fallback if DB not connected)
const DEFAULT_CONFIG = {
    provider: 'ollama',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:4b',
    geminiModel: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 1024
};

/**
 * Get current AI settings from database or environment
 */
const getConfig = async () => {
    try {
        const settings = await Settings.getAISettings();
        return {
            ...DEFAULT_CONFIG,
            ...settings,
            geminiApiKey: process.env.GEMINI_API_KEY
        };
    } catch (error) {
        console.warn('⚠️ [CONFIG] Could not load settings from DB, using defaults');
        return {
            ...DEFAULT_CONFIG,
            geminiApiKey: process.env.GEMINI_API_KEY
        };
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
- Give complete answers without unnecessary padding
- **TOPIC RESTRICTION**: ONLY discuss education, science labs, courses, and studies.
- **FORBIDDEN TOPICS**: Do NOT answer questions about cooking, lifestyle, entertainment, or non-educational topics. If asked, politely refuse.`;

/**
 * Send a Server-Sent Event
 */
function sendSSE(res, data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    res.write(payload);
    if (res.flush) res.flush();
}

/**
 * Stream chat using Ollama (Local AI)
 */
async function streamWithOllama(req, res, message, history, config) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
        })),
        { role: 'user', content: message }
    ];

    console.log(`🚀 [OLLAMA] Streaming with model: ${config.ollamaModel}`);

    const ollamaResponse = await fetch(`${config.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config.ollamaModel,
            messages: messages,
            stream: true,
            options: {
                temperature: config.temperature,
                num_predict: config.maxTokens,
                num_ctx: 4096
            }
        })
    });

    if (!ollamaResponse.ok) {
        throw new Error(`Ollama returned ${ollamaResponse.status}: ${ollamaResponse.statusText}`);
    }

    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let tokenCount = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                    const token = data.message.content;
                    fullResponse += token;
                    tokenCount++;

                    sendSSE(res, {
                        type: 'TOKEN',
                        content: token,
                        index: tokenCount
                    });
                }

                if (data.done === true) {
                    sendSSE(res, {
                        type: 'DONE',
                        model: config.ollamaModel,
                        provider: 'ollama',
                        totalTokens: tokenCount,
                        totalLength: fullResponse.length,
                        timestamp: Date.now()
                    });
                }
            } catch {
                continue;
            }
        }
    }

    return { tokenCount, fullResponse };
}

/**
 * Stream chat using Gemini API (Google Cloud)
 */
async function streamWithGemini(req, res, message, history, config) {
    if (!config.geminiApiKey) {
        throw new Error('Gemini API key not configured');
    }

    // Build conversation for Gemini
    const contents = [];

    // Add system instruction as first user message context
    contents.push({
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\nNow, please respond to the following conversation:` }]
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'I understand. I am AISLA, your learning assistant. I will help you with clear, educational responses using proper markdown formatting. How can I help you today?' }]
    });

    // Add history
    for (const h of history.slice(-6)) {
        contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        });
    }

    // Add current message
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    console.log(`🚀 [GEMINI] Streaming with model: ${config.geminiModel}`);

    // Use streaming endpoint
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:streamGenerateContent?alt=sse&key=${config.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: config.temperature,
                    maxOutputTokens: config.maxTokens,
                    topP: 0.9
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let tokenCount = 0;
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;

                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                    fullResponse += text;
                    tokenCount++;

                    sendSSE(res, {
                        type: 'TOKEN',
                        content: text,
                        index: tokenCount
                    });
                }

                // Check if finished
                if (data.candidates?.[0]?.finishReason === 'STOP') {
                    sendSSE(res, {
                        type: 'DONE',
                        model: config.geminiModel,
                        provider: 'gemini',
                        totalTokens: tokenCount,
                        totalLength: fullResponse.length,
                        timestamp: Date.now()
                    });
                }
            } catch {
                continue;
            }
        }
    }

    // Send final DONE if not already sent
    if (fullResponse && tokenCount > 0) {
        sendSSE(res, {
            type: 'DONE',
            model: config.geminiModel,
            provider: 'gemini',
            totalTokens: tokenCount,
            totalLength: fullResponse.length,
            timestamp: Date.now()
        });
    }

    return { tokenCount, fullResponse };
}

/**
 * Stream chat response using Server-Sent Events
 * Automatically selects provider based on admin settings
 */
export const streamChat = async (req, res, message, history = []) => {
    const config = await getConfig();

    console.log(`\n📨 [CHAT] Provider: ${config.provider.toUpperCase()}`);
    console.log(`📝 [CHAT] Message: "${message.substring(0, 50)}..."`);

    try {
        // Set SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        // Send start event
        sendSSE(res, {
            type: 'START',
            provider: config.provider,
            model: config.provider === 'ollama' ? config.ollamaModel : config.geminiModel,
            timestamp: Date.now()
        });

        // Route to appropriate provider
        let result;
        if (config.provider === 'gemini' && config.geminiApiKey) {
            result = await streamWithGemini(req, res, message, history, config);
        } else {
            // Default to Ollama
            result = await streamWithOllama(req, res, message, history, config);
        }

        res.end();
        console.log(`✅ [CHAT] Complete: ${result.tokenCount} tokens, ${result.fullResponse.length} chars`);

    } catch (error) {
        console.error(`❌ [CHAT] Error: ${error.message}`);

        sendSSE(res, {
            type: 'ERROR',
            error: error.message,
            provider: config.provider,
            timestamp: Date.now()
        });

        res.end();
    }
};

/**
 * Non-streaming chat (fallback)
 */
export const chat = async (message, history = []) => {
    const config = await getConfig();

    try {
        if (config.provider === 'gemini' && config.geminiApiKey) {
            // Gemini non-streaming
            const contents = history.slice(-4).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents })
                }
            );

            if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return {
                success: true,
                response: text,
                model: config.geminiModel,
                provider: 'gemini'
            };

        } else {
            // Ollama non-streaming
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message }
            ];

            const response = await fetch(`${config.ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollamaModel,
                    messages,
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

            const data = await response.json();
            return {
                success: true,
                response: data.message?.content || '',
                model: config.ollamaModel,
                provider: 'ollama'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            response: `Failed to connect to ${config.provider}. Please check your configuration.`,
            provider: config.provider
        };
    }
};

/**
 * Check AI provider status
 */
export const checkStatus = async () => {
    const config = await getConfig();

    const status = {
        activeProvider: config.provider,
        ollama: { online: false, models: [] },
        gemini: { configured: false }
    };

    // Check Ollama
    try {
        const response = await fetch(`${config.ollamaUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            const data = await response.json();
            status.ollama = {
                online: true,
                models: data.models?.map(m => m.name) || [],
                activeModel: config.ollamaModel
            };
        }
    } catch {
        status.ollama = { online: false };
    }

    // Check Gemini
    status.gemini = {
        configured: !!config.geminiApiKey,
        activeModel: config.geminiModel
    };

    return status;
};

export default { streamChat, chat, checkStatus };
