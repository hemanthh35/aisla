/**
 * AISLA AI Service - Multi-Provider AI Functions
 * 
 * Supports both Ollama (local) and Gemini API (cloud)
 * OPTIMIZED FOR SPEED - Uses streaming and parallel generation
 */

import Settings from '../models/Settings.js';

// Default configuration (read at module load - may be undefined for GEMINI_API_KEY)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEXT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const VISION_MODEL = 'llava:latest';

/**
 * Get AI configuration from settings
 * Note: GEMINI_API_KEY is read dynamically to ensure dotenv has loaded
 */
async function getAIConfig() {
    // Read Gemini API key dynamically (not at module load time)
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Debug: Show if key is found
    if (!geminiApiKey) {
        console.log('⚠️ [CONFIG] GEMINI_API_KEY not found in process.env');
        console.log('⚠️ [CONFIG] Available env vars with GEMINI:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
    }

    try {
        const settings = await Settings.getAISettings();
        return {
            provider: settings?.provider || 'ollama',
            ollamaUrl: settings?.ollamaUrl || OLLAMA_URL,
            ollamaModel: settings?.ollamaModel || TEXT_MODEL,
            geminiModel: settings?.geminiModel || 'gemini-2.0-flash',
            geminiApiKey: geminiApiKey,  // Read dynamically
            temperature: settings?.temperature || 0.7,
            maxTokens: settings?.maxTokens || 1500
        };
    } catch (error) {
        console.warn('⚠️ Could not load AI settings, using defaults');
        return {
            provider: 'ollama',
            ollamaUrl: OLLAMA_URL,
            ollamaModel: TEXT_MODEL,
            geminiModel: 'gemini-2.0-flash',
            geminiApiKey: geminiApiKey,  // Read dynamically
            temperature: 0.7,
            maxTokens: 1500
        };
    }
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, options = {}) {
    const config = await getAIConfig();

    console.log(`🔑 [Gemini] API Key configured: ${config.geminiApiKey ? 'Yes (' + config.geminiApiKey.substring(0, 10) + '...)' : 'No'}`);

    if (!config.geminiApiKey) {
        console.warn('⚠️ [Gemini] API key not found. Add GEMINI_API_KEY to your .env file');
        return { success: false, error: 'Gemini API key not configured' };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxTokens || 8192,
                        topP: 0.9
                    }
                }),
                signal: AbortSignal.timeout(60000)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return { success: true, text };
    } catch (error) {
        console.error('Gemini call failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Call Ollama API with SPEED optimizations
 * Now uses dynamic settings from database
 */
async function callOllama(model, prompt, systemPrompt = '', options = {}) {
    try {
        // Get dynamic settings from database
        const config = await getAIConfig();
        const ollamaUrl = options.ollamaUrl || config.ollamaUrl || OLLAMA_URL;
        const temperature = options.temperature ?? config.temperature ?? 0.5;
        const maxTokens = options.maxTokens || config.maxTokens || 1500;

        console.log(`🤖 [Ollama] Using URL: ${ollamaUrl}, Model: ${model}, Temp: ${temperature}`);

        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: temperature,
                    num_predict: maxTokens,
                    num_ctx: 2048,      // Smaller context = faster
                    num_thread: 8,      // Use more CPU threads
                    top_k: 20,          // Faster sampling
                    top_p: 0.8,         // Faster sampling
                    repeat_penalty: 1.1
                }
            }),
            signal: AbortSignal.timeout(60000) // 60 second timeout
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, text: data.response };
    } catch (error) {
        console.error('Ollama call failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Parse JSON from AI response
 */
function parseJSON(text) {
    try {
        let cleaned = text
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('JSON parse error:', e.message);
        return null;
    }
}

/**
 * Generate structured experiment content from raw input
 * Uses dynamic AI provider selection from settings
 */
export async function generateExperiment(title, rawContent) {
    console.log(`🧪 [AI] Generating experiment: ${title}`);
    const startTime = Date.now();

    // Get dynamic AI configuration
    const config = await getAIConfig();
    console.log(`🤖 [AI] Using provider: ${config.provider}, model: ${config.provider === 'ollama' ? config.ollamaModel : config.geminiModel}`);

    const prompt = `Create a JSON experiment for: ${title}

INPUT: ${rawContent.substring(0, 1500)}

Return ONLY this JSON (fill each field with 1-3 sentences):
{
"aim": "objective",
"theory": "explanation in 2-3 sentences",
"apparatus": ["item1", "item2"],
"procedure": ["step1", "step2", "step3"],
"keyFormulas": ["formula1"],
"example": "one example",
"observations": "what to observe",
"result": "expected result",
"precautions": ["precaution1"],
"commonMistakes": ["mistake1"],
"realWorldUse": ["application1"],
"summary": "one line summary"
}`;

    const system = `You are a concise science teacher. Return ONLY valid JSON. Be brief but accurate.`;

    // Use the configured provider
    let result;
    console.log(`🔍 [AI] Debug - Provider: ${config.provider}, Gemini Key exists: ${!!config.geminiApiKey}`);

    if (config.provider === 'gemini') {
        if (!config.geminiApiKey) {
            console.error('❌ [AI] Gemini selected but API key not configured! Check GEMINI_API_KEY in .env');
            return { success: false, error: 'Gemini API key not configured. Please add GEMINI_API_KEY to server .env file.' };
        }
        console.log(`🌐 [AI] Calling Gemini API...`);
        result = await callGemini(system + '\n\n' + prompt, { maxTokens: 2000 });
    } else {
        console.log(`🖥️ [AI] Calling Ollama with model: ${config.ollamaModel}...`);
        result = await callOllama(config.ollamaModel, prompt, system, { maxTokens: 1200 });
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ [AI] Generation took ${elapsed}s`);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    let content = parseJSON(result.text);

    // Ensure all fields exist with defaults
    if (content) {
        content = {
            aim: content.aim || `To study ${title}`,
            theory: content.theory || 'Theory content',
            apparatus: content.apparatus || ['Equipment'],
            procedure: content.procedure || ['Step 1'],
            keyFormulas: content.keyFormulas || [],
            example: content.example || 'Example',
            observations: content.observations || 'Observations',
            result: content.result || 'Results',
            precautions: content.precautions || ['Safety first'],
            commonMistakes: content.commonMistakes || ['Be careful'],
            realWorldUse: content.realWorldUse || ['Applications'],
            summary: content.summary || 'Summary'
        };
    } else {
        // Quick fallback
        content = {
            aim: `To study ${title}`,
            theory: rawContent.substring(0, 300),
            apparatus: ['Laboratory equipment'],
            procedure: ['Follow procedure'],
            keyFormulas: [],
            example: 'See content',
            observations: 'Record observations',
            result: 'Analyze results',
            precautions: ['Safety guidelines'],
            commonMistakes: ['Read carefully'],
            realWorldUse: ['Various applications'],
            summary: 'Experiment summary'
        };
    }

    return { success: true, content, elapsed };
}

/**
 * Generate explanation for content based on intent
 * Uses dynamic AI provider selection from settings
 * Intents: simple, detailed, example
 */
export async function generateExplanation(content, intent = 'simple') {
    console.log(`📖 [AI] Generating ${intent} explanation`);

    // Get dynamic AI configuration
    const config = await getAIConfig();

    const prompts = {
        simple: `You are a helpful teacher. Explain this concept in very simple terms that a 10-year-old could understand. 
Use everyday analogies and avoid technical jargon. Make it engaging and easy to remember.

Content to explain:
${content}

Give a clear, simple explanation.`,

        detailed: `You are an expert professor. Provide a comprehensive, detailed technical explanation of this concept.
Include:
- The underlying principles
- Mathematical relationships (if applicable)
- How it works step by step
- Technical details that an advanced student should know

Content to explain:
${content}

Give a thorough, detailed explanation.`,

        example: `You are a practical teacher. Give 3 real-world examples of how this concept is used in everyday life or industry.
For each example:
1. Describe the situation
2. Explain how the concept applies
3. Why it matters

Content to explain:
${content}

Provide practical, relatable examples.`
    };

    const systemPrompts = {
        simple: 'You are a friendly, patient teacher who makes complex topics simple and fun.',
        detailed: 'You are an expert professor with deep technical knowledge.',
        example: 'You are a practical instructor who connects theory to real-world applications.'
    };

    // Use the configured provider
    let result;
    if (config.provider === 'gemini' && config.geminiApiKey) {
        result = await callGemini(systemPrompts[intent] + '\n\n' + prompts[intent], { maxTokens: 2000 });
    } else {
        result = await callOllama(
            config.ollamaModel,
            prompts[intent] || prompts.simple,
            systemPrompts[intent] || systemPrompts.simple,
            { maxTokens: 1500 }
        );
    }

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return { success: true, explanation: result.text };
}

/**
 * Stream explanation for content - real-time token streaming
 * Uses dynamic AI provider selection from settings
 * Supports both Ollama and Gemini streaming
 */
export async function streamExplanation(res, content, intent = 'simple') {
    console.log(`📖 [AI] Streaming ${intent} explanation`);

    // Get dynamic AI configuration
    const config = await getAIConfig();
    console.log(`🤖 [AI] Streaming with provider: ${config.provider}`);

    const prompts = {
        simple: 'Explain this in very simple terms. Use everyday examples and analogies.',
        detailed: 'Give a comprehensive technical explanation with all details.',
        example: 'Give 3 real-world examples of how this is used in everyday life.'
    };

    const systemPrompts = {
        simple: 'You are a friendly teacher. Make complex topics simple and fun.',
        detailed: 'You are an expert professor. Give thorough technical explanations.',
        example: 'You are a practical instructor. Connect theory to real-world uses.'
    };

    // Helper to send SSE with flush
    const sendSSE = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (res.flush) res.flush();
    };

    try {
        // Set SSE headers (critical for streaming)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        const model = config.provider === 'gemini' ? config.geminiModel : config.ollamaModel;
        sendSSE({ type: 'START', model, provider: config.provider });

        let fullText = '';
        let tokenCount = 0;

        if (config.provider === 'gemini' && config.geminiApiKey) {
            // Use Gemini streaming
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:streamGenerateContent?alt=sse&key=${config.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `${systemPrompts[intent]}\n\n${prompts[intent]}\n\n${content}` }]
                        }],
                        generationConfig: {
                            temperature: config.temperature,
                            maxOutputTokens: config.maxTokens
                        }
                    })
                }
            );

            if (!geminiResponse.ok) {
                throw new Error(`Gemini error: ${geminiResponse.status}`);
            }

            const reader = geminiResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr || jsonStr === '[DONE]') continue;
                        const data = JSON.parse(jsonStr);
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullText += text;
                            tokenCount++;
                            sendSSE({ type: 'TOKEN', content: text });
                        }
                    } catch { continue; }
                }
            }
        } else {
            // Use Ollama streaming
            const ollamaResponse = await fetch(`${config.ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollamaModel,
                    messages: [
                        { role: 'system', content: systemPrompts[intent] || systemPrompts.simple },
                        { role: 'user', content: `${prompts[intent] || prompts.simple}\n\n${content}` }
                    ],
                    stream: true,
                    options: {
                        temperature: config.temperature,
                        num_predict: config.maxTokens
                    }
                })
            });

            if (!ollamaResponse.ok) {
                throw new Error(`Ollama error: ${ollamaResponse.status}`);
            }

            const reader = ollamaResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            const token = data.message.content;
                            fullText += token;
                            tokenCount++;
                            sendSSE({ type: 'TOKEN', content: token });
                        }
                        if (data.done === true) {
                            sendSSE({ type: 'DONE', tokens: tokenCount, provider: config.provider });
                        }
                    } catch { continue; }
                }
            }
        }

        sendSSE({ type: 'DONE', tokens: tokenCount, provider: config.provider });
        res.end();
        console.log(`✅ [AI] Explanation streamed (${tokenCount} tokens, ${fullText.length} chars)`);

    } catch (error) {
        console.error('Stream explanation error:', error);
        res.write(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`);
        res.end();
    }
}

/**
 * Generate quiz questions from experiment content
 * OPTIMIZED FOR SPEED
 */
export async function generateQuiz(experiment) {
    console.log(`📝 [AI] Generating quiz for: ${experiment.title}`);
    const startTime = Date.now();

    const experimentContent = typeof experiment.content === 'string'
        ? experiment.content
        : JSON.stringify(experiment.content);

    // Get dynamic AI configuration
    const config = await getAIConfig();

    const prompt = `Create 5 MCQ questions for: ${experiment.title}

Content: ${experimentContent.substring(0, 1000)}

Return JSON array:
[{"type":"mcq","question":"Q?","options":["A","B","C","D"],"answer":"A","explanation":"Why"}]

Make questions clear and concise.`;

    // Use the configured provider
    let result;
    if (config.provider === 'gemini' && config.geminiApiKey) {
        result = await callGemini('You are a quiz creator. Return JSON only.\n\n' + prompt, { maxTokens: 1500 });
    } else {
        result = await callOllama(config.ollamaModel, prompt,
            'You are a quiz creator. Return JSON only.',
            { maxTokens: 800 }
        );
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ [AI] Quiz generated in ${elapsed}s`);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    const questions = parseJSON(result.text);

    if (!questions || !Array.isArray(questions)) {
        // Quick fallback
        return {
            success: true,
            questions: [
                {
                    type: 'mcq',
                    question: `What is the main objective of ${experiment.title}?`,
                    options: ['To understand the concept', 'To skip practice', 'To avoid experiments', 'None'],
                    answer: 'To understand the concept',
                    explanation: 'Understanding is the primary goal of any experiment.'
                }
            ]
        };
    }

    return { success: true, questions };
}

