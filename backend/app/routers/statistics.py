from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, List, Set, Tuple, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/statistics", response_model=schemas.StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    total_items = db.query(models.HeirloomItem).count()

    confirmed_count = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.is_final == True
    ).count()

    category_query = db.query(
        models.HeirloomItem.category,
        func.count(models.HeirloomItem.id).label('count')
    ).group_by(models.HeirloomItem.category).all()

    category_distribution = []
    for category, count in category_query:
        percentage = round((count / total_items * 100), 1) if total_items > 0 else 0
        category_distribution.append(schemas.CategoryDistributionItem(
            category=category,
            count=count,
            percentage=percentage
        ))

    member_count_query = db.query(
        models.FamilyMember.id,
        models.FamilyMember.name,
        models.FamilyMember.relation,
        func.count(models.ItemFamilyMember.item_id).label('item_count')
    ).join(
        models.ItemFamilyMember,
        models.FamilyMember.id == models.ItemFamilyMember.family_member_id
    ).group_by(
        models.FamilyMember.id
    ).order_by(desc('item_count')).limit(5).all()

    top_members = []
    for member_id, name, relation, item_count in member_count_query:
        top_members.append(schemas.TopRelatedFamilyMember(
            id=member_id,
            name=name,
            relation=relation,
            count=item_count
        ))

    finalized_item_ids = db.query(
        models.InheritanceIntention.item_id
    ).filter(
        models.InheritanceIntention.is_final == True
    ).distinct().subquery()

    pending_intentions = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.is_final == False,
        models.InheritanceIntention.item_id.notin_(finalized_item_ids)
    ).count()

    pending_recipient_query = db.query(
        models.InheritanceIntention.proposed_recipient,
        func.count(models.InheritanceIntention.id).label('count')
    ).filter(
        models.InheritanceIntention.is_final == False,
        models.InheritanceIntention.proposed_recipient.isnot(None),
        models.InheritanceIntention.item_id.notin_(finalized_item_ids)
    ).group_by(
        models.InheritanceIntention.proposed_recipient
    ).order_by(desc('count')).all()

    pending_recipient_distribution = []
    for recipient, count in pending_recipient_query:
        if recipient:
            pending_recipient_distribution.append(schemas.PendingRecipientDistributionItem(
                recipient=recipient,
                count=count
            ))

    items_with_discussion_count = db.query(
        models.HeirloomItem.id,
        func.count(models.Discussion.id).label('discussion_count')
    ).outerjoin(
        models.Discussion,
        models.HeirloomItem.id == models.Discussion.item_id
    ).group_by(models.HeirloomItem.id).all()

    no_discussion_count = sum(1 for _, dc in items_with_discussion_count if dc == 0)

    negotiated_count = db.query(models.HeirloomItem).join(
        models.InheritanceIntention,
        models.HeirloomItem.id == models.InheritanceIntention.item_id
    ).filter(
        models.InheritanceIntention.is_final == True
    ).distinct().count()

    active_discussion_query = db.query(
        models.HeirloomItem.id,
        models.HeirloomItem.name,
        func.count(models.Discussion.id).label('discussion_count'),
        func.max(models.Discussion.created_at).label('last_discussion_at')
    ).outerjoin(
        models.Discussion,
        models.HeirloomItem.id == models.Discussion.item_id
    ).group_by(
        models.HeirloomItem.id,
        models.HeirloomItem.name
    ).having(
        func.count(models.Discussion.id) > 0
    ).order_by(desc('discussion_count')).limit(5).all()

    active_discussion_items = []
    for item_id, name, discussion_count, last_discussion_at in active_discussion_query:
        active_discussion_items.append(schemas.ActiveDiscussionItem(
            id=item_id,
            name=name,
            discussion_count=discussion_count,
            last_discussion_at=last_discussion_at
        ))

    total_attachments = db.query(models.ItemAttachment).count()

    type_query = db.query(
        models.ItemAttachment.attachment_type,
        func.count(models.ItemAttachment.id).label('count')
    ).group_by(models.ItemAttachment.attachment_type).all()

    attachment_type_distribution = []
    for attachment_type, count in type_query:
        percentage = round((count / total_attachments * 100), 1) if total_attachments > 0 else 0
        attachment_type_distribution.append(schemas.AttachmentTypeDistributionItem(
            attachment_type=attachment_type,
            count=count,
            percentage=percentage
        ))

    items_with_image_query = db.query(
        models.ItemAttachment.item_id
    ).filter(
        models.ItemAttachment.attachment_type.in_(models.IMAGE_ATTACHMENT_TYPES)
    ).distinct().subquery()

    items_without_image_attachments_count = db.query(models.HeirloomItem).filter(
        ~models.HeirloomItem.id.in_(items_with_image_query)
    ).count() if db.query(models.ItemAttachment).count() > 0 else total_items

    contributor_query = db.query(
        models.ItemAttachment.uploader,
        func.count(models.ItemAttachment.id).label('count')
    ).filter(
        models.ItemAttachment.uploader.isnot(None),
        models.ItemAttachment.uploader != ""
    ).group_by(
        models.ItemAttachment.uploader
    ).order_by(desc('count')).limit(5).all()

    top_attachment_contributors = []
    for uploader, count in contributor_query:
        top_attachment_contributors.append(schemas.TopAttachmentContributor(
            uploader=uploader,
            count=count
        ))

    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)

    all_items = db.query(models.HeirloomItem).all()

    item_status_map: Dict[int, Dict] = {}
    at_risk_item_ids: Set[int] = set()
    deteriorated_item_ids: Set[int] = set()
    normal_item_ids: Set[int] = set()
    pending_review_item_ids: Set[int] = set()
    overdue_review_item_ids: Set[int] = set()
    item_risk_counts: Dict[int, int] = {}
    item_latest_risks: Dict[int, List[str]] = {}
    item_next_review_dates: Dict[int, Optional[str]] = {}

    all_records = (
        db.query(models.InspectionRecord)
        .order_by(
            models.InspectionRecord.item_id,
            desc(models.InspectionRecord.inspection_date),
        )
        .all()
    )

    records_by_item: Dict[int, List[models.InspectionRecord]] = {}
    for rec in all_records:
        records_by_item.setdefault(rec.item_id, []).append(rec)

    recent_30days_inspection_count = 0
    risk_type_counter: Dict[str, int] = {}

    for item in all_items:
        records = records_by_item.get(item.id, [])
        if not records:
            continue

        latest = records[0]

        for rec in records:
            try:
                rec_date = datetime.strptime(rec.inspection_date, "%Y-%m-%d").date()
                if rec_date >= thirty_days_ago:
                    recent_30days_inspection_count += 1
            except (ValueError, TypeError):
                pass

            risks_str = rec.environmental_risks or ""
            for rt in models.INSPECTION_RISK_TYPES:
                if rt in risks_str:
                    risk_type_counter[rt] = risk_type_counter.get(rt, 0) + 1

        latest_risks_list = []
        latest_risks_str = latest.environmental_risks or ""
        for rt in models.INSPECTION_RISK_TYPES:
            if rt in latest_risks_str:
                latest_risks_list.append(rt)

        cond_change = (latest.condition_change or "").strip()
        has_risks = len(latest_risks_list) > 0
        is_deteriorated = cond_change and ("变差" in cond_change or "恶化" in cond_change or "损坏" in cond_change or "破损扩大" in cond_change)
        is_present = latest.is_present
        next_review_str = latest.next_review_date
        item_next_review_dates[item.id] = next_review_str
        is_overdue = False

        if next_review_str:
            try:
                next_review_date = datetime.strptime(next_review_str, "%Y-%m-%d").date()
                if next_review_date < today:
                    is_overdue = True
            except (ValueError, TypeError):
                pass

        item_latest_risks[item.id] = latest_risks_list

        if is_overdue:
            overdue_review_item_ids.add(item.id)
            pending_review_item_ids.add(item.id)
        elif next_review_str:
            pending_review_item_ids.add(item.id)

        total_risks_for_item = 0
        for rec in records:
            risks = rec.environmental_risks or ""
            for rt in models.INSPECTION_RISK_TYPES:
                if rt in risks:
                    total_risks_for_item += 1
        item_risk_counts[item.id] = total_risks_for_item

        if has_risks or not is_present:
            at_risk_item_ids.add(item.id)
        if is_deteriorated:
            deteriorated_item_ids.add(item.id)
        if not has_risks and not is_deteriorated and is_present and not is_overdue:
            normal_item_ids.add(item.id)

    at_risk_count = len(at_risk_item_ids)
    deteriorated_count = len(deteriorated_item_ids)
    normal_status_count = len(normal_item_ids)
    pending_review_count = len(pending_review_item_ids)
    overdue_review_count = len(overdue_review_item_ids)

    total_risks_all = sum(risk_type_counter.values())
    inspection_risk_type_distribution = []
    for risk_type in models.INSPECTION_RISK_TYPES:
        c = risk_type_counter.get(risk_type, 0)
        if c > 0:
            pct = round((c / total_risks_all * 100), 1) if total_risks_all > 0 else 0
            inspection_risk_type_distribution.append(schemas.InspectionRiskTypeItem(
                risk_type=risk_type,
                count=c,
                percentage=pct,
            ))

    high_risk_sorted = sorted(
        [(item_id, cnt) for item_id, cnt in item_risk_counts.items() if cnt > 0],
        key=lambda x: x[1],
        reverse=True,
    )[:5]

    high_risk_items = []
    for item_id, risk_cnt in high_risk_sorted:
        item_obj = db.query(models.HeirloomItem).filter(models.HeirloomItem.id == item_id).first()
        if item_obj:
            next_rd = item_next_review_dates.get(item_id)
            is_ov = False
            if next_rd:
                try:
                    nd = datetime.strptime(next_rd, "%Y-%m-%d").date()
                    is_ov = nd < today
                except (ValueError, TypeError):
                    pass
            high_risk_items.append(schemas.HighRiskItem(
                id=item_obj.id,
                name=item_obj.name,
                risk_count=risk_cnt,
                latest_risk_types=item_latest_risks.get(item_id, []),
                next_review_date=next_rd,
                is_overdue=is_ov,
            ))

    total_exhibitions = db.query(models.ExhibitionPlan).count()

    pending_return_item_count = (
        db.query(models.ExhibitionItem.item_id)
        .filter(models.ExhibitionItem.return_status == models.EXHIBITION_RETURN_LENT)
        .distinct()
        .count()
    )

    participation_query = (
        db.query(
            models.HeirloomItem.id,
            models.HeirloomItem.name,
            models.HeirloomItem.cover_image,
            func.count(models.ExhibitionItem.id).label('count'),
        )
        .join(
            models.ExhibitionItem,
            models.HeirloomItem.id == models.ExhibitionItem.item_id,
        )
        .group_by(
            models.HeirloomItem.id,
            models.HeirloomItem.name,
            models.HeirloomItem.cover_image,
        )
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_exhibition_items = []
    for item_id, name, cover_image, cnt in participation_query:
        top_exhibition_items.append(schemas.TopExhibitionItem(
            id=item_id,
            name=name,
            cover_image=cover_image,
            count=cnt,
        ))

    status_query = (
        db.query(
            models.ExhibitionPlan.status,
            func.count(models.ExhibitionPlan.id).label('count'),
        )
        .group_by(models.ExhibitionPlan.status)
        .all()
    )
    status_count_map = {st: c for st, c in status_query}
    exhibition_status_distribution = []
    for ex_status in models.EXHIBITION_STATUSES:
        c = status_count_map.get(ex_status, 0)
        pct = round((c / total_exhibitions * 100), 1) if total_exhibitions > 0 else 0
        if c > 0:
            exhibition_status_distribution.append(schemas.ExhibitionStatusDistributionItem(
                status=ex_status,
                count=c,
                percentage=pct,
            ))

    ninety_days_ago = today - timedelta(days=90)
    all_exhibitions = db.query(models.ExhibitionPlan).all()
    recent_90days_exhibition_count = 0
    for plan in all_exhibitions:
        ref_date_str = plan.event_time
        if not ref_date_str:
            continue
        try:
            ref_date = datetime.strptime(ref_date_str, "%Y-%m-%d").date()
            if ref_date >= ninety_days_ago:
                recent_90days_exhibition_count += 1
        except (ValueError, TypeError):
            pass

    return schemas.StatisticsResponse(
        confirmed_inheritance_count=confirmed_count,
        category_distribution=category_distribution,
        top_related_family_members=top_members,
        pending_intentions_count=pending_intentions,
        total_items=total_items,
        pending_recipient_distribution=pending_recipient_distribution,
        no_discussion_count=no_discussion_count,
        negotiated_count=negotiated_count,
        active_discussion_items=active_discussion_items,
        total_attachments=total_attachments,
        attachment_type_distribution=attachment_type_distribution,
        items_without_image_attachments_count=items_without_image_attachments_count,
        top_attachment_contributors=top_attachment_contributors,
        pending_review_count=pending_review_count,
        at_risk_count=at_risk_count,
        deteriorated_count=deteriorated_count,
        normal_status_count=normal_status_count,
        overdue_review_count=overdue_review_count,
        recent_30days_inspection_count=recent_30days_inspection_count,
        inspection_risk_type_distribution=inspection_risk_type_distribution,
        high_risk_items=high_risk_items,
        total_exhibitions=total_exhibitions,
        pending_return_item_count=pending_return_item_count,
        top_exhibition_items=top_exhibition_items,
        exhibition_status_distribution=exhibition_status_distribution,
        recent_90days_exhibition_count=recent_90days_exhibition_count,
    )
