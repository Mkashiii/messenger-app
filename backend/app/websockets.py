import json
from typing import Dict

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from . import models


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_group(self, message: dict, group_id: int, db: Session):
        members = (
            db.query(models.GroupMember)
            .filter(models.GroupMember.group_id == group_id)
            .all()
        )
        for member in members:
            await self.send_personal_message(message, member.user_id)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session):
    await manager.connect(websocket, user_id)

    # Mark user online
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_online = True
        db.commit()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
                continue

            msg_type = payload.get("type")

            if msg_type == "direct":
                receiver_id = payload.get("receiver_id")
                content = payload.get("content", "")
                if not receiver_id or not content:
                    continue

                # Persist message
                message = models.Message(
                    content=content,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    message_type=models.MessageType.direct,
                )
                db.add(message)
                db.commit()
                db.refresh(message)

                out = {
                    "type": "direct",
                    "id": message.id,
                    "content": content,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "created_at": message.created_at.isoformat(),
                }
                # Deliver to receiver and echo back to sender
                await manager.send_personal_message(out, receiver_id)
                await manager.send_personal_message(out, user_id)

            elif msg_type == "group":
                group_id = payload.get("group_id")
                content = payload.get("content", "")
                if not group_id or not content:
                    continue

                membership = db.query(models.GroupMember).filter(
                    models.GroupMember.group_id == group_id,
                    models.GroupMember.user_id == user_id,
                ).first()
                if not membership:
                    continue

                message = models.Message(
                    content=content,
                    sender_id=user_id,
                    group_id=group_id,
                    message_type=models.MessageType.group,
                )
                db.add(message)
                db.commit()
                db.refresh(message)

                out = {
                    "type": "group",
                    "id": message.id,
                    "content": content,
                    "sender_id": user_id,
                    "group_id": group_id,
                    "created_at": message.created_at.isoformat(),
                }
                await manager.broadcast_to_group(out, group_id, db)

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        if user:
            from sqlalchemy.sql import func
            user.is_online = False
            user.last_seen = func.now()
            db.commit()