/**
 * Evaluate quiz answers
 */
export async function evaluateQuiz(questions, userAnswers) {
    console.log(`✅ [AI] Evaluating ${questions.length} answers`);

    const results = [];
    let correctCount = 0;
    const wrongTopics = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAns = (userAnswers[i] || '').toString().toLowerCase().trim();
        const correctAns = (q.answer || '').toString().toLowerCase().trim();

        const isCorrect = userAns === correctAns;

        if (isCorrect) correctCount++;
        else wrongTopics.push(q.question);

        results.push({
            questionIndex: i,
            isCorrect,
            feedback: isCorrect
                ? `Correct! ${q.explanation || ''}`
                : `Incorrect. The answer is: ${q.answer}. ${q.explanation || ''}`
        });
    }

    const percentage = Math.round((correctCount / questions.length) * 100);

    return {
        success: true,
        evaluation: {
            results,
            correctCount,
            totalQuestions: questions.length,
            percentage,
            overallFeedback: percentage >= 70
                ? 'Great job! You understand this topic well.'
                : percentage >= 50
                    ? 'Good effort! Review the topics you missed.'
                    : 'Keep studying! Focus on the core concepts.',
            topicsToRevise: wrongTopics.slice(0, 3),
            strengths: percentage >= 70 ? ['Good understanding'] : [],
            suggestions: percentage < 70
                ? ['Review theory', 'Practice more', 'Ask questions']
                : ['Try advanced topics']
        }
    };
}

