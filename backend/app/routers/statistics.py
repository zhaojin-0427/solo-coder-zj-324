from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
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
        top_attachment_contributors=top_attachment_contributors
    )
