import axios from 'axios'
import {
  FamilyMember,
  HeirloomItem,
  StoryCard,
  RepairRecord,
  StorageLocation,
  InheritanceIntention,
  Discussion,
  StatisticsResponse,
  DiscussionFilterParams,
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

export default api
