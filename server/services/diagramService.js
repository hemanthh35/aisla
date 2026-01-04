/**
 * Diagram Service - Enhanced diagram code generation
 * Supports: Mermaid, Graphviz (DOT), PlantUML, D2
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEXT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

/**
 * Call Ollama API
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
                    temperature: options.temperature || 0.2,
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
 * Generate Graphviz (DOT) diagram
 */
async function generateGraphviz(description) {
    const systemPrompt = `You are a Graphviz DOT code generator. Generate ONLY valid DOT syntax code.

CRITICAL RULES:
1. Output ONLY the DOT code - no explanations, no markdown, no code blocks
2. Always start with "digraph" or "graph"
3. Use proper DOT syntax with semicolons
4. Keep it simple and syntactically correct

VALID SYNTAX PATTERNS:

FLOWCHART:
digraph Flowchart {
    rankdir=TB;
    node [shape=box, style=rounded, fontname="Arial"];
    
    Start [shape=ellipse, label="Start"];
    Process [label="Process Data"];
    Decision [shape=diamond, label="Valid?"];
    End [shape=ellipse, label="End"];
    
    Start -> Process;
    Process -> Decision;
    Decision -> End [label="Yes"];
    Decision -> Process [label="No"];
}

CIRCUIT:
digraph Circuit {
    rankdir=LR;
    node [shape=box, style=rounded];
    
    Battery [label="Battery\\n9V", shape=circle];
    Switch [label="Switch"];
    Resistor [label="Resistor\\n220Ω"];
    LED [label="LED", shape=triangle];
    Ground [label="Ground", shape=invtriangle];
    
    Battery -> Switch [label="+ wire"];
    Switch -> Resistor;
    Resistor -> LED;
    LED -> Ground [label="- wire"];
}

CLASS DIAGRAM:
digraph Classes {
    rankdir=TB;
    node [shape=record];
    
    User [label="{User|+ name\\l+ email\\l|+ login()\\l+ logout()\\l}"];
    Order [label="{Order|+ id\\l+ total\\l|+ calculate()\\l}"];
    
    User -> Order [label="places"];
}`;

    const userPrompt = `Generate Graphviz DOT code for: ${description}

Output ONLY the DOT code, starting with "digraph" or "graph". No explanations.`;

    const result = await callOllama(TEXT_MODEL, userPrompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 1200
    });

    if (!result.success) {
        return { success: false, error: result.error };
    }

    let code = cleanDiagramCode(result.text);

    // Ensure it starts with digraph or graph
    if (!code.match(/^\s*(di)?graph\s+/i)) {
        code = `digraph G {\n    rankdir=LR;\n    node [shape=box];\n    ${code}\n}`;
    }

    return { success: true, code, format: 'graphviz' };
}

/**
 * Generate PlantUML diagram
 */
async function generatePlantUML(description) {
    const systemPrompt = `You are a PlantUML code generator. Generate ONLY valid PlantUML syntax.

CRITICAL RULES:
1. Output ONLY the PlantUML code - no explanations, no markdown, no code blocks
2. ALWAYS start with @startuml and end with @enduml
3. Use proper PlantUML syntax
4. Keep it simple and syntactically correct

VALID SYNTAX PATTERNS:

SEQUENCE DIAGRAM:
@startuml
actor User
participant "Web App" as App
database "Database" as DB

User -> App: Login Request
App -> DB: Validate Credentials
DB --> App: User Data
App --> User: Login Success
@enduml

CLASS DIAGRAM:
@startuml
class User {
    +String name
    +String email
    +login()
    +logout()
}

class Order {
    +int id
    +float total
    +calculate()
}

User "1" --> "*" Order : places
@enduml

ACTIVITY DIAGRAM:
@startuml
start
:User enters data;
if (Valid?) then (yes)
    :Process data;
    :Save to database;
else (no)
    :Show error;
endif
:End;
stop
@enduml

USE CASE:
@startuml
left to right direction
actor User
rectangle System {
    usecase "Login" as UC1
    usecase "View Profile" as UC2
    usecase "Update Settings" as UC3
}
User --> UC1
User --> UC2
User --> UC3
@enduml`;

    const userPrompt = `Generate PlantUML code for: ${description}

Output ONLY the PlantUML code, starting with @startuml and ending with @enduml. No explanations.`;

    const result = await callOllama(TEXT_MODEL, userPrompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 1200
    });

    if (!result.success) {
        return { success: false, error: result.error };
    }

    let code = cleanDiagramCode(result.text);

    // Ensure it has @startuml and @enduml
    if (!code.includes('@startuml')) {
        code = '@startuml\n' + code;
    }
    if (!code.includes('@enduml')) {
        code = code + '\n@enduml';
    }

    return { success: true, code, format: 'plantuml' };
}

