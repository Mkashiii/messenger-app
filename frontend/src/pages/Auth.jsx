import React, { useState } from 'react';
import Login from '../components/Login';
import Register from '../components/Register';

export default function Auth({ onLoginSuccess }) {
  const [view, setView] = useState('login');

  return (
    <div className="auth-page">
      <div className="auth-container">
        {view === 'login' ? (
          <Login
            onLoginSuccess={onLoginSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <Register
            onLoginSuccess={onLoginSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
