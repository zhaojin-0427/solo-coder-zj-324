import { useState, useEffect } from 'react'
import HeirloomCard from '../components/HeirloomCard'
import { itemsApi, familyMembersApi } from '../services/api'
import { HeirloomItem, FamilyMember, INSPECTION_STATUS_FILTERS, InspectionStatusFilter, INSPECTION_RISK_TYPES } from '../types'
import './ItemsPage.css'

const CATEGORY_OPTIONS = ['饰品', '瓷器', '文献', '家具', '文玩', '首饰', '钟表', '其他']
const CONDITION_OPTIONS = ['完好', '良好', '一般', '需修复']

function parseRiskList(risksStr?: string): string[] {
  if (!risksStr) return []
  return risksStr
    .split(/[,，、\s]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
}

function isInspectionOverdue(nextReviewDate?: string): boolean {
  if (!nextReviewDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = new Date(nextReviewDate)
  next.setHours(0, 0, 0, 0)
  return next < today
}

function getItemInspectionStatus(item: HeirloomItem): 'pending' | 'risk' | 'deteriorated' | 'normal' | 'none' {
  const records = item.inspection_records || []
  if (records.length === 0) return 'none'
  const sorted = records.slice().sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime())
  const latest = sorted[0]
  const risks = parseRiskList(latest.environmental_risks)
  const hasRisk = risks.length > 0 || !latest.is_present
  const isOverdue = isInspectionOverdue(latest.next_review_date)
  const condChange = (latest.condition_change || '').toLowerCase()
  const isDeteriorated =
    condChange.includes('变差') ||
    condChange.includes('恶化') ||
    condChange.includes('损坏') ||
    condChange.includes('破损扩大') ||
    condChange.includes('脆化')

  if (isOverdue || (latest.next_review_date && !isOverdue)) return 'pending'
  if (hasRisk) return 'risk'
  if (isDeteriorated) return 'deteriorated'
  return 'normal'
}

function ItemsPage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedStatus, setSelectedStatus] = useState<InspectionStatusFilter>('全部')
  const [showAddModal, setShowAddModal] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    era: '',
    usage_scene: '',
    condition: CONDITION_OPTIONS[1],
    description: '',
    cover_image: '📷',
    related_people_ids: [] as (string | number)[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [itemsData, membersData] = await Promise.all([
          itemsApi.getItems(),
          familyMembersApi.getFamilyMembers(),
        ])
        setItems(itemsData)
        setFamilyMembers(membersData)
      } catch (err: any) {
        setError(err.message || '加载旧物列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const categories = ['全部', ...new Set(items.map((item) => item.category))]

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== '全部' && item.category !== selectedCategory) return false
    if (selectedStatus !== '全部') {
      const status = getItemInspectionStatus(item)
      if (selectedStatus === '待复查' && status !== 'pending') return false
      if (selectedStatus === '存在风险' && status !== 'risk') return false
      if (selectedStatus === '状态变差' && status !== 'deteriorated') return false
      if (selectedStatus === '正常' && status !== 'normal') return false
    }
    return true
  })

  const togglePerson = (id: string | number) => {
    setFormData((prev) => ({
      ...prev,
      related_people_ids: prev.related_people_ids.includes(id)
        ? prev.related_people_ids.filter((pid) => pid !== id)
        : [...prev.related_people_ids, id],
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: CATEGORY_OPTIONS[0],
      era: '',
      usage_scene: '',
      condition: CONDITION_OPTIONS[1],
      description: '',
      cover_image: '📷',
      related_people_ids: [],
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('请填写旧物名称')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await itemsApi.createItem(formData)
      const data = await itemsApi.getItems()
      setItems(data)
      setShowAddModal(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || '创建旧物失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="items-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">旧物档案</h2>
            <p className="page-subtitle">加载中...</p>
          </div>
        </div>
        <div className="loading-state">
          <p>📦 正在加载旧物档案...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="items-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">旧物档案</h2>
            <p className="page-subtitle">加载失败</p>
          </div>
        </div>
        <div className="error-state">
          <p>😢 {error}</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      </div>
    )
  }

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">旧物档案</h2>
          <p className="page-subtitle">共 {items.length} 件珍藏旧物</p>
        </div>
        <button
          className="action-btn primary"
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
        >
          + 新增旧物
        </button>
      </div>

      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="filter-bar secondary">
        <span className="filter-bar-label">盘点状态：</span>
        {INSPECTION_STATUS_FILTERS.map((status) => (
          <button
            key={status}
            className={`filter-btn status-btn ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status === '待复查' && '⏰ '}
            {status === '存在风险' && '⚠️ '}
            {status === '状态变差' && '📉 '}
            {status === '正常' && '✓ '}
            {status}
          </button>
        ))}
      </div>

      <div className="items-grid">
        {filteredItems.map((item) => (
          <HeirloomCard key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <p>暂无该类别的旧物</p>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">新增旧物</h2>
            <div className="form-group">
              <label>名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                placeholder="请输入旧物名称"
              />
            </div>
            <div className="form-group">
              <label>类别</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>年代</label>
              <input
                type="text"
                value={formData.era}
                onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                className="form-input"
                placeholder="如：民国时期、1980年代"
              />
            </div>
            <div className="form-group">
              <label>使用场景</label>
              <input
                type="text"
                value={formData.usage_scene}
                onChange={(e) => setFormData({ ...formData, usage_scene: e.target.value })}
                className="form-input"
                placeholder="如：婚嫁陪嫁、日常使用"
              />
            </div>
            <div className="form-group">
              <label>保存状态</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="form-input"
              >
                {CONDITION_OPTIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                rows={3}
                placeholder="请描述旧物的详细信息"
              />
            </div>
            <div className="form-group">
              <label>封面图（emoji 或 URL）</label>
              <input
                type="text"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                className="form-input"
                placeholder="如：📷 或 https://..."
              />
            </div>
            <div className="form-group">
              <label>关联家人</label>
              <div className="checkbox-group">
                {familyMembers.map((member) => (
                  <label
                    key={member.id}
                    className={`checkbox-item ${
                      formData.related_people_ids.includes(member.id) ? 'checked' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.related_people_ids.includes(member.id)}
                      onChange={() => togglePerson(member.id)}
                    />
                    <span>{member.name}（{member.relation}）</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemsPage
