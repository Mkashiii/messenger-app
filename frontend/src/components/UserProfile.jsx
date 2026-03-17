import React, { useState } from 'react';
import { usersAPI } from '../services/api';

export default function UserProfile({ user, onUpdate, isCurrentUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    avatar_url: user?.avatar_url || '',
    email: user?.email || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);
    try {
      const { data } = await usersAPI.updateMe(form);
      localStorage.setItem('user', JSON.stringify(data));
      onUpdate && onUpdate(data);
      setSuccess(true);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-card">
      <div className="profile-avatar-wrap">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="avatar" className="profile-avatar-img" />
        ) : (
          <div className="profile-avatar-placeholder">
            {(user.username?.[0] || '?').toUpperCase()}
          </div>
        )}
        <span className={`profile-status ${user.is_online ? 'online' : 'offline'}`}>
          {user.is_online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="profile-info">
        <h2>{user.full_name || user.username}</h2>
        <p className="profile-username">@{user.username}</p>
        <p className="profile-email">{user.email}</p>
        <p className="profile-joined">
          Joined {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>

      {isCurrentUser && !editing && (
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Edit Profile
        </button>
      )}

      {isCurrentUser && editing && (
        <form onSubmit={handleSave} className="profile-edit-form">
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">Profile updated!</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>Avatar URL</label>
            <input
              name="avatar_url"
              type="url"
              value={form.avatar_url}
              onChange={handleChange}
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setEditing(false); setError(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
