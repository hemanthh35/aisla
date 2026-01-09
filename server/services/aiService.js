/**
 * AISLA AI Service - Gemini + Ollama Powered AI Functions
 * 
 * OPTIMIZED FOR SPEED - Uses Gemini API (fast cloud) with Ollama fallback
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEXT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const VISION_MODEL = 'llava:latest';
const GEMINI_MODEL = 'gemini-2.0-flash';  // Fast Gemini 2.0 model

/**
 * Call Gemini API - FAST cloud AI
 */
async function callGemini(prompt, systemPrompt = '', options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ [GEMINI] No API key configured');
        return { success: false, error: 'Gemini API key not configured' };
    }

    console.log(`🚀 [GEMINI] Calling model: ${GEMINI_MODEL}`);
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.9,
                        maxOutputTokens: options.maxTokens || 1024,
                        topP: 0.95,
                        topK: 20
                    }
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`❌ [GEMINI] API error ${response.status}:`, errorData.substring(0, 200));
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`✅ [GEMINI] Response received in ${elapsed}s (${text.length} chars)`);

        return { success: true, text };
    } catch (error) {
        console.error('❌ [GEMINI] Call failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Call Ollama API with SPEED optimizations (fallback)
 */
async function callOllama(model, prompt, systemPrompt = '', options = {}) {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.5,
                    num_predict: options.maxTokens || 1500,
                    num_ctx: 2048,
                    num_thread: 8,
                    top_k: 20,
                    top_p: 0.8,
                    repeat_penalty: 1.1,
                    ...options
                }
            })
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
 * Smart AI call - Tries Gemini first (fast), falls back to Ollama
 */