/**
 * Generate D2 diagram
 */
async function generateD2(description) {
    const systemPrompt = `You are a D2 diagram code generator. Generate ONLY valid D2 syntax.

CRITICAL RULES:
1. Output ONLY the D2 code - no explanations, no markdown, no code blocks
2. Use simple arrow syntax: A -> B
3. Add labels with colon: A -> B: label
4. Keep it clean and simple

VALID SYNTAX PATTERNS:

FLOWCHART:
Start -> Process: begin
Process -> Decision: check
Decision -> Success: yes
Decision -> Error: no
Error -> Process: retry
Success -> End

CIRCUIT:
Battery -> Switch: power
Switch -> Resistor: current
Resistor -> LED: current
LED -> Ground: return

SYSTEM ARCHITECTURE:
Client -> LoadBalancer: HTTP request
LoadBalancer -> Server1: distribute
LoadBalancer -> Server2: distribute
Server1 -> Database: query
Server2 -> Database: query
Database -> Server1: results
Database -> Server2: results
Server1 -> Client: response
Server2 -> Client: response

WITH STYLING:
User: {
    shape: person
}
Server: {
    shape: rectangle
}
Database: {
    shape: cylinder
}
User -> Server: request
Server -> Database: query
Database -> Server: data
Server -> User: response`;

    const userPrompt = `Generate D2 code for: ${description}

Output ONLY the D2 code with simple arrow syntax. No explanations.`;

    const result = await callOllama(TEXT_MODEL, userPrompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 1000
    });

    if (!result.success) {
        return { success: false, error: result.error };
    }

    const code = cleanDiagramCode(result.text);

    return { success: true, code, format: 'd2' };
}

/**
 * Generate Mermaid diagram
 */
async function generateMermaid(description) {
    const systemPrompt = `You are a Mermaid.js code generator. Generate ONLY valid Mermaid syntax.

CRITICAL RULES:
1. Output ONLY the Mermaid code - no explanations, no markdown, no code blocks
2. Start with diagram type: flowchart TD, sequenceDiagram, classDiagram, etc.
3. Use proper Mermaid syntax
4. NO style commands, NO fillcolor, NO shape= - keep it simple
5. NEVER use 'end' as a node ID - use 'finish' or 'complete' instead (end is a reserved keyword)
6. NEVER use reserved words as node IDs: end, graph, subgraph, style, class, default

VALID SYNTAX PATTERNS:

FLOWCHART:
flowchart LR
    Start([Start]) --> Process[Process Data]
    Process --> Decision{Valid?}
    Decision -->|Yes| Success[Success]
    Decision -->|No| Error[Error]
    Error --> Process
    Success --> Finish([Finish])

SEQUENCE:
sequenceDiagram
    participant User
    participant App
    participant DB
    User->>App: Login
    App->>DB: Validate
    DB-->>App: User Data
    App-->>User: Success

CLASS:
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Order {
        +int id
        +float total
    }
    User --> Order : places

STATE:
stateDiagram-v2
    [*] --> Pending
    Pending --> Processing
    Processing --> Shipped
    Processing --> Cancelled
    Shipped --> Delivered
    Delivered --> [*]
    Cancelled --> [*]`;

    const userPrompt = `Generate Mermaid.js code for: ${description}

Output ONLY the Mermaid code, starting with the diagram type. No explanations.`;

    const result = await callOllama(TEXT_MODEL, userPrompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 1200
    });

    if (!result.success) {
        return { success: false, error: result.error };
    }

    let code = cleanDiagramCode(result.text);

    // Ensure it starts with a valid diagram type
    const validTypes = ['flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'pie', 'gantt', 'gitGraph'];
    const hasValidType = validTypes.some(type => code.trim().startsWith(type));

    if (!hasValidType) {
        // Try to detect if it's a flowchart based on arrows
        if (code.includes('-->') || code.includes('->')) {
            code = 'flowchart TD\n    ' + code.split('\n').join('\n    ');
        } else {
            code = 'flowchart TD\n' + code;
        }
    }

    // Sanitize Mermaid code to replace reserved keywords
    code = sanitizeMermaidCode(code);

    return { success: true, code, format: 'mermaid' };
}

