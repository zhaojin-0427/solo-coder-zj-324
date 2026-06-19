from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/items/{item_id}/attachments", response_model=List[schemas.ItemAttachment])
def get_attachments(
    item_id: int,
    attachment_type: Optional[str] = Query(None, description="按资料类型筛选"),
    is_public: Optional[bool] = Query(None, description="按是否公开筛选"),
    db: Session = Depends(get_db)
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    query = db.query(models.ItemAttachment).filter(models.ItemAttachment.item_id == item_id)
    if attachment_type:
        query = query.filter(models.ItemAttachment.attachment_type == attachment_type)
    if is_public is not None:
        query = query.filter(models.ItemAttachment.is_public == is_public)

    return query.order_by(models.ItemAttachment.created_at.desc()).all()


@router.get("/items/{item_id}/attachments/{attachment_id}", response_model=schemas.ItemAttachment)
def get_attachment(item_id: int, attachment_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    attachment = db.query(models.ItemAttachment).filter(
        models.ItemAttachment.id == attachment_id,
        models.ItemAttachment.item_id == item_id
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="资料附件不存在")
    return attachment


@router.post("/items/{item_id}/attachments", response_model=schemas.ItemAttachment, status_code=status.HTTP_201_CREATED)
def create_attachment(item_id: int, attachment: schemas.ItemAttachmentCreate, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    if attachment.attachment_type not in models.ATTACHMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"资料类型无效，可选值：{', '.join(models.ATTACHMENT_TYPES)}")

    db_attachment = models.ItemAttachment(
        item_id=item_id,
        attachment_type=attachment.attachment_type,
        title=attachment.title,
        url=attachment.url,
        capture_time=attachment.capture_time,
        uploader=attachment.uploader,
        remark=attachment.remark,
        is_public=attachment.is_public
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@router.put("/items/{item_id}/attachments/{attachment_id}", response_model=schemas.ItemAttachment)
def update_attachment(
    item_id: int,
    attachment_id: int,
    attachment_update: schemas.ItemAttachmentUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    attachment = db.query(models.ItemAttachment).filter(
        models.ItemAttachment.id == attachment_id,
        models.ItemAttachment.item_id == item_id
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="资料附件不存在")

    update_data = attachment_update.model_dump(exclude_unset=True)

    if "attachment_type" in update_data and update_data["attachment_type"] not in models.ATTACHMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"资料类型无效，可选值：{', '.join(models.ATTACHMENT_TYPES)}")

    for key, value in update_data.items():
        setattr(attachment, key, value)

    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete("/items/{item_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(item_id: int, attachment_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    attachment = db.query(models.ItemAttachment).filter(
        models.ItemAttachment.id == attachment_id,
        models.ItemAttachment.item_id == item_id
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="资料附件不存在")

    db.delete(attachment)
    db.commit()
    return None
