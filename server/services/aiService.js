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
        { maxTokens: 1500 }
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

        // Send start event
        sendSSE({ type: 'START', model: TEXT_MODEL });

        // Use /api/chat for streaming (same as chat service)
        const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompts[intent] || systemPrompts.simple },
                    { role: 'user', content: `${prompts[intent] || prompts.simple}\n\n${content}` }
                ],
                stream: true,
                options: {
                    temperature: 0.7,
                    num_predict: 1500
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

                    // Extract token from chat response
                    if (data.message?.content) {
                        const token = data.message.content;
                        fullText += token;
                        tokenCount++;

                        // Send token immediately
                        sendSSE({ type: 'TOKEN', content: token });
                    }

                    // Check if complete
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
 */
export async function generateDiagram(description, format = 'mermaid') {
    console.log(`📊 [AI] Generating ${format} diagram`);

    // Build format-specific prompt
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

    const result = await callAI(systemPrompt, '', {
        temperature: 0.8,
        maxTokens: 800  // REDUCED from 1500 for speed
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
    generateDiagram,
    generateTestCases,
    streamCodeSuggestion,
    analyzeCodeComplexity
};

