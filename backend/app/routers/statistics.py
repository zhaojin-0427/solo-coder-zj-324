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
    
    pending_intentions = db.query(models.InheritanceIntention).filter(
        models.InheritanceIntention.is_final == False
    ).count()
    
    return schemas.StatisticsResponse(
        confirmed_inheritance_count=confirmed_count,
        category_distribution=category_distribution,
        top_related_family_members=top_members,
        pending_intentions_count=pending_intentions,
        total_items=total_items
    )
