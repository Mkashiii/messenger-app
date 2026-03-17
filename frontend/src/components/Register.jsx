import React, { useState } from 'react';
import { authAPI, usersAPI } from '../services/api';

export default function Register({ onLoginSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      const { data: tokenData } = await authAPI.login(form.username, form.password);
      localStorage.setItem('token', tokenData.access_token);
      const { data: user } = await usersAPI.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">💬</div>
        <h1>Create account</h1>
        <p>Join Messenger today</p>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-banner">{error}</div>}
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{' '}
        <button className="link-btn" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </div>
  );
}
