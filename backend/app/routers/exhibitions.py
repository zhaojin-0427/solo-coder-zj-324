from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter()


def _get_plan_or_404(db: Session, plan_id: int) -> models.ExhibitionPlan:
    plan = db.query(models.ExhibitionPlan).filter(models.ExhibitionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="展陈方案不存在")
    return plan


def _sync_items(db: Session, plan: models.ExhibitionPlan, items_data: List[schemas.ExhibitionItemCreate]):
    existing_map = {ei.item_id: ei for ei in plan.items}
    seen_item_ids = set()
    for index, item_in in enumerate(items_data):
        item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_in.item_id).first()
        if not item:
            raise HTTPException(status_code=400, detail=f"旧物档案 {item_in.item_id} 不存在")
        if item_in.return_status not in models.EXHIBITION_RETURN_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"归位状态无效，可选值：{', '.join(models.EXHIBITION_RETURN_STATUSES)}",
            )
        seen_item_ids.add(item_in.item_id)
        if item_in.item_id in existing_map:
            ei = existing_map[item_in.item_id]
            ei.display_order = index
            ei.narrative_focus = item_in.narrative_focus
            ei.return_status = item_in.return_status
            ei.transport_risk = item_in.transport_risk
        else:
            plan.items.append(
                models.ExhibitionItem(
                    item_id=item_in.item_id,
                    display_order=index,
                    narrative_focus=item_in.narrative_focus,
                    return_status=item_in.return_status,
                    transport_risk=item_in.transport_risk,
                )
            )

    for item_id, ei in existing_map.items():
        if item_id not in seen_item_ids:
            db.delete(ei)


@router.get("/exhibitions", response_model=List[schemas.ExhibitionPlan])
def get_exhibitions(
    status_filter: Optional[str] = Query(None, alias="status", description="按展陈状态筛选"),
    location: Optional[str] = Query(None, description="按地点筛选（模糊匹配）"),
    theme: Optional[str] = Query(None, description="按主题筛选（模糊匹配）"),
    start_date: Optional[str] = Query(None, description="举办时间起始（YYYY-MM-DD）"),
    end_date: Optional[str] = Query(None, description="举办时间结束（YYYY-MM-DD）"),
    db: Session = Depends(get_db),
):
    query = db.query(models.ExhibitionPlan)
    if status_filter:
        query = query.filter(models.ExhibitionPlan.status == status_filter)
    if location:
        query = query.filter(models.ExhibitionPlan.location.ilike(f"%{location}%"))
    if theme:
        query = query.filter(models.ExhibitionPlan.theme.ilike(f"%{theme}%"))
    if start_date:
        query = query.filter(models.ExhibitionPlan.event_time >= start_date)
    if end_date:
        query = query.filter(models.ExhibitionPlan.event_time <= end_date)

    return query.order_by(desc(models.ExhibitionPlan.event_time), desc(models.ExhibitionPlan.created_at)).all()


@router.get("/exhibitions/{plan_id}", response_model=schemas.ExhibitionPlan)
def get_exhibition(plan_id: int, db: Session = Depends(get_db)):
    return _get_plan_or_404(db, plan_id)


@router.post("/exhibitions", response_model=schemas.ExhibitionPlan, status_code=status.HTTP_201_CREATED)
def create_exhibition(plan: schemas.ExhibitionPlanCreate, db: Session = Depends(get_db)):
    if plan.status not in models.EXHIBITION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"展陈状态无效，可选值：{', '.join(models.EXHIBITION_STATUSES)}",
        )

    db_plan = models.ExhibitionPlan(
        theme=plan.theme,
        event_time=plan.event_time,
        location=plan.location,
        planner=plan.planner,
        required_materials=plan.required_materials,
        transport_notes=plan.transport_notes,
        status=plan.status,
    )
    db.add(db_plan)
    db.flush()
    _sync_items(db, db_plan, plan.items)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.put("/exhibitions/{plan_id}", response_model=schemas.ExhibitionPlan)
