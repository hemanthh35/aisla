// AISLA - Quiz Result Page
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ResultPage.css';

const ResultPage = () => {
    const { id } = useParams();

    const [submission, setSubmission] = useState(null);
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResult();
    }, [id]);

    const fetchResult = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch experiment
            const expRes = await axios.get(`/api/experiment/${id}`, config);
            setExperiment(expRes.data.experiment);

            // Fetch submission
            const subRes = await axios.get(`/api/quiz/submission/${id}`, config);
            setSubmission(subRes.data.submission);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    const getScoreClass = (percentage) => {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'average';
        return 'needs-improvement';
    };

    const getScoreMessage = (percentage) => {
        if (percentage >= 80) return 'Excellent work!';
        if (percentage >= 60) return 'Good job!';
        if (percentage >= 40) return 'Keep practicing!';
        return 'Don\'t give up!';
    };

    if (loading) {
        return (
            <div className="result-page loading-page">
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Loading results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="result-page error-page">
                <div className="error-container">
                    <h2>No Results Found</h2>
                    <p>{error}</p>
                    <Link to={`/experiment/${id}`} className="back-link">Back to Experiment</Link>
                </div>
            </div>
        );
    }

    const scoreClass = getScoreClass(submission?.percentage || 0);

    return (
        <div className="result-page">
            {/* Header */}
            <header className="result-header">
                <Link to="/dashboard" className="back-button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Dashboard
                </Link>
                <h1 className="result-title">Quiz Results</h1>
            </header>

            <main className="result-main">
                {/* Score Card */}
                <div className={`score-card ${scoreClass}`}>
                    <div className="score-circle">
                        <svg viewBox="0 0 100 100">
                            <circle
                                className="score-bg"
                                cx="50" cy="50" r="45"
                                fill="none"
                                strokeWidth="8"
                            />
                            <circle
                                className="score-progress"
                                cx="50" cy="50" r="45"
                                fill="none"
                                strokeWidth="8"
                                strokeDasharray={`${(submission?.percentage || 0) * 2.83} 283`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="score-value">{submission?.percentage || 0}%</div>
                    </div>
                    <div className="score-info">
                        <h2 className="score-message">{getScoreMessage(submission?.percentage || 0)}</h2>
                        <p className="score-details">
                            You scored <strong>{submission?.score}</strong> out of <strong>{submission?.totalQuestions}</strong> questions
                        </p>
                        <p className="experiment-name">{experiment?.title}</p>
                    </div>
                </div>

                {/* Feedback Section */}
                {submission?.feedback && (
                    <div className="feedback-section">
                        <h3 className="section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            AI Feedback
                        </h3>

                        <div className="feedback-card">
                            <p className="overall-feedback">{submission.feedback.overallFeedback}</p>
                        </div>

                        <div className="feedback-grid">
                            {submission.feedback.strengths?.length > 0 && (
                                <div className="feedback-item strengths">
                                    <h4>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Strengths
                                    </h4>
                                    <ul>
                                        {submission.feedback.strengths.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {submission.feedback.topicsToRevise?.length > 0 && (
                                <div className="feedback-item revise">
                                    <h4>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        Topics to Revise
                                    </h4>
                                    <ul>
                                        {submission.feedback.topicsToRevise.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {submission.feedback.suggestions?.length > 0 && (
                                <div className="feedback-item suggestions">
                                    <h4>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        Suggestions
                                    </h4>
                                    <ul>
                                        {submission.feedback.suggestions.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Answer Review */}
                {submission?.answers && (
                    <div className="answers-section">
                        <h3 className="section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Answer Review
                        </h3>

                        <div className="answers-list">
                            {submission.answers.map((answer, index) => (
                                <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="answer-header">
                                        <span className="answer-number">Q{index + 1}</span>
                                        <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                            {answer.isCorrect ? (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Correct
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                    Incorrect
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="answer-body">
                                        <p className="your-answer">
                                            <strong>Your answer:</strong> {answer.userAnswer || 'No answer'}
                                        </p>
                                        {answer.feedback && (
                                            <p className="answer-feedback">{answer.feedback}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="result-actions">
                    <Link to={`/experiment/${id}`} className="action-btn secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        Review Experiment
                    </Link>
                    <Link to="/dashboard" className="action-btn primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default ResultPage;
