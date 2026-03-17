import React, { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';

export default function UserList({ currentUser, onSelectUser, selectedUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getUsers(search);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return (
    <div className="user-list">
      <div className="list-search">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      {loading && <div className="list-loading">Loading…</div>}
      <ul className="list-items">
        {users.map((user) => (
          <li
            key={user.id}
            className={`list-item ${selectedUser?.id === user.id ? 'active' : ''}`}
            onClick={() => onSelectUser(user)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectUser(user)}
          >
            <div className="list-item-avatar">
              {(user.username?.[0] || '?').toUpperCase()}
              <span className={`online-dot ${user.is_online ? 'is-online' : ''}`} />
            </div>
            <div className="list-item-info">
              <span className="list-item-name">
                {user.full_name || user.username}
              </span>
              <span className="list-item-sub">@{user.username}</span>
            </div>
          </li>
        ))}
        {!loading && users.length === 0 && (
          <li className="list-empty">No users found</li>
        )}
      </ul>
    </div>
  );
}
