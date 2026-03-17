from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message_in: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if message_in.message_type == schemas.MessageType.direct:
        if not message_in.receiver_id:
            raise HTTPException(status_code=400, detail="receiver_id required for direct messages")
        if not db.query(models.User).filter(models.User.id == message_in.receiver_id).first():
            raise HTTPException(status_code=404, detail="Receiver not found")
    else:
        if not message_in.group_id:
            raise HTTPException(status_code=400, detail="group_id required for group messages")
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == message_in.group_id,
            models.GroupMember.user_id == current_user.id,
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")

    message = models.Message(
        content=message_in.content,
        sender_id=current_user.id,
        receiver_id=message_in.receiver_id,
        group_id=message_in.group_id,
        message_type=message_in.message_type,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/{user_id}", response_model=list[schemas.MessageResponse])
def get_conversation(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    messages = (
        db.query(models.Message)
        .filter(
            models.Message.message_type == models.MessageType.direct,
            (
                (models.Message.sender_id == current_user.id)
                & (models.Message.receiver_id == user_id)
            )
            | (
                (models.Message.sender_id == user_id)
                & (models.Message.receiver_id == current_user.id)
            ),
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.get("/groups/{group_id}", response_model=list[schemas.MessageResponse])
def get_group_messages(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    messages = (
        db.query(models.Message)
        .filter(
            models.Message.group_id == group_id,
            models.Message.message_type == models.MessageType.group,
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.put("/{message_id}/read", response_model=schemas.MessageResponse)
def mark_as_read(
    message_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    message.is_read = True
    db.commit()
    db.refresh(message)
    return message
