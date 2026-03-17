from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    direct = "direct"
    group = "group"


class GroupRole(str, Enum):
    member = "member"
    admin = "admin"


# ─── User Schemas ────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[EmailStr] = None


class UserStatusUpdate(BaseModel):
    is_online: bool


class UserResponse(UserBase):
    id: int
    is_online: bool
    last_seen: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Token Schemas ────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ─── Message Schemas ──────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str
    receiver_id: Optional[int] = None
    group_id: Optional[int] = None
    message_type: MessageType = MessageType.direct


class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    receiver_id: Optional[int] = None
    group_id: Optional[int] = None
    message_type: MessageType
    is_read: bool
    created_at: datetime
    sender: UserResponse

    model_config = {"from_attributes": True}


# ─── Group Schemas ────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    role: GroupRole
    joined_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}


class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    avatar_url: Optional[str] = None
    created_at: datetime
    members: List[GroupMemberResponse] = []

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
