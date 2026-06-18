from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/items/{item_id}/story-card", response_model=schemas.StoryCard)
def get_story_card(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    if not item.story_card:
        raise HTTPException(status_code=404, detail="暂无故事卡")
    return item.story_card


@router.post("/items/{item_id}/story-card", response_model=schemas.StoryCard, status_code=status.HTTP_201_CREATED)
def create_story_card(item_id: int, story_card: schemas.StoryCardCreate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    if item.story_card:
        raise HTTPException(status_code=400, detail="该旧物已有故事卡，请使用更新接口")
    
    db_story_card = models.StoryCard(
        item_id=item_id,
        **story_card.model_dump()
    )
    db.add(db_story_card)
    db.commit()
    db.refresh(db_story_card)
    return db_story_card


@router.put("/items/{item_id}/story-card", response_model=schemas.StoryCard)
def update_story_card(item_id: int, story_card_update: schemas.StoryCardUpdate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    if not item.story_card:
        raise HTTPException(status_code=404, detail="暂无故事卡，请先创建")
    
    for key, value in story_card_update.model_dump().items():
        setattr(item.story_card, key, value)
    
    db.commit()
    db.refresh(item.story_card)
    return item.story_card


@router.delete("/items/{item_id}/story-card", status_code=status.HTTP_204_NO_CONTENT)
def delete_story_card(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    if not item.story_card:
        raise HTTPException(status_code=404, detail="暂无故事卡")
    
    db.delete(item.story_card)
    db.commit()
    return None
