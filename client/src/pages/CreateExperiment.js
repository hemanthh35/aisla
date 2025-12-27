// AISLA - Create Experiment Page with Real-Time Progress
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './CreateExperiment.css';

const CreateExperiment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        contentType: 'text',
        subject: '',
        difficulty: 'intermediate'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    // Progress state for streaming
    const [progress, setProgress] = useState({
        status: '',
        elapsed: 0,
        message: ''
    });

    // Check if user is faculty
    if (user?.role !== 'faculty' && user?.role !== 'admin') {
        return (
            <div className="create-experiment-page">
                <div className="access-denied">
                    <h2>Access Denied</h2>
                    <p>Only faculty members can create experiments.</p>
                    <Link to="/dashboard" className="back-link">Go to Dashboard</Link>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];

            setLoading(true);
            setProgress({ status: 'extracting', message: 'Extracting text from image...' });

            try {
                const token = localStorage.getItem('token');
                const res = await axios.post('/api/experiment/extract-text',
                    { imageBase64: base64 },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setFormData({
                    ...formData,
                    content: formData.content + '\n' + res.data.text,
                    contentType: 'image'
                });
                setProgress({ status: '', message: '' });
            } catch (err) {
                setError('Failed to extract text from image');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Streaming submit with real-time progress
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Please enter an experiment title');
            return;
        }

        if (!formData.content.trim() || formData.content.length < 50) {
            setError('Please provide more detailed content (at least 50 characters)');
            return;
        }

        setLoading(true);
        setProgress({
            status: 'generating',
            elapsed: 0,
            message: 'Starting AI generation... Estimated time: 30-60 seconds'
        });

        // Timer for elapsed time
        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            setProgress(prev => ({ ...prev, elapsed }));
        }, 1000);

        try {
            const token = localStorage.getItem('token');

            // Use streaming endpoint
            const response = await fetch('/api/experiment/create-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'START':
                                setProgress({
                                    status: 'generating',
                                    elapsed: 0,
                                    message: data.message
                                });
                                break;

                            case 'PROGRESS':
                                setProgress({
                                    status: 'generating',
                                    elapsed: data.elapsed,
                                    message: data.message
                                });
                                break;

                            case 'DONE':
                                clearInterval(timer);
                                setProgress({
                                    status: 'done',
                                    elapsed: data.elapsed,
                                    message: data.message
                                });
                                // Navigate to the new experiment
                                setTimeout(() => {
                                    navigate(`/experiment/${data.experiment._id}`);
                                }, 500);
                                break;

                            case 'ERROR':
                                throw new Error(data.error);
                        }
                    } catch (parseErr) {
                        // Skip invalid JSON
                    }
                }
            }

        } catch (err) {
            clearInterval(timer);
            setError(err.message || 'Failed to create experiment');
            setProgress({ status: '', elapsed: 0, message: '' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-experiment-page">
            {/* Header */}
            <header className="create-header">
                <Link to="/dashboard" className="back-button" title="Back to Dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="create-title">Create New Experiment</h1>
            </header>

            {/* Progress Steps */}
            <div className="progress-steps">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <span>Basic Info</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Content</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Generate</span>
                </div>
            </div>

            {/* Form Card */}
            <div className="create-form-card">
                {error && (
                    <div className="error-alert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="form-step">
                            <h2 className="step-title">Basic Information</h2>
                            <p className="step-description">Enter the basic details for your experiment.</p>

                            <div className="form-group">
                                <label htmlFor="title">Experiment Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Ohm's Law Verification"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Subject</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Biology">Biology</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="difficulty">Difficulty Level</label>
                                    <select
                                        id="difficulty"
                                        name="difficulty"
                                        value={formData.difficulty}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!formData.title.trim()) {
                                            setError('Please enter an experiment title');
                                            return;
                                        }
                                        setStep(2);
                                    }}
                                >
                                    Continue
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Content */}
                    {step === 2 && (
                        <div className="form-step">
                            <h2 className="step-title">Experiment Content</h2>
                            <p className="step-description">
                                Provide the raw content for your experiment. You can type, paste text, or upload an image.
                            </p>

                            {/* Upload Options */}
                            <div className="upload-options">
                                <label className="upload-option">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={loading}
                                    />
                                    <div className="upload-option-content">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span>Upload Image</span>
                                        <small>OCR will extract text</small>
                                    </div>
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="content">Content *</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Enter or paste the experiment details here. Include information about the aim, theory, procedure, formulas, etc. The AI will structure this into a complete experiment module."
                                    className="form-textarea"
                                    rows={12}
                                />
                                <span className="char-count">{formData.content.length} characters</span>
                            </div>

                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!formData.content.trim() || formData.content.length < 50) {
                                            setError('Please provide more detailed content (at least 50 characters)');
                                            return;
                                        }
                                        setStep(3);
                                    }}
                                    disabled={loading}
                                >
                                    Continue
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Generate */}
                    {step === 3 && (
                        <div className="form-step">
                            <h2 className="step-title">Generate Experiment</h2>
                            <p className="step-description">
                                Review your input and let AI generate a structured experiment.
                            </p>

                            <div className="review-section">
                                <div className="review-item">
                                    <span className="review-label">Title:</span>
                                    <span className="review-value">{formData.title}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Subject:</span>
                                    <span className="review-value">{formData.subject || 'Not specified'}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Difficulty:</span>
                                    <span className="review-value">{formData.difficulty}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Content:</span>
                                    <span className="review-value">{formData.content.substring(0, 200)}...</span>
                                </div>
                            </div>

                            {/* Progress Display */}
                            {loading && progress.status && (
                                <div className="generation-progress">
                                    <div className="progress-indicator">
                                        <div className="progress-spinner"></div>
                                        <div className="progress-info">
                                            <div className="progress-status">{progress.message}</div>
                                            <div className="progress-time">
                                                ⏱️ Elapsed: <strong>{progress.elapsed}s</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${Math.min((progress.elapsed / 60) * 100, 95)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {!loading && (
                                <div className="ai-info">
                                    <div className="ai-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </div>
                                    <div className="ai-text">
                                        <h4>AI-Powered Generation</h4>
                                        <p>
                                            Our AI will analyze your content and generate a structured experiment.
                                            <br />
                                            <strong>⏱️ Estimated time: 30-60 seconds</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(2)}
                                    disabled={loading}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-generate"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Generating... {progress.elapsed}s
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                            </svg>
                                            Generate Experiment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreateExperiment;
