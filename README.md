# Messenger App

A full-stack real-time messaging application built with **FastAPI** (Python) and **React**.

## Features

- 🔐 JWT-based authentication (register / login)
- 💬 Real-time direct messaging via WebSocket
- 👥 Group chats with member management
- 🟢 Online/offline presence indicators
- 🔍 User search
- 👤 User profile editing
- 🐳 Docker Compose for one-command startup

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Backend  | FastAPI, SQLAlchemy 2, PostgreSQL, Passlib/bcrypt, python-jose |
| Frontend | React 18, React Router 6, Axios, WebSocket API |
| Infra    | Docker, Docker Compose, Nginx                 |

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <repo-url>
cd messenger-app

# 2. Start all services
docker compose up --build

# 3. Open the app
#   Frontend → http://localhost:3000
#   API docs  → http://localhost:8000/docs
```

See **SETUP.md** for detailed instructions including running without Docker.