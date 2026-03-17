import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import './App.css';

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = (user) => setCurrentUser(user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  if (!authChecked) return null;

  const isAuthenticated = !!currentUser;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/auth'} replace />}
        />
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
