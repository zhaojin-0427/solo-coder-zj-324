from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter()


def _get_risk_types_list(risks_str: Optional[str]) -> List[str]:
    if not risks_str:
        return []
    return [r.strip() for r in risks_str.split(",") if r.strip()]


@router.get("/items/{item_id}/inspections", response_model=List[schemas.InspectionRecord])
def get_inspections(
    item_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    records = (
        db.query(models.InspectionRecord)
        .filter(models.InspectionRecord.item_id == item_id)
        .order_by(desc(models.InspectionRecord.inspection_date))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


@router.get(
    "/items/{item_id}/inspections/{inspection_id}",
    response_model=schemas.InspectionRecord,
)
def get_inspection(item_id: int, inspection_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")
    record = (
        db.query(models.InspectionRecord)
        .filter(
            models.InspectionRecord.id == inspection_id,
            models.InspectionRecord.item_id == item_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="盘点记录不存在")
    return record


@router.post(
    "/items/{item_id}/inspections",
    response_model=schemas.InspectionRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_inspection(
    item_id: int,
    record: schemas.InspectionRecordCreate,
    db: Session = Depends(get_db),
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    db_record = models.InspectionRecord(item_id=item_id, **record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put(
    "/items/{item_id}/inspections/{inspection_id}",
    response_model=schemas.InspectionRecord,
)
def update_inspection(
    item_id: int,
    inspection_id: int,
    record_update: schemas.InspectionRecordUpdate,
    db: Session = Depends(get_db),
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    db_record = (
        db.query(models.InspectionRecord)
        .filter(
            models.InspectionRecord.id == inspection_id,
            models.InspectionRecord.item_id == item_id,
        )
        .first()
    )
    if not db_record:
        raise HTTPException(status_code=404, detail="盘点记录不存在")

    update_data = record_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_record, key, value)

    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete(
    "/items/{item_id}/inspections/{inspection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_inspection(
    item_id: int, inspection_id: int, db: Session = Depends(get_db)
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    db_record = (
        db.query(models.InspectionRecord)
        .filter(
            models.InspectionRecord.id == inspection_id,
            models.InspectionRecord.item_id == item_id,
        )
        .first()
    )
    if not db_record:
        raise HTTPException(status_code=404, detail="盘点记录不存在")

    db.delete(db_record)
    db.commit()
    return None
