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
}

export interface Discussion {
  id: string | number;
  item_id: string | number;
  author: string;
  content: string;
  reply_to_id?: string | number;
  created_at?: string;
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
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
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

export interface StatisticsResponse {
  confirmed_inheritance_count: number;
  category_distribution: CategoryDistributionItem[];
  top_related_family_members: TopRelatedFamilyMember[];
  pending_intentions_count: number;
  total_items: number;
  pending_recipient_distribution: PendingRecipientDistributionItem[];
}
