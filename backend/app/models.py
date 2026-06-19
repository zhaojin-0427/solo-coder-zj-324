from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from .database import Base


ATTACHMENT_TYPE_PHOTO = "实物照片"
ATTACHMENT_TYPE_REPAIR_COMPARE = "修补前后对比图"
ATTACHMENT_TYPE_RECEIPT = "票据凭证"
ATTACHMENT_TYPE_AUDIO = "音频口述链接"
ATTACHMENT_TYPE_SCAN = "扫描文档链接"

ATTACHMENT_TYPES = [
    ATTACHMENT_TYPE_PHOTO,
    ATTACHMENT_TYPE_REPAIR_COMPARE,
    ATTACHMENT_TYPE_RECEIPT,
    ATTACHMENT_TYPE_AUDIO,
    ATTACHMENT_TYPE_SCAN,
]

IMAGE_ATTACHMENT_TYPES = [ATTACHMENT_TYPE_PHOTO, ATTACHMENT_TYPE_REPAIR_COMPARE]


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    relation = Column(String, nullable=False)
    avatar = Column(String)
    birth_year = Column(Integer)

    items = relationship("HeirloomItem", secondary="item_family_member", back_populates="related_people")


class ItemFamilyMember(Base):
    __tablename__ = "item_family_member"

    item_id = Column(Integer, ForeignKey("heirloom_items.id"), primary_key=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), primary_key=True)


class HeirloomItem(Base):
    __tablename__ = "heirloom_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    era = Column(String)
    usage_scene = Column(String)
    condition = Column(String)
    description = Column(Text)
    cover_image = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    related_people = relationship("FamilyMember", secondary="item_family_member", back_populates="items")
    story_card = relationship("StoryCard", back_populates="item", uselist=False, cascade="all, delete-orphan")
    repair_records = relationship("RepairRecord", back_populates="item", cascade="all, delete-orphan")
    storage_location = relationship("StorageLocation", back_populates="item", uselist=False, cascade="all, delete-orphan")
    intentions = relationship("InheritanceIntention", back_populates="item", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="item", cascade="all, delete-orphan")
    attachments = relationship("ItemAttachment", back_populates="item", cascade="all, delete-orphan")
    inspection_records = relationship("InspectionRecord", back_populates="item", cascade="all, delete-orphan")
    exhibition_items = relationship("ExhibitionItem", back_populates="item", cascade="all, delete-orphan")


class StoryCard(Base):
    __tablename__ = "story_cards"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False, unique=True)
    oral_history = Column(Text)
    special_memory = Column(Text)
    intended_recipient = Column(String)
    narrator = Column(String)
    recorded_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    item = relationship("HeirloomItem", back_populates="story_card")
    story_evidence = relationship("ItemAttachment", secondary="story_card_attachments")


class RepairRecord(Base):
    __tablename__ = "repair_records"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    date = Column(String)
    description = Column(Text)
    repaired_by = Column(String)
    cost = Column(String)
    notes = Column(Text)

    item = relationship("HeirloomItem", back_populates="repair_records")


class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False, unique=True)
    location = Column(String)
    details = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    item = relationship("HeirloomItem", back_populates="storage_location")


class InheritanceIntention(Base):
    __tablename__ = "inheritance_intentions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    version = Column(Integer, default=1)
    proposed_by = Column(String)
    proposed_recipient = Column(String)
    reason = Column(Text)
    is_final = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True))

    item = relationship("HeirloomItem", back_populates="intentions")


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    author = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reply_to_id = Column(Integer, ForeignKey("discussions.id"), nullable=True)

    item = relationship("HeirloomItem", back_populates="discussions")
    reply_to = relationship("Discussion", remote_side=[id], backref=backref("replies", lazy="dynamic"))


class ItemAttachment(Base):
    __tablename__ = "item_attachments"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    attachment_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    capture_time = Column(String)
    uploader = Column(String)
    remark = Column(Text)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    item = relationship("HeirloomItem", back_populates="attachments")


class StoryCardAttachment(Base):
    __tablename__ = "story_card_attachments"

    story_card_id = Column(Integer, ForeignKey("story_cards.id"), primary_key=True)
    attachment_id = Column(Integer, ForeignKey("item_attachments.id"), primary_key=True)


INSPECTION_RISK_HUMIDITY = "潮湿"
INSPECTION_RISK_MOTH = "虫蛀"
INSPECTION_RISK_SUNLIGHT = "阳光直射"
INSPECTION_RISK_DAMAGE_SPREAD = "破损扩大"
INSPECTION_RISK_MOLD = "发霉"
INSPECTION_RISK_TEMPERATURE = "温度过高"
INSPECTION_RISK_OTHER = "其他"

INSPECTION_RISK_TYPES = [
    INSPECTION_RISK_HUMIDITY,
    INSPECTION_RISK_MOTH,
    INSPECTION_RISK_SUNLIGHT,
    INSPECTION_RISK_DAMAGE_SPREAD,
    INSPECTION_RISK_MOLD,
    INSPECTION_RISK_TEMPERATURE,
    INSPECTION_RISK_OTHER,
]

INSPECTION_STATUS_NORMAL = "正常"
INSPECTION_STATUS_DETERIORATED = "状态变差"
INSPECTION_STATUS_RISK = "存在风险"
INSPECTION_STATUS_OVERDUE = "逾期未复查"
INSPECTION_STATUS_PENDING = "待复查"


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    inspection_date = Column(String, nullable=False)
    inspector = Column(String, nullable=False)
    is_present = Column(Boolean, default=True, nullable=False)
    condition_change = Column(String)
    environmental_risks = Column(String)
    handling_suggestions = Column(Text)
    next_review_date = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    item = relationship("HeirloomItem", back_populates="inspection_records")


EXHIBITION_STATUS_PLANNED = "待开始"
EXHIBITION_STATUS_ONGOING = "进行中"
EXHIBITION_STATUS_COMPLETED = "已结束"
EXHIBITION_STATUS_RETURNED = "已归位"

EXHIBITION_STATUSES = [
    EXHIBITION_STATUS_PLANNED,
    EXHIBITION_STATUS_ONGOING,
    EXHIBITION_STATUS_COMPLETED,
    EXHIBITION_STATUS_RETURNED,
]

EXHIBITION_RETURN_LENT = "借出中"
EXHIBITION_RETURN_RETURNED = "已归位"

EXHIBITION_RETURN_STATUSES = [
    EXHIBITION_RETURN_LENT,
    EXHIBITION_RETURN_RETURNED,
]


class ExhibitionPlan(Base):
    __tablename__ = "exhibition_plans"

    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String, nullable=False)
    event_time = Column(String)
    location = Column(String)
    planner = Column(String)
    required_materials = Column(Text)
    transport_notes = Column(Text)
    status = Column(String, default=EXHIBITION_STATUS_PLANNED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("ExhibitionItem", back_populates="exhibition", cascade="all, delete-orphan", order_by="ExhibitionItem.display_order")


class ExhibitionItem(Base):
    __tablename__ = "exhibition_items"

    id = Column(Integer, primary_key=True, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibition_plans.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("heirloom_items.id"), nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    narrative_focus = Column(Text)
    return_status = Column(String, default=EXHIBITION_RETURN_LENT, nullable=False)
    transport_risk = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    exhibition = relationship("ExhibitionPlan", back_populates="items")
    item = relationship("HeirloomItem", back_populates="exhibition_items")