/**
 * Extract text from image using LLaVA
 */
export async function extractTextFromImage(imageBase64) {
    console.log(`🖼️ [AI] Extracting text from image`);

    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: VISION_MODEL,
                prompt: 'Extract all text from this image. Return only the text content.',
                images: [base64Data],
                stream: false,
                options: { temperature: 0.3, num_predict: 2000 }
            })
        });

        if (!response.ok) throw new Error(`LLaVA error: ${response.status}`);

        const data = await response.json();
        return { success: true, text: data.response };
    } catch (error) {
        return { success: false, error: error.message, text: 'OCR failed. Ensure LLaVA is installed.' };
    }
}

/**
 * Generate diagram code from text description
 * Supports: mermaid, graphviz, plantuml, d2, html
 * HTML format uses Gemini API for best results
 */
export async function generateDiagram(description, format = 'mermaid') {
    console.log(`📊 [AI] Generating ${format} diagram`);

    // HTML format - Use Gemini for rich interactive diagrams
    if (format === 'html') {
        return await generateHTMLDiagram(description);
    }

    // Build format-specific prompt for other formats
    let formatPrompt = '';

    if (format === 'mermaid') {
        formatPrompt = `OUTPUT FORMAT: MERMAID.JS

STRICT SYNTAX RULES:
1. Start with diagram type: flowchart TD, flowchart LR, sequenceDiagram, classDiagram, etc.
2. Every node needs an ID and label: A[Label] or B{Decision} or C((Circle))
3. Arrows: --> or --- with optional text |like this|
4. NO spaces in node IDs. Use camelCase or single letters.
5. NO style commands. NO fillcolor. NO shape=. Keep it simple.

VALID EXAMPLE:
flowchart LR
    A[Battery 9V] --> B[Switch]
    B --> C[Resistor 220Ω]
    C --> D[LED]
    D --> E[Ground]

SEQUENCE DIAGRAM EXAMPLE:
sequenceDiagram
    Client->>Server: Request
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: Response`;
    } else if (format === 'graphviz') {
        formatPrompt = `OUTPUT FORMAT: GRAPHVIZ DOT

YOU MUST USE DOT SYNTAX. DO NOT USE MERMAID.

SYNTAX:
digraph NAME {
    rankdir=LR;
    node [shape=box];
    A -> B -> C;
}

CIRCUIT EXAMPLE:
digraph Circuit {
    rankdir=LR;
    node [shape=box, style=rounded];
    
    Battery [label="Battery\\n9V"];
    R1 [label="R1\\n220Ω"];
    LED [label="LED"];
    GND [label="Ground"];
    
    Battery -> R1 -> LED -> GND;
}

FLOWCHART EXAMPLE:
digraph Process {
    rankdir=TB;
    node [shape=box];
    
    Start [shape=ellipse];
    End [shape=ellipse];
    Decision [shape=diamond];
    
    Start -> Input -> Process -> Decision;
    Decision -> Output [label="Yes"];
    Decision -> Process [label="No"];
    Output -> End;
}`;
    } else if (format === 'plantuml') {
        formatPrompt = `OUTPUT FORMAT: PLANTUML

ALWAYS start with @startuml and end with @enduml

SEQUENCE EXAMPLE:
@startuml
actor User
participant "Login" as L
database "DB" as D

User -> L: Enter credentials
L -> D: Validate
D --> L: Result
L --> User: Response
@enduml

CLASS DIAGRAM:
@startuml
class User {
    +name: String
    +email: String
    +login()
}
class Order {
    +id: int
    +total: float
}
User --> Order
@enduml`;
    } else if (format === 'd2') {
        formatPrompt = `OUTPUT FORMAT: D2

Simple arrow syntax with labels.

EXAMPLE:
Battery -> Switch: power
Switch -> Resistor: current
Resistor -> LED: current  
LED -> Ground

FLOWCHART:
Start -> Process -> Decision
Decision -> End: yes
Decision -> Process: no`;
    }

    const systemPrompt = `You are a diagram code generator. Generate ONLY valid ${format.toUpperCase()} code.

${formatPrompt}

CRITICAL RULES:
1. Output ONLY the diagram code - no explanations, no markdown, no code blocks
2. Use the EXACT format specified above
3. Keep it simple and syntactically correct
4. For circuits: show components in current flow order

User wants: ${description}

Generate the ${format} code now:`;

    // Try Gemini first for better diagram generation
    const geminiKey = process.env.GEMINI_API_KEY;
    let result;

    console.log(`🔑 [Diagram] Checking Gemini API Key: ${geminiKey ? 'Found' : 'NOT FOUND'}`);

    if (geminiKey) {
        console.log(`🌐 [AI] Using Gemini for ${format} diagram generation`);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 2048,
                            topP: 0.9
                        }
                    }),
                    signal: AbortSignal.timeout(45000)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [Gemini] API Error: ${response.status} - ${errorText}`);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log(`✅ [Gemini] Generated ${format} diagram (${text.length} chars)`);
            result = { success: true, text };
        } catch (error) {
            console.error(`❌ [Gemini] Error:`, error.message);
            result = { success: false, error: error.message };
        }
    }

    // Fallback to Ollama if Gemini fails or not available
    if (!result?.success) {
        console.log(`🖥️ [AI] Falling back to Ollama for ${format} diagram`);
        result = await callOllama(TEXT_MODEL, systemPrompt, '', {
            temperature: 0.2,
            maxTokens: 1500
        });
    }

    if (!result.success) {
        return { success: false, error: result.error };
    }

    // Clean the response
    let diagramCode = result.text
        .replace(/```[\w]*\n?/gi, '')
        .replace(/```/g, '')
        .replace(/^Here['']?s.*:\n?/gim, '')
        .replace(/^The .*code.*:\n?/gim, '')
        .trim();

    // Basic validation
    if (format === 'mermaid' && !diagramCode.match(/^(flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|pie|gantt)/m)) {
        // Try to fix by adding flowchart header
        if (diagramCode.includes('-->') || diagramCode.includes('->')) {
            diagramCode = 'flowchart TD\n    ' + diagramCode.split('\n').join('\n    ');
        }
    }

    if (format === 'plantuml' && !diagramCode.includes('@startuml')) {
        diagramCode = '@startuml\n' + diagramCode + '\n@enduml';
    }

    if (format === 'graphviz' && !diagramCode.includes('digraph') && !diagramCode.includes('graph')) {
        diagramCode = 'digraph G {\n    rankdir=LR;\n    ' + diagramCode.split('\n').join('\n    ') + '\n}';
    }

    return { success: true, code: diagramCode, format };
}

/**
 * Generate interactive HTML diagram using Gemini API
 * Creates beautiful, animated SVG-based visualizations
 */
async function generateHTMLDiagram(description) {
    console.log(`🎨 [AI] Generating HTML diagram with Gemini`);

    const htmlPrompt = `You are an expert web developer and diagram designer. Create a complete, self-contained HTML page that visualizes this diagram:

"${description}"

REQUIREMENTS:
1. Create a COMPLETE standalone HTML document with inline CSS and optional inline JavaScript
2. Use SVG for the diagram graphics - SVG is preferred for crisp, scalable diagrams
3. Style it with a modern dark theme (dark background, light text, vibrant accent colors)
4. Add subtle CSS animations for visual appeal (hover effects, transitions, gentle pulses)
5. Make it responsive and centered on the page
6. Include labels and connection lines/arrows between elements
7. Use a professional color palette (blues, purples, cyans work well on dark backgrounds)

DESIGN GUIDELINES:
- Background: Dark (#0a0a0f or similar)
- Text: Light (#e4e4e7 or white)
- Accents: Vibrant colors (#6366f1 indigo, #8b5cf6 purple, #06b6d4 cyan, #22c55e green)
- Borders: Subtle glows or gradients
- Shapes: Rounded rectangles, circles, or appropriate shapes for the diagram type
- Arrows/Lines: Styled with markers, gradual gradients

FOR CIRCUIT DIAGRAMS:
- Use proper electrical symbols or labeled boxes
- Show current flow direction with arrows
- Label components with their values (e.g., "220Ω", "9V")
- Use color coding (red for positive, black for negative)

FOR FLOWCHARTS:
- Use rectangles for processes, diamonds for decisions, ovals for start/end
- Connect with arrows showing flow direction
- Color code different types of nodes

FOR SEQUENCE DIAGRAMS:
- Show participants as labeled boxes at the top
- Draw vertical lifelines
- Show messages as horizontal arrows with labels

FOR CLASS/ER DIAGRAMS:
- Show entities/classes as labeled rectangles with attributes
- Show relationships with labeled connecting lines

OUTPUT:
Return ONLY the complete HTML code starting with <!DOCTYPE html> and ending with </html>.
Do NOT include any explanation, markdown, or code blocks - just the raw HTML.
The HTML must be valid and render correctly in a browser.`;

    // Check for Gemini API key - try multiple sources
    const geminiKey = process.env.GEMINI_API_KEY;
    let result;

    console.log(`🔑 [HTML Diagram] Checking Gemini API Key: ${geminiKey ? 'Found (' + geminiKey.substring(0, 10) + '...)' : 'NOT FOUND'}`);

    if (geminiKey) {
        console.log(`🌐 [AI] Using Gemini for HTML diagram generation`);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: htmlPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8192,
                            topP: 0.9
                        }
                    }),
                    signal: AbortSignal.timeout(60000)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [Gemini] API Error: ${response.status} - ${errorText}`);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log(`✅ [Gemini] Generated ${text.length} characters`);
            result = { success: true, text };
        } catch (error) {
            console.error(`❌ [Gemini] Error:`, error.message);
            result = { success: false, error: error.message };
        }
    } else {
        console.warn(`⚠️ [AI] GEMINI_API_KEY not found in environment variables!`);
        console.warn(`⚠️ [AI] Please add GEMINI_API_KEY to your .env file`);
    }

    // Fallback to Ollama if Gemini fails or not available
    if (!result?.success) {
        console.log(`🖥️ [AI] Falling back to Ollama for HTML diagram`);
        result = await callOllama(TEXT_MODEL, htmlPrompt, '', {
            temperature: 0.7,
            maxTokens: 4000
        });
    }

    if (!result.success) {
        return { success: false, error: result.error };
    }

    // Clean and validate HTML
    let htmlCode = result.text
        .replace(/```html\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    // Ensure it starts with DOCTYPE or html
    if (!htmlCode.toLowerCase().startsWith('<!doctype') && !htmlCode.toLowerCase().startsWith('<html')) {
        // Try to extract HTML from the response
        const htmlMatch = htmlCode.match(/<!DOCTYPE[\s\S]*<\/html>/i) ||
            htmlCode.match(/<html[\s\S]*<\/html>/i);
        if (htmlMatch) {
            htmlCode = htmlMatch[0];
        } else {
            // Wrap content in a basic HTML structure
            htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Diagram</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            min-height: 100vh; 
            background: linear-gradient(135deg, #0a0a0f 0%, #12121a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #e4e4e7;
            padding: 2rem;
        }
        .diagram-container {
            background: rgba(20, 20, 30, 0.8);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .diagram-title {
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            color: #c4b5fd;
        }
        .diagram-content {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: center;
            align-items: center;
        }
        .node {
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 10px;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .node:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        .arrow {
            font-size: 1.5rem;
            color: #6366f1;
        }
    </style>
</head>
<body>
    <div class="diagram-container">
        <h2 class="diagram-title">${description}</h2>
        <div class="diagram-content">
            ${htmlCode}
        </div>
    </div>
</body>
</html>`;
        }
    }

    // Ensure </html> tag exists
    if (!htmlCode.toLowerCase().includes('</html>')) {
        htmlCode += '\n</html>';
    }

    console.log(`✅ [AI] HTML diagram generated (${htmlCode.length} bytes)`);
    return { success: true, code: htmlCode, format: 'html' };
}


