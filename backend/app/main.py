from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .routers import users, messages, groups
from .websockets import websocket_endpoint

app = FastAPI(title="Messenger API", version="1.0.0")

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


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.websocket("/ws/{user_id}")
async def ws_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await websocket_endpoint(websocket, user_id, db)
