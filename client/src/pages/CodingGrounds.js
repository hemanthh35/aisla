// AISLA - Coding Grounds (Online Code Editor) - Full Screen Mode with AI Suggestions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CodingGrounds.css';

// Language configurations
const LANGUAGES = {
    python: {
        id: 'python',
        name: 'Python',
        extension: '.py',
        monaco: 'python',
        version: '3.10.0',
        template: `# Python Code
# Start coding here!

def main():
    print("Hello, World!")
    
if __name__ == "__main__":
    main()
`,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
            </svg>
        )
    },
    javascript: {
        id: 'javascript',
        name: 'JavaScript',
        extension: '.js',
        monaco: 'javascript',
        version: '18.15.0',
        template: `// JavaScript Code
// Start coding here!

function main() {
    console.log("Hello, World!");
}

main();
`,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
            </svg>
        )
    },
    c: {
        id: 'c',
        name: 'C',
        extension: '.c',
        monaco: 'c',
        version: '10.2.0',
        template: `// C Code
// Start coding here!

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.45 15.97L15.45 15.97L15.45 15.97L15.45 15.97C14.52 16.76 13.33 17.25 12 17.25C9.1 17.25 6.75 14.9 6.75 12C6.75 9.1 9.1 6.75 12 6.75C13.33 6.75 14.52 7.24 15.45 8.03L15.97 8.5L18.62 5.85L18.1 5.38C16.52 3.9 14.37 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C14.37 21 16.52 20.1 18.1 18.62L18.62 18.15L15.97 15.5L15.45 15.97Z" />
            </svg>
        )
    },
    cpp: {
        id: 'cpp',
        name: 'C++',
        extension: '.cpp',
        monaco: 'cpp',
        version: '10.2.0',
        template: `// C++ Code
// Start coding here!

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.5 15.97L10.5 15.97L10.5 15.97L10.5 15.97C9.57 16.76 8.38 17.25 7.05 17.25C4.15 17.25 1.8 14.9 1.8 12C1.8 9.1 4.15 6.75 7.05 6.75C8.38 6.75 9.57 7.24 10.5 8.03L11.02 8.5L13.67 5.85L13.15 5.38C11.57 3.9 9.42 3 7.05 3C2.08 3 -1.95 7.03 -1.95 12C-1.95 16.97 2.08 21 7.05 21C9.42 21 11.57 20.1 13.15 18.62L13.67 18.15L11.02 15.5L10.5 15.97ZM18 11H16V9H14V11H12V13H14V15H16V13H18V11ZM24 11H22V9H20V11H18V13H20V15H22V13H24V11Z" />
            </svg>
        )
    },
    java: {
        id: 'java',
        name: 'Java',
        extension: '.java',
        monaco: 'java',
        version: '15.0.2',
        template: `// Java Code
// Start coding here!

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.889 4.832 0 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.189-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639" />
            </svg>
        )
    }
};

// Piston API for code execution
const PISTON_API = 'https://emkc.org/api/v2/piston';

const CodingGrounds = () => {
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const suggestionRef = useRef(null);
    const debounceRef = useRef(null);

    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(LANGUAGES.python.template);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [fontSize, setFontSize] = useState(14);
    const [showSettings, setShowSettings] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [activeTab, setActiveTab] = useState('output');
    const [savedCodes, setSavedCodes] = useState([]);
    const [currentFileName, setCurrentFileName] = useState('untitled');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showFilesPanel, setShowFilesPanel] = useState(false);
    const [lineNumbers, setLineNumbers] = useState([]);

    // AI Suggestion States
    const [problemStatement, setProblemStatement] = useState('');
    const [showProblemInput, setShowProblemInput] = useState(true);
    const [suggestion, setSuggestion] = useState('');
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(true);

    // Test Cases States
    const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', passed: null }]);
    const [showTestCases, setShowTestCases] = useState(false);
    const [runningTests, setRunningTests] = useState(false);
    const [testResults, setTestResults] = useState([]);

    // Complexity Analysis States
    const [complexity, setComplexity] = useState(null);
    const [analyzingComplexity, setAnalyzingComplexity] = useState(false);

    // Performance Metrics
    const [memoryUsage, setMemoryUsage] = useState(null);
    const [performanceScore, setPerformanceScore] = useState(null);

    // Undo/Redo History
    const [codeHistory, setCodeHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Test case generation loading
    const [generatingTests, setGeneratingTests] = useState(false);

    // Update line numbers when code changes
    useEffect(() => {
        const lines = code.split('\n');
        setLineNumbers(lines.map((_, i) => i + 1));
    }, [code]);

    // Load saved codes from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('codingGrounds_savedCodes');
        if (saved) {
            setSavedCodes(JSON.parse(saved));
        }
    }, []);

    // Debounced AI suggestion fetch
    const fetchSuggestion = useCallback(async (currentCode) => {
        if (!problemStatement.trim() || !currentCode.trim() || !aiEnabled) {
            return;
        }

        // Don't fetch if code is just the template
        if (currentCode === LANGUAGES[language].template) {
            return;
        }

        setIsLoadingSuggestion(true);
        setSuggestion('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/code-suggestion-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    problemStatement,
                    code: currentCode,
                    language: LANGUAGES[language].name
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get suggestion');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullSuggestion = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === 'TOKEN') {
                            fullSuggestion += data.content;
                            setSuggestion(fullSuggestion);

                            // Auto-scroll suggestion panel
                            if (suggestionRef.current) {
                                suggestionRef.current.scrollTop = suggestionRef.current.scrollHeight;
                            }
                        } else if (data.type === 'DONE') {
                            setIsLoadingSuggestion(false);
                        } else if (data.type === 'ERROR') {
                            setSuggestion(`⚠️ ${data.error}`);
                            setIsLoadingSuggestion(false);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        } catch (error) {
            setSuggestion('💡 AI suggestions unavailable. Keep coding!');
            setIsLoadingSuggestion(false);
        }
    }, [problemStatement, language, aiEnabled]);

    // Handle code change with debounced AI and history tracking
    const handleCodeChange = (newCode) => {
        setCode(newCode);

        // Track history for undo/redo
        const newHistory = codeHistory.slice(0, historyIndex + 1);
        newHistory.push(newCode);
        if (newHistory.length > 50) newHistory.shift(); // Keep last 50 changes
        setCodeHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce AI calls (wait 2 seconds after user stops typing)
        if (aiEnabled && problemStatement.trim()) {
            debounceRef.current = setTimeout(() => {
                fetchSuggestion(newCode);
            }, 2000);
        }
    };

    // Undo function
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCode(codeHistory[newIndex]);
        }
    };

    // Redo function
    const redo = () => {
        if (historyIndex < codeHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCode(codeHistory[newIndex]);
        }
    };

    // Manual suggestion request
    const requestSuggestion = () => {
        if (problemStatement.trim() && code.trim()) {
            fetchSuggestion(code);
        }
    };

    // Handle language change
    const handleLanguageChange = (langId) => {
        setLanguage(langId);
        setCode(LANGUAGES[langId].template);
        setOutput('');
        setExecutionTime(null);
        setSuggestion('');
    };

    // Execute code using Piston API
    const runCode = async () => {
        setIsRunning(true);
        setOutput('Running...');
        setActiveTab('output');
        const startTime = Date.now();

        try {
            const lang = LANGUAGES[language];
            const response = await fetch(`${PISTON_API}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: lang.id === 'cpp' ? 'c++' : lang.id,
                    version: lang.version,
                    files: [
                        {
                            name: `main${lang.extension}`,
                            content: code
                        }
                    ],
                    stdin: input
                })
            });

            const result = await response.json();
            const endTime = Date.now();
            setExecutionTime(endTime - startTime);

            if (result.run) {
                const outputText = result.run.stdout || result.run.stderr || 'No output';
                setOutput(outputText);
            } else if (result.compile && result.compile.stderr) {
                setOutput(`Compilation Error:\n${result.compile.stderr}`);
            } else {
                setOutput('Error executing code');
            }
        } catch (error) {
            setOutput(`Error: ${error.message}`);
            setExecutionTime(null);
        } finally {
            setIsRunning(false);
        }
    };

    // Save code
    const saveCode = () => {
        setShowSaveModal(true);
    };

    const confirmSave = (fileName) => {
        const newSavedCode = {
            id: Date.now(),
            name: fileName,
            language,
            code,
            problemStatement,
            createdAt: new Date().toISOString()
        };

        const updatedCodes = [...savedCodes, newSavedCode];
        setSavedCodes(updatedCodes);
        localStorage.setItem('codingGrounds_savedCodes', JSON.stringify(updatedCodes));
        setCurrentFileName(fileName);
        setShowSaveModal(false);
    };

    // Load saved code
    const loadSavedCode = (savedCode) => {
        setLanguage(savedCode.language);
        setCode(savedCode.code);
        setCurrentFileName(savedCode.name);
        if (savedCode.problemStatement) {
            setProblemStatement(savedCode.problemStatement);
            setShowProblemInput(false);
        }
        setShowFilesPanel(false);
    };

    // Delete saved code
    const deleteSavedCode = (id) => {
        const updatedCodes = savedCodes.filter(c => c.id !== id);
        setSavedCodes(updatedCodes);
        localStorage.setItem('codingGrounds_savedCodes', JSON.stringify(updatedCodes));
    };

    // Clear code
    const clearCode = () => {
        setCode(LANGUAGES[language].template);
        setOutput('');
        setExecutionTime(null);
        setSuggestion('');
        setComplexity(null);
        setTestResults([]);
    };

    // Run all test cases
    const runTestCases = async () => {
        if (testCases.length === 0) return;

        setRunningTests(true);
        const results = [];
        const lang = LANGUAGES[language];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            if (!testCase.input && !testCase.expectedOutput) continue;

            try {
                const response = await fetch(`${PISTON_API}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: lang.id === 'cpp' ? 'c++' : lang.id,
                        version: lang.version,
                        files: [{ name: `main${lang.extension}`, content: code }],
                        stdin: testCase.input
                    })
                });

                const result = await response.json();
                const actualOutput = (result.run?.stdout || '').trim();
                const expectedOutput = (testCase.expectedOutput || '').trim();
                const passed = actualOutput === expectedOutput;

                results.push({
                    index: i,
                    input: testCase.input,
                    expected: expectedOutput,
                    actual: actualOutput,
                    passed
                });
            } catch (error) {
                results.push({
                    index: i,
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    actual: 'Error',
                    passed: false
                });
            }
        }

        setTestResults(results);
        setRunningTests(false);
    };

    // Add test case
    const addTestCase = () => {
        setTestCases([...testCases, { input: '', expectedOutput: '', passed: null }]);
    };

    // Update test case
    const updateTestCase = (index, field, value) => {
        const updated = [...testCases];
        updated[index][field] = value;
        setTestCases(updated);
    };

    // Remove test case
    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    // Analyze complexity
    const analyzeComplexity = async () => {
        setAnalyzingComplexity(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/analyze-complexity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code,
                    language: LANGUAGES[language].name
                })
            });

            const result = await response.json();
            if (result.success) {
                setComplexity(result);
            }
        } catch (error) {
            console.error('Complexity analysis failed:', error);
        } finally {
            setAnalyzingComplexity(false);
        }
    };

    // Format code (basic indentation fix)
    const formatCode = () => {
        let formatted = code;
        const lang = language;

        // Basic formatting based on language
        if (lang === 'python') {
            // Python: ensure consistent 4-space indentation
            formatted = code.split('\n').map(line => {
                const trimmed = line.trimStart();
                const spaces = line.length - line.trimStart().length;
                const indent = Math.round(spaces / 4) * 4;
                return ' '.repeat(indent) + trimmed;
            }).join('\n');
        } else {
            // C-style languages: basic brace formatting
            let indentLevel = 0;
            formatted = code.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('}')) indentLevel = Math.max(0, indentLevel - 1);
                const result = '    '.repeat(indentLevel) + trimmed;
                if (trimmed.endsWith('{')) indentLevel++;
                return result;
            }).join('\n');
        }

        setCode(formatted);
    };

    // Take code screenshot
    const takeScreenshot = async () => {
        const codeContent = document.querySelector('.code-editor');
        if (!codeContent) return;

        // Create a styled element for screenshot
        const container = document.createElement('div');
        container.style.cssText = `
            background: linear-gradient(135deg, #1a1b26 0%, #0d1117 100%);
            padding: 24px;
            border-radius: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: #c9d1d9;
            min-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;

        // Header with dots
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';
        header.innerHTML = `
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #28c840;"></div>
            <span style="margin-left: auto; color: #6e7681; font-size: 12px;">${currentFileName}${LANGUAGES[language].extension}</span>
        `;
        container.appendChild(header);

        // Code content
        const codeEl = document.createElement('pre');
        codeEl.style.cssText = 'margin: 0; white-space: pre-wrap; line-height: 1.6;';
        codeEl.textContent = code;
        container.appendChild(codeEl);

        // Watermark
        const watermark = document.createElement('div');
        watermark.style.cssText = 'text-align: right; margin-top: 16px; color: #6e7681; font-size: 11px;';
        watermark.textContent = '✨ Created with AISLA Coding Grounds';
        container.appendChild(watermark);

        document.body.appendChild(container);

        try {
            // Use html2canvas-like approach with canvas
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(container, {
                backgroundColor: null,
                scale: 2
            });

            // Download
            const link = document.createElement('a');
            link.download = `${currentFileName}-code.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            // Fallback: copy code to clipboard
            navigator.clipboard.writeText(code);
            alert('Screenshot requires html2canvas. Code copied to clipboard instead!');
        } finally {
            document.body.removeChild(container);
        }
    };

    // Handle tab key
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + '    ' + code.substring(end);
            handleCodeChange(newCode);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        }
        // Ctrl/Cmd + Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCode();
        }
        // Ctrl/Cmd + Z to undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo
        if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
            ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
    };

    // Start coding with problem statement
    const startCoding = async () => {
        if (problemStatement.trim()) {
            setShowProblemInput(false);
            setGeneratingTests(true);

            // Generate test cases automatically
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/ai/generate-test-cases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        problemStatement,
                        language: LANGUAGES[language].name
                    })
                });

                const result = await response.json();
                if (result.success && result.testCases) {
                    setTestCases(result.testCases);
                    console.log('✅ Generated test cases:', result.testCases);
                }
            } catch (error) {
                console.error('Failed to generate test cases:', error);
                // Keep default empty test case
            } finally {
                setGeneratingTests(false);
            }
        }
    };

    return (
        <div className="coding-grounds fullscreen">
            {/* Problem Statement Input Modal */}
            {showProblemInput && (
                <div className="problem-input-overlay">
                    <div className="problem-input-modal">
                        <div className="problem-modal-header">
                            <div className="problem-modal-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <h2>What problem are you solving?</h2>
                            <p>Describe the coding problem or challenge you're working on. The AI will guide you without giving direct answers.</p>
                        </div>
                        <textarea
                            className="problem-textarea"
                            value={problemStatement}
                            onChange={(e) => setProblemStatement(e.target.value)}
                            placeholder="e.g., Write a function that finds the largest number in an array...

or

Implement a program to calculate the factorial of a number using recursion..."
                            autoFocus
                        />
                        <div className="problem-modal-actions">
                            <button className="skip-btn" onClick={() => setShowProblemInput(false)}>
                                Skip (No AI Help)
                            </button>
                            <button
                                className="start-btn"
                                onClick={startCoding}
                                disabled={!problemStatement.trim() || generatingTests}
                            >
                                {generatingTests ? (
                                    <>
                                        <div className="run-spinner"></div>
                                        Generating Tests...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        Start Coding
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Full Width */}
            <main className="cg-main fullscreen">
                {/* Top Bar */}
                <header className="cg-topbar">
                    <div className="topbar-left">
                        {/* Back Button */}
                        <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <div className="cg-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                            <h1>Coding Grounds</h1>
                        </div>
                    </div>

                    <div className="topbar-actions">
                        {/* Language Dropdown Selector */}
                        <div className="language-dropdown">
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="lang-select"
                            >
                                {Object.values(LANGUAGES).map((lang) => (
                                    <option key={lang.id} value={lang.id}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            {/* Undo Button */}
                            <button
                                className="action-btn-labeled undo-btn"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                title="Undo (Ctrl+Z)"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 7v6h6" />
                                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                                </svg>
                                <span>Undo</span>
                            </button>
                            {/* Redo Button */}
                            <button
                                className="action-btn-labeled redo-btn"
                                onClick={redo}
                                disabled={historyIndex >= codeHistory.length - 1}
                                title="Redo (Ctrl+Shift+Z)"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 7v6h-6" />
                                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                                </svg>
                                <span>Redo</span>
                            </button>
                            {/* AI Toggle */}
                            <button
                                className={`action-btn-labeled ai-btn ${aiEnabled ? 'active' : ''}`}
                                onClick={() => setAiEnabled(!aiEnabled)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                                </svg>
                                <span>{aiEnabled ? 'AI On' : 'AI Off'}</span>
                            </button>
                            <button
                                className={`action-btn-labeled files-btn ${showFilesPanel ? 'active' : ''}`}
                                onClick={() => setShowFilesPanel(!showFilesPanel)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                                <span>Files{savedCodes.length > 0 ? ` (${savedCodes.length})` : ''}</span>
                            </button>
                            <button className="action-btn-labeled save-btn" onClick={saveCode}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                <span>Save</span>
                            </button>
                            <button className="action-btn-labeled clear-btn" onClick={clearCode}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                                <span>Clear</span>
                            </button>
                            {/* Test Cases Button */}
                            <button
                                className={`action-btn-labeled test-btn ${showTestCases ? 'active' : ''}`}
                                onClick={() => setShowTestCases(!showTestCases)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                <span>Tests</span>
                            </button>
                            {/* Complexity Analysis Button */}
                            <button
                                className={`action-btn-labeled complexity-btn ${analyzingComplexity ? 'loading' : ''}`}
                                onClick={analyzeComplexity}
                                disabled={analyzingComplexity}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 20V10" />
                                    <path d="M18 20V4" />
                                    <path d="M6 20v-4" />
                                </svg>
                                <span>{analyzingComplexity ? '...' : 'Big-O'}</span>
                            </button>
                            {/* Format Code Button */}
                            <button
                                className="action-btn-labeled format-btn"
                                onClick={formatCode}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="21" y1="10" x2="3" y2="10" />
                                    <line x1="21" y1="6" x2="7" y2="6" />
                                    <line x1="21" y1="14" x2="7" y2="14" />
                                    <line x1="21" y1="18" x2="3" y2="18" />
                                </svg>
                                <span>Format</span>
                            </button>
                            {/* Screenshot Button */}
                            <button
                                className="action-btn-labeled screenshot-btn"
                                onClick={takeScreenshot}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>Share</span>
                            </button>
                            <button
                                className="action-btn-labeled settings-btn"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                                </svg>
                                <span>Settings</span>
                            </button>
                            <button
                                className={`run-btn ${isRunning ? 'running' : ''}`}
                                onClick={runCode}
                                disabled={isRunning}
                                title="Run (Ctrl+Enter)"
                            >
                                {isRunning ? (
                                    <>
                                        <div className="run-spinner"></div>
                                        <span>Running...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        <span>Run Code</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Problem Statement Bar */}
                {problemStatement && !showProblemInput && (
                    <div className="problem-bar">
                        <div className="problem-bar-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className="problem-text">{problemStatement}</span>
                        </div>
                        <button className="edit-problem-btn" onClick={() => setShowProblemInput(true)}>
                            Edit Problem
                        </button>
                    </div>
                )}

                {/* Settings Panel */}
                {showSettings && (
                    <div className="settings-panel">
                        <div className="settings-group">
                            <label>Font Size</label>
                            <input
                                type="range"
                                min="12"
                                max="24"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                            />
                            <span>{fontSize}px</span>
                        </div>
                        <div className="settings-group">
                            <label>Theme</label>
                            <select className="theme-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                                <option value="midnight">Midnight</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Files Panel */}
                {showFilesPanel && (
                    <div className="files-panel">
                        <div className="files-panel-header">
                            <h3>My Saved Files</h3>
                            <button className="close-panel-btn" onClick={() => setShowFilesPanel(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="files-list">
                            {savedCodes.length === 0 ? (
                                <div className="no-files">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <p>No saved files yet</p>
                                    <span>Save your code to see it here</span>
                                </div>
                            ) : (
                                savedCodes.map((saved) => (
                                    <div key={saved.id} className="file-item" onClick={() => loadSavedCode(saved)}>
                                        <div className="file-icon">{LANGUAGES[saved.language]?.icon}</div>
                                        <div className="file-info">
                                            <span className="file-name">{saved.name}{LANGUAGES[saved.language]?.extension}</span>
                                            <span className="file-date">{new Date(saved.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            className="file-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSavedCode(saved.id);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18" />
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Test Cases Panel */}
                {showTestCases && (
                    <div className="test-cases-panel">
                        <div className="test-cases-header">
                            <h3>📝 Test Cases</h3>
                            <div className="test-actions">
                                <button className="add-test-btn" onClick={addTestCase}>+ Add Test</button>
                                <button
                                    className="run-tests-btn"
                                    onClick={runTestCases}
                                    disabled={runningTests}
                                >
                                    {runningTests ? '⏳ Running...' : '▶ Run All Tests'}
                                </button>
                            </div>
                            <button className="close-panel-btn" onClick={() => setShowTestCases(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="test-cases-list">
                            {testCases.map((testCase, index) => {
                                const result = testResults.find(r => r.index === index);
                                return (
                                    <div key={index} className={`test-case-item ${result ? (result.passed ? 'passed' : 'failed') : ''}`}>
                                        <div className="test-case-header">
                                            <span className="test-case-label">Test #{index + 1}</span>
                                            {result && (
                                                <span className={`test-result-badge ${result.passed ? 'pass' : 'fail'}`}>
                                                    {result.passed ? '✓ Passed' : '✗ Failed'}
                                                </span>
                                            )}
                                            <button className="remove-test-btn" onClick={() => removeTestCase(index)}>×</button>
                                        </div>
                                        <div className="test-case-inputs">
                                            <div className="test-input-group">
                                                <label>Input:</label>
                                                <textarea
                                                    value={testCase.input}
                                                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                                    placeholder="Enter input..."
                                                />
                                            </div>
                                            <div className="test-input-group">
                                                <label>Expected Output:</label>
                                                <textarea
                                                    value={testCase.expectedOutput}
                                                    onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                                                    placeholder="Expected output..."
                                                />
                                            </div>
                                        </div>
                                        {result && !result.passed && (
                                            <div className="test-actual-output">
                                                <label>Actual Output:</label>
                                                <pre>{result.actual}</pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {testResults.length > 0 && (
                            <div className="test-summary">
                                <span className="tests-passed">{testResults.filter(r => r.passed).length} passed</span>
                                <span className="tests-failed">{testResults.filter(r => !r.passed).length} failed</span>
                                <span className="tests-total">of {testResults.length} tests</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Complexity Analysis Display */}
                {complexity && (
                    <div className="complexity-display">
                        <div className="complexity-header">
                            <h4>📊 Complexity Analysis</h4>
                            <button className="dismiss-complexity" onClick={() => setComplexity(null)}>×</button>
                        </div>
                        <div className="complexity-metrics">
                            <div className="metric time">
                                <span className="metric-label">Time</span>
                                <span className="metric-value">{complexity.timeComplexity}</span>
                            </div>
                            <div className="metric space">
                                <span className="metric-label">Space</span>
                                <span className="metric-value">{complexity.spaceComplexity}</span>
                            </div>
                        </div>
                        {complexity.explanation && (
                            <p className="complexity-explanation">{complexity.explanation}</p>
                        )}
                        {complexity.optimizationTip && (
                            <div className="optimization-tip">
                                💡 <span>{complexity.optimizationTip}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Performance Metrics Bar (after code execution) */}
                {executionTime && (
                    <div className="performance-bar">
                        <div className="perf-metric">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{executionTime}ms</span>
                        </div>
                        {performanceScore && (
                            <div className={`perf-score ${performanceScore >= 80 ? 'good' : performanceScore >= 50 ? 'ok' : 'slow'}`}>
                                Performance: {performanceScore}%
                            </div>
                        )}
                    </div>
                )}
                <div className={`editor-container ${theme} ${aiEnabled && problemStatement ? 'with-ai' : ''}`}>
                    {/* Code Editor */}
                    <div className="code-panel">
                        <div className="panel-header">
                            <div className="file-tab active">
                                <span className="file-icon">{LANGUAGES[language].icon}</span>
                                <span className="file-name">{currentFileName}{LANGUAGES[language].extension}</span>
                            </div>
                        </div>
                        <div className="editor-wrapper">
                            <div className="line-numbers">
                                {lineNumbers.map((num) => (
                                    <div key={num} className="line-number">{num}</div>
                                ))}
                            </div>
                            <textarea
                                ref={textareaRef}
                                className="code-editor"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                style={{ fontSize: `${fontSize}px` }}
                                placeholder="Start coding here..."
                            />
                        </div>
                    </div>

                    {/* AI Suggestion Panel */}
                    {aiEnabled && problemStatement && (
                        <div className="suggestion-panel">
                            <div className="suggestion-header">
                                <div className="suggestion-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2" />
                                    </svg>
                                    <span>AI Mentor</span>
                                    {isLoadingSuggestion && <div className="typing-indicator"><span></span><span></span><span></span></div>}
                                </div>
                                <button className="get-hint-btn" onClick={requestSuggestion} disabled={isLoadingSuggestion}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 21h5v-5" />
                                    </svg>
                                    Get Hint
                                </button>
                            </div>
                            <div className="suggestion-content" ref={suggestionRef}>
                                {suggestion ? (
                                    <div className="suggestion-text">{suggestion}</div>
                                ) : (
                                    <div className="suggestion-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <p>Start typing your code...</p>
                                        <span>I'll give you hints and guidance as you work on your solution. Remember, I won't write code for you — I'm here to help you learn!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* I/O Panel */}
                    <div className="io-panel">
                        <div className="io-tabs">
                            <button
                                className={`io-tab ${activeTab === 'input' ? 'active' : ''}`}
                                onClick={() => setActiveTab('input')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                                Input
                            </button>
                            <button
                                className={`io-tab ${activeTab === 'output' ? 'active' : ''}`}
                                onClick={() => setActiveTab('output')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 18 12 22 8 18" />
                                    <line x1="12" y1="22" x2="12" y2="9" />
                                </svg>
                                Output
                                {executionTime && (
                                    <span className="execution-time">{executionTime}ms</span>
                                )}
                            </button>
                        </div>

                        <div className="io-content">
                            {activeTab === 'input' ? (
                                <textarea
                                    className="io-textarea"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Enter input for your program here..."
                                    style={{ fontSize: `${fontSize}px` }}
                                />
                            ) : (
                                <div
                                    className={`output-content ${output.includes('Error') ? 'error' : ''}`}
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    {output || 'Output will appear here after running your code...'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="shortcuts-bar">
                    <div className="shortcut">
                        <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
                        <span>Run</span>
                    </div>
                    <div className="shortcut">
                        <kbd>Ctrl</kbd>+<kbd>S</kbd>
                        <span>Save</span>
                    </div>
                    <div className="shortcut">
                        <kbd>Tab</kbd>
                        <span>Indent</span>
                    </div>
                </div>
            </main>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
                    <div className="save-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Save Code</h3>
                        <input
                            type="text"
                            placeholder="Enter file name..."
                            defaultValue={currentFileName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    confirmSave(e.target.value);
                                }
                            }}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowSaveModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={(e) => {
                                    const input = e.target.closest('.save-modal').querySelector('input');
                                    confirmSave(input.value || 'untitled');
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodingGrounds;
