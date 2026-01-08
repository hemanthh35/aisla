// AISLA - Comprehensive Admin Dashboard with Charts
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import './AdminDashboard.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        totalExperiments: 0,
        totalQuizzes: 0,
        totalSubmissions: 0,
        averageScore: 0
    });
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [chartData, setChartData] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        rollNumber: ''
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'admin') return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch all data in parallel
            const [usersRes, experimentsRes, submissionsRes, chartRes] = await Promise.all([
                axios.get('/api/admin/users', config).catch(err => {
                    console.error('Failed to fetch users:', err.response?.data || err.message);
                    return { data: { users: [] } };
                }),
                axios.get('/api/experiments', config).catch(err => {
                    console.error('Failed to fetch experiments:', err.response?.data || err.message);
                    return { data: { experiments: [] } };
                }),
                axios.get('/api/admin/all-submissions', config).catch(err => {
                    console.error('Failed to fetch submissions:', err.response?.data || err.message);
                    return { data: { submissions: [] } };
                }),
                axios.get('/api/admin/chart-data', config).catch(err => {
                    console.error('Failed to fetch chart data:', err.response?.data || err.message);
                    return { data: { charts: null } };
                })
            ]);

            const allUsers = usersRes.data.users || [];
            const allExperiments = experimentsRes.data.experiments || [];
            const allSubmissions = submissionsRes.data.submissions || [];

            console.log('Fetched data:', {
                users: allUsers.length,
                experiments: allExperiments.length,
                submissions: allSubmissions.length
            });

            // Separate students and faculty
            const studentsList = allUsers.filter(u => u.role === 'student');
            const facultyList = allUsers.filter(u => u.role === 'faculty' || u.role === 'admin');

            setStudents(studentsList);
            setFaculty(facultyList);
            setExperiments(allExperiments);
            setSubmissions(allSubmissions);
            setChartData(chartRes.data.charts || null);

            // Calculate stats
            const avgScore = allSubmissions.length > 0
                ? Math.round(allSubmissions.reduce((a, s) => a + (s.percentage || 0), 0) / allSubmissions.length)
                : 0;

            setStats({
                totalStudents: studentsList.length,
                totalFaculty: facultyList.length,
                totalExperiments: allExperiments.length,
                totalQuizzes: allExperiments.filter(e => e.quizGenerated).length,
                totalSubmissions: allSubmissions.length,
                averageScore: avgScore
            });

            // Create recent activity
            const activity = [
                ...allSubmissions.slice(0, 5).map(s => ({
                    type: 'submission',
                    user: s.userId?.name || 'Unknown',
                    action: `submitted quiz for ${s.experimentId?.title || 'experiment'}`,
                    score: s.percentage,
                    date: s.submittedAt
                })),
                ...allExperiments.slice(0, 5).map(e => ({
                    type: 'experiment',
                    user: e.createdBy?.name || 'Faculty',
                    action: `created experiment "${e.title}"`,
                    date: e.createdAt
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

            setRecentActivity(activity);

        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Failed to load admin data. Some features may not work.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get initials
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Filter and sort students
    const filteredStudents = students
        .filter(s =>
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'email') return (a.email || '').localeCompare(b.email || '');
            if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

    // Get student stats
    const getStudentStats = (studentId) => {
        const studentSubmissions = submissions.filter(s => s.userId?._id === studentId || s.userId === studentId);
        const totalAttempts = studentSubmissions.length;
        const avgScore = totalAttempts > 0
            ? Math.round(studentSubmissions.reduce((a, s) => a + s.percentage, 0) / totalAttempts)
            : 0;
        const bestScore = totalAttempts > 0
            ? Math.max(...studentSubmissions.map(s => s.percentage))
            : 0;
        return { totalAttempts, avgScore, bestScore };
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Create user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/admin/users', createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowCreateModal(false);
            setCreateForm({
                name: '',
                email: '',
                password: '',
                role: 'student',
                department: '',
                rollNumber: ''
            });
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setFormLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/users/${selectedUser._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setFormLoading(false);
        }
    };

    // Chart options
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#71717a' }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#71717a' },
                beginAtZero: true
            }
        }
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#71717a' }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#71717a' },
                beginAtZero: true
            }
        }
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#a1a1aa', padding: 15 }
            }
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="admin-dashboard-page">
                <div className="access-denied">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <h2>Access Denied</h2>
                    <p>Only administrators can access this page.</p>
                    <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span>AISLA Admin</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Admin Panel</div>
                        <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Overview
                        </button>
                        <button className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                            Analytics
                        </button>
                        <button className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            Students
                        </button>
                        <button className={`sidebar-link ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                            Quiz Results
                        </button>
                        <button className={`sidebar-link ${activeTab === 'experiments' ? 'active' : ''}`} onClick={() => setActiveTab('experiments')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                            Experiments
                        </button>
                        <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                            User Management
                        </button>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Tools</div>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            Main Dashboard
                        </Link>
                        <Link to="/ai-settings" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                            AI Settings
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
                            <div className="sidebar-user-role">Administrator</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <h1 className="topbar-title">Admin Dashboard</h1>
                        <span className="admin-badge">Administrator</span>
                    </div>
                    <div className="topbar-right">
                        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                            Refresh
                        </button>
                    </div>
                </header>

                <div className="admin-content">
                    {error && (
                        <div className="error-banner">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            <section className="stats-grid">
                                <div className="stat-card primary">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div>
                                    <div className="stat-info"><div className="stat-value">{stats.totalStudents}</div><div className="stat-label">Total Students</div></div>
                                </div>
                                <div className="stat-card success">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg></div>
                                    <div className="stat-info"><div className="stat-value">{stats.totalExperiments}</div><div className="stat-label">Experiments</div></div>
                                </div>
                                <div className="stat-card warning">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>
                                    <div className="stat-info"><div className="stat-value">{stats.totalSubmissions}</div><div className="stat-label">Quiz Submissions</div></div>
                                </div>
                                <div className="stat-card info">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
                                    <div className="stat-info"><div className="stat-value">{stats.averageScore}%</div><div className="stat-label">Average Score</div></div>
                                </div>
                            </section>

                            <div className="overview-grid">
                                <section className="activity-section">
                                    <div className="section-header">
                                        <h3>Recent Activity</h3>
                                    </div>
                                    <div className="activity-list">
                                        {recentActivity.length === 0 ? (
                                            <div className="empty-activity">No recent activity</div>
                                        ) : recentActivity.map((activity, index) => (
                                            <div key={index} className={`activity-item ${activity.type}`}>
                                                <div className={`activity-icon ${activity.type}`}>
                                                    {activity.type === 'submission' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>}
                                                </div>
                                                <div className="activity-content">
                                                    <p><strong>{activity.user}</strong> {activity.action}{activity.score !== undefined && <span className={`score-badge ${activity.score >= 70 ? 'good' : activity.score >= 50 ? 'avg' : 'poor'}`}>{activity.score}%</span>}</p>
                                                    <span className="activity-time">{timeAgo(activity.date)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="quick-actions-section">
                                    <div className="section-header">
                                        <h3>Quick Actions</h3>
                                    </div>
                                    <div className="quick-actions-grid">
                                        <button className="quick-action-btn primary" onClick={() => setShowCreateModal(true)}>
                                            <div className="quick-action-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                            </div>
                                            <div className="quick-action-text">
                                                <div className="quick-action-title">Add User</div>
                                                <div className="quick-action-desc">Create student, faculty, or admin</div>
                                            </div>
                                        </button>
                                        <button className="quick-action-btn success" onClick={() => navigate('/experiment/create')}>
                                            <div className="quick-action-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                                            </div>
                                            <div className="quick-action-text">
                                                <div className="quick-action-title">New Experiment</div>
                                                <div className="quick-action-desc">Create AI-powered experiment</div>
                                            </div>
                                        </button>
                                        <button className="quick-action-btn info" onClick={() => setActiveTab('users')}>
                                            <div className="quick-action-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            </div>
                                            <div className="quick-action-text">
                                                <div className="quick-action-title">Manage Users</div>
                                                <div className="quick-action-desc">View all {stats.totalStudents + stats.totalFaculty} users</div>
                                            </div>
                                        </button>
                                        <button className="quick-action-btn warning" onClick={() => setActiveTab('analytics')}>
                                            <div className="quick-action-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
                                            </div>
                                            <div className="quick-action-text">
                                                <div className="quick-action-title">View Analytics</div>
                                                <div className="quick-action-desc">Performance insights & charts</div>
                                            </div>
                                        </button>
                                    </div>
                                </section>

                                <section className="performers-section">
                                    <div className="section-header"><h3>Top Performers</h3></div>
                                    <div className="performers-list">
                                        {students.map(s => ({ ...s, stats: getStudentStats(s._id) })).filter(s => s.stats.totalAttempts > 0).sort((a, b) => b.stats.avgScore - a.stats.avgScore).slice(0, 5).map((student, index) => (
                                            <div key={student._id} className="performer-item">
                                                <div className="performer-rank">{index + 1}</div>
                                                <div className="performer-avatar">{getInitials(student.name)}</div>
                                                <div className="performer-info"><div className="performer-name">{student.name}</div><div className="performer-meta">{student.stats.totalAttempts} quizzes</div></div>
                                                <div className="performer-score">{student.stats.avgScore}%</div>
                                            </div>
                                        ))}
                                        {students.filter(s => getStudentStats(s._id).totalAttempts > 0).length === 0 && <div className="empty-performers">No quiz data yet</div>}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {/* Analytics Tab - Charts */}
                    {activeTab === 'analytics' && (
                        <section className="analytics-section">
                            <div className="section-header">
                                <h3>Analytics & Insights</h3>
                            </div>

                            <div className="charts-grid">
                                {/* Line Chart - Daily Submissions */}
                                <div className="chart-card">
                                    <h4>Daily Quiz Submissions (Last 7 Days)</h4>
                                    <div className="chart-container">
                                        {chartData?.dailySubmissions ? (
                                            <Line
                                                data={{
                                                    labels: chartData.dailySubmissions.labels,
                                                    datasets: [{
                                                        label: 'Submissions',
                                                        data: chartData.dailySubmissions.data,
                                                        borderColor: '#6366f1',
                                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                        fill: true,
                                                        tension: 0.4
                                                    }]
                                                }}
                                                options={lineChartOptions}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>

                                {/* Pie Chart - Score Distribution */}
                                <div className="chart-card">
                                    <h4>Score Distribution</h4>
                                    <div className="chart-container pie-container">
                                        {chartData?.scoreDistribution ? (
                                            <Doughnut
                                                data={{
                                                    labels: chartData.scoreDistribution.labels,
                                                    datasets: [{
                                                        data: chartData.scoreDistribution.data,
                                                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                                                        borderWidth: 0
                                                    }]
                                                }}
                                                options={pieChartOptions}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>

                                {/* Bar Chart - Experiments by Subject */}
                                <div className="chart-card">
                                    <h4>Experiments by Subject</h4>
                                    <div className="chart-container">
                                        {chartData?.experimentsBySubject ? (
                                            <Bar
                                                data={{
                                                    labels: chartData.experimentsBySubject.labels,
                                                    datasets: [{
                                                        label: 'Experiments',
                                                        data: chartData.experimentsBySubject.data,
                                                        backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']
                                                    }]
                                                }}
                                                options={barChartOptions}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>

                                {/* Pie Chart - Role Distribution */}
                                <div className="chart-card">
                                    <h4>User Role Distribution</h4>
                                    <div className="chart-container pie-container">
                                        {chartData?.roleDistribution ? (
                                            <Pie
                                                data={{
                                                    labels: chartData.roleDistribution.labels,
                                                    datasets: [{
                                                        data: chartData.roleDistribution.data,
                                                        backgroundColor: ['#00d4ff', '#6366f1', '#f59e0b'],
                                                        borderWidth: 0
                                                    }]
                                                }}
                                                options={pieChartOptions}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>

                                {/* Bar Chart - Quiz Performance */}
                                <div className="chart-card wide">
                                    <h4>Quiz Performance by Experiment (Average Score %)</h4>
                                    <div className="chart-container">
                                        {chartData?.quizPerformance ? (
                                            <Bar
                                                data={{
                                                    labels: chartData.quizPerformance.labels,
                                                    datasets: [{
                                                        label: 'Average Score %',
                                                        data: chartData.quizPerformance.avgScores,
                                                        backgroundColor: chartData.quizPerformance.avgScores.map(s => s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444')
                                                    }]
                                                }}
                                                options={{ ...barChartOptions, indexAxis: 'y' }}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>

                                {/* Line Chart - Average Scores Trend */}
                                <div className="chart-card wide">
                                    <h4>Average Score Trend (Last 7 Days)</h4>
                                    <div className="chart-container">
                                        {chartData?.dailySubmissions ? (
                                            <Line
                                                data={{
                                                    labels: chartData.dailySubmissions.labels,
                                                    datasets: [{
                                                        label: 'Average Score %',
                                                        data: chartData.dailySubmissions.avgScores,
                                                        borderColor: '#22c55e',
                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                        fill: true,
                                                        tension: 0.4
                                                    }]
                                                }}
                                                options={lineChartOptions}
                                            />
                                        ) : <div className="no-chart-data">No data available</div>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* User Management Tab */}
                    {activeTab === 'users' && (
                        <section className="users-section">
                            <div className="section-header">
                                <h3>User Management</h3>
                                <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                    Create User
                                </button>
                            </div>

                            <div className="users-table">
                                <div className="table-header">
                                    <span>User</span>
                                    <span>Email</span>
                                    <span>Role</span>
                                    <span>Joined</span>
                                    <span>Actions</span>
                                </div>
                                {[...students, ...faculty].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(u => (
                                    <div key={u._id} className="table-row">
                                        <div className="student-cell">
                                            <div className={`student-avatar ${u.role}`}>{getInitials(u.name)}</div>
                                            <span className="student-name">{u.name}</span>
                                        </div>
                                        <span className="email-cell">{u.email}</span>
                                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                                        <span className="date-cell">{formatDate(u.createdAt)}</span>
                                        <div className="actions-cell">
                                            {u._id !== user._id && (
                                                <button className="delete-btn" onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <section className="students-section">
                            <div className="section-header">
                                <h3>All Students ({filteredStudents.length})</h3>
                                <div className="section-actions">
                                    <div className="search-box">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                        <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                        <option value="name">Sort by Name</option>
                                        <option value="email">Sort by Email</option>
                                        <option value="date">Sort by Date</option>
                                    </select>
                                    <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                        Add Student
                                    </button>
                                </div>
                            </div>
                            {filteredStudents.length === 0 ? (
                                <div className="empty-state">
                                    <h4>No students found</h4>
                                    <button className="create-btn" onClick={() => setShowCreateModal(true)}>Add Your First Student</button>
                                </div>
                            ) : (
                                <div className="students-table">
                                    <div className="table-header"><span>Student</span><span>Email</span><span>Roll Number</span><span>Quizzes</span><span>Avg Score</span><span>Best Score</span><span>Joined</span><span>Actions</span></div>
                                    {filteredStudents.map(student => {
                                        const studentStats = getStudentStats(student._id); return (
                                            <div key={student._id} className="table-row">
                                                <div className="student-cell"><div className="student-avatar">{getInitials(student.name)}</div><span className="student-name">{student.name}</span></div>
                                                <span className="email-cell">{student.email}</span>
                                                <span className="roll-cell">{student.rollNumber || '-'}</span>
                                                <span className="quizzes-cell">{studentStats.totalAttempts}</span>
                                                <span className={`score-cell ${studentStats.avgScore >= 70 ? 'good' : studentStats.avgScore >= 50 ? 'avg' : ''}`}>{studentStats.avgScore > 0 ? `${studentStats.avgScore}%` : '-'}</span>
                                                <span className={`score-cell ${studentStats.bestScore >= 70 ? 'good' : studentStats.bestScore >= 50 ? 'avg' : ''}`}>{studentStats.bestScore > 0 ? `${studentStats.bestScore}%` : '-'}</span>
                                                <span className="date-cell">{formatDate(student.createdAt)}</span>
                                                <div className="actions-cell">
                                                    {student._id !== user._id && (
                                                        <button className="delete-btn" onClick={() => { setSelectedUser(student); setShowDeleteModal(true); }} title="Delete student">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Quiz Results Tab */}
                    {activeTab === 'quizzes' && (
                        <section className="quizzes-section">
                            <div className="section-header"><h3>All Quiz Submissions ({submissions.length})</h3></div>
                            {submissions.length === 0 ? (
                                <div className="empty-state"><h4>No quiz submissions yet</h4></div>
                            ) : (
                                <div className="submissions-table">
                                    <div className="table-header"><span>Student</span><span>Experiment</span><span>Score</span><span>Percentage</span><span>Attempt</span><span>Date</span></div>
                                    {submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).map(sub => (
                                        <div key={sub._id} className="table-row">
                                            <div className="student-cell"><div className="student-avatar">{getInitials(sub.userId?.name)}</div><div className="student-info"><span className="student-name">{sub.userId?.name || 'Unknown'}</span><span className="student-email">{sub.userId?.email}</span></div></div>
                                            <span className="experiment-cell">{sub.experimentId?.title || 'Unknown'}</span>
                                            <span className="score-cell">{sub.score}/{sub.totalQuestions}</span>
                                            <span className={`percentage-cell ${sub.percentage >= 70 ? 'good' : sub.percentage >= 50 ? 'avg' : 'poor'}`}>{sub.percentage}%</span>
                                            <span className="attempt-cell">#{sub.attemptNumber || 1}</span>
                                            <span className="date-cell">{formatDate(sub.submittedAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Experiments Tab */}
                    {activeTab === 'experiments' && (
                        <section className="experiments-section">
                            <div className="section-header">
                                <h3>All Experiments ({experiments.length})</h3>
                                <button className="create-btn" onClick={() => navigate('/experiment/create')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                    Create New
                                </button>
                            </div>
                            {experiments.length === 0 ? (
                                <div className="empty-state"><h4>No experiments yet</h4><button onClick={() => navigate('/experiment/create')}>Create Experiment</button></div>
                            ) : (
                                <div className="experiments-grid">
                                    {experiments.map(exp => {
                                        const expSubmissions = submissions.filter(s => s.experimentId?._id === exp._id || s.experimentId === exp._id); const avgScore = expSubmissions.length > 0 ? Math.round(expSubmissions.reduce((a, s) => a + s.percentage, 0) / expSubmissions.length) : 0; return (
                                            <div key={exp._id} className="experiment-card" onClick={() => navigate(`/experiment/${exp._id}`)}>
                                                <div className="experiment-header"><div className="experiment-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg></div><span className={`difficulty-badge ${exp.difficulty}`}>{exp.difficulty}</span></div>
                                                <h4 className="experiment-title">{exp.title}</h4>
                                                <p className="experiment-subject">{exp.subject || 'General'}</p>
                                                <div className="experiment-stats"><div className="exp-stat"><span className="exp-stat-value">{expSubmissions.length}</span><span className="exp-stat-label">Submissions</span></div><div className="exp-stat"><span className="exp-stat-value">{avgScore}%</span><span className="exp-stat-label">Avg Score</span></div><div className="exp-stat"><span className={`exp-stat-value ${exp.quizGenerated ? 'active' : ''}`}>{exp.quizGenerated ? '✓' : '✗'}</span><span className="exp-stat-label">Quiz</span></div></div>
                                                <div className="experiment-footer"><span className="experiment-date">{formatDate(exp.createdAt)}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New User</h3>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            {formError && <div className="form-error">{formError}</div>}
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                                        <option value="student">Student</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <input type="text" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
                                </div>
                            </div>
                            {createForm.role === 'student' && (
                                <div className="form-group">
                                    <label>Roll Number</label>
                                    <input type="text" value={createForm.rollNumber} onChange={e => setCreateForm({ ...createForm, rollNumber: e.target.value })} />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </div>
                        <h3>Delete User</h3>
                        <p>Are you sure you want to delete <strong>{selectedUser.name}</strong>?</p>
                        <p className="warning-text">This will also delete all their quiz submissions. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDeleteUser} disabled={formLoading}>{formLoading ? 'Deleting...' : 'Delete User'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