async function callAI(prompt, systemPrompt = '', options = {}) {
    // Try Gemini first (much faster - cloud-based)
    if (process.env.GEMINI_API_KEY) {
        console.log('🚀 [AI] Using Gemini API (fast cloud)...');
        const geminiResult = await callGemini(prompt, systemPrompt, options);
        if (geminiResult.success) {
            return geminiResult;
        }
        console.log('⚠️ [AI] Gemini failed, falling back to Ollama...');
    }

    // Fallback to Ollama
    console.log('🔧 [AI] Using Ollama (local)...');
    return await callOllama(TEXT_MODEL, prompt, systemPrompt, options);
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
 * OPTIMIZED: Simplified prompt for SPEED
 */
export async function generateExperiment(title, rawContent) {
    console.log(`🧪 [AI] Generating experiment: ${title}`);
    const startTime = Date.now();

    const prompt = `Generate experiment JSON for: "${title}"

Context: ${rawContent.substring(0, 800)}

JSON format:
{"aim":"1 sentence","theory":"2 sentences","apparatus":["3 items"],"procedure":["3 steps"],"keyFormulas":[],"example":"brief","observations":"brief","result":"brief","precautions":["2 items"],"commonMistakes":["2 items"],"realWorldUse":["2 items"],"summary":"1 sentence"}

Return ONLY valid JSON, no explanation.`;

    const system = `Expert science teacher. Output: valid JSON only. Be concise.`;

    const result = await callAI(prompt, system, { maxTokens: 800, temperature: 0.9 });

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
 * Intents: simple, detailed, example
 */
export async function generateExplanation(content, intent = 'simple') {
    console.log(`📖 [AI] Generating ${intent} explanation`);

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

    const result = await callOllama(
        TEXT_MODEL,
        prompts[intent] || prompts.simple,
        systemPrompts[intent] || systemPrompts.simple,
        { maxTokens: 500 }
    );

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return { success: true, explanation: result.text };
}

/**
 * Stream explanation for content - real-time token streaming
 * Uses the same pattern as the chat service for consistent streaming
 */
export async function streamExplanation(res, content, intent = 'simple') {
    console.log(`📖 [AI] Streaming ${intent} explanation`);

    const prompts = {
        simple: `Explain this concept in 4-5 SHORT bullet points. Each bullet should be ONE clear sentence. No code, no tables, just simple facts.

Content: ${content}

Format:
• Key point 1 (one sentence)
• Key point 2 (one sentence)
• Key point 3 (one sentence)
• Key point 4 (one sentence)`,
        detailed: `Provide a SHORT technical explanation (MAX 150 words). Structure:
1. What it is (1 sentence)
2. How it works (2-3 sentences)
3. Key insight (1 sentence)

Content: ${content}

Keep it CONCISE and focused.`,
        example: `Give 2 SHORT, practical examples (MAX 100 words total). For each:
- What: Brief scenario (5-10 words)
- Why: How concept applies (1 sentence)

Content: ${content}

Keep examples brief and clear.`
    };

    const systemPrompts = {
        simple: 'You are a concise teacher. Output ONLY bullet points. No extra text.',
        detailed: 'You are an expert who explains briefly. MAX 150 words. No fluff.',
        example: 'You are practical. Give 2 SHORT examples. MAX 100 words total.'
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

        const userPrompt = prompts[intent] || prompts.simple;
        const systemPrompt = systemPrompts[intent] || systemPrompts.simple;

        // 1. Try Gemini Streaming (FAST CLOUD)
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                console.log(`🚀 [AI] Using Gemini Streaming for Explanation...`);
                sendSSE({ type: 'START', model: GEMINI_MODEL });

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 500
                            }
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`Gemini stream error: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let tokenCount = 0;
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    let openBrace = buffer.indexOf('{');
                    while (openBrace !== -1) {
                        let nesting = 0;
                        let closeBrace = -1;
                        for (let i = openBrace; i < buffer.length; i++) {
                            if (buffer[i] === '{') nesting++;
                            else if (buffer[i] === '}') nesting--;

                            if (nesting === 0) {
                                closeBrace = i;
                                break;
                            }
                        }

                        if (closeBrace !== -1) {
                            const jsonStr = buffer.substring(openBrace, closeBrace + 1);
                            try {
                                const data = JSON.parse(jsonStr);
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    tokenCount++;
                                    sendSSE({ type: 'TOKEN', content: text });
                                }
                            } catch (e) { }
                            buffer = buffer.substring(closeBrace + 1);
                            openBrace = buffer.indexOf('{');
                        } else {
                            break;
                        }
                    }
                }

                sendSSE({ type: 'DONE', tokens: tokenCount });
                res.end();
                console.log(`✅ [AI] Gemini streamed ${tokenCount} chunks`);
                return;

            } catch (geminiError) {
                console.error('⚠️ [AI] Gemini streaming failed, falling back to local model:', geminiError.message);
            }
        }

        // 2. Fallback to Ollama
        console.log(`🔧 [AI] Using Ollama (Local) for Explanation...`);
        sendSSE({ type: 'START', model: TEXT_MODEL });

        const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `${userPrompt}\n\n${content}` }
                ],
                stream: true,
                options: {
                    temperature: 0.7,
                    num_predict: 400,
                    top_p: 0.9,
                    top_k: 40
                }
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama error: ${ollamaResponse.status}`);
        }

        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
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
                        const token = data.message.content;
                        fullText += token;
                        tokenCount++;
                        sendSSE({ type: 'TOKEN', content: token });
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
        console.log(`✅ [AI] Explanation streamed (${tokenCount} tokens, ${fullText.length} chars)`);

    } catch (error) {
        console.error('Stream explanation error:', error);
        res.write(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`);
        res.end();
    }
}

/**
 * Generate quiz questions from experiment content
 * OPTIMIZED FOR SPEED - Uses Gemini API (faster than Ollama)
 */
export async function generateQuiz(experiment) {
    console.log(`📝 [AI] Generating quiz for: ${experiment.title}`);
    const startTime = Date.now();

    const experimentContent = typeof experiment.content === 'string'
        ? experiment.content
        : JSON.stringify(experiment.content);

    // OPTIMIZED: Shorter prompt, less content, focus on essentials
    const prompt = `Generate 5 MCQ questions for: "${experiment.title}"

Content: ${experimentContent.substring(0, 600)}

JSON format: [{"type":"mcq","question":"Q?","options":["A","B","C","D"],"answer":"A","explanation":"brief"}]

Return valid JSON only.`;

    const result = await callAI(prompt,
        'Quiz expert. Output: JSON array only.',
        { maxTokens: 600, temperature: 0.9 }  // FAST settings
    );

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ [AI] Quiz generated in ${elapsed}s`);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    const questions = parseJSON(result.text);

    if (!questions || !Array.isArray(questions) || questions.length < 3) {
        // Robust fallback with 5 basic questions
        return {
            success: true,
            questions: [
                {
                    type: 'mcq',
                    question: `What is the primary focus of this experiment on ${experiment.title}?`,
                    options: ['To analyze the underlying theoretical concepts', 'To demonstrate practical applications', 'Both A and B', 'None of the above'],
                    answer: 'Both A and B',
                    explanation: 'Experiments typically aim to connect theory with practice.'
                },
                {
                    type: 'mcq',
                    question: `Which safety precaution is most important for ${experiment.title}?`,
                    options: ['Wearing appropriate protective gear', 'Working quickly to finish sooner', 'Ignoring instructions', 'Eating in the lab'],
                    answer: 'Wearing appropriate protective gear',
                    explanation: 'Safety is always the top priority in any experimental setting.'
                },
                {
                    type: 'mcq',
                    question: `What kind of data is primarily collected in this experiment?`,
                    options: ['Quantitative measurements', 'Qualitative observations', 'Both quantitative and qualitative', 'Random interactions'],
                    answer: 'Both quantitative and qualitative',
                    explanation: 'Most experiments involve recording both numerical data and observational notes.'
                },
                {
                    type: 'mcq',
                    question: `Why is accuracy important in ${experiment.title}?`,
                    options: ['To ensure reproducible results', 'To look professional', 'It is not important', 'To waste time'],
                    answer: 'To ensure reproducible results',
                    explanation: 'Accuracy allows others to verify and reproduce your scientific findings.'
                },
                {
                    type: 'mcq',
                    question: `What is a common source of error in this type of experiment?`,
                    options: ['Instrumental limitations', 'Perfect conditions', 'Theory being wrong', 'All of the above'],
                    answer: 'Instrumental limitations',
                    explanation: 'Real-world equipment always has some degree of uncertainty or limitation.'
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
 * Extract text from image using Gemini Vision (fast/accurate)
 */
export async function extractTextFromImage(imageBase64) {
    console.log(`🖼️ [AI] Extracting text from image`);

    // Try Gemini Vision first
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        try {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Extract all text from this image exactly as written. If it's a scientific experiment, preserve the structure (Aim, Procedure, etc.)." },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Data
                                    }
                                }
                            ]
                        }]
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                return { success: true, text };
            }
        } catch (err) {
            console.error('Gemini Vision failed:', err);
        }
    }

    // Fallback to LLaVA (local)
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
 * Extract text from PDF using Gemini (High context/accuracy)
 */