/**
 * Generate test cases for a coding problem
 */
export async function generateTestCases(problemStatement, language = 'python') {
    console.log(`🧪 [AI] Generating test cases for ${language}`);

    const prompt = `Generate 5 test cases for this coding problem:

${problemStatement}

Return a JSON array with this format:
[
    {"input": "test input 1", "expectedOutput": "expected output 1", "description": "what this tests"},
    {"input": "test input 2", "expectedOutput": "expected output 2", "description": "what this tests"}
]

Include:
- Edge cases (empty input, single element, etc.)
- Normal cases
- Large input case

Return ONLY the JSON array, no explanations.`;

    const result = await callOllama(TEXT_MODEL, prompt, 'You are a test case generator. Return only valid JSON.', { maxTokens: 800 });

    if (!result.success) {
        return { success: false, error: result.error, testCases: [] };
    }

    const testCases = parseJSON(result.text);

    if (!testCases || !Array.isArray(testCases)) {
        // Fallback test cases
        return {
            success: true,
            testCases: [
                { input: "[]", expectedOutput: "[]", description: "Empty input" },
                { input: "[1]", expectedOutput: "[1]", description: "Single element" },
                { input: "[1,2,3]", expectedOutput: "[1,2,3]", description: "Normal case" }
            ]
        };
    }

    return { success: true, testCases };
}

