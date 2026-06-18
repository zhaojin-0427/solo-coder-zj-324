from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/items", response_model=List[schemas.HeirloomItem])
def get_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.HeirloomItem).offset(skip).limit(limit).all()
    return items


@router.get("/items/{item_id}", response_model=schemas.HeirloomItem)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    return item


@router.post("/items", response_model=schemas.HeirloomItem, status_code=status.HTTP_201_CREATED)
def create_item(item: schemas.HeirloomItemCreate, db: Session = Depends(get_db)):
    db_item = models.HeirloomItem(
        name=item.name,
        category=item.category,
        era=item.era,
        usage_scene=item.usage_scene,
        condition=item.condition,
        description=item.description,
        cover_image=item.cover_image
    )
    
    if item.related_people_ids:
        members = db.query(models.FamilyMember).filter(
            models.FamilyMember.id.in_(item.related_people_ids)
        ).all()
        db_item.related_people = members
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/items/{item_id}", response_model=schemas.HeirloomItem)
def update_item(item_id: int, item_update: schemas.HeirloomItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    update_data = item_update.model_dump(exclude_unset=True)
    
    if "related_people_ids" in update_data:
        member_ids = update_data.pop("related_people_ids")
        if member_ids is not None:
            members = db.query(models.FamilyMember).filter(
                models.FamilyMember.id.in_(member_ids)
            ).all()
            db_item.related_people = members
    
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    db.delete(db_item)
    db.commit()
    return None


@router.get("/items/{item_id}/repair-records", response_model=List[schemas.RepairRecord])
def get_repair_records(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    return item.repair_records


@router.post("/items/{item_id}/repair-records", response_model=schemas.RepairRecord, status_code=status.HTTP_201_CREATED)
def create_repair_record(item_id: int, record: schemas.RepairRecordCreate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    db_record = models.RepairRecord(
        item_id=item_id,
        **record.model_dump()
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/items/{item_id}/storage", response_model=schemas.StorageLocation)
def get_storage_location(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    if not item.storage_location:
        raise HTTPException(status_code=404, detail="暂无存放位置信息")
    return item.storage_location


@router.put("/items/{item_id}/storage", response_model=schemas.StorageLocation)
def update_storage_location(item_id: int, storage: schemas.StorageLocationUpdate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    
    if item.storage_location:
        for key, value in storage.model_dump().items():
            setattr(item.storage_location, key, value)
        db.commit()
        db.refresh(item.storage_location)
        return item.storage_location
    else:
        db_storage = models.StorageLocation(
            item_id=item_id,
            **storage.model_dump()
        )
        db.add(db_storage)
        db.commit()
        db.refresh(db_storage)
        return db_storage
