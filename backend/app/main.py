from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models
from .routers import items, story_cards, inheritance, discussions, statistics, attachments
from .models import FamilyMember, HeirloomItem, StoryCard, RepairRecord, StorageLocation, InheritanceIntention, Discussion, ItemAttachment

Base.metadata.create_all(bind=engine)

app = FastAPI(title="家族旧物档案 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router, prefix="/api", tags=["items"])
app.include_router(story_cards.router, prefix="/api", tags=["story_cards"])
app.include_router(inheritance.router, prefix="/api", tags=["inheritance"])
app.include_router(discussions.router, prefix="/api", tags=["discussions"])
app.include_router(statistics.router, prefix="/api", tags=["statistics"])
app.include_router(attachments.router, prefix="/api", tags=["attachments"])


def init_seed_data():
    db = SessionLocal()
    try:
        if db.query(FamilyMember).count() > 0:
            return

        members = [
            FamilyMember(name="爷爷", relation="祖父", avatar="👴", birth_year=1935),
            FamilyMember(name="奶奶", relation="祖母", avatar="👵", birth_year=1938),
            FamilyMember(name="爸爸", relation="父亲", avatar="👨", birth_year=1965),
            FamilyMember(name="妈妈", relation="母亲", avatar="👩", birth_year=1967),
            FamilyMember(name="小明", relation="儿子", avatar="👦", birth_year=1995),
            FamilyMember(name="小红", relation="女儿", avatar="👧", birth_year=1998),
        ]
        db.add_all(members)
        db.flush()

        items_list = [
            HeirloomItem(
                name="老式怀表",
                category="饰品",
                era="民国时期",
                usage_scene="日常佩戴",
                condition="良好",
                description="爷爷年轻时随身携带的怀表，走时准确。",
                cover_image="⌚",
                related_people=[members[0], members[2]]
            ),
            HeirloomItem(
                name="青花瓷瓶",
                category="瓷器",
                era="清代",
                usage_scene="书房陈设",
                condition="有轻微划痕",
                description="奶奶的陪嫁品，传了好几代。",
                cover_image="🏺",
                related_people=[members[1], members[3]]
            ),
            HeirloomItem(
                name="老照片集",
                category="文献",
                era="20世纪中期",
                usage_scene="家庭纪念",
                condition="纸张泛黄",
                description="记录了家族几十年的珍贵瞬间。",
                cover_image="📷",
                related_people=members[:4]
            ),
            HeirloomItem(
                name="红木椅子",
                category="家具",
                era="民国",
                usage_scene="客厅使用",
                condition="需保养",
                description="爷爷亲手打造的红木椅子。",
                cover_image="🪑",
                related_people=[members[0], members[2]]
            ),
            HeirloomItem(
                name="银质首饰盒",
                category="饰品",
                era="清末",
                usage_scene="收纳首饰",
                condition="完好",
                description="奶奶的母亲留下的首饰盒。",
                cover_image="💍",
                related_people=[members[1], members[5]]
            ),
        ]
        db.add_all(items_list)
        db.flush()

        story_cards_list = [
            StoryCard(
                item_id=items_list[0].id,
                oral_history="这块怀表是爷爷20岁生日时，他的父亲送给他的礼物。",
                special_memory="记得小时候，爷爷总喜欢把怀表放在我耳边，听它滴答滴答的声音。",
                intended_recipient="小明",
                narrator="爷爷",
                recorded_by="爸爸"
            ),
            StoryCard(
                item_id=items_list[1].id,
                oral_history="这个瓷瓶是奶奶出嫁时的陪嫁，据说是奶奶的奶奶传下来的。",
                special_memory="每年春节，奶奶都会把它拿出来擦拭，说里面藏着家族的福气。",
                intended_recipient="小红",
                narrator="奶奶",
                recorded_by="妈妈"
            ),
        ]
        db.add_all(story_cards_list)

        repair_records_list = [
            RepairRecord(
                item_id=items_list[0].id,
                date="2020-05-15",
                description="清洗机芯，更换表蒙",
                repaired_by="老字号钟表店",
                cost="300元",
                notes="保养后走时精准"
            ),
            RepairRecord(
                item_id=items_list[3].id,
                date="2019-08-20",
                description="松动部位加固，重新上漆",
                repaired_by="传统木匠王师傅",
                cost="800元",
                notes="保留原有包浆"
            ),
        ]
        db.add_all(repair_records_list)

        storage_locations_list = [
            StorageLocation(
                item_id=items_list[0].id,
                location="主卧保险柜",
                details="放在绒布盒中，避免受潮"
            ),
            StorageLocation(
                item_id=items_list[1].id,
                location="客厅博古架",
                details="中间层，避免阳光直射"
            ),
            StorageLocation(
                item_id=items_list[2].id,
                location="书房书架顶层",
                details="防潮箱存放"
            ),
        ]
        db.add_all(storage_locations_list)

        intentions_list = [
            InheritanceIntention(
                item_id=items_list[0].id,
                version=1,
                proposed_by="爷爷",
                proposed_recipient="小明",
                reason="小明是长孙，这块表应该传给他",
                is_final=False
            ),
            InheritanceIntention(
                item_id=items_list[0].id,
                version=2,
                proposed_by="爸爸",
                proposed_recipient="小明",
                reason="同意父亲的意见，小明对钟表也很感兴趣",
                is_final=True
            ),
            InheritanceIntention(
                item_id=items_list[1].id,
                version=1,
                proposed_by="奶奶",
                proposed_recipient="小红",
                reason="小红是孙女，女孩子喜欢这些",
                is_final=True
            ),
        ]
        db.add_all(intentions_list)

        discussions_list = [
            Discussion(
                item_id=items_list[0].id,
                author="爸爸",
                content="我觉得这块怀表应该传给小明，他是长孙。"
            ),
            Discussion(
                item_id=items_list[0].id,
                author="妈妈",
                content="我也同意，小明平时就很喜欢这些老物件。",
                reply_to_id=1
            ),
            Discussion(
                item_id=items_list[1].id,
                author="小红",
                content="这个瓷瓶好漂亮啊！奶奶真的要传给我吗？"
            ),
        ]
        db.add_all(discussions_list)

        db.commit()
    finally:
        db.close()


def init_attachment_seed_data():
    db = SessionLocal()
    try:
        if db.query(ItemAttachment).count() > 0:
            return

        items_list = db.query(HeirloomItem).order_by(HeirloomItem.id).all()
        if not items_list:
            return

        attachments_list = []
        if len(items_list) > 0:
            item = items_list[0]
            attachments_list.extend([
                ItemAttachment(item_id=item.id, attachment_type="实物照片",
                               title="怀表正面特写",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=antique%20pocket%20watch%20close%20up%20brass%20vintage&image_size=square",
                               capture_time="2021-06-10", uploader="爸爸", remark="清晨自然光下拍摄",
                               is_public=True),
                ItemAttachment(item_id=item.id, attachment_type="修补前后对比图",
                               title="机芯保养前后对比",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pocket%20watch%20mechanism%20repair%20before%20after&image_size=landscape_16_9",
                               capture_time="2020-05-15", uploader="爸爸", remark="老字号钟表店保养记录",
                               is_public=True),
                ItemAttachment(item_id=item.id, attachment_type="票据凭证",
                               title="钟表保养收据",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handwritten%20chinese%20receipt%20paper%20vintage&image_size=square",
                               capture_time="2020-05-15", uploader="爸爸", remark="保养费用 300 元凭证",
                               is_public=False),
                ItemAttachment(item_id=item.id, attachment_type="音频口述链接",
                               title="爷爷讲述怀表来历",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20cassette%20tape%20recorder%20oral%20history&image_size=square",
                               capture_time="2022-03-08", uploader="小明", remark="录音时长 8 分钟",
                               is_public=True),
            ])

        if len(items_list) > 1:
            item = items_list[1]
            attachments_list.extend([
                ItemAttachment(item_id=item.id, attachment_type="实物照片",
                               title="青花瓷瓶全景",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20and%20white%20porcelain%20vase%20qing%20dynasty&image_size=portrait_4_3",
                               capture_time="2021-09-20", uploader="妈妈", remark="客厅博古架陈列照",
                               is_public=True),
                ItemAttachment(item_id=item.id, attachment_type="扫描文档链接",
                               title="陪嫁礼单扫描件",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=old%20chinese%20wedding%20gift%20list%20document%20scan&image_size=portrait_4_3",
                               capture_time="1958-01-01", uploader="奶奶", remark="记录瓷瓶传承来源",
                               is_public=True),
            ])

        if len(items_list) > 3:
            item = items_list[3]
            attachments_list.extend([
                ItemAttachment(item_id=item.id, attachment_type="修补前后对比图",
                               title="红木椅加固修复对比",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rosewood%20chair%20restoration%20before%20after&image_size=landscape_16_9",
                               capture_time="2019-08-20", uploader="爷爷", remark="王师傅加固松动部位",
                               is_public=True),
                ItemAttachment(item_id=item.id, attachment_type="票据凭证",
                               title="木工修缮工费单",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handwritten%20woodwork%20receipt%20chinese%20vintage&image_size=square",
                               capture_time="2019-08-20", uploader="爷爷", remark="工费 800 元",
                               is_public=False),
            ])

        if len(items_list) > 2:
            item = items_list[2]
            attachments_list.extend([
                ItemAttachment(item_id=item.id, attachment_type="实物照片",
                               title="老照片集翻拍",
                               url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=old%20family%20photo%20album%20black%20white%20vintage&image_size=square",
                               capture_time="2020-12-05", uploader="小红", remark="部分老照片数字化",
                               is_public=True),
            ])

        if attachments_list:
            db.add_all(attachments_list)
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    init_seed_data()
    init_attachment_seed_data()


@app.get("/")
def read_root():
    return {"message": "家族旧物档案 API 服务已启动", "version": "1.0.0"}


@app.get("/api/family-members")
def get_family_members():
    from .database import get_db
    db = next(get_db())
    members = db.query(FamilyMember).all()
    return members
