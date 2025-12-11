// AISLA - Badge Management Page (Admin Only)
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './BadgeManagement.css';

const BadgeManagement = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('badges');
    const [loading, setLoading] = useState(true);

    // Badge state
    const [badges, setBadges] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);

    // Assignment state
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Stats state
    const [stats, setStats] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'star',
        color: 'gold',
        rarity: 'common',
        category: 'achievement',
        points: 10
    });

    const [assignFormData, setAssignFormData] = useState({
        userId: '',
        badgeId: '',
        reason: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    // Check if admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const config = getAuthConfig();

            const [badgesRes, usersRes, assignmentsRes, statsRes] = await Promise.all([
                axios.get('/api/badges', config),
                axios.get('/api/badges/users', config),
                axios.get('/api/badges/assignments', config),
                axios.get('/api/badges/stats', config)
            ]);

            setBadges(badgesRes.data.badges || []);
            setUsers(usersRes.data.users || []);
            setAssignments(assignmentsRes.data.assignments || []);
            setStats(statsRes.data.stats || null);
        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Badge CRUD handlers
    const handleCreateBadge = async (e) => {
        e.preventDefault();
        try {
            const config = getAuthConfig();
            await axios.post('/api/badges', formData, config);
            showMessage('success', 'Badge created successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Error creating badge');
        }
    };

    const handleUpdateBadge = async (e) => {
        e.preventDefault();
        try {
            const config = getAuthConfig();
            await axios.put(`/api/badges/${editingBadge._id}`, formData, config);
            showMessage('success', 'Badge updated successfully!');
            setEditingBadge(null);
            resetForm();
            fetchData();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Error updating badge');
        }
    };

    const handleDeleteBadge = async (badgeId) => {
        if (!window.confirm('Are you sure you want to delete this badge? All assignments will be removed.')) {
            return;
        }
        try {
            const config = getAuthConfig();
            await axios.delete(`/api/badges/${badgeId}`, config);
            showMessage('success', 'Badge deleted successfully!');
            fetchData();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Error deleting badge');
        }
    };

    // Assignment handlers
    const handleAssignBadge = async (e) => {
        e.preventDefault();
        try {
            const config = getAuthConfig();
            await axios.post('/api/badges/assign', assignFormData, config);
            showMessage('success', 'Badge assigned successfully!');
            setShowAssignModal(false);
            setAssignFormData({ userId: '', badgeId: '', reason: '' });
            fetchData();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Error assigning badge');
        }
    };

    const handleRevokeBadge = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to revoke this badge?')) {
            return;
        }
        try {
            const config = getAuthConfig();
            await axios.delete(`/api/badges/revoke/${assignmentId}`, config);
            showMessage('success', 'Badge revoked successfully!');
            fetchData();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Error revoking badge');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon: 'star',
            color: 'gold',
            rarity: 'common',
            category: 'achievement',
            points: 10
        });
    };

    const openEditModal = (badge) => {
        setEditingBadge(badge);
        setFormData({
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            color: badge.color,
            rarity: badge.rarity,
            category: badge.category,
            points: badge.points
        });
    };

    const iconOptions = ['star', 'trophy', 'medal', 'award', 'crown', 'lightning', 'fire', 'rocket', 'diamond', 'heart', 'book', 'code', 'check', 'target', 'zap'];
    const colorOptions = ['gold', 'silver', 'bronze', 'purple', 'blue', 'green', 'red', 'orange', 'pink', 'cyan'];
    const rarityOptions = ['common', 'rare', 'epic', 'legendary'];
    const categoryOptions = ['academic', 'participation', 'achievement', 'milestone', 'special'];

    const getBadgeIcon = (icon) => {
        const icons = {
            star: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
            trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
            medal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /><path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" /><circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" /></svg>,
            award: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
            crown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>,
            lightning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" /><path d="m13 12-3 5h4l-3 5" /></svg>,
            fire: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
            rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>,
            diamond: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /></svg>,
            heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
            book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
            code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
            check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
            target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
            zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
        };
        return icons[icon] || icons.star;
    };

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="badge-management">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <div className="sidebar-section-title">Menu</div>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Dashboard
                        </Link>

                        <Link to="/experiment/create" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Create Experiment
                        </Link>

                        <Link to="/badge-management" className="sidebar-link active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                            </svg>
                            Badge Management
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <h1 className="topbar-title">Badge Management</h1>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Message Toast */}
                    {message.text && (
                        <div className={`message-toast ${message.type}`}>
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Stats Overview */}
                    {stats && (
                        <section className="badge-stats-grid">
                            <div className="badge-stat-card">
                                <div className="badge-stat-icon gold">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="6" />
                                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                    </svg>
                                </div>
                                <div className="badge-stat-info">
                                    <div className="badge-stat-value">{stats.totalBadges}</div>
                                    <div className="badge-stat-label">Total Badges</div>
                                </div>
                            </div>

                            <div className="badge-stat-card">
                                <div className="badge-stat-icon purple">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="badge-stat-info">
                                    <div className="badge-stat-value">{users.length}</div>
                                    <div className="badge-stat-label">Total Users</div>
                                </div>
                            </div>

                            <div className="badge-stat-card">
                                <div className="badge-stat-icon green">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className="badge-stat-info">
                                    <div className="badge-stat-value">{stats.totalAssignments}</div>
                                    <div className="badge-stat-label">Badges Awarded</div>
                                </div>
                            </div>

                            <div className="badge-stat-card">
                                <div className="badge-stat-icon blue">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="20" x2="12" y2="10" />
                                        <line x1="18" y1="20" x2="18" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="16" />
                                    </svg>
                                </div>
                                <div className="badge-stat-info">
                                    <div className="badge-stat-value">
                                        {stats.topEarners?.[0]?.badgeCount || 0}
                                    </div>
                                    <div className="badge-stat-label">Top Earner Badges</div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Tabs */}
                    <div className="badge-tabs">
                        <button
                            className={`badge-tab ${activeTab === 'badges' ? 'active' : ''}`}
                            onClick={() => setActiveTab('badges')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                            </svg>
                            All Badges
                        </button>
                        <button
                            className={`badge-tab ${activeTab === 'assign' ? 'active' : ''}`}
                            onClick={() => setActiveTab('assign')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            Award Badges
                        </button>
                        <button
                            className={`badge-tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Award History
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading badge data...</p>
                        </div>
                    ) : (
                        <>
                            {/* All Badges Tab */}
                            {activeTab === 'badges' && (
                                <section className="badges-section">
                                    <div className="section-header">
                                        <h3 className="section-title">All Badges ({badges.length})</h3>
                                        <button className="create-badge-btn" onClick={() => setShowCreateModal(true)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="16" />
                                                <line x1="8" y1="12" x2="16" y2="12" />
                                            </svg>
                                            Create Badge
                                        </button>
                                    </div>

                                    {badges.length === 0 ? (
                                        <div className="empty-state">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="8" r="6" />
                                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                            </svg>
                                            <h4>No badges created yet</h4>
                                            <p>Create your first badge to start awarding achievements</p>
                                            <button className="empty-state-btn" onClick={() => setShowCreateModal(true)}>
                                                Create Badge
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="badges-grid">
                                            {badges.map((badge) => (
                                                <div key={badge._id} className={`badge-card ${badge.color}`}>
                                                    <div className="badge-card-header">
                                                        <div className={`badge-icon-wrapper ${badge.color}`}>
                                                            {getBadgeIcon(badge.icon)}
                                                        </div>
                                                        <span className={`badge-rarity ${badge.rarity}`}>{badge.rarity}</span>
                                                    </div>
                                                    <h4 className="badge-name">{badge.name}</h4>
                                                    <p className="badge-description">{badge.description}</p>
                                                    <div className="badge-meta">
                                                        <span className="badge-category">{badge.category}</span>
                                                        <span className="badge-points">{badge.points} pts</span>
                                                    </div>
                                                    <div className="badge-actions">
                                                        <button className="badge-edit-btn" onClick={() => openEditModal(badge)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        <button className="badge-delete-btn" onClick={() => handleDeleteBadge(badge._id)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Award Badges Tab */}
                            {activeTab === 'assign' && (
                                <section className="assign-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Award Badge to User</h3>
                                    </div>

                                    <div className="assign-form-card">
                                        <form onSubmit={handleAssignBadge}>
                                            <div className="assign-form-grid">
                                                <div className="form-group">
                                                    <label>Select User</label>
                                                    <select
                                                        value={assignFormData.userId}
                                                        onChange={(e) => setAssignFormData({ ...assignFormData, userId: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Choose a user...</option>
                                                        {users.map((u) => (
                                                            <option key={u._id} value={u._id}>
                                                                {u.name} ({u.email}) - {u.role}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>Select Badge</label>
                                                    <select
                                                        value={assignFormData.badgeId}
                                                        onChange={(e) => setAssignFormData({ ...assignFormData, badgeId: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Choose a badge...</option>
                                                        {badges.map((b) => (
                                                            <option key={b._id} value={b._id}>
                                                                {b.name} ({b.rarity})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group full-width">
                                                    <label>Reason (Optional)</label>
                                                    <textarea
                                                        value={assignFormData.reason}
                                                        onChange={(e) => setAssignFormData({ ...assignFormData, reason: e.target.value })}
                                                        placeholder="Why is this badge being awarded?"
                                                        rows="3"
                                                    />
                                                </div>
                                            </div>

                                            <button type="submit" className="assign-btn">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="8" r="6" />
                                                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                                </svg>
                                                Award Badge
                                            </button>
                                        </form>
                                    </div>

                                    {/* Users with their badges */}
                                    <div className="users-badges-list">
                                        <h4 className="subsection-title">Users & Their Badges</h4>
                                        {users.filter(u => u.role !== 'admin').map((u) => {
                                            const userAssignments = assignments.filter(a => a.userId?._id === u._id);
                                            return (
                                                <div key={u._id} className="user-badges-card">
                                                    <div className="user-badges-header">
                                                        <div className="user-avatar">{getInitials(u.name)}</div>
                                                        <div className="user-info">
                                                            <div className="user-name">{u.name}</div>
                                                            <div className="user-details">
                                                                {u.email} • {u.role} {u.department ? `• ${u.department}` : ''}
                                                            </div>
                                                        </div>
                                                        <div className="user-badge-count">{userAssignments.length} badges</div>
                                                    </div>
                                                    {userAssignments.length > 0 && (
                                                        <div className="user-earned-badges">
                                                            {userAssignments.map((a) => (
                                                                <div key={a._id} className={`mini-badge ${a.badgeId?.color}`}>
                                                                    <div className="mini-badge-icon">
                                                                        {getBadgeIcon(a.badgeId?.icon)}
                                                                    </div>
                                                                    <span>{a.badgeId?.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Award History Tab */}
                            {activeTab === 'history' && (
                                <section className="history-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Award History ({assignments.length})</h3>
                                    </div>

                                    {assignments.length === 0 ? (
                                        <div className="empty-state">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <h4>No badges awarded yet</h4>
                                            <p>Start awarding badges to users to see the history here</p>
                                        </div>
                                    ) : (
                                        <div className="history-list">
                                            {assignments.map((assignment) => (
                                                <div key={assignment._id} className="history-item">
                                                    <div className={`history-badge-icon ${assignment.badgeId?.color}`}>
                                                        {getBadgeIcon(assignment.badgeId?.icon)}
                                                    </div>
                                                    <div className="history-content">
                                                        <div className="history-main">
                                                            <span className="history-badge-name">{assignment.badgeId?.name}</span>
                                                            <span className="history-arrow">→</span>
                                                            <span className="history-user-name">{assignment.userId?.name}</span>
                                                            <span className="history-user-role">({assignment.userId?.role})</span>
                                                        </div>
                                                        {assignment.reason && (
                                                            <div className="history-reason">"{assignment.reason}"</div>
                                                        )}
                                                        <div className="history-meta">
                                                            <span>Awarded by {assignment.awardedBy?.name}</span>
                                                            <span>•</span>
                                                            <span>{new Date(assignment.awardedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="revoke-btn"
                                                        onClick={() => handleRevokeBadge(assignment._id)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="15" y1="9" x2="9" y2="15" />
                                                            <line x1="9" y1="9" x2="15" y2="15" />
                                                        </svg>
                                                        Revoke
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Create Badge Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Badge</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateBadge}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Badge Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Quiz Master"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What is this badge awarded for?"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Icon</label>
                                        <div className="icon-selector">
                                            {iconOptions.map((icon) => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, icon })}
                                                >
                                                    {getBadgeIcon(icon)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-selector">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`color-option ${color} ${formData.color === color ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, color })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Rarity</label>
                                        <select
                                            value={formData.rarity}
                                            onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                                        >
                                            {rarityOptions.map((r) => (
                                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categoryOptions.map((c) => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Points</label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            max="1000"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="badge-preview">
                                    <label>Preview</label>
                                    <div className={`preview-badge ${formData.color}`}>
                                        <div className={`preview-badge-icon ${formData.color}`}>
                                            {getBadgeIcon(formData.icon)}
                                        </div>
                                        <div className="preview-badge-info">
                                            <span className="preview-badge-name">{formData.name || 'Badge Name'}</span>
                                            <span className={`preview-badge-rarity ${formData.rarity}`}>{formData.rarity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="modal-submit-btn">
                                    Create Badge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Badge Modal */}
            {editingBadge && (
                <div className="modal-overlay" onClick={() => setEditingBadge(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Badge</h3>
                            <button className="modal-close" onClick={() => { setEditingBadge(null); resetForm(); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateBadge}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Badge Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Icon</label>
                                        <div className="icon-selector">
                                            {iconOptions.map((icon) => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, icon })}
                                                >
                                                    {getBadgeIcon(icon)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-selector">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`color-option ${color} ${formData.color === color ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, color })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Rarity</label>
                                        <select
                                            value={formData.rarity}
                                            onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                                        >
                                            {rarityOptions.map((r) => (
                                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categoryOptions.map((c) => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Points</label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            max="1000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="modal-cancel-btn" onClick={() => { setEditingBadge(null); resetForm(); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="modal-submit-btn">
                                    Update Badge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgeManagement;
