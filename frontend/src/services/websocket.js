const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.messageHandlers = [];
    this.statusHandlers = [];
    this.reconnectTimer = null;
    this.shouldReconnect = false;
  }

  connect(userId, token) {
    this.userId = userId;
    this.shouldReconnect = true;
    this._open(userId, token);
  }

  _open(userId, token) {
    const url = `${WS_BASE}/ws/${userId}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      clearTimeout(this.reconnectTimer);
      // Keep-alive ping every 30 s
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;
        if (data.type === 'status') {
          this.statusHandlers.forEach((cb) => cb(data));
        } else {
          this.messageHandlers.forEach((cb) => cb(data));
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.ws.onclose = () => {
      clearInterval(this.pingInterval);
      if (this.shouldReconnect) {
        // Re-read token from storage on reconnect so an updated token is used
        const latestToken = localStorage.getItem('token') || token;
        this.reconnectTimer = setTimeout(() => this._open(userId, latestToken), 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
      this.ws.close();
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(messageData) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(messageData));
    }
  }

  onMessage(callback) {
    this.messageHandlers.push(callback);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((cb) => cb !== callback);
    };
  }

  onStatusUpdate(callback) {
    this.statusHandlers.push(callback);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((cb) => cb !== callback);
    };
  }
}

const wsService = new WebSocketService();
export default wsService;
