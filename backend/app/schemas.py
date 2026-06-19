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

    class Config:
        from_attributes = True


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
