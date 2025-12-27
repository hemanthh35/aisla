// AISLA - Auto-Diagram Generator (Admin Only)
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import mermaid from 'mermaid';
import './DiagramGenerator.css';

const DiagramGenerator = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const diagramRef = useRef(null);

    const [description, setDescription] = useState('');
    const [format, setFormat] = useState('mermaid');
    const [diagramCode, setDiagramCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Initialize mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#6366f1',
                primaryTextColor: '#fff',
                primaryBorderColor: '#818cf8',
                lineColor: '#94a3b8',
                secondaryColor: '#1e1b4b',
                tertiaryColor: '#0f172a',
                background: '#0f172a',
                mainBkg: '#1e1b4b',
                nodeBorder: '#6366f1',
                clusterBkg: '#1e1b4b',
                titleColor: '#f1f5f9',
                edgeLabelBackground: '#1e1b4b'
            }
        });
    }, []);

    // Render mermaid diagram when code changes
    useEffect(() => {
        if (diagramCode && format === 'mermaid' && diagramRef.current) {
            renderMermaid();
        }
    }, [diagramCode, format]);

    const renderMermaid = async () => {
        if (!diagramRef.current) return;

        try {
            diagramRef.current.innerHTML = '';
            const { svg } = await mermaid.render('diagram-' + Date.now(), diagramCode);
            diagramRef.current.innerHTML = svg;
        } catch (err) {
            console.error('Mermaid render error:', err);
            diagramRef.current.innerHTML = `<div class="render-error">Diagram render error: ${err.message}</div>`;
        }
    };

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError('Please enter a description');
            return;
        }

        setLoading(true);
        setError('');
        setDiagramCode('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                '/api/ai/generate-diagram',
                { description, format },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDiagramCode(res.data.code);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate diagram');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(diagramCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([diagramCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram.${format === 'mermaid' ? 'mmd' : format === 'graphviz' ? 'dot' : format === 'plantuml' ? 'puml' : 'd2'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const examplePrompts = [
        "Create a flowchart showing user login process with authentication",
        "Draw a sequence diagram for API request-response cycle",
        "Show a class diagram for an e-commerce system with User, Product, and Order",
        "Create a circuit diagram with battery, switch, resistor, and LED",
        "Draw a state diagram for an order lifecycle: pending, processing, shipped, delivered"
    ];

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="diagram-page">
            {/* Header */}
            <header className="diagram-header">
                <div className="header-left">
                    <Link to="/dashboard" className="back-button" title="Back to Dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="header-info">
                        <h1 className="page-title">Auto-Diagram Generator</h1>
                        <p className="page-subtitle">Convert text descriptions into diagram code</p>
                    </div>
                </div>
                <span className="admin-badge">Admin Only</span>
            </header>

            <main className="diagram-main">
                {/* Input Section */}
                <section className="input-section">
                    <div className="input-header">
                        <h2>Description</h2>
                        <div className="format-selector">
                            <label>Format:</label>
                            <select value={format} onChange={(e) => setFormat(e.target.value)}>
                                <option value="mermaid">Mermaid.js</option>
                                <option value="html">HTML Visualization (Web)</option>
                                <option value="graphviz">Graphviz (DOT)</option>
                                <option value="plantuml">PlantUML</option>
                                <option value="d2">D2</option>
                            </select>
                        </div>
                    </div>

                    <textarea
                        className="description-input"
                        placeholder="Describe the diagram you want to create...

Examples:
• Create a flowchart for user registration process
• Draw a circuit with battery, resistor, and LED
• Show a sequence diagram for payment flow
• Create an ER diagram for a blog system"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                    />

                    <div className="example-prompts">
                        <span className="prompts-label">Try:</span>
                        {examplePrompts.slice(0, 3).map((prompt, index) => (
                            <button
                                key={index}
                                className="prompt-chip"
                                onClick={() => setDescription(prompt)}
                            >
                                {prompt.substring(0, 40)}...
                            </button>
                        ))}
                    </div>

                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={loading || !description.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                Generate Diagram
                            </>
                        )}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </section>

                {/* Output Section */}
                {diagramCode && (
                    <section className="output-section">
                        <div className="output-header">
                            <h2>Generated Code ({format})</h2>
                            <div className="output-actions">
                                <button className="action-btn" onClick={handleCopy}>
                                    {copied ? (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copy
                                        </>
                                    )}
                                </button>
                                <button className="action-btn" onClick={handleDownload}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                        </div>

                        <pre className="code-output">
                            <code>{diagramCode}</code>
                        </pre>

                        {/* Preview Section */}
                        <div className="preview-section">
                            <h3>Preview {format !== 'mermaid' && format !== 'html' && `(${format})`}</h3>
                            {format === 'mermaid' ? (
                                <div className="diagram-preview" ref={diagramRef}></div>
                            ) : format === 'html' ? (
                                <div className="html-preview-container">
                                    <iframe
                                        srcDoc={diagramCode}
                                        style={{
                                            width: '100%',
                                            minHeight: '400px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: 'var(--radius-xl)',
                                            background: 'white'
                                        }}
                                        title="HTML Diagram Preview"
                                    />
                                    <div className="preview-note" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                                        * This is a live HTML preview rendered in an iframe.
                                    </div>
                                </div>
                            ) : (
                                <div className="external-preview">
                                    <p className="preview-note">
                                        {format === 'graphviz' && (
                                            <>
                                                <span>📊 Graphviz DOT code generated!</span>
                                                <br />
                                                Render at: <a href="https://dreampuf.github.io/GraphvizOnline/" target="_blank" rel="noopener noreferrer">GraphvizOnline</a> or <a href="https://viz-js.com/" target="_blank" rel="noopener noreferrer">Viz.js</a>
                                            </>
                                        )}
                                        {format === 'plantuml' && (
                                            <>
                                                <span>📐 PlantUML code generated!</span>
                                                <br />
                                                Render at: <a href="https://www.plantuml.com/plantuml/uml" target="_blank" rel="noopener noreferrer">PlantUML Online</a>
                                            </>
                                        )}
                                        {format === 'd2' && (
                                            <>
                                                <span>✨ D2 code generated!</span>
                                                <br />
                                                Render at: <a href="https://play.d2lang.com/" target="_blank" rel="noopener noreferrer">D2 Playground</a>
                                            </>
                                        )}
                                    </p>
                                    <p className="copy-hint">Copy the code above and paste it into the renderer.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default DiagramGenerator;
