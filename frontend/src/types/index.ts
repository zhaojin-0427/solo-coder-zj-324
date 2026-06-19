export interface FamilyMember {
  id: string | number;
  name: string;
  relation: string;
  avatar?: string;
  birth_year?: number;
}

export interface RepairRecord {
  id: string | number;
  item_id: string | number;
  date: string;
  description: string;
  repaired_by: string;
  cost?: number;
  notes?: string;
}

export interface StorageLocation {
  id: string | number;
  item_id: string | number;
  location: string;
  details?: string;
  updated_at?: string;
}

export interface StoryCard {
  id: string | number;
  item_id: string | number;
  oral_history: string;
  special_memory: string;
  intended_recipient?: string;
  narrator?: string;
  recorded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InheritanceIntention {
  id: string | number;
  item_id: string | number;
  version: number;
  proposed_by: string;
  proposed_recipient?: string;
  reason?: string;
  is_final: boolean;
  created_at?: string;
  confirmed_at?: string;
}

export interface Discussion {
  id: string | number;
  item_id: string | number;
  author: string;
  content: string;
  reply_to_id?: string | number;
  created_at?: string;
}

export const ATTACHMENT_TYPES = [
  '实物照片',
  '修补前后对比图',
  '票据凭证',
  '音频口述链接',
  '扫描文档链接',
] as const

export const IMAGE_ATTACHMENT_TYPES = ['实物照片', '修补前后对比图']

export const ATTACHMENT_TYPE_META: Record<string, { icon: string; color: string }> = {
  实物照片: { icon: '📷', color: '#8b6914' },
  修补前后对比图: { icon: '🔧', color: '#c25a3a' },
  票据凭证: { icon: '🧾', color: '#6b8cae' },
  音频口述链接: { icon: '🎙️', color: '#9b7bb8' },
  扫描文档链接: { icon: '📄', color: '#5a8f5a' },
}

export const INSPECTION_RISK_TYPES = [
  '潮湿',
  '虫蛀',
  '阳光直射',
  '破损扩大',
  '发霉',
  '温度过高',
  '其他',
] as const

export const INSPECTION_RISK_META: Record<string, { icon: string; color: string }> = {
  潮湿: { icon: '💧', color: '#6b8cae' },
  虫蛀: { icon: '🐛', color: '#8b6914' },
  阳光直射: { icon: '☀️', color: '#c8942e' },
  破损扩大: { icon: '⚠️', color: '#c25a3a' },
  发霉: { icon: '🍄', color: '#5a8f5a' },
  温度过高: { icon: '🔥', color: '#e07b3a' },
  其他: { icon: '❓', color: '#a08060' },
}

export const INSPECTION_STATUS_FILTERS = [
  '全部',
  '待复查',
  '存在风险',
  '状态变差',
  '正常',
] as const

export type InspectionStatusFilter = typeof INSPECTION_STATUS_FILTERS[number]

export interface InspectionRecord {
  id: string | number
  item_id: string | number
  inspection_date: string
  inspector: string
  is_present: boolean
  condition_change?: string
  environmental_risks?: string
  handling_suggestions?: string
  next_review_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ItemAttachment {
  id: string | number;
  item_id: string | number;
  attachment_type: string;
  title: string;
  url: string;
  capture_time?: string;
  uploader?: string;
  remark?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HeirloomItem {
  id: string | number;
  name: string;
  category: string;
  era: string;
  usage_scene?: string;
  condition: string;
  description: string;
  cover_image?: string;
  created_at?: string;
  updated_at?: string;
  related_people: FamilyMember[];
  story_card?: StoryCard;
  repair_records: RepairRecord[];
  storage_location?: StorageLocation;
  intentions: InheritanceIntention[];
  discussions: Discussion[];
  attachments: ItemAttachment[];
  inspection_records: InspectionRecord[];
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  percentage?: number;
}

export interface TopRelatedFamilyMember {
  id: string | number;
  name: string;
  relation: string;
  count: number;
}

export interface PendingRecipientDistributionItem {
  recipient: string;
  count: number;
}

export interface ActiveDiscussionItem {
  id: string | number;
  name: string;
  discussion_count: number;
  last_discussion_at?: string;
}

export interface AttachmentTypeDistributionItem {
  attachment_type: string;
  count: number;
  percentage?: number;
}

export interface TopAttachmentContributor {
  uploader: string;
  count: number;
}

export interface InspectionRiskTypeItem {
  risk_type: string
  count: number
  percentage?: number
}

export interface HighRiskItem {
  id: string | number
  name: string
  risk_count: number
  latest_risk_types: string[]
  next_review_date?: string
  is_overdue: boolean
}

export interface StatisticsResponse {
  confirmed_inheritance_count: number;
  category_distribution: CategoryDistributionItem[];
  top_related_family_members: TopRelatedFamilyMember[];
  pending_intentions_count: number;
  total_items: number;
  pending_recipient_distribution: PendingRecipientDistributionItem[];
  no_discussion_count: number;
  negotiated_count: number;
  active_discussion_items: ActiveDiscussionItem[];
  total_attachments: number;
  attachment_type_distribution: AttachmentTypeDistributionItem[];
  items_without_image_attachments_count: number;
  top_attachment_contributors: TopAttachmentContributor[];
  pending_review_count: number
  at_risk_count: number
  deteriorated_count: number
  normal_status_count: number
  overdue_review_count: number
  recent_30days_inspection_count: number
  inspection_risk_type_distribution: InspectionRiskTypeItem[]
  high_risk_items: HighRiskItem[]
}

export interface DiscussionFilterParams {
  item_id?: string | number;
  author?: string;
  keyword?: string;
}