def update_exhibition(plan_id: int, plan_update: schemas.ExhibitionPlanUpdate, db: Session = Depends(get_db)):
    db_plan = _get_plan_or_404(db, plan_id)
    update_data = plan_update.model_dump(exclude_unset=True)

    items_data = update_data.pop("items", None)

    if "status" in update_data and update_data["status"] not in models.EXHIBITION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"展陈状态无效，可选值：{', '.join(models.EXHIBITION_STATUSES)}",
        )

    for key, value in update_data.items():
        setattr(db_plan, key, value)

    if items_data is not None:
        _sync_items(db, db_plan, [schemas.ExhibitionItemCreate(**i) for i in items_data])

    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.delete("/exhibitions/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exhibition(plan_id: int, db: Session = Depends(get_db)):
    db_plan = _get_plan_or_404(db, plan_id)
    db.delete(db_plan)
    db.commit()
    return None


@router.put("/exhibitions/{plan_id}/items/reorder", response_model=schemas.ExhibitionPlan)
def reorder_exhibition_items(
    plan_id: int,
    reorder_request: schemas.ExhibitionReorderRequest,
    db: Session = Depends(get_db),
):
    db_plan = _get_plan_or_404(db, plan_id)

    ordered_ids = reorder_request.ordered_item_ids
    item_map = {ei.item_id: ei for ei in db_plan.items}

    missing_ids = [i for i in ordered_ids if i not in item_map]
    if missing_ids:
        raise HTTPException(status_code=400, detail=f"以下旧物不在该展陈方案中：{', '.join(map(str, missing_ids))}")

    for index, item_id in enumerate(ordered_ids):
        item_map[item_id].display_order = index

    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.put("/exhibitions/{plan_id}/items/{item_id}", response_model=schemas.ExhibitionItem)
def update_exhibition_item(
    plan_id: int,
    item_id: int,
    item_update: schemas.ExhibitionItemUpdate,
    db: Session = Depends(get_db),
):
    db_plan = _get_plan_or_404(db, plan_id)
    ei = (
        db.query(models.ExhibitionItem)
        .filter(
            models.ExhibitionItem.exhibition_id == plan_id,
            models.ExhibitionItem.item_id == item_id,
        )
        .first()
    )
    if not ei:
        raise HTTPException(status_code=404, detail="该旧物未参与此展陈方案")

    update_data = item_update.model_dump(exclude_unset=True)
    if "return_status" in update_data and update_data["return_status"] not in models.EXHIBITION_RETURN_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"归位状态无效，可选值：{', '.join(models.EXHIBITION_RETURN_STATUSES)}",
        )

    if "return_status" in update_data and update_data["return_status"] == models.EXHIBITION_RETURN_RETURNED:
        remaining_lent = (
            db.query(func.count(models.ExhibitionItem.id))
            .filter(
                models.ExhibitionItem.exhibition_id == plan_id,
                models.ExhibitionItem.return_status == models.EXHIBITION_RETURN_LENT,
            )
            .scalar()
        )
        if remaining_lent <= 1:
            db_plan.status = models.EXHIBITION_STATUS_RETURNED

    for key, value in update_data.items():
        setattr(ei, key, value)

    db.commit()
    db.refresh(ei)
    db.refresh(db_plan)
    return ei


@router.get("/items/{item_id}/exhibitions", response_model=List[schemas.ExhibitionPlan])
def get_item_exhibitions(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="旧物档案不存在")

    plan_ids = (
        db.query(models.ExhibitionItem.exhibition_id)
        .filter(models.ExhibitionItem.item_id == item_id)
        .distinct()
        .all()
    )
    plan_id_list = [pid for (pid,) in plan_ids]
    if not plan_id_list:
        return []

    plans = (
        db.query(models.ExhibitionPlan)
        .filter(models.ExhibitionPlan.id.in_(plan_id_list))
        .order_by(desc(models.ExhibitionPlan.event_time), desc(models.ExhibitionPlan.created_at))
        .all()
    )
    return plans
