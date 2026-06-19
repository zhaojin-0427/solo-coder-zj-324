from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class FamilyMemberBase(BaseModel):
    name: str
    relation: str
    avatar: Optional[str] = None
    birth_year: Optional[int] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(FamilyMemberBase):
    pass


class FamilyMember(FamilyMemberBase):
    id: int

    class Config:
        from_attributes = True


class StoryCardBase(BaseModel):
    oral_history: Optional[str] = None
    special_memory: Optional[str] = None
    intended_recipient: Optional[str] = None
    narrator: Optional[str] = None
    recorded_by: Optional[str] = None


class StoryCardCreate(StoryCardBase):
    pass


class StoryCardUpdate(StoryCardBase):
    pass


class StoryCard(StoryCardBase):
    id: int
    item_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RepairRecordBase(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    repaired_by: Optional[str] = None
    cost: Optional[str] = None
    notes: Optional[str] = None


class RepairRecordCreate(RepairRecordBase):
    pass


class RepairRecordUpdate(RepairRecordBase):
    pass


class RepairRecord(RepairRecordBase):
    id: int
    item_id: int

    class Config:
        from_attributes = True


class StorageLocationBase(BaseModel):
    location: Optional[str] = None
    details: Optional[str] = None


class StorageLocationCreate(StorageLocationBase):
    pass


class StorageLocationUpdate(StorageLocationBase):
    pass


class StorageLocation(StorageLocationBase):
    id: int
    item_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class InheritanceIntentionBase(BaseModel):
    version: int = 1
    proposed_by: Optional[str] = None
    proposed_recipient: Optional[str] = None
    reason: Optional[str] = None
    is_final: bool = False


class InheritanceIntentionCreate(InheritanceIntentionBase):
    pass


class InheritanceIntentionUpdate(BaseModel):
    proposed_by: Optional[str] = None
    proposed_recipient: Optional[str] = None
    reason: Optional[str] = None
    is_final: Optional[bool] = None


class InheritanceIntention(InheritanceIntentionBase):
    id: int
    item_id: int
    created_at: datetime
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DiscussionBase(BaseModel):
    author: str
    content: str
    reply_to_id: Optional[int] = None


class DiscussionCreate(DiscussionBase):
    pass


class Discussion(DiscussionBase):
    id: int
    item_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ItemAttachmentBase(BaseModel):
    attachment_type: str
    title: str
    url: str
    capture_time: Optional[str] = None
    uploader: Optional[str] = None
    remark: Optional[str] = None
    is_public: bool = True


class ItemAttachmentCreate(ItemAttachmentBase):
    pass


class ItemAttachmentUpdate(BaseModel):
    attachment_type: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    capture_time: Optional[str] = None
    uploader: Optional[str] = None
    remark: Optional[str] = None
    is_public: Optional[bool] = None


class ItemAttachment(ItemAttachmentBase):
    id: int
    item_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StoryCardEvidenceRequest(BaseModel):
    attachment_ids: List[int] = []


class HeirloomItemBase(BaseModel):
    name: str
    category: str
    era: Optional[str] = None
    usage_scene: Optional[str] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None


class HeirloomItemCreate(HeirloomItemBase):
    related_people_ids: Optional[List[int]] = []


class HeirloomItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    era: Optional[str] = None
    usage_scene: Optional[str] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    related_people_ids: Optional[List[int]] = None


class InspectionRecordBase(BaseModel):
    inspection_date: str
    inspector: str
    is_present: bool = True
    condition_change: Optional[str] = None
    environmental_risks: Optional[str] = None
    handling_suggestions: Optional[str] = None
    next_review_date: Optional[str] = None
    notes: Optional[str] = None


class InspectionRecordCreate(InspectionRecordBase):
    pass


class InspectionRecordUpdate(BaseModel):
    inspection_date: Optional[str] = None
    inspector: Optional[str] = None
    is_present: Optional[bool] = None
    condition_change: Optional[str] = None
    environmental_risks: Optional[str] = None
    handling_suggestions: Optional[str] = None
    next_review_date: Optional[str] = None
    notes: Optional[str] = None


class InspectionRecord(InspectionRecordBase):
    id: int
    item_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HeirloomItem(HeirloomItemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    related_people: List[FamilyMember] = []
    story_card: Optional[StoryCard] = None
    repair_records: List[RepairRecord] = []
    storage_location: Optional[StorageLocation] = None
    intentions: List[InheritanceIntention] = []
    discussions: List[Discussion] = []
    attachments: List[ItemAttachment] = []
    inspection_records: List[InspectionRecord] = []

    class Config:
        from_attributes = True


class ExhibitionItemRef(BaseModel):
    id: int
    name: str
    category: str
    era: Optional[str] = None
    cover_image: Optional[str] = None
    condition: Optional[str] = None

    class Config:
        from_attributes = True


class ExhibitionItemBase(BaseModel):
    item_id: int
    narrative_focus: Optional[str] = None
    return_status: str = "借出中"
    transport_risk: bool = False


class ExhibitionItemCreate(ExhibitionItemBase):
    pass


class ExhibitionItem(ExhibitionItemBase):
    id: int
    exhibition_id: int
    display_order: int
    item: Optional[ExhibitionItemRef] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExhibitionPlanBase(BaseModel):
    theme: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    planner: Optional[str] = None
    required_materials: Optional[str] = None
    transport_notes: Optional[str] = None
    status: str = "待开始"


class ExhibitionPlanCreate(ExhibitionPlanBase):
    items: List[ExhibitionItemCreate] = []


class ExhibitionPlanUpdate(BaseModel):
    theme: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    planner: Optional[str] = None
    required_materials: Optional[str] = None
    transport_notes: Optional[str] = None
    status: Optional[str] = None
    items: Optional[List[ExhibitionItemCreate]] = None


class ExhibitionPlan(ExhibitionPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    items: List[ExhibitionItem] = []

    class Config:
        from_attributes = True


class ExhibitionReorderRequest(BaseModel):
    ordered_item_ids: List[int] = []


class ExhibitionItemUpdate(BaseModel):
    narrative_focus: Optional[str] = None
    return_status: Optional[str] = None
    transport_risk: Optional[bool] = None


class CategoryDistributionItem(BaseModel):
    category: str
    count: int
    percentage: float

class TopRelatedFamilyMember(BaseModel):
    id: int
    name: str
    relation: str
    count: int


class PendingRecipientDistributionItem(BaseModel):
    recipient: str
    count: int


class ActiveDiscussionItem(BaseModel):
    id: int
    name: str
    discussion_count: int
    last_discussion_at: Optional[datetime] = None


class AttachmentTypeDistributionItem(BaseModel):
    attachment_type: str
    count: int
    percentage: float


class TopAttachmentContributor(BaseModel):
    uploader: str
    count: int


class InspectionRiskTypeItem(BaseModel):
    risk_type: str
    count: int
    percentage: float


class HighRiskItem(BaseModel):
    id: int
    name: str
    risk_count: int
    latest_risk_types: List[str] = []
    next_review_date: Optional[str] = None
    is_overdue: bool = False


class TopExhibitionItem(BaseModel):
    id: int
    name: str
    cover_image: Optional[str] = None
    count: int


class ExhibitionStatusDistributionItem(BaseModel):
    status: str
    count: int
    percentage: float


class StatisticsResponse(BaseModel):
    confirmed_inheritance_count: int
    category_distribution: List[CategoryDistributionItem]
    top_related_family_members: List[TopRelatedFamilyMember]
    pending_intentions_count: int
    total_items: int
    pending_recipient_distribution: List[PendingRecipientDistributionItem]
    no_discussion_count: int
    negotiated_count: int
    active_discussion_items: List[ActiveDiscussionItem]
    total_attachments: int = 0
    attachment_type_distribution: List[AttachmentTypeDistributionItem] = []
    items_without_image_attachments_count: int = 0
    top_attachment_contributors: List[TopAttachmentContributor] = []
    pending_review_count: int = 0
    at_risk_count: int = 0
    deteriorated_count: int = 0
    normal_status_count: int = 0
    overdue_review_count: int = 0
    recent_30days_inspection_count: int = 0
    inspection_risk_type_distribution: List[InspectionRiskTypeItem] = []
    high_risk_items: List[HighRiskItem] = []
    total_exhibitions: int = 0
    pending_return_item_count: int = 0
    top_exhibition_items: List[TopExhibitionItem] = []
    exhibition_status_distribution: List[ExhibitionStatusDistributionItem] = []
    recent_90days_exhibition_count: int = 0
