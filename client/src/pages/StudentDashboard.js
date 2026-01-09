// AISLA - Student Dashboard with Detailed Insights
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import NotificationsModal from '../components/NotificationsModal';
import './StudentDashboard.css';

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

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    // Data states
    const [experiments, setExperiments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [badges, setBadges] = useState([]);
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalExperiments: 0,
        completedExperiments: 0,
        streak: 0,
        rank: 0,
        totalStudents: 0
    });

    // Check access
    useEffect(() => {
        if (user && (user.role === 'faculty' || user.role === 'admin')) {
            navigate('/faculty-dashboard');
        }
    }, [user, navigate]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [expRes, subRes, badgeRes] = await Promise.all([
                axios.get('/api/experiments', config).catch(() => ({ data: { experiments: [] } })),
                axios.get('/api/quiz/my-submissions', config).catch(() => ({ data: { submissions: [] } })),
                axios.get('/api/badges/my-badges', config).catch(() => ({ data: { badges: [] } }))
            ]);

            const allExperiments = expRes.data.experiments || [];
            const allSubmissions = subRes.data.submissions || [];
            const allBadges = badgeRes.data.badges || [];

            setExperiments(allExperiments);
            setSubmissions(allSubmissions);
            setBadges(allBadges);

            // Calculate stats
            const avgScore = allSubmissions.length > 0
                ? Math.round(allSubmissions.reduce((a, s) => a + (s.percentage || 0), 0) / allSubmissions.length)
                : 0;
            const bestScore = allSubmissions.length > 0
                ? Math.max(...allSubmissions.map(s => s.percentage || 0))
                : 0;

            // Get unique experiments completed
            const completedExpIds = [...new Set(allSubmissions.map(s => s.experimentId?._id || s.experimentId))];

            setStats({
                totalQuizzes: allSubmissions.length,
                averageScore: avgScore,
                bestScore: bestScore,
                totalExperiments: allExperiments.length,
                completedExperiments: completedExpIds.length,
                streak: calculateStreak(allSubmissions),
                rank: calculateRank(avgScore),
                totalStudents: 100 // Placeholder
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

    // Calculate learning streak
    const calculateStreak = (subs) => {
        if (subs.length === 0) return 0;
        const today = new Date();
        const sortedDates = subs
            .map(s => new Date(s.submittedAt).toDateString())
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
            const diff = Math.floor((today - new Date(sortedDates[i])) / (1000 * 60 * 60 * 24));
            if (diff === i) streak++;
            else break;
        }
        return streak;
    };

    // Calculate rank based on average score
    const calculateRank = (avgScore) => {
        if (avgScore >= 90) return 'A+';
        if (avgScore >= 80) return 'A';
        if (avgScore >= 70) return 'B+';
        if (avgScore >= 60) return 'B';
        if (avgScore >= 50) return 'C';
        return 'D';
    };

    // Get performance level
    const getPerformanceLevel = () => {
        const avg = stats.averageScore;
        if (avg >= 90) return { level: 'Excellent', color: '#22c55e', icon: '🌟' };
        if (avg >= 70) return { level: 'Good', color: '#3b82f6', icon: '✨' };
        if (avg >= 50) return { level: 'Average', color: '#f59e0b', icon: '📈' };
        return { level: 'Needs Improvement', color: '#ef4444', icon: '💪' };
    };

    // Chart data
    const scoreProgressData = {
        labels: submissions.slice(-10).map((s, i) => `Quiz ${i + 1}`),
        datasets: [{
            label: 'Score %',
            data: submissions.slice(-10).map(s => s.percentage || 0),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const subjectPerformance = () => {
        const subjects = {};
        submissions.forEach(s => {
            const subject = s.experimentId?.subject || 'General';
            if (!subjects[subject]) subjects[subject] = { total: 0, count: 0 };
            subjects[subject].total += s.percentage || 0;
            subjects[subject].count++;
        });
        return {
            labels: Object.keys(subjects),
            datasets: [{
                data: Object.values(subjects).map(s => Math.round(s.total / s.count)),
                backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
                borderWidth: 0
            }]
        };
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
            month: 'short', day: 'numeric'
        });
    };

    const performance = getPerformanceLevel();

    if (!user || user.role === 'faculty' || user.role === 'admin') {
        return null;
    }

    return (
        <div className="student-dashboard">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                        <div className="sidebar-section-title">Learning</div>
                        <Link to="/dashboard" className="sidebar-link active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Dashboard
                        </Link>
                        <Link to="/experiments" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                            Experiments
                        </Link>
                        <Link to="/ar-lab" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                            AR Lab
                        </Link>
                        <Link to="/viva-voice" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            Viva Voice
                        </Link>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Progress</div>
                        <Link to="/my-submissions" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                            My Quizzes
                        </Link>
                        <Link to="/badges" className="sidebar-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                            Badges
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'Student'}</div>
                            <div className="sidebar-user-role">Student</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="student-main">
                <header className="student-topbar">
                    <div className="topbar-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <h1 className="topbar-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
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
                        </button>
                    </div>
                </header>

                <div className="student-content">
                    {/* Performance Banner */}
                    <section className="performance-banner" style={{ '--accent': performance.color }}>
                        <div className="performance-icon">{performance.icon}</div>
                        <div className="performance-info">
                            <h2>Performance Level: <span style={{ color: performance.color }}>{performance.level}</span></h2>
                            <p>Keep up the great work! You're doing amazing.</p>
                        </div>
                        <div className="performance-rank">
                            <span className="rank-label">Grade</span>
                            <span className="rank-value">{stats.rank}</span>
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section className="stats-grid">
                        <div className="stat-card primary">
                            <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.totalQuizzes}</div>
                                <div className="stat-label">Quizzes Taken</div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.averageScore}%</div>
                                <div className="stat-label">Average Score</div>
                            </div>
                        </div>
                        <div className="stat-card warning">
                            <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.bestScore}%</div>
                                <div className="stat-label">Best Score</div>
                            </div>
                        </div>
                        <div className="stat-card info">
                            <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg></div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.completedExperiments}/{stats.totalExperiments}</div>
                                <div className="stat-label">Experiments Done</div>
                            </div>
                        </div>
                    </section>

                    {/* Charts Row */}
                    <div className="charts-row">
                        <section className="chart-card">
                            <h3>Score Progress</h3>
                            <div className="chart-container">
                                {submissions.length > 0 ? (
                                    <Line data={scoreProgressData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
                                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' }, min: 0, max: 100 }
                                        }
                                    }} />
                                ) : <div className="no-data">Take some quizzes to see your progress!</div>}
                            </div>
                        </section>

                        <section className="chart-card">
                            <h3>Subject Performance</h3>
                            <div className="chart-container pie">
                                {submissions.length > 0 ? (
                                    <Doughnut data={subjectPerformance()} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } } }
                                    }} />
                                ) : <div className="no-data">Complete quizzes to see subject breakdown!</div>}
                            </div>
                        </section>
                    </div>

                    {/* Recent Activity & Badges */}
                    <div className="bottom-row">
                        <section className="recent-section">
                            <h3>Recent Quizzes</h3>
                            <div className="recent-list">
                                {submissions.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No quiz attempts yet</p>
                                        <Link to="/experiments" className="start-btn">Start Learning</Link>
                                    </div>
                                ) : submissions.slice(0, 5).map((sub, idx) => (
                                    <div key={idx} className="recent-item">
                                        <div className="recent-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /></svg>
                                        </div>
                                        <div className="recent-info">
                                            <span className="recent-title">{sub.experimentId?.title || 'Quiz'}</span>
                                            <span className="recent-date">{formatDate(sub.submittedAt)}</span>
                                        </div>
                                        <span className={`recent-score ${sub.percentage >= 70 ? 'good' : sub.percentage >= 50 ? 'avg' : 'poor'}`}>
                                            {sub.percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="badges-section">
                            <h3>My Badges ({badges.length})</h3>
                            <div className="badges-grid">
                                {badges.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No badges earned yet. Keep learning!</p>
                                    </div>
                                ) : badges.slice(0, 6).map((badge, idx) => (
                                    <div key={idx} className="badge-item">
                                        <span className="badge-icon">{badge.icon || '🏆'}</span>
                                        <span className="badge-name">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Recommended Experiments */}
                    <section className="recommended-section">
                        <h3>Continue Learning</h3>
                        <div className="experiments-grid">
                            {experiments.slice(0, 4).map(exp => (
                                <Link key={exp._id} to={`/experiment/${exp._id}`} className="experiment-card">
                                    <div className="exp-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /></svg>
                                    </div>
                                    <h4>{exp.title}</h4>
                                    <span className={`difficulty ${exp.difficulty}`}>{exp.difficulty}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
