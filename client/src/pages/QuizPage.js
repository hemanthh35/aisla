// AISLA - Quiz Page
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './QuizPage.css';

const QuizPage = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch experiment
            const expRes = await axios.get(`/api/experiment/${id}`, config);
            setExperiment(expRes.data.experiment);

            // Fetch quiz
            const quizRes = await axios.get(`/api/quiz/${id}`, config);
            setQuiz(quizRes.data.quiz);
            setAnswers(new Array(quizRes.data.quiz.questions.length).fill(''));
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Quiz not found. It may need to be generated first.');
            } else {
                setError(err.response?.data?.message || 'Failed to load quiz');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionIndex, answer) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answer;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        const unanswered = answers.filter(a => !a.trim()).length;
        if (unanswered > 0) {
            const confirm = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
            if (!confirm) return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/quiz/submit',
                {
                    experimentId: id,
                    quizId: quiz._id,
                    answers
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            navigate(`/experiment/${id}/result`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const currentQ = quiz?.questions?.[currentQuestion];
    const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;

    if (loading) {
        return (
            <div className="quiz-page loading-page">
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-page error-page">
                <div className="error-container">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h2>Quiz Not Available</h2>
                    <p>{error}</p>
                    <Link to={`/experiment/${id}`} className="back-link">Back to Experiment</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-page">
            {/* Header */}
            <header className="quiz-header">
                <div className="header-info">
                    <Link to={`/experiment/${id}`} className="back-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="quiz-title">{experiment?.title} - Quiz</h1>
                        <p className="quiz-subtitle">Question {currentQuestion + 1} of {quiz?.questions?.length}</p>
                    </div>
                </div>
                <div className="quiz-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{Math.round(progress)}%</span>
                </div>
            </header>

            {/* Question Card */}
            <main className="quiz-main">
                <div className="question-card">
                    <div className="question-header">
                        <span className={`question-type ${currentQ?.type}`}>
                            {currentQ?.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                        </span>
                        <span className="question-number">Q{currentQuestion + 1}</span>
                    </div>

                    <h2 className="question-text">{currentQ?.question}</h2>

                    {currentQ?.type === 'mcq' ? (
                        <div className="mcq-options">
                            {currentQ?.options?.map((option, index) => (
                                <label
                                    key={index}
                                    className={`option ${answers[currentQuestion] === option ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion}`}
                                        value={option}
                                        checked={answers[currentQuestion] === option}
                                        onChange={() => handleAnswerChange(currentQuestion, option)}
                                    />
                                    <span className="option-marker">{String.fromCharCode(65 + index)}</span>
                                    <span className="option-text">{option}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="short-answer">
                            <textarea
                                placeholder="Type your answer here..."
                                value={answers[currentQuestion]}
                                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                                rows={4}
                            />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="quiz-navigation">
                    <button
                        className="nav-btn prev"
                        onClick={() => setCurrentQuestion(prev => prev - 1)}
                        disabled={currentQuestion === 0}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Previous
                    </button>

                    <div className="question-dots">
                        {quiz?.questions?.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentQuestion ? 'active' : ''} ${answers[index] ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestion(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {currentQuestion < quiz?.questions?.length - 1 ? (
                        <button
                            className="nav-btn next"
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                        >
                            Next
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            className="nav-btn submit"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Quiz
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuizPage;
