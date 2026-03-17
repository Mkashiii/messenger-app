from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Depends, WebSocketException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .routers import users, messages, groups
from .websockets import websocket_endpoint
from .auth import verify_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Messenger API", version="1.0.0", lifespan=lifespan)

# NOTE: In production, restrict allow_origins to your frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(messages.router)
app.include_router(groups.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.websocket("/ws/{user_id}")
async def ws_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    # Validate JWT token passed as query param: /ws/{user_id}?token=<jwt>
    token = websocket.query_params.get("token", "")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        credentials_exception = Exception("Invalid token")
        token_data = verify_token(token, credentials_exception)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    # Verify the token owner matches the requested user_id
    from . import models as _models
    user = db.query(_models.User).filter(_models.User.username == token_data.username).first()
    if user is None or user.id != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await websocket_endpoint(websocket, user_id, db)