/**
 * Clean diagram code from AI response
 */
function cleanDiagramCode(text) {
    return text
        .replace(/```[\w]*\n?/gi, '')
        .replace(/```/g, '')
        .replace(/^Here['']?s.*:\n?/gim, '')
        .replace(/^The .*code.*:\n?/gim, '')
        .replace(/^Output:\n?/gim, '')
        .trim();
}

/**
 * Sanitize Mermaid code to replace reserved keywords
 * Mermaid has reserved words like 'end', 'graph', 'subgraph', etc.
 */
function sanitizeMermaidCode(code) {
    // Replace reserved word 'end' when used as a node ID
    // Pattern: end[ or end( at word boundary, but not 'endif' or 'ender' etc.
    let sanitized = code;

    // Replace 'end[' with 'finish[' (node with brackets)
    sanitized = sanitized.replace(/\bend\[/gi, 'finish[');

    // Replace 'end(' with 'finish(' (node with parentheses)
    sanitized = sanitized.replace(/\bend\(/gi, 'finish(');

    // Replace standalone 'end' that's used as a flowchart node (not in 'endif', 'subgraph...end', etc.)
    // Be careful not to replace 'end' keyword for subgraph closing
    sanitized = sanitized.replace(/-->\s*end\s*$/gim, '--> finish');
    sanitized = sanitized.replace(/-->\|[^|]*\|\s*end\s*$/gim, (match) => match.replace(/end\s*$/, 'finish'));

    // Replace 'end' followed by arrow operator
    sanitized = sanitized.replace(/\bend\s*-->/gi, 'finish -->');

    // Replace common reserved words used as node IDs
    const reservedReplacements = [
        { pattern: /\bstart\[/gi, replacement: 'startNode[' },
        { pattern: /\bgraph\[/gi, replacement: 'graphNode[' },
        { pattern: /\bclass\[/gi, replacement: 'classNode[' },
        { pattern: /\bdefault\[/gi, replacement: 'defaultNode[' },
        { pattern: /\bstyle\[/gi, replacement: 'styleNode[' },
    ];

    // Only apply if NOT already using proper format
    // (we want to keep 'Start([Start])' style nodes working)

    return sanitized;
}

/**
 * Main diagram generation function
 */
export async function generateDiagram(description, format = 'mermaid') {
    console.log(`📊 [DiagramService] Generating ${format} diagram`);

    try {
        let result;

        switch (format.toLowerCase()) {
            case 'graphviz':
            case 'dot':
                result = await generateGraphviz(description);
                break;

            case 'plantuml':
            case 'puml':
                result = await generatePlantUML(description);
                break;

            case 'd2':
                result = await generateD2(description);
                break;

            case 'mermaid':
            default:
                result = await generateMermaid(description);
                break;
        }

        if (!result.success) {
            return { success: false, error: result.error };
        }

        console.log(`✅ [DiagramService] ${format} diagram generated successfully`);
        return result;

    } catch (error) {
        console.error(`❌ [DiagramService] Error:`, error);
        return { success: false, error: error.message };
    }
}

export default { generateDiagram };
