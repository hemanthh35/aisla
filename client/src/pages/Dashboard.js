// AISLA - Role-Based Dashboard (Student/Faculty)
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import AIChatWidget from '../components/AIChatWidget';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [userBadges, setUserBadges] = useState([]);

  // Quiz Management (Faculty)
  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [quizStats, setQuizStats] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch experiments
      const expRes = await axios.get('/api/experiments', config);
      setExperiments(expRes.data.experiments || []);

      // Fetch user's badges
      try {
        const badgesRes = await axios.get('/api/badges/my-badges', config);
        setUserBadges(badgesRes.data.badges || []);
      } catch (badgeError) {
        console.log('Badges not available:', badgeError);
      }

      // For students, fetch their submissions
      if (!isFaculty) {
        const subRes = await axios.get('/api/quiz/my-submissions', config);
        setSubmissions(subRes.data.submissions || []);
      }

      // Calculate stats
      if (isFaculty) {
        setStats({
          totalExperiments: expRes.data.experiments?.length || 0,
          totalStudents: 0, // Would need separate endpoint
        });
      } else {
        const subs = expRes.data.submissions || [];
        setStats({
          experimentsCompleted: subs.length,
          averageScore: subs.length > 0
            ? Math.round(subs.reduce((a, s) => a + s.percentage, 0) / subs.length)
            : 0
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch quiz submissions for a specific experiment (Faculty)
  const fetchQuizSubmissions = async (experimentId) => {
    setLoadingSubmissions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/quiz/submissions/${experimentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizSubmissions(res.data.submissions || []);
      setQuizStats(res.data.stats || {});
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setQuizSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Select an experiment to view its quiz submissions
  const handleSelectExperiment = (exp) => {
    setSelectedExperiment(exp);
    fetchQuizSubmissions(exp._id);
  };

  // Export submissions to CSV
  const exportToCSV = () => {
    if (!quizSubmissions.length) return;

    const headers = ['Student Name', 'Email', 'Score', 'Percentage', 'Attempt', 'Date'];
    const rows = quizSubmissions.map(sub => [
      sub.userId?.name || 'Unknown',
      sub.userId?.email || 'N/A',
      `${sub.score}/${sub.totalQuestions}`,
      `${sub.percentage}%`,
      sub.attemptNumber || 1,
      new Date(sub.submittedAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExperiment?.title || 'quiz'}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete experiment handler
  const handleDeleteExperiment = async (experimentId) => {
    if (!window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/experiments/${experimentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from local state
      setExperiments(experiments.filter(exp => exp._id !== experimentId));
      alert('Experiment deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Failed to delete experiment');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  return (
    <div className="dashboard">
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
            <Link to="/dashboard" className="sidebar-link active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Dashboard
            </Link>

            {isFaculty && (
              <>
                <Link to="/experiment/create" className="sidebar-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Create Experiment
                </Link>
                <button
                  className={`sidebar-link ${showQuizPanel ? 'active' : ''}`}
                  onClick={() => setShowQuizPanel(!showQuizPanel)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Quiz Results
                </button>
              </>
            )}

            <div className="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18h8" />
                <path d="M3 22h18" />
                <path d="M14 22a7 7 0 1 0 0-14h-1" />
                <path d="M9 14h2" />
                <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
              </svg>
              Experiments
            </div>

            {!isFaculty && (
              <>
                <div className="sidebar-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                  My Progress
                </div>
                <a href="#quiz-history" className="sidebar-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Quiz History
                </a>
              </>
            )}

            {isAdmin && (
              <Link to="/badge-management" className="sidebar-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                Badge Management
              </Link>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{user?.role || 'student'}</div>
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
            <h1 className="topbar-title">{isFaculty ? 'Faculty Dashboard' : 'Student Dashboard'}</h1>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-content">
                <p className="welcome-greeting">{getGreeting()}</p>
                <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h2>
                <p className="welcome-subtitle">
                  {isFaculty
                    ? 'Manage your experiments and track student progress.'
                    : 'Continue your learning journey with AI-powered experiments.'}
                </p>
              </div>
              {isFaculty && (
                <div className="welcome-actions">
                  <button className="welcome-btn welcome-btn-primary" onClick={() => navigate('/experiment/create')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Create Experiment
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Stats Cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18h8" />
                    <path d="M3 22h18" />
                    <path d="M14 22a7 7 0 1 0 0-14h-1" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{experiments.length}</div>
              <div className="stat-label">{isFaculty ? 'Created Experiments' : 'Available Experiments'}</div>
            </div>

            {!isFaculty && (
              <>
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">{submissions.length}</div>
                  <div className="stat-label">Quizzes Completed</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">
                    {submissions.length > 0
                      ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length)
                      : 0}%
                  </div>
                  <div className="stat-label">Average Score</div>
                </div>
              </>
            )}
          </section>

          {/* Experiments List */}
          <section className="experiments-section">
            <div className="section-header">
              <h3 className="section-title">
                {isFaculty ? 'Your Experiments' : 'Available Experiments'}
              </h3>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loader"></div>
                <p>Loading experiments...</p>
              </div>
            ) : experiments.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18h8" />
                  <path d="M3 22h18" />
                  <path d="M14 22a7 7 0 1 0 0-14h-1" />
                  <path d="M9 14h2" />
                  <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                  <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                </svg>
                <h4>No experiments yet</h4>
                <p>
                  {isFaculty
                    ? 'Create your first experiment to get started!'
                    : 'No experiments available at the moment.'}
                </p>
                {isFaculty && (
                  <button className="empty-state-btn" onClick={() => navigate('/experiment/create')}>
                    Create Experiment
                  </button>
                )}
              </div>
            ) : (
              <div className="experiments-grid">
                {experiments.map((exp) => (
                  <div key={exp._id} className="experiment-card" onClick={() => navigate(`/experiment/${exp._id}`)}>
                    <div className="experiment-card-header">
                      <div className="experiment-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 18h8" />
                          <path d="M3 22h18" />
                          <path d="M14 22a7 7 0 1 0 0-14h-1" />
                        </svg>
                      </div>
                      {exp.difficulty && (
                        <span className={`experiment-badge ${exp.difficulty}`}>
                          {exp.difficulty}
                        </span>
                      )}
                    </div>
                    <h4 className="experiment-title">{exp.title}</h4>
                    <p className="experiment-aim">{exp.content?.aim?.substring(0, 100)}...</p>
                    <div className="experiment-meta">
                      <span className="experiment-date">
                        {new Date(exp.createdAt).toLocaleDateString()}
                      </span>
                      {exp.quizGenerated && (
                        <span className="experiment-quiz-badge">Quiz Available</span>
                      )}
                    </div>
                    {(user?.role === 'admin' || (isFaculty && exp.createdBy === user?._id)) && (
                      <div className="experiment-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="experiment-action-btn edit-btn"
                          onClick={() => navigate(`/experiment/${exp._id}/edit`)}
                          title="Edit Experiment"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="experiment-action-btn delete-btn"
                          onClick={() => handleDeleteExperiment(exp._id)}
                          title="Delete Experiment"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quiz History (Student only) */}
          {!isFaculty && (
            <section id="quiz-history" className="submissions-section">
              <div className="section-header">
                <h3 className="section-title">Quiz History</h3>
                {submissions.length > 0 && (
                  <span className="submissions-count">{submissions.length} attempts</span>
                )}
              </div>
              {submissions.length === 0 ? (
                <div className="empty-history">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p>No quiz attempts yet</p>
                  <span>Take a quiz from any experiment to see your history here</span>
                </div>
              ) : (
                <div className="submissions-list">
                  {submissions.slice(0, 10).map((sub) => (
                    <div key={sub._id} className="submission-item">
                      <div className="submission-info">
                        <span className="submission-title">{sub.experimentId?.title || 'Experiment'}</span>
                        <div className="submission-meta">
                          <span className="submission-attempt">
                            Attempt #{sub.attemptNumber || 1}
                          </span>
                          <span className="submission-date">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="submission-actions">
                        <div className={`submission-score ${sub.percentage >= 70 ? 'good' : sub.percentage >= 50 ? 'average' : 'poor'}`}>
                          {sub.percentage}%
                        </div>
                        <button
                          className="retake-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/experiment/${sub.experimentId?._id}/quiz`);
                          }}
                          title="Retake Quiz"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                          </svg>
                          Retake
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* My Badges Section */}
          {userBadges.length > 0 && (
            <section className="badges-section">
              <div className="section-header">
                <h3 className="section-title">My Badges</h3>
                <span className="badge-count">{userBadges.length} earned</span>
              </div>
              <div className="user-badges-grid">
                {userBadges.map((ub) => (
                  <div key={ub._id} className={`user-badge-card ${ub.badgeId?.color || 'gold'}`}>
                    <div className={`user-badge-icon ${ub.badgeId?.color || 'gold'}`}>
                      {getBadgeIcon(ub.badgeId?.icon || 'star')}
                    </div>
                    <div className="user-badge-info">
                      <div className="user-badge-name">{ub.badgeId?.name}</div>
                      <div className="user-badge-description">{ub.badgeId?.description}</div>
                      <div className="user-badge-meta">
                        <span className={`user-badge-rarity ${ub.badgeId?.rarity}`}>
                          {ub.badgeId?.rarity}
                        </span>
                        <span className="user-badge-date">
                          {new Date(ub.awardedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {ub.reason && (
                        <div className="user-badge-reason">"{ub.reason}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Quiz Results Panel (Faculty) */}
      {isFaculty && showQuizPanel && (
        <div className="quiz-panel-overlay" onClick={() => setShowQuizPanel(false)}>
          <div className="quiz-results-panel" onClick={e => e.stopPropagation()}>
            <div className="quiz-panel-header">
              <h2>Quiz Results</h2>
              <button className="close-panel-btn" onClick={() => setShowQuizPanel(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="quiz-panel-body">
              {/* Experiment Selector */}
              <div className="experiment-selector">
                <h3>Select Experiment</h3>
                <div className="experiment-chips">
                  {experiments.filter(exp => exp.quizGenerated).map(exp => (
                    <button
                      key={exp._id}
                      className={`exp-chip ${selectedExperiment?._id === exp._id ? 'active' : ''}`}
                      onClick={() => handleSelectExperiment(exp)}
                    >
                      {exp.title}
                    </button>
                  ))}
                  {experiments.filter(exp => exp.quizGenerated).length === 0 && (
                    <p className="no-quizzes">No experiments with quizzes yet</p>
                  )}
                </div>
              </div>

              {/* Submissions List */}
              {selectedExperiment && (
                <div className="quiz-submissions">
                  <div className="submissions-header">
                    <h3>{selectedExperiment.title} - Submissions</h3>
                    {quizSubmissions.length > 0 && (
                      <button className="export-btn" onClick={exportToCSV}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                      </button>
                    )}
                  </div>

                  {/* Stats */}
                  {quizStats && quizSubmissions.length > 0 && (
                    <div className="quiz-stats-row">
                      <div className="stat-box">
                        <span className="stat-number">{quizStats.totalSubmissions || quizSubmissions.length}</span>
                        <span className="stat-text">Total</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-number">{quizStats.averageScore || 0}%</span>
                        <span className="stat-text">Average</span>
                      </div>
                      <div className="stat-box good">
                        <span className="stat-number">{quizStats.highestScore || 0}%</span>
                        <span className="stat-text">Highest</span>
                      </div>
                      <div className="stat-box poor">
                        <span className="stat-number">{quizStats.lowestScore || 0}%</span>
                        <span className="stat-text">Lowest</span>
                      </div>
                    </div>
                  )}

                  {loadingSubmissions ? (
                    <div className="loading-submissions">
                      <div className="loader small"></div>
                      <span>Loading submissions...</span>
                    </div>
                  ) : quizSubmissions.length === 0 ? (
                    <div className="no-submissions">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8M12 8v8" />
                      </svg>
                      <p>No submissions yet</p>
                    </div>
                  ) : (
                    <div className="submissions-table">
                      <div className="table-header">
                        <span>Student</span>
                        <span>Score</span>
                        <span>Attempt</span>
                        <span>Date</span>
                      </div>
                      {quizSubmissions.map(sub => (
                        <div key={sub._id} className="table-row">
                          <div className="student-cell">
                            <span className="student-name">{sub.userId?.name || 'Unknown'}</span>
                            <span className="student-email">{sub.userId?.email}</span>
                          </div>
                          <span className={`score-cell ${sub.percentage >= 70 ? 'good' : sub.percentage >= 50 ? 'average' : 'poor'}`}>
                            {sub.percentage}%
                          </span>
                          <span className="attempt-cell">#{sub.attemptNumber || 1}</span>
                          <span className="date-cell">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Widget - Floating Chat Assistant */}
      <AIChatWidget />
    </div>
  );
};

export default Dashboard;
