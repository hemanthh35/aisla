// ClassDetails page - View class analytics and student progress
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./ClassDetails.css";

const ClassDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [classData, setClassData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch class details
      const classRes = await axios.get(`/api/classes/${id}`, config);
      setClassData(classRes.data.data);

      // Fetch analytics
      const analyticsRes = await axios.get(
        `/api/analytics/class/${id}`,
        config
      );
      setAnalytics(analyticsRes.data.data);

      // Fetch student progress
      const studentsRes = await axios.get(
        `/api/analytics/class/${id}/students`,
        config
      );
      setStudents(studentsRes.data.data.students || []);
    } catch (err) {
      console.error("Error fetching class data:", err);
      setError(err.response?.data?.message || "Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/analytics/class/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${classData?.code}_students.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#22c55e";
    if (score >= 70) return "#eab308";
    if (score >= 50) return "#f97316";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className="class-details">
        <div className="loading-state">Loading class data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-details">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/class-management">Back to Classes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="class-details">
      {/* Header */}
      <div className="class-details-header">
        <div className="header-left">
          <Link to="/class-management" className="back-link">
            ← Back to Classes
          </Link>
          <h1>{classData?.name}</h1>
          <div className="class-meta-row">
            <span className="class-code-badge">{classData?.code}</span>
            <span className="join-code-display">
              Join Code: <strong>{classData?.joinCode}</strong>
            </span>
            {classData?.department && (
              <span className="meta-badge">{classData.department}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleExportCSV} className="export-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon students">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {analytics?.overview?.totalStudents || 0}
            </div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon experiments">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {analytics?.overview?.totalExperiments || 0}
            </div>
            <div className="stat-label">Experiments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon submissions">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {analytics?.overview?.totalSubmissions || 0}
            </div>
            <div className="stat-label">Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon average">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="stat-content">
            <div
              className="stat-value"
              style={{
                color: getScoreColor(analytics?.overview?.classAverage || 0),
              }}
            >
              {analytics?.overview?.classAverage || 0}%
            </div>
            <div className="stat-label">Class Average</div>
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      {analytics?.scoreDistribution && (
        <div className="chart-section">
          <h3>Score Distribution</h3>
          <div className="score-distribution">
            <div className="score-bar-container">
              <div
                className="score-bar excellent"
                style={{
                  width: `${
                    (analytics.scoreDistribution.excellent /
                      Math.max(analytics.overview.totalSubmissions, 1)) *
                    100
                  }%`,
                }}
              >
                <span>{analytics.scoreDistribution.excellent}</span>
              </div>
              <div className="score-label">90-100% (Excellent)</div>
            </div>
            <div className="score-bar-container">
              <div
                className="score-bar good"
                style={{
                  width: `${
                    (analytics.scoreDistribution.good /
                      Math.max(analytics.overview.totalSubmissions, 1)) *
                    100
                  }%`,
                }}
              >
                <span>{analytics.scoreDistribution.good}</span>
              </div>
              <div className="score-label">70-89% (Good)</div>
            </div>
            <div className="score-bar-container">
              <div
                className="score-bar average"
                style={{
                  width: `${
                    (analytics.scoreDistribution.average /
                      Math.max(analytics.overview.totalSubmissions, 1)) *
                    100
                  }%`,
                }}
              >
                <span>{analytics.scoreDistribution.average}</span>
              </div>
              <div className="score-label">50-69% (Average)</div>
            </div>
            <div className="score-bar-container">
              <div
                className="score-bar needs-work"
                style={{
                  width: `${
                    (analytics.scoreDistribution.needsWork /
                      Math.max(analytics.overview.totalSubmissions, 1)) *
                    100
                  }%`,
                }}
              >
                <span>{analytics.scoreDistribution.needsWork}</span>
              </div>
              <div className="score-label">&lt;50% (Needs Work)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Student Progress
        </button>
        <button
          className={`tab ${activeTab === "experiments" ? "active" : ""}`}
          onClick={() => setActiveTab("experiments")}
        >
          Experiments
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="students-list">
            {students.length === 0 ? (
              <div className="empty-message">No students enrolled yet</div>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Progress</th>
                    <th>Avg Score</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student._id}>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar">
                            {s.student.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="student-name">{s.student.name}</div>
                            <div className="student-email">
                              {s.student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{s.student.rollNumber || "—"}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${s.completionRate}%` }}
                            />
                          </div>
                          <span>
                            {s.completedExperiments}/{s.totalExperiments}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            color: getScoreColor(s.averageScore),
                            fontWeight: 600,
                          }}
                        >
                          {s.averageScore}%
                        </span>
                      </td>
                      <td>
                        {s.lastActivity
                          ? new Date(s.lastActivity).toLocaleDateString()
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "experiments" && analytics?.experimentStats && (
          <div className="experiments-list">
            {Object.keys(analytics.experimentStats).length === 0 ? (
              <div className="empty-message">No experiments assigned yet</div>
            ) : (
              <div className="experiment-cards">
                {Object.entries(analytics.experimentStats).map(
                  ([expId, stats]) => (
                    <div key={expId} className="experiment-stat-card">
                      <div className="exp-stat-header">
                        <div className="exp-completion">
                          <div
                            className="completion-circle"
                            style={{
                              background: `conic-gradient(#6366f1 ${
                                stats.completionRate * 3.6
                              }deg, rgba(255,255,255,0.1) 0deg)`,
                            }}
                          >
                            <span>{stats.completionRate}%</span>
                          </div>
                        </div>
                        <div className="exp-stats">
                          <div className="exp-stat-item">
                            <span className="stat-num">
                              {stats.studentsCompleted}
                            </span>
                            <span className="stat-text">Completed</span>
                          </div>
                          <div className="exp-stat-item">
                            <span className="stat-num">
                              {stats.totalSubmissions}
                            </span>
                            <span className="stat-text">Submissions</span>
                          </div>
                          <div className="exp-stat-item">
                            <span
                              className="stat-num"
                              style={{
                                color: getScoreColor(stats.averageScore),
                              }}
                            >
                              {stats.averageScore}%
                            </span>
                            <span className="stat-text">Avg Score</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
