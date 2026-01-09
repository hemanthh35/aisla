// ClassManagement page - Faculty creates and manages classes
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./ClassManagement.css";

const ClassManagement = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    department: "",
    semester: "",
    maxStudents: 50,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/classes", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`Class created! Join code: ${response.data.data.joinCode}`);
      setClasses([response.data.data, ...classes]);
      setFormData({
        name: "",
        code: "",
        description: "",
        department: "",
        semester: "",
        maxStudents: 50,
      });
      setTimeout(() => setShowCreateModal(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create class");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this class? All enrollments will be removed."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classes.filter((c) => c._id !== classId));
      setSuccess("Class deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete class");
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess("Join code copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  if (user?.role !== "faculty" && user?.role !== "admin") {
    return (
      <div className="class-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only faculty members can manage classes.</p>
          <Link to="/dashboard">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="class-management">
      <div className="class-header">
        <div className="header-content">
          <h1>My Classes</h1>
          <p>Create and manage your classes, monitor student progress</p>
        </div>
        <button
          className="create-class-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create Class
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3>No Classes Yet</h3>
          <p>Create your first class to start managing students</p>
          <button onClick={() => setShowCreateModal(true)}>
            Create Your First Class
          </button>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((classItem) => (
            <div key={classItem._id} className="class-card">
              <div className="class-card-header">
                <div className="class-info">
                  <h3>{classItem.name}</h3>
                  <span className="class-code">{classItem.code}</span>
                </div>
                <div
                  className={`class-status ${
                    classItem.isActive ? "active" : "inactive"
                  }`}
                >
                  {classItem.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <p className="class-description">
                {classItem.description || "No description"}
              </p>

              <div className="class-meta">
                <div className="meta-item">
                  <span className="meta-label">Students</span>
                  <span className="meta-value">
                    {classItem.studentCount || 0} / {classItem.maxStudents}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Experiments</span>
                  <span className="meta-value">
                    {classItem.experiments?.length || 0}
                  </span>
                </div>
                {classItem.department && (
                  <div className="meta-item">
                    <span className="meta-label">Dept</span>
                    <span className="meta-value">{classItem.department}</span>
                  </div>
                )}
              </div>

              <div className="join-code-section">
                <span className="join-label">Join Code:</span>
                <span className="join-code">{classItem.joinCode}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyJoinCode(classItem.joinCode)}
                  title="Copy join code"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>

              <div className="class-actions">
                <Link
                  to={`/class/${classItem._id}`}
                  className="action-btn view-btn"
                >
                  View Details
                </Link>
                <button
                  className="delete-icon-btn"
                  onClick={() => handleDeleteClass(classItem._id)}
                  title="Delete class"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Class</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Physics 101"
                  required
                />
              </div>
              <div className="form-group">
                <label>Class Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., PHY101"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the class"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="e.g., Physics"
                  />
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    placeholder="e.g., Fall 2024"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Max Students</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudents: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  max={500}
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
