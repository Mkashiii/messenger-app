# Setup Guide

## Option 1 — Docker Compose (Recommended)

### Prerequisites
- Docker ≥ 24
- Docker Compose v2

### Steps

```bash
# Start all services (db, backend, frontend)
docker compose up --build

# The first run downloads images and builds the containers (~2-3 min).
# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:8000
#   API docs  → http://localhost:8000/docs
#   DB        → localhost:5432
```

To stop everything:
```bash
docker compose down
```

To wipe the database volume too:
```bash
docker compose down -v
```

---

## Option 2 — Run Without Docker

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 running locally

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL to point to your local Postgres instance

# Run the development server (auto-creates tables on startup)
python run.py
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if backend runs on a different host/port

# Start the dev server
npm start
# App available at http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                    | Default                                       | Description                    |
|-----------------------------|-----------------------------------------------|--------------------------------|
| `DATABASE_URL`              | `postgresql://postgres:password@db:5432/messenger` | PostgreSQL connection string |
| `SECRET_KEY`                | *(change this!)*                              | JWT signing key                |
| `ALGORITHM`                 | `HS256`                                       | JWT algorithm                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                                        | Token lifetime                 |

### Frontend (`frontend/.env`)

| Variable              | Default                    | Description          |
|-----------------------|----------------------------|----------------------|
| `REACT_APP_API_URL`   | `http://localhost:8000`    | Backend HTTP URL     |
| `REACT_APP_WS_URL`    | `ws://localhost:8000`      | Backend WebSocket URL |

---

## API Overview

| Method | Path                              | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | `/register`                       | Register new user        |
| POST   | `/login`                          | Obtain JWT token         |
| GET    | `/users/me`                       | Current user profile     |
| PUT    | `/users/me`                       | Update profile           |
| PUT    | `/users/me/status`                | Update online status     |
| GET    | `/users`                          | List / search users      |
| GET    | `/users/{id}`                     | Get user by ID           |
| POST   | `/messages`                       | Send direct/group msg    |
| GET    | `/messages/{user_id}`             | Get conversation         |
| GET    | `/messages/groups/{group_id}`     | Get group messages       |
| PUT    | `/messages/{id}/read`             | Mark message as read     |
| POST   | `/groups`                         | Create group             |
| GET    | `/groups`                         | List my groups           |
| GET    | `/groups/{id}`                    | Get group details        |
| PUT    | `/groups/{id}`                    | Update group             |
| DELETE | `/groups/{id}`                    | Delete group             |
| POST   | `/groups/{id}/members`            | Add member               |
| DELETE | `/groups/{id}/members/{user_id}`  | Remove member            |
| GET    | `/groups/{id}/members`            | List members             |
| WS     | `/ws/{user_id}`                   | Real-time WebSocket      |

Full interactive docs: `http://localhost:8000/docs`
