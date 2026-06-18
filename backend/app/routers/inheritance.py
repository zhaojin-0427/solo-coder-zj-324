from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/items/{item_id}/intentions", response_model=List[schemas.InheritanceIntention])
def get_intentions(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    return sorted(item.intentions, key=lambda x: x.version)


@router.post("/items/{item_id}/intentions", response_model=schemas.InheritanceIntention, status_code=status.HTTP_201_CREATED)
def create_intention(item_id: int, intention: schemas.InheritanceIntentionCreate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    existing_final = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.item_id == item_id,
        models.InheritanceIntention.is_final == True
    ).first()
    if existing_final and intention.is_final:
        raise HTTPException(status_code=400, detail="已存在最终确认的传承意向")
    
    max_version = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.item_id == item_id
    ).count()
    
    db_intention = models.InheritanceIntention(
        item_id=item_id,
        version=max_version + 1,
        proposed_by=intention.proposed_by,
        proposed_recipient=intention.proposed_recipient,
        reason=intention.reason,
        is_final=intention.is_final
    )
    db.add(db_intention)
    db.commit()
    db.refresh(db_intention)
    return db_intention


@router.put("/items/{item_id}/intentions/{intention_id}/confirm", response_model=schemas.InheritanceIntention)
def confirm_intention(item_id: int, intention_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    intention = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.id == intention_id,
        models.InheritanceIntention.item_id == item_id
    ).first()
    if not intention:
        raise HTTPException(status_code=404, detail="传承意向不存在")
    
    existing_final = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.item_id == item_id,
        models.InheritanceIntention.is_final == True,
        models.InheritanceIntention.id != intention_id
    ).first()
    if existing_final:
        raise HTTPException(status_code=400, detail="已存在其他最终确认的传承意向")
    
    intention.is_final = True
    db.commit()
    db.refresh(intention)
    return intention