/**
 * Stream code suggestions (hints without direct answers)
 */
export async function streamCodeSuggestion(res, problemStatement, code, language = 'python') {
    console.log(`💡 [AI] Streaming code suggestion for ${language}`);

    const systemPrompt = `You are a helpful coding tutor. Provide hints and guidance WITHOUT giving direct code answers.
- Point out logical issues or edge cases
- Suggest algorithmic approaches
- Ask guiding questions
- Encourage the student to think through the problem
Do NOT write the solution code for them.`;

    const userPrompt = `Problem: ${problemStatement}

Student's current code (${language}):
\`\`\`${language}
${code}
\`\`\`

Provide helpful hints and suggestions to guide them toward the solution.`;

    // Helper to send SSE
    const sendSSE = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (res.flush) res.flush();
    };

    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        sendSSE({ type: 'START', model: TEXT_MODEL });

        const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: true,
                options: { temperature: 0.7, num_predict: 1000 }
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama error: ${ollamaResponse.status}`);
        }

        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();
        let tokenCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        tokenCount++;
                        sendSSE({ type: 'TOKEN', content: data.message.content });
                    }
                    if (data.done === true) {
                        sendSSE({ type: 'DONE', tokens: tokenCount });
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        res.end();
    } catch (error) {
        console.error('Stream code suggestion error:', error);
        res.write(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`);
        res.end();
    }
}

