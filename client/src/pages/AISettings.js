// AISLA - AI Provider Settings (Admin Only)
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './AISettings.css';

const AISettings = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Settings state
    const [settings, setSettings] = useState({
        provider: 'ollama',
        ollamaModel: 'gemma3:4b',
        ollamaUrl: 'http://localhost:11434',
        geminiModel: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 1024
    });

    // Provider status
    const [status, setStatus] = useState({
        ollama: { available: false, models: [] },
        gemini: { available: false }
    });

    useEffect(() => {
        // Check if admin
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        } else if (user) {
            fetchSettings();
        }
    }, [user, navigate]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/settings/ai', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(res.data.settings);
            setStatus(res.data.status);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(null);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/settings/ai', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (provider) => {
        setTesting(provider);
        setTestResult(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/settings/ai/test',
                { provider },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTestResult({
                provider,
                success: true,
                response: res.data.response,
                model: res.data.model
            });
        } catch (err) {
            setTestResult({
                provider,
                success: false,
                error: err.response?.data?.error || err.message
            });
        } finally {
            setTesting(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="ai-settings-access-denied">
                <div className="access-denied-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <h2>Access Denied</h2>
                    <p>Only administrators can access AI settings.</p>
                    <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-settings-page">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`ai-settings-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span>AISLA</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Admin Tools</div>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link to="/ai-settings" className="sidebar-link active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            AI Settings
                        </Link>
                        <Link to="/badge-management" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                            </svg>
                            Badge Management
                        </Link>
                        <Link to="/diagram-generator" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18" />
                                <path d="M9 21V9" />
                            </svg>
                            Diagram Generator
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
                            <div className="sidebar-user-role">{user?.role || 'admin'}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ai-settings-main">
                <header className="ai-settings-topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <h1 className="topbar-title">AI Provider Settings</h1>
                        <span className="admin-badge">Admin Only</span>
                    </div>
                </header>

                <div className="ai-settings-content">
                    {loading ? (
                        <div className="settings-loading">
                            <div className="loader"></div>
                            <p>Loading AI settings...</p>
                        </div>
                    ) : (
                        <>
                            {/* Alerts */}
                            {error && (
                                <div className="alert alert-error">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    {success}
                                </div>
                            )}

                            {/* Provider Selection */}
                            <section className="settings-section">
                                <div className="section-header">
                                    <h2>Active AI Provider</h2>
                                    <p>Choose between local Ollama or cloud-based Gemini API</p>
                                </div>

                                <div className="provider-cards">
                                    {/* Ollama Card */}
                                    <div
                                        className={`provider-card ${settings.provider === 'ollama' ? 'active' : ''} ${!status.ollama?.available ? 'unavailable' : ''}`}
                                        onClick={() => status.ollama?.available && setSettings({ ...settings, provider: 'ollama' })}
                                    >
                                        <div className="provider-header">
                                            <div className="provider-icon ollama">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                                    <path d="M9 9h6v6H9z" />
                                                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                                                </svg>
                                            </div>
                                            <div className="provider-info">
                                                <h3>Ollama</h3>
                                                <span className="provider-type">Local / Offline</span>
                                            </div>
                                            {settings.provider === 'ollama' && (
                                                <div className="active-badge">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="provider-status">
                                            <span className={`status-dot ${status.ollama?.available ? 'online' : 'offline'}`}></span>
                                            {status.ollama?.available ? 'Running' : 'Not Available'}
                                        </div>
                                        {status.ollama?.models?.length > 0 && (
                                            <div className="provider-models">
                                                {status.ollama.models.slice(0, 3).map(m => (
                                                    <span key={m} className="model-tag">{m}</span>
                                                ))}
                                                {status.ollama.models.length > 3 && (
                                                    <span className="model-tag more">+{status.ollama.models.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                        <p className="provider-desc">
                                            Run AI models locally on your machine. No internet required. Complete privacy.
                                        </p>
                                    </div>

                                    {/* Gemini Card */}
                                    <div
                                        className={`provider-card ${settings.provider === 'gemini' ? 'active' : ''} ${!status.gemini?.available ? 'unavailable' : ''}`}
                                        onClick={() => status.gemini?.available && setSettings({ ...settings, provider: 'gemini' })}
                                    >
                                        <div className="provider-header">
                                            <div className="provider-icon gemini">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                    <path d="M2 17l10 5 10-5" />
                                                    <path d="M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                            <div className="provider-info">
                                                <h3>Gemini API</h3>
                                                <span className="provider-type">Google Cloud</span>
                                            </div>
                                            {settings.provider === 'gemini' && (
                                                <div className="active-badge">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="provider-status">
                                            <span className={`status-dot ${status.gemini?.available ? 'online' : 'offline'}`}></span>
                                            {status.gemini?.available ? 'API Key Configured' : 'API Key Missing'}
                                        </div>
                                        <p className="provider-desc">
                                            Use Google's Gemini 2.0 Flash model. Fast, powerful, and always available.
                                        </p>
                                        {!status.gemini?.available && (
                                            <div className="provider-warning">
                                                Add GEMINI_API_KEY to server .env file
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Provider-specific Settings */}
                            <section className="settings-section">
                                <div className="section-header">
                                    <h2>Model Configuration</h2>
                                    <p>Customize parameters for the selected provider</p>
                                </div>

                                <div className="settings-grid">
                                    {/* Ollama Settings */}
                                    {settings.provider === 'ollama' && (
                                        <>
                                            <div className="setting-group">
                                                <label>Ollama URL</label>
                                                <input
                                                    type="text"
                                                    value={settings.ollamaUrl}
                                                    onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                                                    placeholder="http://localhost:11434"
                                                />
                                                <span className="setting-hint">Default: http://localhost:11434</span>
                                            </div>
                                            <div className="setting-group">
                                                <label>Model Name</label>
                                                <select
                                                    value={settings.ollamaModel}
                                                    onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                                                >
                                                    {status.ollama?.models?.length > 0 ? (
                                                        status.ollama.models.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))
                                                    ) : (
                                                        <option value={settings.ollamaModel}>{settings.ollamaModel}</option>
                                                    )}
                                                </select>
                                                <span className="setting-hint">Select from available Ollama models</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Gemini Settings */}
                                    {settings.provider === 'gemini' && (
                                        <div className="setting-group">
                                            <label>Gemini Model</label>
                                            <select
                                                value={settings.geminiModel}
                                                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                                            >
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                            </select>
                                            <span className="setting-hint">Gemini 2.0 Flash offers best performance</span>
                                        </div>
                                    )}

                                    {/* Common Settings */}
                                    <div className="setting-group">
                                        <label>Temperature</label>
                                        <div className="range-input">
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={settings.temperature}
                                                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                                            />
                                            <span className="range-value">{settings.temperature}</span>
                                        </div>
                                        <span className="setting-hint">Lower = more focused, Higher = more creative</span>
                                    </div>

                                    <div className="setting-group">
                                        <label>Max Tokens</label>
                                        <input
                                            type="number"
                                            min="256"
                                            max="8192"
                                            value={settings.maxTokens}
                                            onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                                        />
                                        <span className="setting-hint">Maximum response length (256-8192)</span>
                                    </div>
                                </div>
                            </section>

                            {/* Test Connection */}
                            <section className="settings-section">
                                <div className="section-header">
                                    <h2>Test Connection</h2>
                                    <p>Verify that the AI provider is working correctly</p>
                                </div>

                                <div className="test-buttons">
                                    <button
                                        className={`test-btn ollama ${testing === 'ollama' ? 'testing' : ''}`}
                                        onClick={() => handleTest('ollama')}
                                        disabled={testing || !status.ollama?.available}
                                    >
                                        {testing === 'ollama' ? (
                                            <>
                                                <div className="btn-loader"></div>
                                                Testing Ollama...
                                            </>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                                Test Ollama
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={`test-btn gemini ${testing === 'gemini' ? 'testing' : ''}`}
                                        onClick={() => handleTest('gemini')}
                                        disabled={testing || !status.gemini?.available}
                                    >
                                        {testing === 'gemini' ? (
                                            <>
                                                <div className="btn-loader"></div>
                                                Testing Gemini...
                                            </>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                                Test Gemini
                                            </>
                                        )}
                                    </button>
                                </div>

                                {testResult && (
                                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                                        <div className="test-result-header">
                                            {testResult.success ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="15" y1="9" x2="9" y2="15" />
                                                    <line x1="9" y1="9" x2="15" y2="15" />
                                                </svg>
                                            )}
                                            <span>
                                                {testResult.success
                                                    ? `${testResult.provider.toUpperCase()} is working!`
                                                    : `${testResult.provider.toUpperCase()} test failed`}
                                            </span>
                                        </div>
                                        {testResult.success ? (
                                            <div className="test-response">
                                                <strong>Model:</strong> {testResult.model}<br />
                                                <strong>Response:</strong> {testResult.response}
                                            </div>
                                        ) : (
                                            <div className="test-error">
                                                {testResult.error}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Save Button */}
                            <div className="settings-actions">
                                <button className="save-btn" onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="btn-loader"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                <polyline points="7 3 7 8 15 8" />
                                            </svg>
                                            Save Settings
                                        </>
                                    )}
                                </button>
                                <button className="refresh-btn" onClick={fetchSettings} disabled={loading}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 21h5v-5" />
                                    </svg>
                                    Refresh Status
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AISettings;
