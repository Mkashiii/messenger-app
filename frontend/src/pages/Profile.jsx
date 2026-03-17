import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/UserProfile';

export default function Profile({ currentUser, onUpdateUser }) {
  const navigate = useNavigate();

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
      </div>
      <UserProfile
        user={currentUser}
        onUpdate={onUpdateUser}
        isCurrentUser
      />
    </div>
  );
}