/**
 * Analyze code complexity (Big-O notation)
 */
export async function analyzeCodeComplexity(code, language = 'python') {
    console.log(`📊 [AI] Analyzing code complexity`);

    const prompt = `Analyze this ${language} code and determine its time and space complexity:

\`\`\`${language}
${code}
\`\`\`

Return a JSON object:
{
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "explanation": "Brief explanation of the analysis",
    "bottleneck": "The operation that causes the complexity"
}

Return ONLY the JSON, no other text.`;

    const result = await callOllama(TEXT_MODEL, prompt, 'You are an algorithm complexity analyzer. Return only valid JSON.', { maxTokens: 500 });

    if (!result.success) {
        return {
            success: false,
            timeComplexity: 'Unknown',
            spaceComplexity: 'Unknown',
            explanation: 'Failed to analyze: ' + result.error
        };
    }

    const analysis = parseJSON(result.text);

    if (!analysis) {
        return {
            success: true,
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(1)',
            explanation: 'Analysis could not be parsed. Please review manually.',
            bottleneck: 'Unknown'
        };
    }

    return {
        success: true,
        timeComplexity: analysis.timeComplexity || 'Unknown',
        spaceComplexity: analysis.spaceComplexity || 'Unknown',
        explanation: analysis.explanation || 'No explanation available',
        bottleneck: analysis.bottleneck || 'Not identified'
    };
}

export default {
    generateExperiment,
    generateExplanation,
    streamExplanation,
    generateQuiz,
    evaluateQuiz,
    extractTextFromImage,
    generateDiagram,
    generateTestCases,
    streamCodeSuggestion,
    analyzeCodeComplexity
};

