// AISLA - Experiment View Page (Student & Faculty)
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import mermaid from 'mermaid';
import AIChatWidget from '../components/AIChatWidget';
import './ExperimentView.css';

const ExperimentView = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState('aim');
    const [aiExplanation, setAiExplanation] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizHistory, setQuizHistory] = useState([]);
    const [showQuizPanel, setShowQuizPanel] = useState(false);
    const [diagramLoading, setDiagramLoading] = useState(false);
    const [diagramData, setDiagramData] = useState(null);
    const [showDiagram, setShowDiagram] = useState(false);
    const diagramRef = useRef(null);

    const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

    // Initialize Mermaid with colorful theme
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: '#6366f1',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#818cf8',
                lineColor: '#06b6d4',
                secondaryColor: '#10b981',
                tertiaryColor: '#f59e0b',
                background: '#1f2937',
                mainBkg: '#1e293b',
                secondBkg: '#334155',
                textColor: '#ffffff',
                border1: '#6366f1',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '18px',
                nodeBorder: '#818cf8',
                clusterBkg: '#374151',
                defaultLinkColor: '#06b6d4',
                edgeLabelBackground: '#1f2937'
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
                padding: 15,
                nodeSpacing: 60,
                rankSpacing: 50,
                diagramPadding: 10
            },
            securityLevel: 'loose'
        });
    }, [id]);

    // Render markdown to HTML with table support
    const renderMarkdown = (text) => {
        if (!text) return '';

        let html = text;

        // First, normalize bullet characters - replace escaped unicode with actual bullets
        html = html.replace(/u2022/g, '•');
        html = html.replace(/u2099/g, '•');
        html = html.replace(/\\u2022/g, '•');
        
        // Tables (must be done first)
        html = html.replace(/\|(.+)\|\n\|[-: |]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
            const headers = header.split('|').map(h => h.trim()).filter(Boolean);
            const rowsData = rows.trim().split('\n').map(row => 
                row.split('|').map(cell => cell.trim()).filter(Boolean)
            );
            
            let table = '<table class="ai-table"><thead><tr>';
            headers.forEach(h => { table += `<th>${h}</th>`; });
            table += '</tr></thead><tbody>';
            rowsData.forEach(row => {
                table += '<tr>';
                row.forEach(cell => { table += `<td>${cell}</td>`; });
                table += '</tr>';
            });
            table += '</tbody></table>';
            return table;
        });

        // Code blocks (before other processing)
        html = html.replace(/```[a-z]*\n([^`]+)```/gs, '<pre><code>$1</code></pre>');
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bullet lists - handle • symbol (unicode 2022) and regular * or -
        html = html.replace(/^[•\*\-]\s*(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>(\n|<br\/>)?)+/gs, '<ul class="ai-list">$&</ul>');
        
        // Clean up extra line breaks inside lists
        html = html.replace(/(<\/li>)<br\/>/g, '$1');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br/>');
        
        // Wrap in paragraph if not already wrapped
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    };

    useEffect(() => {
        fetchExperiment();
    }, [id]);

    // Render Mermaid diagram when data changes
    useEffect(() => {
        if (diagramData && diagramRef.current) {
            const renderDiagram = async () => {
                try {
                    // Clear previous content
                    diagramRef.current.innerHTML = '';
                    
                    // Create a unique ID for this diagram
                    const diagramId = `mermaid-${Date.now()}`;
                    
                    // Render the diagram
                    const { svg } = await mermaid.render(diagramId, diagramData.code);
                    diagramRef.current.innerHTML = svg;
                } catch (error) {
                    console.error('Mermaid render error:', error);
                    diagramRef.current.innerHTML = `<p style="color: #ef4444;">Failed to render diagram. Please check the code syntax.</p>`;
                }
            };
            renderDiagram();
        }
    }, [diagramData]);

    const fetchExperiment = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/experiment/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExperiment(res.data.experiment);

            // Fetch quiz history after experiment loads
            if (res.data.experiment?.quizGenerated) {
                fetchQuizHistory();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load experiment');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizHistory = async () => {
        try {
            const token = localStorage.getItem('token');

            if (isFaculty) {
                // Faculty: Get all student submissions for this experiment
                const res = await axios.get(`/api/quiz/submissions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuizHistory(res.data.submissions || []);
            } else {
                // Student: Get their own submissions
                const res = await axios.get(`/api/quiz/submission/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuizHistory(res.data.history || []);
            }
        } catch (err) {
            // No submissions yet is fine
            console.log('No quiz history yet');
        }
    };

    const handleAiExplain = async (intent) => {
        setAiLoading(true);
        setAiExplanation('');

        try {
            const token = localStorage.getItem('token');
            let content = getSectionContent(activeSection);

            // Convert array content to string for AI
            if (Array.isArray(content)) {
                content = content.join('\n');
            }

            if (!content || content.trim() === '') {
                setAiExplanation('No content available to explain for this section.');
                setAiLoading(false);
                return;
            }

            // Use streaming endpoint for real-time response
            const response = await fetch('/api/ai/explain-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, intent })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'TOKEN':
                                fullText += data.content;
                                setAiExplanation(fullText);
                                break;
                            case 'DONE':
                                setAiLoading(false);
                                break;
                            case 'ERROR':
                                setAiExplanation(`Error: ${data.error}`);
                                setAiLoading(false);
                                break;
                            default:
                                break;
                        }
                    } catch (e) { }
                }
            }

            setAiLoading(false);

        } catch (err) {
            console.error('AI Explain error:', err);
            setAiExplanation('Sorry, AI explanation is not available. Make sure Ollama is running.');
            setAiLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        setQuizLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/quiz/generate',
                { experimentId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Navigate to quiz page
            navigate(`/experiment/${id}/quiz`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleGenerateDiagram = async () => {
        setDiagramLoading(true);
        setShowDiagram(true);
        setDiagramData(null);

        try {
            const token = localStorage.getItem('token');
            const sectionContent = getSectionContent(activeSection);
            const sectionLabel = sections.find(s => s.id === activeSection)?.label;

            // Prepare description based on section content
            let content = `${experiment?.title} - ${sectionLabel}\n\n`;
            
            if (Array.isArray(sectionContent)) {
                content += sectionContent.join('\n');
            } else {
                content += sectionContent;
            }

            // Call diagram generation API
            const res = await axios.post('/api/ai/diagram',
                { 
                    content: content.substring(0, 2000), // Limit length
                    experimentTitle: `${experiment?.title} - ${sectionLabel}`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setDiagramData(res.data.diagram);
            } else {
                alert('Failed to generate diagram: ' + (res.data.error || 'Unknown error'));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate diagram');
        } finally {
            setDiagramLoading(false);
        }
    };

    const handleDownloadDiagram = () => {
        if (!diagramRef.current) return;

        const svgElement = diagramRef.current.querySelector('svg');
        if (!svgElement) return;

        try {
            // Get SVG data
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `aisla-diagram-${activeSection}-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download diagram');
        }
    };

    const getSectionContent = (section) => {
        if (!experiment?.content) return '';
        const content = experiment.content;

        switch (section) {
            case 'aim': return content.aim || '';
            case 'theory': return content.theory || '';
            case 'procedure':
                // Handle both array and string
                if (Array.isArray(content.procedure)) {
                    return content.procedure;
                }
                return content.procedure || '';
            case 'formulas': return content.keyFormulas || [];
            case 'example': return content.example || '';
            case 'mistakes': return content.commonMistakes || [];
            case 'application':
                // Handle both realWorldUse (new) and realWorldApplication (old)
                const apps = content.realWorldUse || content.realWorldApplication || content.applications || [];
                if (Array.isArray(apps)) {
                    return apps;
                }
                return apps;
            case 'summary': return content.summary || '';
            case 'observations': return content.observations || '';
            case 'apparatus': return content.apparatus || [];
            case 'precautions': return content.precautions || [];
            case 'result': return content.result || '';
            default: return '';
        }
    };

    // Render section content - handles arrays and strings
    const renderSectionContent = () => {
        const content = getSectionContent(activeSection);

        if (!content || (Array.isArray(content) && content.length === 0)) {
            return <div className="content-text empty">No content available for this section.</div>;
        }

        // Procedure - numbered list
        if (activeSection === 'procedure' && Array.isArray(content)) {
            return (
                <ol className="procedure-list">
                    {content.map((step, index) => (
                        <li key={index} className="procedure-step">{step}</li>
                    ))}
                </ol>
            );
        }

        // Formulas - formula cards
        if (activeSection === 'formulas' && Array.isArray(content)) {
            return (
                <ul className="formula-list">
                    {content.map((formula, index) => (
                        <li key={index} className="formula-item">
                            <svg className="formula-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16v16H4z" /><path d="M8 8l8 8" /><path d="M16 8l-8 8" />
                            </svg>
                            <span>{formula}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Mistakes - warning list
        if (activeSection === 'mistakes' && Array.isArray(content)) {
            return (
                <ul className="mistakes-list">
                    {content.map((mistake, index) => (
                        <li key={index} className="mistake-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>{mistake}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Applications / Real-World Use - bullet list
        if (activeSection === 'application' && Array.isArray(content)) {
            return (
                <ul className="application-list">
                    {content.map((app, index) => (
                        <li key={index} className="application-item">
                            <svg className="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span>{app}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Default - text content
        // If content contains HTML tables (from AI generation), handle formatting
        if (typeof content === 'string') {
            if (content.includes('<table')) {
                // Convert newlines to <br>, but try to clean up around table tags to avoid accumulating gaps
                const formattedHtml = content
                    .replace(/\n/g, '<br />')
                    // Remove <br /> immediately before <table>
                    .replace(/<br \/>\s*(<table)/g, '$1')
                    // Remove <br /> immediately after </table>
                    .replace(/(<\/table>)\s*<br \/>/g, '$1');

                return (
                    <div
                        className="content-text with-table"
                        dangerouslySetInnerHTML={{ __html: formattedHtml }}
                    />
                );
            }
            return <div className="content-text">{content}</div>;
        }

        return <div className="content-text">{String(content)}</div>;
    };

    const sections = [
        {
            id: 'aim',
            label: 'Aim',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
        },
        {
            id: 'theory',
            label: 'Theory',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
        },
        {
            id: 'apparatus',
            label: 'Apparatus',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
        },
        {
            id: 'procedure',
            label: 'Procedure',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
        },
        {
            id: 'observations',
            label: 'Observations',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        },
        {
            id: 'formulas',
            label: 'Key Formulas',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M8 8l8 8" /><path d="M16 8l-8 8" /></svg>
        },
        {
            id: 'example',
            label: 'Example',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4" /><path d="M12 18v4" /><circle cx="12" cy="12" r="4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></svg>
        },
        {
            id: 'result',
            label: 'Result',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        },
        {
            id: 'precautions',
            label: 'Precautions',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        },
        {
            id: 'mistakes',
            label: 'Common Mistakes',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        },
        {
            id: 'application',
            label: 'Real-World Use',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
        },
        {
            id: 'summary',
            label: 'Summary',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        }
    ];

    if (loading) {
        return (
            <div className="experiment-page">
                <header className="experiment-header">
                    <div className="header-left">
                        <div className="skeleton skeleton-back"></div>
                        <div className="experiment-info">
                            <div className="skeleton skeleton-title"></div>
                            <div className="skeleton skeleton-meta"></div>
                        </div>
                    </div>
                </header>
                <div className="experiment-layout">
                    <nav className="section-nav">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton skeleton-nav-item"></div>
                        ))}
                    </nav>
                    <main className="experiment-content">
                        <div className="content-card">
                            <div className="skeleton skeleton-section-title"></div>
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-text short"></div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="experiment-page error-page">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="experiment-page">
            {/* Header */}
            <header className="experiment-header">
                <div className="header-left">
                    <Link to="/dashboard" className="back-button" title="Back to Dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="experiment-info">
                        <h1 className="experiment-title">{experiment?.title}</h1>
                        <div className="experiment-meta">
                            {experiment?.subject && (
                                <span className="meta-badge">{experiment.subject}</span>
                            )}
                            {experiment?.difficulty && (
                                <span className={`meta-badge ${experiment.difficulty}`}>
                                    {experiment.difficulty}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    {isFaculty && !experiment?.quizGenerated && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleGenerateQuiz}
                            disabled={quizLoading}
                        >
                            {quizLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                    Generate Quiz
                                </>
                            )}
                        </button>
                    )}
                    {experiment?.quizGenerated && (
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/experiment/${id}/quiz`)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            Take Quiz
                        </button>
                    )}
                </div>
            </header>

            <div className="experiment-layout">
                {/* Section Navigation */}
                <aside className="section-nav">
                    <h3 className="nav-title">Sections</h3>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveSection(section.id);
                                setAiExplanation('');
                            }}
                        >
                            {section.icon}
                            <span>{section.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="experiment-content">
                    <div className="content-card">
                        <div className="content-header">
                            <h2 className="content-title">
                                {sections.find(s => s.id === activeSection)?.label}
                            </h2>
                        </div>

                        <div className="content-body">
                            {renderSectionContent()}
                        </div>

                        {/* AI Explain Buttons */}
                        <div className="ai-actions">
                            <p className="ai-help-text">Need help understanding? Ask AI:</p>
                            <div className="ai-buttons">
                                <button
                                    className="ai-btn"
                                    onClick={() => handleAiExplain('simple')}
                                    disabled={aiLoading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    Explain Simply
                                </button>
                                <button
                                    className="ai-btn"
                                    onClick={() => handleAiExplain('detailed')}
                                    disabled={aiLoading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                    Detailed Explanation
                                </button>
                                <button
                                    className="ai-btn"
                                    onClick={() => handleAiExplain('example')}
                                    disabled={aiLoading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    Give Examples
                                </button>
                                <button
                                    className="ai-btn diagram-btn"
                                    onClick={handleGenerateDiagram}
                                    disabled={diagramLoading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="9" y1="9" x2="15" y2="9" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                        <line x1="12" y1="9" x2="12" y2="15" />
                                    </svg>
                                    {diagramLoading ? 'Generating...' : 'Create Diagram'}
                                </button>
                            </div>
                        </div>

                        {/* AI Explanation Response */}
                        {(aiLoading || aiExplanation) && (
                            <div className="ai-response">
                                <div className="ai-response-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                    AI Explanation
                                    {aiLoading && <span className="streaming-indicator">Streaming...</span>}
                                </div>
                                <div className="ai-response-body">
                                    {aiExplanation ? (
                                        <div className="ai-text-container">
                                            <div
                                                className="ai-text markdown-content"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(aiExplanation) }}
                                            />
                                            {aiLoading && <span className="streaming-cursor">▌</span>}
                                        </div>
                                    ) : (
                                        <div className="ai-loading">
                                            <div className="loader small"></div>
                                            <span>AI is starting...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Diagram Display */}
                        {showDiagram && (
                            <div className="diagram-response">
                                <div className="diagram-response-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="9" y1="9" x2="15" y2="9" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                        <line x1="12" y1="9" x2="12" y2="15" />
                                    </svg>
                                    Generated Diagram
                                    <button 
                                        className="close-diagram"
                                        onClick={() => setShowDiagram(false)}
                                        title="Close diagram"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="diagram-response-body">
                                    {diagramLoading ? (
                                        <div className="diagram-loading">
                                            <div className="loader"></div>
                                            <span>Generating diagram...</span>
                                        </div>
                                    ) : diagramData ? (
                                        <div className="diagram-container-main">
                                            <div className="diagram-actions-top">
                                                <button className="diagram-action-btn" onClick={handleDownloadDiagram}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                                                        <polyline points="7 10 12 15 17 10"></polyline>
                                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                                    </svg>
                                                    Download SVG
                                                </button>
                                                <button 
                                                    className="diagram-action-btn secondary"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(diagramData.code);
                                                        alert('Code copied!');
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                    Copy Code
                                                </button>
                                            </div>

                                            {/* Visual Diagram Rendering */}
                                            <div className="diagram-visual-compact">
                                                <div 
                                                    ref={diagramRef}
                                                    className="mermaid-container compact"
                                                />
                                            </div>
                                            
                                            {/* Diagram Code (Collapsible) */}
                                            <details className="diagram-code-details">
                                                <summary className="code-summary">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="16 18 22 12 16 6"></polyline>
                                                        <polyline points="8 6 2 12 8 18"></polyline>
                                                    </svg>
                                                    View Source Code
                                                </summary>
                                                <div className="diagram-code">
                                                    <pre><code>{diagramData.code}</code></pre>
                                                </div>
                                            </details>
                                        </div>
                                    ) : (
                                        <p className="diagram-error">Failed to generate diagram</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Quiz History Sidebar Panel */}
                {experiment?.quizGenerated && (
                    <aside className={`quiz-history-panel ${showQuizPanel ? 'open' : ''}`}>
                        <button
                            className="quiz-panel-toggle"
                            onClick={() => setShowQuizPanel(!showQuizPanel)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Quiz History
                            {quizHistory.length > 0 && (
                                <span className="quiz-count">{quizHistory.length}</span>
                            )}
                        </button>

                        <div className="quiz-panel-content">
                            <div className="quiz-panel-header">
                                <h3>{isFaculty ? 'Student Submissions' : 'Your Attempts'}</h3>
                                {!isFaculty && (
                                    <button
                                        className="take-quiz-btn"
                                        onClick={() => navigate(`/experiment/${id}/quiz`)}
                                    >
                                        {quizHistory.length > 0 ? 'Retake Quiz' : 'Take Quiz'}
                                    </button>
                                )}
                            </div>

                            {quizHistory.length === 0 ? (
                                <div className="quiz-empty">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <p>{isFaculty ? 'No submissions yet' : 'No attempts yet'}</p>
                                </div>
                            ) : (
                                <div className="quiz-history-list">
                                    {quizHistory.map((sub, index) => (
                                        <div key={sub._id} className="quiz-history-item">
                                            <div className="quiz-history-info">
                                                {isFaculty ? (
                                                    <>
                                                        <span className="quiz-student-name">
                                                            {sub.userId?.name || 'Student'}
                                                        </span>
                                                        <span className="quiz-student-email">
                                                            {sub.userId?.email}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="quiz-attempt-num">
                                                        Attempt #{sub.attemptNumber || index + 1}
                                                    </span>
                                                )}
                                                <span className="quiz-date">
                                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className={`quiz-score ${sub.percentage >= 70 ? 'good' : sub.percentage >= 50 ? 'average' : 'poor'}`}>
                                                {sub.percentage}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isFaculty && quizHistory.length > 0 && (
                                <div className="quiz-stats">
                                    <div className="quiz-stat">
                                        <span className="stat-label">Total</span>
                                        <span className="stat-value">{quizHistory.length}</span>
                                    </div>
                                    <div className="quiz-stat">
                                        <span className="stat-label">Average</span>
                                        <span className="stat-value">
                                            {Math.round(quizHistory.reduce((a, s) => a + s.percentage, 0) / quizHistory.length)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>

            {/* AI Chat Widget */}
            <AIChatWidget />
        </div>
    );
};

export default ExperimentView;
