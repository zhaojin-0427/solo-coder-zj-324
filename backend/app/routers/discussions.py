from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/discussions", response_model=List[schemas.Discussion])
def get_all_discussions(
    item_id: Optional[int] = Query(None, description="按旧物ID筛选"),
    author: Optional[str] = Query(None, description="按发言人筛选"),
    keyword: Optional[str] = Query(None, description="按关键词筛选内容"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Discussion)

    conditions = []
    if item_id is not None:
        conditions.append(models.Discussion.item_id == item_id)
    if author:
        conditions.append(models.Discussion.author == author)
    if keyword:
        conditions.append(models.Discussion.content.contains(keyword))

    if conditions:
        query = query.filter(and_(*conditions))

    discussions = query.order_by(models.Discussion.created_at.desc()).all()
    return discussions


@router.get("/items/{item_id}/discussions", response_model=List[schemas.Discussion])
def get_discussions(
    item_id: int,
    author: Optional[str] = Query(None, description="按发言人筛选"),
    keyword: Optional[str] = Query(None, description="按关键词筛选内容"),
    db: Session = Depends(get_db)
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    query = db.query(models.Discussion).filter(
        models.Discussion.item_id == item_id,
        models.Discussion.reply_to_id == None
    )

    if author:
        query = query.filter(models.Discussion.author == author)
    if keyword:
        query = query.filter(models.Discussion.content.contains(keyword))

    discussions = query.order_by(models.Discussion.created_at.desc()).all()
    return discussions


@router.post("/items/{item_id}/discussions", response_model=schemas.Discussion, status_code=status.HTTP_201_CREATED)
def create_discussion(item_id: int, discussion: schemas.DiscussionCreate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    if discussion.reply_to_id:
        parent = db.query(models.Discussion).filter(
            models.Discussion.id == discussion.reply_to_id,
            models.Discussion.item_id == item_id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="回复的讨论不存在")

    db_discussion = models.Discussion(
        item_id=item_id,
        author=discussion.author,
        content=discussion.content,
        reply_to_id=discussion.reply_to_id
    )
    db.add(db_discussion)
    db.commit()
    db.refresh(db_discussion)
    return db_discussion
