// AISLA - Experiment View Page (Student & Faculty)
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
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

    const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

    useEffect(() => {
        fetchExperiment();
    }, [id]);

    const fetchExperiment = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/experiment/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExperiment(res.data.experiment);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load experiment');
        } finally {
            setLoading(false);
        }
    };

    const handleAiExplain = async (intent) => {
        setAiLoading(true);
        setAiExplanation('');

        try {
            const token = localStorage.getItem('token');
            const content = getSectionContent(activeSection);

            const res = await axios.post('/api/ai/explain',
                { content, intent },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAiExplanation(res.data.explanation);
        } catch (err) {
            setAiExplanation('Sorry, AI explanation is not available at the moment.');
        } finally {
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

    const getSectionContent = (section) => {
        if (!experiment?.content) return '';
        const content = experiment.content;

        switch (section) {
            case 'aim': return content.aim || '';
            case 'theory': return content.theory || '';
            case 'procedure': return content.procedure || '';
            case 'formulas': return (content.keyFormulas || []).join('\n');
            case 'example': return content.example || '';
            case 'mistakes': return (content.commonMistakes || []).join('\n');
            case 'application': return content.realWorldApplication || '';
            case 'summary': return content.summary || '';
            default: return '';
        }
    };

    const sections = [
        { id: 'aim', label: 'Aim', icon: '🎯' },
        { id: 'theory', label: 'Theory', icon: '📖' },
        { id: 'procedure', label: 'Procedure', icon: '📝' },
        { id: 'formulas', label: 'Key Formulas', icon: '🔢' },
        { id: 'example', label: 'Example', icon: '💡' },
        { id: 'mistakes', label: 'Common Mistakes', icon: '⚠️' },
        { id: 'application', label: 'Real-World Use', icon: '🌍' },
        { id: 'summary', label: 'Summary', icon: '📋' }
    ];

    if (loading) {
        return (
            <div className="experiment-page loading-page">
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Loading experiment...</p>
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
                    <Link to="/dashboard" className="back-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Dashboard
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
                            <span className="nav-icon">{section.icon}</span>
                            {section.label}
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
                            {activeSection === 'formulas' ? (
                                <ul className="formula-list">
                                    {(experiment?.content?.keyFormulas || []).map((formula, index) => (
                                        <li key={index} className="formula-item">{formula}</li>
                                    ))}
                                </ul>
                            ) : activeSection === 'mistakes' ? (
                                <ul className="mistakes-list">
                                    {(experiment?.content?.commonMistakes || []).map((mistake, index) => (
                                        <li key={index} className="mistake-item">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            {mistake}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="content-text">
                                    {getSectionContent(activeSection) || 'No content available for this section.'}
                                </div>
                            )}
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
                                </div>
                                <div className="ai-response-body">
                                    {aiLoading ? (
                                        <div className="ai-loading">
                                            <div className="loader small"></div>
                                            <span>AI is thinking...</span>
                                        </div>
                                    ) : (
                                        <div className="ai-text">{aiExplanation}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExperimentView;
