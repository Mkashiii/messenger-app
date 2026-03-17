import React, { useState } from 'react';
import { authAPI, usersAPI } from '../services/api';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: tokenData } = await authAPI.login(username, password);
      localStorage.setItem('token', tokenData.access_token);
      const { data: user } = await usersAPI.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">💬</div>
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-banner">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="auth-switch">
        Don't have an account?{' '}
        <button className="link-btn" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </div>
  );
}
