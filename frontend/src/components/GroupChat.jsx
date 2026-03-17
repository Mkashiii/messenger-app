import React, { useState, useEffect, useCallback } from 'react';
import { groupsAPI, usersAPI } from '../services/api';

export default function GroupChat({ currentUser, onSelectGroup, selectedGroup }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await groupsAPI.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchMembers = useCallback(async () => {
    if (!selectedGroup) return;
    try {
      const { data } = await groupsAPI.getMembers(selectedGroup.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members', err);
    }
  }, [selectedGroup]);

  const openMembers = async () => {
    await fetchMembers();
    const { data } = await usersAPI.getUsers();
    setAllUsers(data);
    setShowMembers(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await groupsAPI.createGroup(newGroup);
      setGroups((prev) => [...prev, data]);
      setNewGroup({ name: '', description: '' });
      setShowCreate(false);
      onSelectGroup(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await groupsAPI.addMember(selectedGroup.id, userId);
      fetchMembers();
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await groupsAPI.removeMember(selectedGroup.id, userId);
      fetchMembers();
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const memberUserIds = members.map((m) => m.user_id);
  const nonMembers = allUsers.filter((u) => !memberUserIds.includes(u.id));

  return (
    <div className="group-list">
      <div className="list-header-row">
        <span className="list-section-title">Groups</span>
        <button className="icon-btn" onClick={() => setShowCreate(!showCreate)} title="New group">＋</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="create-group-form">
          {error && <div className="error-banner">{error}</div>}
          <input
            type="text"
            placeholder="Group name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
            className="search-input"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            className="search-input"
            style={{ marginTop: '6px' }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </form>
      )}

      <ul className="list-items">
        {groups.map((group) => (
          <li
            key={group.id}
            className={`list-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
            onClick={() => onSelectGroup(group)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectGroup(group)}
          >
            <div className="list-item-avatar group-avatar">👥</div>
            <div className="list-item-info">
              <span className="list-item-name">{group.name}</span>
              <span className="list-item-sub">{group.members?.length || 0} members</span>
            </div>
            {selectedGroup?.id === group.id && (
              <button
                className="icon-btn small"
                onClick={(e) => { e.stopPropagation(); openMembers(); }}
                title="Manage members"
              >
                ⚙
              </button>
            )}
          </li>
        ))}
        {groups.length === 0 && <li className="list-empty">No groups yet</li>}
      </ul>

      {showMembers && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowMembers(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Members – {selectedGroup.name}</h3>
              <button className="icon-btn" onClick={() => setShowMembers(false)}>✕</button>
            </div>
            <h4 className="modal-section">Current members</h4>
            <ul className="modal-list">
              {members.map((m) => (
                <li key={m.id} className="modal-list-item">
                  <span>{m.user?.full_name || m.user?.username} ({m.role})</span>
                  {m.user_id !== currentUser.id && selectedGroup.owner_id === currentUser.id && (
                    <button className="btn-danger-sm" onClick={() => handleRemoveMember(m.user_id)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {selectedGroup.owner_id === currentUser.id && nonMembers.length > 0 && (
              <>
                <h4 className="modal-section">Add members</h4>
                <ul className="modal-list">
                  {nonMembers.map((u) => (
                    <li key={u.id} className="modal-list-item">
                      <span>{u.full_name || u.username}</span>
                      <button className="btn-success-sm" onClick={() => handleAddMember(u.id)}>
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
