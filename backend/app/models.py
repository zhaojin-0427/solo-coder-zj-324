from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from .database import Base


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
