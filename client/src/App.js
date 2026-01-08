// Main App component with routing and authentication context
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import CreateExperiment from './pages/CreateExperiment';
import ExperimentView from './pages/ExperimentView';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import BadgeManagement from './pages/BadgeManagement';
import DiagramGenerator from './pages/DiagramGenerator';
import CodingGrounds from './pages/CodingGrounds';
import AISettings from './pages/AISettings';
import ChemistryLab from './pages/ChemistryLab';
import ChemistryLabAR from './pages/ChemistryLabAR';
import ARChemistryLabCamera from './pages/ARChemistryLabCamera';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Landing page as home */}
            <Route path="/" element={<Landing />} />

            {/* Public routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* Student Dashboard */}
            <Route
              path="/student-dashboard"
              element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />

            {/* Faculty Dashboard */}
            <Route
              path="/faculty-dashboard"
              element={
                <PrivateRoute>
                  <FacultyDashboard />
                </PrivateRoute>
              }
            />

            {/* Faculty: Create Experiment */}
            <Route
              path="/experiment/create"
              element={
                <PrivateRoute>
                  <CreateExperiment />
                </PrivateRoute>
              }
            />

            {/* Experiment View */}
            <Route
              path="/experiment/:id"
              element={
                <PrivateRoute>
                  <ExperimentView />
                </PrivateRoute>
              }
            />

            {/* Quiz Page */}
            <Route
              path="/experiment/:id/quiz"
              element={
                <PrivateRoute>
                  <QuizPage />
                </PrivateRoute>
              }
            />

            {/* Result Page */}
            <Route
              path="/experiment/:id/result"
              element={
                <PrivateRoute>
                  <ResultPage />
                </PrivateRoute>
              }
            />

            {/* Badge Management (Admin) */}
            <Route
              path="/badge-management"
              element={
                <PrivateRoute>
                  <BadgeManagement />
                </PrivateRoute>
              }
            />

            {/* Diagram Generator (Admin) */}
            <Route
              path="/diagram-generator"
              element={
                <PrivateRoute>
                  <DiagramGenerator />
                </PrivateRoute>
              }
            />

            {/* Coding Grounds - Online Code Editor */}
            <Route
              path="/coding-grounds"
              element={
                <PrivateRoute>
                  <CodingGrounds />
                </PrivateRoute>
              }
            />

            {/* AI Settings (Admin) */}
            <Route
              path="/ai-settings"
              element={
                <PrivateRoute>
                  <AISettings />
                </PrivateRoute>
              }
            />

            {/* Virtual Chemistry Lab */}
            <Route
              path="/chemistry-lab"
              element={
                <PrivateRoute>
                  <ChemistryLab />
                </PrivateRoute>
              }
            />

            {/* AR Chemistry Lab */}
            <Route
              path="/chemistry-lab-ar"
              element={
                <PrivateRoute>
                  <ChemistryLabAR />
                </PrivateRoute>
              }
            />

            {/* Camera-Based AR Chemistry Lab */}
            <Route
              path="/ar-chemistry-camera"
              element={
                <PrivateRoute>
                  <ARChemistryLabCamera />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
