import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { messagesAPI } from '../services/api';
import wsService from '../services/websocket';

export default function ChatWindow({ currentUser, selectedUser, selectedGroup }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const isGroup = !!selectedGroup;
  const chatTarget = selectedGroup || selectedUser;

  // Build a lookup map: user_id -> username from group members or direct chat
  const userMap = useMemo(() => {
    const map = { [currentUser.id]: currentUser.username };
    if (selectedUser) {
      map[selectedUser.id] = selectedUser.username;
    }
    if (selectedGroup?.members) {
      selectedGroup.members.forEach((m) => {
        if (m.user) map[m.user.id] = m.user.username;
      });
    }
    return map;
  }, [currentUser, selectedUser, selectedGroup]);

  const fetchMessages = useCallback(async () => {
    if (!chatTarget) return;
    setLoading(true);
    try {
      const { data } = isGroup
        ? await messagesAPI.getGroupMessages(selectedGroup.id)
        : await messagesAPI.getConversation(selectedUser.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  }, [chatTarget, isGroup, selectedGroup, selectedUser]);

  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for incoming WebSocket messages
  useEffect(() => {
    const unsubscribe = wsService.onMessage((data) => {
      const isRelevantDirect =
        !isGroup &&
        data.type === 'direct' &&
        ((data.sender_id === selectedUser?.id && data.receiver_id === currentUser.id) ||
          (data.sender_id === currentUser.id && data.receiver_id === selectedUser?.id));

      const isRelevantGroup =
        isGroup && data.type === 'group' && data.group_id === selectedGroup?.id;

      if (isRelevantDirect || isRelevantGroup) {
        setMessages((prev) => {
          // Deduplicate by id using a Set for O(1) lookup
          const existingIds = new Set(prev.map((m) => m.id));
          if (existingIds.has(data.id)) return prev;
          const senderUsername = userMap[data.sender_id] || `user_${data.sender_id}`;
          return [
            ...prev,
            {
              id: data.id,
              content: data.content,
              sender_id: data.sender_id,
              receiver_id: data.receiver_id,
              group_id: data.group_id,
              created_at: data.created_at,
              sender: { id: data.sender_id, username: senderUsername },
            },
          ];
        });
      }
    });
    return unsubscribe;
  }, [currentUser, selectedUser, selectedGroup, isGroup, userMap]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !chatTarget) return;

    if (isGroup) {
      wsService.sendMessage({ type: 'group', group_id: selectedGroup.id, content: trimmed });
    } else {
      wsService.sendMessage({ type: 'direct', receiver_id: selectedUser.id, content: trimmed });
    }
    setInput('');
  };

  if (!chatTarget) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">💬</div>
        <h2>Select a conversation</h2>
        <p>Choose a user or group from the sidebar to start messaging</p>
      </div>
    );
  }

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-avatar">
          {isGroup ? '👥' : (chatTarget.username?.[0] || '?').toUpperCase()}
        </div>
        <div className="chat-header-info">
          <h3>{isGroup ? chatTarget.name : chatTarget.full_name || chatTarget.username}</h3>
          <span className={`status-text ${chatTarget.is_online ? 'online' : 'offline'}`}>
            {isGroup
              ? `${chatTarget.members?.length || 0} members`
              : chatTarget.is_online
              ? 'Online'
              : 'Offline'}
          </span>
        </div>
      </div>

      <div className="messages-container">
        {loading && <div className="loading-msgs">Loading messages…</div>}
        {messages.length === 0 && !loading && (
          <div className="no-messages">No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <div className="msg-avatar">
                  {(msg.sender?.username?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div className="message-bubble-wrap">
                {isGroup && !isMine && (
                  <span className="msg-sender-name">{msg.sender?.username}</span>
                )}
                <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                  <span className="msg-content">{msg.content}</span>
                  <span className="msg-time">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="message-input-bar" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="message-input"
          autoFocus
        />
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
