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
}

export interface DiscussionFilterParams {
  item_id?: string | number;
  author?: string;
  keyword?: string;
}
