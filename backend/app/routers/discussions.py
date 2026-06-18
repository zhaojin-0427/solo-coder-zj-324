from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/items/{item_id}/discussions", response_model=List[schemas.Discussion])
def get_discussions(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    discussions = db.query(models.Discussion).filter(
        models.Discussion.item_id == item_id,
        models.Discussion.reply_to_id == None
    ).order_by(models.Discussion.created_at.desc()).all()
    
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
