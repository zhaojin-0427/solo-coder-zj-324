import axios from 'axios'
import {
  FamilyMember,
  HeirloomItem,
  StoryCard,
  RepairRecord,
  StorageLocation,
  InheritanceIntention,
  Discussion,
  ItemAttachment,
  StatisticsResponse,
  DiscussionFilterParams,
  InspectionRecord,
  ExhibitionPlan,
  ExhibitionPlanCreate,
  ExhibitionPlanUpdate,
  ExhibitionFilterParams,
  ExhibitionItem,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const familyMembersApi = {
  getFamilyMembers: (): Promise<FamilyMember[]> => {
    return api.get('/family-members')
  },
}

export const itemsApi = {
  getItems: (): Promise<HeirloomItem[]> => {
    return api.get('/items')
  },

  getItem: (id: string | number): Promise<HeirloomItem> => {
    return api.get(`/items/${id}`)
  },

  createItem: (item: Partial<HeirloomItem>): Promise<HeirloomItem> => {
    return api.post('/items', item)
  },

  updateItem: (id: string | number, item: Partial<HeirloomItem>): Promise<HeirloomItem> => {
    return api.put(`/items/${id}`, item)
  },

  deleteItem: (id: string | number): Promise<void> => {
    return api.delete(`/items/${id}`)
  },
}

export const storyCardApi = {
  getStoryCard: (itemId: string | number): Promise<StoryCard> => {
    return api.get(`/items/${itemId}/story-card`)
  },

  createStoryCard: (itemId: string | number, data: Partial<StoryCard>): Promise<StoryCard> => {
    return api.post(`/items/${itemId}/story-card`, data)
  },

  updateStoryCard: (itemId: string | number, data: Partial<StoryCard>): Promise<StoryCard> => {
    return api.put(`/items/${itemId}/story-card`, data)
  },

  deleteStoryCard: (itemId: string | number): Promise<void> => {
    return api.delete(`/items/${itemId}/story-card`)
  },

  getStoryEvidence: (itemId: string | number): Promise<ItemAttachment[]> => {
    return api.get(`/items/${itemId}/story-card/attachments`)
  },

  setStoryEvidence: (itemId: string | number, attachmentIds: (string | number)[]): Promise<ItemAttachment[]> => {
    return api.put(`/items/${itemId}/story-card/attachments`, { attachment_ids: attachmentIds })
  },
}

export const repairRecordsApi = {
  getRepairRecords: (itemId: string | number): Promise<RepairRecord[]> => {
    return api.get(`/items/${itemId}/repair-records`)
  },

  addRepairRecord: (itemId: string | number, data: Partial<RepairRecord>): Promise<RepairRecord> => {
    return api.post(`/items/${itemId}/repair-records`, data)
  },
}

export const storageApi = {
  getStorageLocation: (itemId: string | number): Promise<StorageLocation> => {
    return api.get(`/items/${itemId}/storage`)
  },

  updateStorageLocation: (itemId: string | number, data: Partial<StorageLocation>): Promise<StorageLocation> => {
    return api.put(`/items/${itemId}/storage`, data)
  },
}

export interface AttachmentQueryParams {
  attachment_type?: string
  is_public?: boolean
}

export const attachmentsApi = {
  getAttachments: (
    itemId: string | number,
    params?: AttachmentQueryParams
  ): Promise<ItemAttachment[]> => {
    return api.get(`/items/${itemId}/attachments`, { params })
  },

  getAttachment: (itemId: string | number, attachmentId: string | number): Promise<ItemAttachment> => {
    return api.get(`/items/${itemId}/attachments/${attachmentId}`)
  },

  createAttachment: (
    itemId: string | number,
    data: Partial<ItemAttachment>
  ): Promise<ItemAttachment> => {
    return api.post(`/items/${itemId}/attachments`, data)
  },

  updateAttachment: (
    itemId: string | number,
    attachmentId: string | number,
    data: Partial<ItemAttachment>
  ): Promise<ItemAttachment> => {
    return api.put(`/items/${itemId}/attachments/${attachmentId}`, data)
  },

  deleteAttachment: (itemId: string | number, attachmentId: string | number): Promise<void> => {
    return api.delete(`/items/${itemId}/attachments/${attachmentId}`)
  },
}

export const intentionsApi = {
  getIntentions: (itemId: string | number): Promise<InheritanceIntention[]> => {
    return api.get(`/items/${itemId}/intentions`)
  },

  createIntention: (itemId: string | number, data: Partial<InheritanceIntention>): Promise<InheritanceIntention> => {
    return api.post(`/items/${itemId}/intentions`, data)
  },

  confirmIntention: (itemId: string | number, intentionId: string | number): Promise<InheritanceIntention> => {
    return api.put(`/items/${itemId}/intentions/${intentionId}/confirm`)
  },
}

export const discussionsApi = {
  getAllDiscussions: (params?: DiscussionFilterParams): Promise<Discussion[]> => {
    return api.get('/discussions', { params })
  },

  getDiscussions: (
    itemId: string | number,
    params?: Omit<DiscussionFilterParams, 'item_id'>
  ): Promise<Discussion[]> => {
    return api.get(`/items/${itemId}/discussions`, { params })
  },

  addDiscussion: (itemId: string | number, data: Partial<Discussion>): Promise<Discussion> => {
    return api.post(`/items/${itemId}/discussions`, data)
  },
}

export const statisticsApi = {
  getStatistics: (): Promise<StatisticsResponse> => {
    return api.get('/statistics')
  },
}

export const inspectionsApi = {
  getInspections: (itemId: string | number): Promise<InspectionRecord[]> => {
    return api.get(`/items/${itemId}/inspections`)
  },

  getInspection: (
    itemId: string | number,
    inspectionId: string | number
  ): Promise<InspectionRecord> => {
    return api.get(`/items/${itemId}/inspections/${inspectionId}`)
  },

  createInspection: (
    itemId: string | number,
    data: Partial<InspectionRecord>
  ): Promise<InspectionRecord> => {
    return api.post(`/items/${itemId}/inspections`, data)
  },

  updateInspection: (
    itemId: string | number,
    inspectionId: string | number,
    data: Partial<InspectionRecord>
  ): Promise<InspectionRecord> => {
    return api.put(`/items/${itemId}/inspections/${inspectionId}`, data)
  },

  deleteInspection: (
    itemId: string | number,
    inspectionId: string | number
  ): Promise<void> => {
    return api.delete(`/items/${itemId}/inspections/${inspectionId}`)
  },
}

export const exhibitionsApi = {
  getExhibitions: (params?: ExhibitionFilterParams): Promise<ExhibitionPlan[]> => {
    return api.get('/exhibitions', { params })
  },

  getExhibition: (id: string | number): Promise<ExhibitionPlan> => {
    return api.get(`/exhibitions/${id}`)
  },

  createExhibition: (data: ExhibitionPlanCreate): Promise<ExhibitionPlan> => {
    return api.post('/exhibitions', data)
  },

  updateExhibition: (
    id: string | number,
    data: ExhibitionPlanUpdate
  ): Promise<ExhibitionPlan> => {
    return api.put(`/exhibitions/${id}`, data)
  },

  deleteExhibition: (id: string | number): Promise<void> => {
    return api.delete(`/exhibitions/${id}`)
  },

  reorderItems: (
    planId: string | number,
    orderedItemIds: (string | number)[]
  ): Promise<ExhibitionPlan> => {
    return api.put(`/exhibitions/${planId}/items/reorder`, {
      ordered_item_ids: orderedItemIds,
    })
  },

  updateExhibitionItem: (
    planId: string | number,
    itemId: string | number,
    data: Partial<ExhibitionItem>
  ): Promise<ExhibitionItem> => {
    return api.put(`/exhibitions/${planId}/items/${itemId}`, data)
  },

  getItemExhibitions: (itemId: string | number): Promise<ExhibitionPlan[]> => {
    return api.get(`/items/${itemId}/exhibitions`)
  },
}

export default api
