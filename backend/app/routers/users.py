from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..config import get_settings

settings = get_settings()
router = APIRouter(tags=["users"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        avatar_url=user_in.avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.put("/users/me", response_model=schemas.UserResponse)
def update_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/users/me/status", response_model=schemas.UserResponse)
def update_status(
    status_update: schemas.UserStatusUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy.sql import func
    current_user.is_online = status_update.is_online
    if not status_update.is_online:
        current_user.last_seen = func.now()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(
    search: str = "",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.User).filter(models.User.id != current_user.id)
    if search:
        query = query.filter(
            models.User.username.ilike(f"%{search}%")
            | models.User.full_name.ilike(f"%{search}%")
        )
    return query.all()


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