export async function extractTextFromPDF(pdfBase64) {
    console.log(`📄 [AI] Extracting text from PDF`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'Gemini API key required for PDF parsing' };
    }

    try {
        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Read this PDF document and extract the core content of the experiment. Focus on the Aim, Apparatus, Theory, and Procedure. Return the extracted text in a clean, readable format suitable for a lab manual." },
                            {
                                inline_data: {
                                    mime_type: "application/pdf",
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini PDF error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return { success: true, text };
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate diagram code from text description
 */
export async function generateDiagram(description, format = 'mermaid') {
    console.log(`📊 [AI] Generating ${format} diagram`);

    // Build format-specific prompt
    let formatPrompt = '';

    if (format === 'mermaid') {
        formatPrompt = `OUTPUT FORMAT: MERMAID FLOWCHART

CRITICAL SYNTAX RULES:
1. Start with EXACTLY: flowchart TD
2. NEVER use "digraph", "graph {", or "{ }" blocks.
3. Node IDs: Simple IDs (A, B, C)
4. Labels MUST be in double quotes if they contain special characters: A["Label (Text)"]
5. Connections: A --> B
6. FORBIDDEN: Do not use Rankdir, node [shape=box], or [label="..."] syntax.

STYLISH COLOR CLASSES:
classDef primary fill:#6366f1,stroke:#4338ca,color:#fff
classDef secondary fill:#06b6d4,stroke:#0891b2,color:#fff
classDef success fill:#10b981,stroke:#059669,color:#fff
classDef warning fill:#f59e0b,stroke:#d97706,color:#fff

EXAMPLE:
flowchart TD
    A["Start"] --> B["Process"]
    B --> C["End"]
    class A primary
    class B,C secondary`;
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

    const systemPrompt = `You are a professional diagram code generator. Your task is to transform technical concepts, formulas, or processes into a VALID ${format.toUpperCase()} diagram.

${formatPrompt}

CRITICAL RULES:
1. Output ONLY the diagram code - no explanations, no markdown (\`\`\`), no text preamble.
2. Use ONLY the EXACT format specified above.
3. If the user provides a formula or simple statement, represent it as nodes and arrows (e.g., A["Input"] --> B["Calculation"] --> C["Result"]).
4. Keep it SIMPLE and syntactically correct.
5. NEVER use the ampersand (&) symbol to combine nodes; use separate lines instead.
6. NO semicolons (;) at the end of lines.
7. Use classDef and class ONLY as shown in the EXAMPLE for colorful diagrams.
8. Every line MUST be valid ${format} syntax.
9. If you generate a flowchart, it MUST start with "flowchart TD" or "flowchart LR".

User request: ${description}

Generate clean, valid, and COLORFUL ${format} code now:`;

    const result = await callAI(systemPrompt, '', {
        temperature: 0.2, // Lower temperature for more consistent syntax
        maxTokens: 800
    });

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

    // Clean up common Mermaid syntax errors
    if (format === 'mermaid') {
        // DETECT AND FIX GRAPHVIZ HALLUCINATIONS
        if (diagramCode.includes('digraph') || diagramCode.includes('rankdir')) {
            console.log('⚠️ [AI] Detected Graphviz syntax in Mermaid request, attempting conversion...');

            // Extract labels like A[label="Start"] -> A["Start"]
            diagramCode = diagramCode.replace(/([A-Z0-9]+)\s*\[\s*label\s*=\s*"([^"]+)"\s*\]/gi, '$1["$2"]');

            // Remove Graphviz headers
            diagramCode = diagramCode.replace(/digraph\s+\w+\s*\{/gi, '');
            diagramCode = diagramCode.replace(/graph\s*\[[^\]]+\]/gi, '');
            diagramCode = diagramCode.replace(/node\s*\[[^\]]+\]/gi, '');
            diagramCode = diagramCode.replace(/rankdir\s*=\s*\w+;?/gi, '');
            diagramCode = diagramCode.replace(/[\{\}]/g, '');

            // Change -> to -->
            diagramCode = diagramCode.replace(/->/g, '-->');

            // Add flowchart TD header if missing
            if (!diagramCode.trim().startsWith('flowchart')) {
                diagramCode = 'flowchart TD\n' + diagramCode;
            }
        }

        // Remove semicolons at end of lines
        diagramCode = diagramCode.replace(/;$/gm, '');

        // Quote labels with special characters in [ ]
        diagramCode = diagramCode.replace(/\[([^"\]]+[\/\(\)][^"\]]*)\]/g, '["$1"]');

        // Fix & combinations (replace with separate lines)
        const ampersandPattern = /^\s*([A-Za-z0-9]+(?:\s*&\s*[A-Za-z0-9]+)+)\s*(-->|---)\s*(.+)$/gm;
        diagramCode = diagramCode.replace(ampersandPattern, (match, nodes, arrow, target) => {
            const nodeList = nodes.split('&').map(n => n.trim());
            return nodeList.map(node => `    ${node} ${arrow} ${target}`).join('\n');
        });

        // Ensure proper indentation
        const lines = diagramCode.split('\n');
        if (lines.length > 0 && lines[0].trim().startsWith('flowchart')) {
            diagramCode = lines[0].trim() + '\n' +
                lines.slice(1)
                    .filter(l => l.trim())
                    .map(l => l.trim().startsWith('class') || l.trim().startsWith('style') ? '    ' + l.trim() : '    ' + l.trim())
                    .join('\n');
        }
    }

    // Basic validation and fallback for Mermaid
    if (format === 'mermaid') {
        const hasMermaidHeader = diagramCode.match(/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|pie|gantt)/m);

        if (!hasMermaidHeader) {
            // If it's just text rows like "A = B", convert to nodes
            const lines = diagramCode.split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .map((l, i) => {
                    if (l.includes('-->') || l.includes('->')) return l;
                    // Otherwise wrap as a node
                    return `Node${i}["${l.replace(/"/g, "'")}"]`;
                });

            // Connect nodes if they aren't connected
            let connectedDiagram = '';
            for (let i = 0; i < lines.length; i++) {
                if (i < lines.length - 1 && !lines[i].includes('-->') && !lines[i + 1].includes('-->')) {
                    connectedDiagram += `    ${lines[i]} --> ${lines[i + 1]}\n`;
                } else {
                    connectedDiagram += `    ${lines[i]}\n`;
                }
            }

            diagramCode = 'flowchart TD\n' + connectedDiagram;
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

    const systemPrompt = `You are a fast, concise coding mentor.
1. **STRICTLY NO DIRECT ANSWERS**: Never write the corrected code for the student.
2. **HINTS ONLY**: If the code is incorrect, provide a short, specific hint or ask a guiding question (max 2 sentences).
3. **FOCUS**: Point out the logic error or syntax issue without fixing it for them.
4. **SUCCESS**: If the code is correct, simply say "Good job! Your code looks correct."`;

    const userPrompt = `Problem: ${problemStatement}

Student's current code (${language}):
\`\`\`${language}
${code}
\`\`\`

Provide short, helpful hints or a "Good job" message.`;

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

        // 1. Try Gemini Streaming (FAST CLOUD)
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                console.log(`🚀 [AI] Using Gemini Streaming for Code Suggestions...`);
                // Send START event
                sendSSE({ type: 'START', model: GEMINI_MODEL });

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 500 // Keep it short
                            }
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`Gemini stream error: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let tokenCount = 0;
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Manual JSON parsing for stream
                    let openBrace = buffer.indexOf('{');
                    while (openBrace !== -1) {
                        // Simple heuristic for JSON objects in stream
                        // We look for the closing brace that balances it
                        let nesting = 0;
                        let closeBrace = -1;
                        for (let i = openBrace; i < buffer.length; i++) {
                            if (buffer[i] === '{') nesting++;
                            else if (buffer[i] === '}') nesting--;

                            if (nesting === 0) {
                                closeBrace = i;
                                break;
                            }
                        }

                        if (closeBrace !== -1) {
                            const jsonStr = buffer.substring(openBrace, closeBrace + 1);
                            try {
                                const data = JSON.parse(jsonStr);
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    tokenCount++;
                                    sendSSE({ type: 'TOKEN', content: text });
                                }
                            } catch (e) {
                                // Ignore
                            }
                            buffer = buffer.substring(closeBrace + 1);
                            openBrace = buffer.indexOf('{');
                        } else {
                            break; // Wait for more data
                        }
                    }
                }

                sendSSE({ type: 'DONE', tokens: tokenCount });
                res.end();
                console.log(`✅ [AI] Gemini streamed ${tokenCount} chunks`);
                return;

            } catch (geminiError) {
                console.error('⚠️ [AI] Gemini streaming failed, falling back to local model:', geminiError.message);
                // Fallback to next method
            }
        }

        // 2. Fallback to Ollama
        console.log(`🔧 [AI] Using Ollama (Local) for Code Suggestions...`);
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
                options: { temperature: 0.7, num_predict: 500 }
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
        console.log(`✅ [AI] Ollama streamed ${tokenCount} tokens`);

    } catch (error) {
        console.error('Code suggestion stream error:', error);
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

/**
 * Generate a complete experiment from just a topic name
 * The AI will create all content including theory, procedure, formulas, etc.
 * @param {string} topicName - The experiment topic/title
 * @param {string} subject - Optional subject area (Physics, Chemistry, etc.)
 * @param {string} difficulty - beginner, intermediate, or advanced
 */
export async function generateExperimentFromTopic(topicName, subject = '', difficulty = 'intermediate') {
    console.log(`🎯 [AI] Generating complete experiment from topic: ${topicName}`);
    const startTime = Date.now();

    const difficultyContext = {
        beginner: 'Use simple language, basic concepts, and straightforward procedures suitable for beginners.',
        intermediate: 'Use standard technical terminology and moderate complexity suitable for students with some background.',
        advanced: 'Include advanced concepts, detailed mathematical derivations, and complex procedures for advanced students.'
    };

    const subjectContext = subject ? `This is a ${subject} experiment.` : '';

    const prompt = `You are an expert science educator. Generate a COMPLETE, DETAILED experiment for the topic: "${topicName}"

${subjectContext}
${difficultyContext[difficulty] || difficultyContext.intermediate}

Create a comprehensive experiment with rich, educational content. Return ONLY valid JSON in this exact format:

{
    "aim": "A clear, detailed objective statement (2-3 sentences explaining what students will learn and achieve)",
    "theory": "Comprehensive theoretical background (4-6 sentences explaining the underlying scientific principles, laws, and concepts. Include relevant definitions and explain why this experiment is important.)",
    "apparatus": ["List", "of", "all", "required", "equipment", "and", "materials", "with", "specifications", "where", "applicable"],
    "procedure": [
        "Step 1: Detailed first step with specific instructions",
        "Step 2: Second step with measurements or observations to note",
        "Step 3: Continue with clear, numbered steps",
        "Step 4: Include timing, quantities, and safety notes where needed",
        "Step 5: Final steps leading to completion"
    ],
    "keyFormulas": [
        "Formula 1 with variable descriptions (e.g., V = IR where V is voltage, I is current, R is resistance)",
        "Additional relevant formulas if applicable"
    ],
    "example": "A worked numerical example showing how to apply the formulas with actual numbers and step-by-step calculations. Include given values, formula application, and final answer with units.",
    "observations": "Detailed description of what students should observe during the experiment. Include expected readings, color changes, reactions, or measurements they should record in their observation table.",
    "result": "Expected results with typical values or ranges. Explain how to interpret the results and what conclusions can be drawn from them.",
    "precautions": [
        "Important safety precaution 1",
        "Handling precaution 2", 
        "Accuracy-related precaution 3",
        "Equipment care precaution 4"
    ],
    "commonMistakes": [
        "Common mistake 1 and how to avoid it",
        "Common mistake 2 and correct approach",
        "Typical error 3 students make"
    ],
    "realWorldUse": [
        "Real-world application 1 explaining where this concept is used in industry or daily life",
        "Application 2 with practical relevance",
        "Application 3 connecting theory to real scenarios"
    ],
    "summary": "A concise 2-3 sentence summary of the experiment, its significance, and key takeaways for students."
}

IMPORTANT: Generate detailed, accurate, educational content. Do not use placeholders. Fill every field with substantive content relevant to "${topicName}".`;

    const system = `You are an experienced science teacher and curriculum designer. Create educational, accurate, and engaging experiment content. Always return valid JSON only, no additional text or markdown.`;

    const result = await callAI(prompt, system, {
        maxTokens: 2500,
        temperature: 0.6
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ [AI] Topic-based generation took ${elapsed}s`);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    let content = parseJSON(result.text);

    // Ensure all fields exist with proper defaults
    if (content) {
        content = {
            aim: content.aim || `To study and understand ${topicName}`,
            theory: content.theory || `This experiment explores the concepts related to ${topicName}. The theoretical background provides foundation for understanding the practical aspects.`,
            apparatus: Array.isArray(content.apparatus) ? content.apparatus : ['Standard laboratory equipment'],
            procedure: Array.isArray(content.procedure) ? content.procedure : ['Follow the standard procedure for this experiment'],
            keyFormulas: Array.isArray(content.keyFormulas) ? content.keyFormulas : [],
            example: content.example || 'See the procedure for a practical example of this experiment.',
            observations: content.observations || 'Record all observations carefully in your lab notebook.',
            result: content.result || 'Analyze your observations and draw conclusions based on the theoretical predictions.',
            precautions: Array.isArray(content.precautions) ? content.precautions : ['Follow all safety guidelines'],
            commonMistakes: Array.isArray(content.commonMistakes) ? content.commonMistakes : ['Read instructions carefully before proceeding'],
            realWorldUse: Array.isArray(content.realWorldUse) ? content.realWorldUse : ['This concept has various real-world applications'],
            summary: content.summary || `This experiment demonstrates key concepts related to ${topicName}.`
        };
    } else {
        // Fallback content structure
        content = {
            aim: `To study and understand ${topicName}`,
            theory: `This experiment covers the fundamental concepts of ${topicName}. Please refer to your textbook for detailed theoretical background.`,
            apparatus: ['Laboratory equipment as required'],
            procedure: ['Follow the standard experimental procedure', 'Record all observations', 'Analyze results'],
            keyFormulas: [],
            example: 'Refer to worked examples in your textbook',
            observations: 'Record observations in tabular format',
            result: 'Compare experimental values with theoretical predictions',
            precautions: ['Handle all equipment carefully', 'Follow safety guidelines'],
            commonMistakes: ['Ensure proper calibration', 'Take multiple readings'],
            realWorldUse: ['Various industrial and scientific applications'],
            summary: `This experiment helps understand ${topicName} through practical demonstration.`
        };
    }

    return { success: true, content, elapsed, generatedFromTopic: true };
}

export default {
    generateExperiment,
    generateExperimentFromTopic,
    generateExplanation,
    streamExplanation,
    generateQuiz,
    evaluateQuiz,
    extractTextFromImage,
    extractTextFromPDF,
    generateDiagram,
    generateTestCases,
    streamCodeSuggestion,
    analyzeCodeComplexity
};

