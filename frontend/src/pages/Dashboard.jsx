import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserList from '../components/UserList';
import GroupChat from '../components/GroupChat';
import ChatWindow from '../components/ChatWindow';
import { usersAPI } from '../services/api';
import wsService from '../services/websocket';

export default function Dashboard({ currentUser, onLogout, onUpdateUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('users');
  const navigate = useNavigate();

  // Connect WebSocket on mount, disconnect on unmount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (currentUser && token) {
      wsService.connect(currentUser.id, token);
      usersAPI.updateStatus(true).catch(() => {});
    }
    return () => {
      wsService.disconnect();
      usersAPI.updateStatus(false).catch(() => {});
    };
  }, [currentUser]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  }, []);

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  }, []);

  const handleLogout = () => {
    wsService.disconnect();
    usersAPI.updateStatus(false).catch(() => {});
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">💬</div>
          <span className="sidebar-title">Messenger</span>
          <div className="sidebar-actions">
            <button
              className="icon-btn"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              👤
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              ↩
            </button>
          </div>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {(currentUser?.username?.[0] || '?').toUpperCase()}
            <span className="online-dot is-online" />
          </div>
          <div>
            <div className="sidebar-user-name">
              {currentUser?.full_name || currentUser?.username}
            </div>
            <div className="sidebar-user-status">Online</div>
          </div>
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn ${sidebarTab === 'users' ? 'active' : ''}`}
            onClick={() => setSidebarTab('users')}
          >
            People
          </button>
          <button
            className={`tab-btn ${sidebarTab === 'groups' ? 'active' : ''}`}
            onClick={() => setSidebarTab('groups')}
          >
            Groups
          </button>
        </div>

        <div className="sidebar-content">
          {sidebarTab === 'users' ? (
            <UserList
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
              selectedUser={selectedUser}
            />
          ) : (
            <GroupChat
              currentUser={currentUser}
              onSelectGroup={handleSelectGroup}
              selectedGroup={selectedGroup}
            />
          )}
        </div>
      </aside>

      <main className="main-content">
        <ChatWindow
          currentUser={currentUser}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
        />
      </main>
    </div>
  );
}
