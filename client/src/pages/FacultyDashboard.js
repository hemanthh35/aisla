// AISLA - Faculty Dashboard with Detailed Insights
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import NotificationsModal from '../components/NotificationsModal';
import './FacultyDashboard.css';

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

const FacultyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showNotifications, setShowNotifications] = useState(false);

    // Data states
    const [experiments, setExperiments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        totalExperiments: 0,
        totalQuizzes: 0,
        totalSubmissions: 0,
        totalStudents: 0,
        averageScore: 0,
        passRate: 0
    });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        password: '',
        rollNumber: ''
    });

    // Check access
    useEffect(() => {
        if (user && user.role === 'student') {
            navigate('/student-dashboard');
        }
    }, [user, navigate]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [expRes, subRes, usersRes] = await Promise.all([
                axios.get('/api/experiments', config).catch(() => ({ data: { experiments: [] } })),
                axios.get('/api/quiz/all-submissions', config).catch(() => ({ data: { submissions: [] } })),
                axios.get('/api/admin/users', config).catch(() => ({ data: { users: [] } }))
            ]);

            const allExperiments = expRes.data.experiments || [];
            const allSubmissions = subRes.data.submissions || [];
            const allUsers = usersRes.data.users || [];
            const studentsList = allUsers.filter(u => u.role === 'student');

            setExperiments(allExperiments);
            setSubmissions(allSubmissions);
            setStudents(studentsList);

            // Calculate stats
            const avgScore = allSubmissions.length > 0
                ? Math.round(allSubmissions.reduce((a, s) => a + (s.percentage || 0), 0) / allSubmissions.length)
                : 0;
            const passCount = allSubmissions.filter(s => (s.percentage || 0) >= 50).length;
            const passRate = allSubmissions.length > 0
                ? Math.round((passCount / allSubmissions.length) * 100)
                : 0;

            setStats({
                totalExperiments: allExperiments.length,
                totalQuizzes: allExperiments.filter(e => e.quizGenerated).length,
                totalSubmissions: allSubmissions.length,
                totalStudents: studentsList.length,
                averageScore: avgScore,
                passRate: passRate
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Chart data
    const dailySubmissionsData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        const counts = last7Days.map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toDateString();
            return submissions.filter(s => new Date(s.submittedAt).toDateString() === dateStr).length;
        });

        return {
            labels: last7Days,
            datasets: [{
                label: 'Submissions',
                data: counts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    };

    const scoreDistributionData = () => {
        const ranges = { '90-100': 0, '70-89': 0, '50-69': 0, '0-49': 0 };
        submissions.forEach(s => {
            const score = s.percentage || 0;
            if (score >= 90) ranges['90-100']++;
            else if (score >= 70) ranges['70-89']++;
            else if (score >= 50) ranges['50-69']++;
            else ranges['0-49']++;
        });

        return {
            labels: Object.keys(ranges),
            datasets: [{
                data: Object.values(ranges),
                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        };
    };

    const experimentPerformanceData = () => {
        const expStats = experiments.slice(0, 6).map(exp => {
            const expSubs = submissions.filter(s =>
                (s.experimentId?._id || s.experimentId) === exp._id
            );
            const avg = expSubs.length > 0
                ? Math.round(expSubs.reduce((a, s) => a + (s.percentage || 0), 0) / expSubs.length)
                : 0;
            return { title: exp.title.substring(0, 15) + '...', avg, count: expSubs.length };
        });

        return {
            labels: expStats.map(e => e.title),
            datasets: [{
                label: 'Avg Score %',
                data: expStats.map(e => e.avg),
                backgroundColor: expStats.map(e => e.avg >= 70 ? '#22c55e' : e.avg >= 50 ? '#f59e0b' : '#ef4444')
            }]
        };
    };

    // Get top performers
    const getTopPerformers = () => {
        const studentStats = {};
        submissions.forEach(s => {
            const id = s.userId?._id || s.userId;
            const name = s.userId?.name || 'Unknown';
            if (!studentStats[id]) studentStats[id] = { name, total: 0, count: 0 };
            studentStats[id].total += s.percentage || 0;
            studentStats[id].count++;
        });

        return Object.entries(studentStats)
            .map(([id, data]) => ({
                id,
                name: data.name,
                avg: Math.round(data.total / data.count),
                attempts: data.count
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    // Add student handler
    const handleAddStudent = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/admin/users', {
                ...addForm,
                role: 'student'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowAddModal(false);
            setAddForm({ name: '', email: '', password: '', rollNumber: '' });
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to add student');
        } finally {
            setFormLoading(false);
        }
    };

    // Delete student handler
    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;
        setFormLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/users/${selectedStudent._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowDeleteModal(false);
            setSelectedStudent(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete student');
        } finally {
            setFormLoading(false);
        }
    };

    const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

    if (!user || !isFaculty) {
        return null;
    }

    const topPerformers = getTopPerformers();

    return (
        <div className="faculty-dashboard">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`faculty-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span>AISLA Faculty</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Dashboard</div>
                        <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Overview
                        </button>
                        <button className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                            Analytics
                        </button>
                        <button className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            Students
                        </button>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Actions</div>
                        <Link to="/experiment/create" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                            Create Experiment
                        </Link>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                            All Experiments
                        </Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="sidebar-link">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4" /></svg>
                                Admin Panel
                            </Link>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'Faculty'}</div>
                            <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrator' : 'Faculty'}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="faculty-main">
                <header className="faculty-topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <h1 className="topbar-title">Faculty Dashboard</h1>
                        <span className="faculty-badge">{user?.role === 'admin' ? 'Admin' : 'Faculty'}</span>
                    </div>
                    <div className="topbar-right">
                        <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className="badge-dot"></span>
                        </button>
                        <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

                        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                            Refresh
                        </button>
                    </div>
                </header>

                <div className="faculty-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Grid */}
                            <section className="stats-grid">
                                <div className="stat-card primary">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg></div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.totalExperiments}</div>
                                        <div className="stat-label">Experiments Created</div>
                                    </div>
                                </div>
                                <div className="stat-card success">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.totalStudents}</div>
                                        <div className="stat-label">Total Students</div>
                                    </div>
                                </div>
                                <div className="stat-card warning">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.totalSubmissions}</div>
                                        <div className="stat-label">Quiz Submissions</div>
                                    </div>
                                </div>
                                <div className="stat-card info">
                                    <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.averageScore}%</div>
                                        <div className="stat-label">Class Average</div>
                                    </div>
                                </div>
                            </section>

                            {/* Quick Stats Row */}
                            <div className="quick-stats-row">
                                <div className="quick-stat">
                                    <span className="quick-stat-label">Pass Rate</span>
                                    <span className="quick-stat-value" style={{ color: stats.passRate >= 70 ? '#22c55e' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444' }}>{stats.passRate}%</span>
                                </div>
                                <div className="quick-stat">
                                    <span className="quick-stat-label">Quizzes Available</span>
                                    <span className="quick-stat-value">{stats.totalQuizzes}</span>
                                </div>
                                <div className="quick-stat">
                                    <span className="quick-stat-label">Avg Attempts/Student</span>
                                    <span className="quick-stat-value">{stats.totalStudents > 0 ? (stats.totalSubmissions / stats.totalStudents).toFixed(1) : 0}</span>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="charts-row">
                                <section className="chart-card">
                                    <h3>Daily Submissions (Last 7 Days)</h3>
                                    <div className="chart-container">
                                        <Line data={dailySubmissionsData()} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
                                                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' }, beginAtZero: true }
                                            }
                                        }} />
                                    </div>
                                </section>

                                <section className="chart-card">
                                    <h3>Score Distribution</h3>
                                    <div className="chart-container pie">
                                        <Doughnut data={scoreDistributionData()} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', padding: 15 } } }
                                        }} />
                                    </div>
                                </section>
                            </div>

                            {/* Bottom Row */}
                            <div className="bottom-row">
                                <section className="performers-section">
                                    <h3>Top Performers</h3>
                                    <div className="performers-list">
                                        {topPerformers.length === 0 ? (
                                            <div className="empty-state">No quiz data yet</div>
                                        ) : topPerformers.map((student, idx) => (
                                            <div key={student.id} className="performer-item">
                                                <div className="performer-rank">{idx + 1}</div>
                                                <div className="performer-avatar">{getInitials(student.name)}</div>
                                                <div className="performer-info">
                                                    <span className="performer-name">{student.name}</span>
                                                    <span className="performer-attempts">{student.attempts} quizzes</span>
                                                </div>
                                                <span className={`performer-score ${student.avg >= 70 ? 'good' : student.avg >= 50 ? 'avg' : 'poor'}`}>
                                                    {student.avg}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="recent-section">
                                    <h3>Recent Experiments</h3>
                                    <div className="recent-list">
                                        {experiments.slice(0, 5).map(exp => (
                                            <Link key={exp._id} to={`/experiment/${exp._id}`} className="recent-item">
                                                <div className="recent-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                                                </div>
                                                <div className="recent-info">
                                                    <span className="recent-title">{exp.title}</span>
                                                    <span className="recent-date">{formatDate(exp.createdAt)}</span>
                                                </div>
                                                <span className={`quiz-badge ${exp.quizGenerated ? 'active' : ''}`}>
                                                    {exp.quizGenerated ? 'Quiz Ready' : 'No Quiz'}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <section className="analytics-section">
                            <div className="charts-grid">
                                <div className="chart-card full">
                                    <h3>Experiment Performance (Average Scores)</h3>
                                    <div className="chart-container bar">
                                        <Bar data={experimentPerformanceData()} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            indexAxis: 'y',
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' }, max: 100 },
                                                y: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
                                            }
                                        }} />
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <h3>Submission Trend</h3>
                                    <div className="chart-container">
                                        <Line data={dailySubmissionsData()} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
                                                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' }, beginAtZero: true }
                                            }
                                        }} />
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <h3>Grade Distribution</h3>
                                    <div className="chart-container pie">
                                        <Doughnut data={scoreDistributionData()} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } } }
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <section className="students-section">
                            <div className="section-header">
                                <h3>All Students ({students.length})</h3>
                                <button className="add-student-btn" onClick={() => setShowAddModal(true)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                    Add Student
                                </button>
                            </div>
                            <div className="students-table">
                                <div className="table-header">
                                    <span>Student</span>
                                    <span>Email</span>
                                    <span>Quizzes</span>
                                    <span>Avg Score</span>
                                    <span>Actions</span>
                                </div>
                                {students.length === 0 ? (
                                    <div className="empty-state">No students found. Click "Add Student" to create one.</div>
                                ) : students.map(student => {
                                    const studentSubs = submissions.filter(s =>
                                        (s.userId?._id || s.userId) === student._id
                                    );
                                    const avg = studentSubs.length > 0
                                        ? Math.round(studentSubs.reduce((a, s) => a + (s.percentage || 0), 0) / studentSubs.length)
                                        : 0;
                                    return (
                                        <div key={student._id} className="table-row">
                                            <div className="student-cell">
                                                <div className="student-avatar">{getInitials(student.name)}</div>
                                                <span className="student-name">{student.name}</span>
                                            </div>
                                            <span className="email-cell">{student.email}</span>
                                            <span className="quizzes-cell">{studentSubs.length}</span>
                                            <span className={`score-cell ${avg >= 70 ? 'good' : avg >= 50 ? 'avg' : ''}`}>
                                                {avg > 0 ? `${avg}%` : '-'}
                                            </span>
                                            <div className="actions-cell">
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                                                    title="Delete Student"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Student</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddStudent} className="modal-form">
                            {formError && <div className="form-error">{formError}</div>}
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={addForm.email}
                                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                    placeholder="student@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    required
                                    minLength="6"
                                    value={addForm.password}
                                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div className="form-group">
                                <label>Roll Number</label>
                                <input
                                    type="text"
                                    value={addForm.rollNumber}
                                    onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Adding...' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Student</h2>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{selectedStudent.name}</strong>?</p>
                            <p className="warning-text">This will also delete all their quiz submissions. This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDeleteStudent} disabled={formLoading}>
                                {formLoading ? 'Deleting...' : 'Delete Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;
