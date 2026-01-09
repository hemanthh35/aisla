// AISLA - Create/Edit Experiment Page with Real-Time Progress
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './CreateExperiment.css';

const CreateExperiment = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    // Mode selection: 'quick' = just topic name, 'detailed' = full content
    const [mode, setMode] = useState('quick');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        contentType: 'text',
        subject: '',
        difficulty: 'intermediate'
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [showOptions, setShowOptions] = useState(false);

    // Progress state for streaming
    const [progress, setProgress] = useState({
        status: '',
        elapsed: 0,
        message: ''
    });

    useEffect(() => {
        if (isEditing) {
            fetchExperiment();
        }
    }, [id]);

    const fetchExperiment = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/experiments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const exp = res.data.experiment;
            setFormData({
                title: exp.title,
                content: exp.originalContent?.text || exp.rawContent || '',
                contentType: 'text',
                subject: exp.subject || '',
                difficulty: exp.difficulty || 'intermediate',
                structuredContent: exp.content || {}
            });
            setMode('detailed');
        } catch (err) {
            console.error('Error fetching experiment:', err);
            setError('Failed to fetch experiment for editing');
        } finally {
            setFetching(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Only send fields that were actually modified if possible, 
            // but for now we'll send the ones available in formData
            const updateData = {
                title: formData.title,
                subject: formData.subject,
                difficulty: formData.difficulty,
                rawContent: formData.content,
                content: formData.structuredContent
            };

            const res = await axios.put(`/api/experiment/${id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                navigate(`/experiment/${id}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update experiment');
        } finally {
            setLoading(false);
        }
    };

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

    const handlePDFUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF document');
            return;
        }

        setLoading(true);
        setError('');
        setProgress({ status: 'extracting', message: '📄 AI is parsing PDF document...' });

        try {
            const base64 = await convertToBase64(file);
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/experiment/extract-pdf', {
                pdfBase64: base64
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    content: response.data.text
                }));
                setProgress({ status: '', message: '' });
            }
        } catch (err) {
            console.error('PDF Upload Error:', err);
            setError(err.response?.data?.message || 'Failed to extract text from PDF');
            setProgress({ status: '', message: '' });
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

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
        if (isEditing) {
            handleUpdate();
            return;
        }

        if (!formData.title.trim()) {
            setError('Please enter an experiment title/topic');
            return;
        }

        // For detailed mode, require content
        if (mode === 'detailed' && (!formData.content.trim() || formData.content.length < 50)) {
            setError('Please provide more detailed content (at least 50 characters)');
            return;
        }

        setLoading(true);
        setProgress({
            status: 'generating',
            elapsed: 0,
            message: mode === 'quick'
                ? '⚡ AI generating complete experiment content... (5-15 seconds with Gemini)'
                : '⚡ AI processing your content... (3-10 seconds with Gemini)'
        });

        // Timer for elapsed time
        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            setProgress(prev => ({ ...prev, elapsed }));
        }, 1000);

        try {
            const token = localStorage.getItem('token');

            // Choose endpoint based on mode
            const endpoint = mode === 'quick'
                ? '/api/experiment/generate-from-topic'
                : '/api/experiment/create-stream';

            const body = mode === 'quick'
                ? {
                    topicName: formData.title,
                    subject: formData.subject,
                    difficulty: formData.difficulty
                }
                : formData;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
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

                            default:
                                break;
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
                <h1 className="create-title">{isEditing ? 'Edit Experiment' : 'Create New Experiment'}</h1>
            </header>

            {/* Mode Toggle */}
            <div className="mode-toggle-container">
                <div className="mode-toggle">
                    <button
                        type="button"
                        className={`mode-btn ${mode === 'quick' ? 'active' : ''}`}
                        onClick={() => { setMode('quick'); setStep(1); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Quick Generate
                    </button>
                    <button
                        type="button"
                        className={`mode-btn ${mode === 'detailed' ? 'active' : ''}`}
                        onClick={() => { setMode('detailed'); setStep(1); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Detailed Input
                    </button>
                </div>
                <p className="mode-description">
                    {mode === 'quick'
                        ? '✨ Just enter a topic name — AI will generate the complete experiment automatically!'
                        : '📝 Provide detailed content and AI will structure it into an experiment.'}
                </p>
            </div>

            {/* Minimal Progress Bar at the top instead of steps */}
            {loading && (
                <div className="minimal-progress-bar">
                    <div
                        className="minimal-progress-fill"
                        style={{ width: `${Math.min((progress.elapsed / 90) * 100, 95)}%` }}
                    ></div>
                </div>
            )}

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
                    {/* QUICK MODE - Step 1: Topic & Settings */}
                    {mode === 'quick' && step === 1 && (
                        <div className="form-step">
                            <div className="form-group">
                                <label htmlFor="title" style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: '600', color: '#e4e4e7' }}>What would you like to create today?</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter any science or coding topic..."
                                    className="form-input form-input-large"
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), setStep(2))}
                                />
                            </div>

                            <div className="minimal-options-toggle">
                                <button
                                    type="button"
                                    className="text-btn-small"
                                    onClick={() => setShowOptions(!showOptions)}
                                >
                                    {showOptions ? 'Hide Options' : 'Show Options'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showOptions ? 'rotate(180deg)' : 'none' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            </div>

                            {showOptions && (
                                <div className="form-row minimal-options-row">
                                    <div className="form-group">
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="form-select-minimal"
                                        >
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Computer Science">Coding / IT</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <select
                                            id="difficulty"
                                            name="difficulty"
                                            value={formData.difficulty}
                                            onChange={handleChange}
                                            className="form-select-minimal"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="step-actions center">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-large"
                                    style={{ width: '100%', fontSize: '1.1rem', padding: '1.25rem' }}
                                    onClick={() => {
                                        if (!formData.title.trim()) {
                                            setError('Please enter an experiment topic');
                                            return;
                                        }
                                        setStep(2);
                                    }}
                                >
                                    <span>Continue to Preview</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* QUICK MODE - Step 2: Generate */}
                    {mode === 'quick' && step === 2 && (
                        <div className="form-step">
                            <h2 className="step-title">Generate Experiment</h2>
                            <p className="step-description">
                                Review your topic and let AI create the complete experiment.
                            </p>

                            <div className="review-section quick-review">
                                <div className="review-topic">
                                    <span className="review-label">Topic:</span>
                                    <span className="review-value-large">{formData.title}</span>
                                </div>
                                <div className="review-row">
                                    <div className="review-item">
                                        <span className="review-label">Subject:</span>
                                        <span className="review-value">{formData.subject || 'Auto-detect'}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">Difficulty:</span>
                                        <span className="review-value">{formData.difficulty}</span>
                                    </div>
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
                                            style={{ width: `${Math.min((progress.elapsed / 90) * 100, 95)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {!loading && (
                                <div className="ai-info quick-ai-info">
                                    <div className="ai-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </div>
                                    <div className="ai-text">
                                        <h4>Ready to Generate!</h4>
                                        <p>
                                            AI will create a complete, detailed experiment for <strong>"{formData.title}"</strong>
                                            <br />
                                            <strong>⏱️ Estimated time: 45-90 seconds</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-generate btn-large"
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
                                            Generate Complete Experiment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DETAILED MODE - Step 1: Basic Info */}
                    {mode === 'detailed' && step === 1 && (
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
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Computer Science">Coding / IT</option>
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
                                    type={isEditing ? 'submit' : 'button'}
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!formData.title.trim()) {
                                            setError('Please enter an experiment title');
                                            return;
                                        }
                                        if (!isEditing) setStep(2);
                                    }}
                                >
                                    {isEditing ? 'Save Changes' : 'Continue'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DETAILED MODE - Step 2: Content */}
                    {mode === 'detailed' && step === 2 && (
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
                                        <span>Image</span>
                                        <small>OCR Extract</small>
                                    </div>
                                </label>

                                <label className="upload-option">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handlePDFUpload}
                                        disabled={loading}
                                    />
                                    <div className="upload-option-content">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#ef4444' }}>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <path d="M16 13H8M16 17H8M10 9H8" />
                                        </svg>
                                        <span>PDF Doc</span>
                                        <small>AI Parse</small>
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
                                    rows={8}
                                />
                                <span className="char-count">{formData.content.length} characters</span>
                            </div>

                            {isEditing && formData.structuredContent && (
                                <div className="structured-editor">
                                    <h3 className="section-subtitle">Experiment Module Sections</h3>
                                    <p className="step-description">Refine the AI-generated sections for this experiment.</p>

                                    {['aim', 'apparatus', 'theory', 'procedure', 'observations', 'results', 'precautions'].map(field => (
                                        <div className="form-group" key={field}>
                                            <label htmlFor={`field-${field}`}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                            <textarea
                                                id={`field-${field}`}
                                                value={formData.structuredContent[field] || ''}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        structuredContent: {
                                                            ...formData.structuredContent,
                                                            [field]: e.target.value
                                                        }
                                                    });
                                                }}
                                                className="form-textarea-small"
                                                rows={4}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="step-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {isEditing ? 'Save Changes' : 'Continue'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DETAILED MODE - Step 3: Generate */}
                    {mode === 'detailed' && step === 3 && (
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
