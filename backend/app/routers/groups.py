from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/groups", tags=["groups"])


def _require_admin(group_id: int, user_id: int, db: Session):
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    if membership.role != models.GroupRole.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return membership


@router.post("", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: schemas.GroupCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    group = models.Group(
        name=group_in.name,
        description=group_in.description,
        owner_id=current_user.id,
        avatar_url=group_in.avatar_url,
    )
    db.add(group)
    db.flush()

    owner_membership = models.GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role=models.GroupRole.admin,
    )
    db.add(owner_membership)
    db.commit()
    db.refresh(group)
    return group


@router.get("", response_model=list[schemas.GroupResponse])
def list_groups(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(models.GroupMember)
        .filter(models.GroupMember.user_id == current_user.id)
        .all()
    )
    group_ids = [m.group_id for m in memberships]
    return db.query(models.Group).filter(models.Group.id.in_(group_ids)).all()


@router.get("/{group_id}", response_model=schemas.GroupResponse)
def get_group(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return group


@router.put("/{group_id}", response_model=schemas.GroupResponse)
def update_group(
    group_id: int,
    group_update: schemas.GroupUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(group_id, current_user.id, db)
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    for field, value in group_update.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete the group")
    db.delete(group)
    db.commit()


@router.post("/{group_id}/members", response_model=schemas.GroupMemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: int,
    body: schemas.AddMemberRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(group_id, current_user.id, db)

    if not db.query(models.User).filter(models.User.id == body.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    member = models.GroupMember(
        group_id=group_id,
        user_id=body.user_id,
        role=models.GroupRole.member,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    group_id: int,
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Admin can remove anyone; a member can remove themselves
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    if current_user.id != user_id and membership.role != models.GroupRole.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required to remove others")

    target = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(target)
    db.commit()


@router.get("/{group_id}/members", response_model=list[schemas.GroupMemberResponse])
def list_members(
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
    return (
        db.query(models.GroupMember)
        .filter(models.GroupMember.group_id == group_id)
        .all()
    )
