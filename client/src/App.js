// Main App component with routing and authentication context
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateExperiment from './pages/CreateExperiment';
import ExperimentView from './pages/ExperimentView';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import BadgeManagement from './pages/BadgeManagement';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
