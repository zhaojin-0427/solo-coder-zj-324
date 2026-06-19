import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { itemsApi, repairRecordsApi, storageApi, intentionsApi, discussionsApi, attachmentsApi, inspectionsApi } from '../services/api'
import {
  HeirloomItem,
  RepairRecord,
  StorageLocation,
  InheritanceIntention,
  Discussion,
  ItemAttachment,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_META,
  InspectionRecord,
  INSPECTION_RISK_TYPES,
  INSPECTION_RISK_META,
} from '../types'
import './ItemDetailPage.css'

function isImageUrl(str?: string): boolean {
  if (!str) return false
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')
}

function isAttachmentImageLike(str?: string): boolean {
  if (!str) return false
  if (str.startsWith('data:')) return true
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return /\.(jpeg|jpg|png|gif|webp|bmp)(\?|$)/i.test(str) || str.includes('text_to_image')
  }
  return false
}

function getConditionColor(condition: string): string {
  const c = condition || ''
  if (c.includes('完好') || c.includes('优秀') || c.includes('完美')) return '#5a8f5a'
  if (c.includes('良好') || c.includes('不错')) return '#8b6914'
  if (c.includes('一般') || c.includes('划痕') || c.includes('泛黄')) return '#c8942e'
  if (c.includes('修复') || c.includes('保养') || c.includes('破损')) return '#c25a3a'
  return '#a08060'
}

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

function hasInspectionRisk(rec: InspectionRecord): boolean {
  return parseRiskList(rec.environmental_risks).length > 0 || !rec.is_present
}

function hasInspectionDeteriorated(rec: InspectionRecord): boolean {
  const c = (rec.condition_change || '').toLowerCase()
  return (
    c.includes('变差') ||
    c.includes('恶化') ||
    c.includes('损坏') ||
    c.includes('破损扩大') ||
    c.includes('脆化')
  )
}

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<HeirloomItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [showStorageModal, setShowStorageModal] = useState(false)
  const [showIntentionModal, setShowIntentionModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [repairForm, setRepairForm] = useState<Partial<RepairRecord>>({
    date: '',
    description: '',
    repaired_by: '',
    cost: undefined,
    notes: '',
  })

  const [storageForm, setStorageForm] = useState<Partial<StorageLocation>>({
    location: '',
    details: '',
  })

  const [intentionForm, setIntentionForm] = useState({
    proposed_by: '',
    proposed_recipient: '',
    reason: '',
  })

  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [filterAuthor, setFilterAuthor] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')

  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [attachmentForm, setAttachmentForm] = useState<Partial<ItemAttachment>>({
    attachment_type: '实物照片',
    title: '',
    url: '',
    capture_time: '',
    uploader: '',
    remark: '',
    is_public: true,
  })
  const [attachmentVisibility, setAttachmentVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [selectedAttachment, setSelectedAttachment] = useState<ItemAttachment | null>(null)

  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [editingInspection, setEditingInspection] = useState<InspectionRecord | null>(null)
  const [inspectionForm, setInspectionForm] = useState<Partial<InspectionRecord>>({
    inspection_date: new Date().toISOString().split('T')[0],
    inspector: '',
    is_present: true,
    condition_change: '',
    environmental_risks: '',
    handling_suggestions: '',
    next_review_date: '',
    notes: '',
  })
  const [selectedInspectionRisks, setSelectedInspectionRisks] = useState<string[]>([])

  useEffect(() => {
    if (!id) return

    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsApi.getItem(id)
        setItem(data)
      } catch (err: any) {
        setError(err.message || '加载旧物详情失败')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const handleOpenStorageModal = () => {
    if (item?.storage_location) {
      setStorageForm({
        location: item.storage_location.location,
        details: item.storage_location.details || '',
      })
    } else {
      setStorageForm({ location: '', details: '' })
    }
    setShowStorageModal(true)
  }

  const handleSubmitRepair = async () => {
    if (!id || !repairForm.date || !repairForm.description) {
      setError('请填写日期和修补内容')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await repairRecordsApi.addRepairRecord(id, repairForm)
      const data = await itemsApi.getItem(id)
      setItem(data)
      setShowRepairModal(false)
      setRepairForm({ date: '', description: '', repaired_by: '', cost: undefined, notes: '' })
    } catch (err: any) {
      setError(err.message || '添加修补记录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitStorage = async () => {
    if (!id || !storageForm.location) {
      setError('请填写位置信息')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await storageApi.updateStorageLocation(id, storageForm)
      const data = await itemsApi.getItem(id)
      setItem(data)
      setShowStorageModal(false)
    } catch (err: any) {
      setError(err.message || '保存位置信息失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getNextVersion = (): number => {
    if (!item) return 1
    const intentions = item.intentions || []
    if (intentions.length === 0) return 1
    const maxVersion = intentions.reduce((max, curr) => Math.max(max, curr.version), 0)
    return maxVersion + 1
  }

  const handleSubmitIntention = async () => {
    if (!id) return
    if (!intentionForm.proposed_by.trim() || !intentionForm.proposed_recipient.trim()) {
      setError('请填写提议人和预期传承人')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const version = getNextVersion()
      await intentionsApi.createIntention(id, {
        ...intentionForm,
        version,
      })
      const data = await itemsApi.getItem(id)
      setItem(data)
      setShowIntentionModal(false)
      setIntentionForm({ proposed_by: '', proposed_recipient: '', reason: '' })
    } catch (err: any) {
      setError(err.message || '创建传承意向失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmIntention = async (intentionId: string | number) => {
    if (!id) return
    try {
      setSubmitting(true)
      setError(null)
      await intentionsApi.confirmIntention(id, intentionId)
      const data = await itemsApi.getItem(id)
      setItem(data)
    } catch (err: any) {
      setError(err.message || '确认传承意向失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!id || !newComment.trim()) return
    try {
      setSubmittingComment(true)
      setError(null)
      await discussionsApi.addDiscussion(id, {
        content: newComment.trim(),
        author: '当前用户',
      })
      setNewComment('')
      const data = await itemsApi.getItem(id)
      setItem(data)
    } catch (err: any) {
      setError(err.message || '发表评论失败')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitAttachment = async () => {
    if (!id) return
    if (!attachmentForm.title?.trim() || !attachmentForm.url?.trim()) {
      setError('请填写附件名称和链接')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await attachmentsApi.createAttachment(id, attachmentForm)
      const data = await itemsApi.getItem(id)
      setItem(data)
      setShowAttachmentModal(false)
      setAttachmentForm({
        attachment_type: '实物照片',
        title: '',
        url: '',
        capture_time: '',
        uploader: '',
        remark: '',
        is_public: true,
      })
    } catch (err: any) {
      setError(err.message || '添加资料附件失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string | number) => {
    if (!id) return
    if (!window.confirm('确定要删除该资料附件吗？')) return
    try {
      setSubmitting(true)
      setError(null)
      await attachmentsApi.deleteAttachment(id, attachmentId)
      const data = await itemsApi.getItem(id)
      setItem(data)
      setSelectedAttachment(null)
    } catch (err: any) {
      setError(err.message || '删除资料附件失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openInspectionModal = (record?: InspectionRecord) => {
    if (record) {
      setEditingInspection(record)
      setInspectionForm({
        inspection_date: record.inspection_date,
        inspector: record.inspector,
        is_present: record.is_present,
        condition_change: record.condition_change || '',
        environmental_risks: record.environmental_risks || '',
        handling_suggestions: record.handling_suggestions || '',
        next_review_date: record.next_review_date || '',
        notes: record.notes || '',
      })
      setSelectedInspectionRisks(parseRiskList(record.environmental_risks))
    } else {
      setEditingInspection(null)
      setInspectionForm({
        inspection_date: new Date().toISOString().split('T')[0],
        inspector: '',
        is_present: true,
        condition_change: '',
        environmental_risks: '',
        handling_suggestions: '',
        next_review_date: '',
        notes: '',
      })
      setSelectedInspectionRisks([])
    }
    setShowInspectionModal(true)
  }

  const toggleInspectionRisk = (risk: string) => {
    setSelectedInspectionRisks((prev) =>
      prev.includes(risk) ? prev.filter((r) => r !== risk) : [...prev, risk]
    )
  }

  const handleSubmitInspection = async () => {
    if (!id) return
    if (!inspectionForm.inspection_date || !inspectionForm.inspector?.trim()) {
      setError('请填写盘点日期和盘点人')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const payload = {
        ...inspectionForm,
        environmental_risks: selectedInspectionRisks.join(','),
      }
      if (editingInspection) {
        await inspectionsApi.updateInspection(id, editingInspection.id, payload)
      } else {
        await inspectionsApi.createInspection(id, payload)
      }
      const data = await itemsApi.getItem(id)
      setItem(data)
      setShowInspectionModal(false)
      setEditingInspection(null)
    } catch (err: any) {
      setError(err.message || '保存盘点记录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInspection = async (inspectionId: string | number) => {
    if (!id) return
    if (!window.confirm('确定要删除该盘点记录吗？')) return
    try {
      setSubmitting(true)
      setError(null)
      await inspectionsApi.deleteInspection(id, inspectionId)
      const data = await itemsApi.getItem(id)
      setItem(data)
    } catch (err: any) {
      setError(err.message || '删除盘点记录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openAttachmentModal = () => {
    setAttachmentForm({
      attachment_type: '实物照片',
      title: '',
      url: '',
      capture_time: '',
      uploader: '',
      remark: '',
      is_public: true,
    })
    setShowAttachmentModal(true)
  }

  const filteredAttachments = (item?.attachments || []).filter((a) => {
    if (attachmentVisibility === 'public') return a.is_public
    if (attachmentVisibility === 'private') return !a.is_public
    return true
  })

  const groupedAttachments = ATTACHMENT_TYPES.map((type) => ({
    type,
    meta: ATTACHMENT_TYPE_META[type] || { icon: '📎', color: '#a08060' },
    items: filteredAttachments.filter((a) => a.attachment_type === type),
  })).filter((g) => g.items.length > 0)

  const sortedIntentions = (item?.intentions || []).slice().sort((a, b) => b.version - a.version)
  const finalIntention = sortedIntentions.find((i) => i.is_final) || null
  const hasConfirmed = !!finalIntention

  const sortedInspections = (item?.inspection_records || [])
    .slice()
    .sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime())
  const latestInspection = sortedInspections[0] || null
  const hasLatestRisk = latestInspection ? hasInspectionRisk(latestInspection) : false
  const isLatestOverdue = latestInspection
    ? isInspectionOverdue(latestInspection.next_review_date)
    : false

  const allAuthors = Array.from(
    new Set((item?.discussions || []).map((d) => d.author).filter(Boolean))
  )

  const displayedDiscussions = (item?.discussions || []).filter((d) => {
    if (filterAuthor && d.author !== filterAuthor) return false
    if (filterKeyword && !d.content.includes(filterKeyword)) return false
    return true
  })

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasActiveDiscussionFilter = filterAuthor !== '' || filterKeyword.trim() !== ''

  if (loading) {
    return (
      <div className="item-detail-page">
        <div className="loading-state">
          <p>📦 正在加载旧物详情...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="item-detail-page">
        <div className="error-state">
          <p>😢 {error}</p>
          <button onClick={() => navigate('/items')}>返回列表</button>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="item-detail-page">
        <div className="not-found">
          <p>未找到该旧物</p>
          <button onClick={() => navigate('/items')}>返回列表</button>
        </div>
      </div>
    )
  }

  return (
    <div className="item-detail-page">
      <div className="detail-header">
        <Link to="/items" className="back-link">
          ← 返回列表
        </Link>
        <div className="detail-actions">
          <Link to={`/story-card/${item.id}`} className="action-btn primary">
            编辑故事卡
          </Link>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-image-section">
          <div className="detail-image">
            {item.cover_image ? (
              isImageUrl(item.cover_image) ? (
                <img src={item.cover_image} alt={item.name} />
              ) : (
                <div className="image-placeholder-large emoji-placeholder-large">
                  <span className="placeholder-emoji-large">{item.cover_image}</span>
                  <p>{item.name}</p>
                </div>
              )
            ) : (
              <div className="image-placeholder-large">
                <span className="placeholder-icon">📷</span>
                <p>{item.name}</p>
              </div>
            )}
          </div>
          <div className="item-tags">
            <span className="tag">{item.category}</span>
            <span className="tag">{item.era}</span>
            <span
              className="tag condition"
              style={{ backgroundColor: getConditionColor(item.condition), color: '#fff' }}
            >
              状态：{item.condition || '未标注'}
            </span>
          </div>

          <div className="negotiation-status">
            <h4 className="section-title-sm">📊 协商状态</h4>
            <div className="status-grid">
              <div className="status-mini-card">
                <span className="status-num">{item.discussions?.length || 0}</span>
                <span className="status-label">讨论数</span>
              </div>
              <div className="status-mini-card">
                <span className="status-num">{sortedIntentions.length}</span>
                <span className="status-label">意向版本</span>
              </div>
              <div className="status-mini-card">
                {hasConfirmed ? (
                  <>
                    <span className="status-num confirmed">✓</span>
                    <span className="status-label">已确认</span>
                  </>
                ) : (
                  <>
                    <span className="status-num pending">...</span>
                    <span className="status-label">协商中</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="inspection-status">
            <h4 className="section-title-sm">🔍 盘点状态</h4>
            <div className="status-grid">
              <div className="status-mini-card">
                <span className="status-num">{sortedInspections.length}</span>
                <span className="status-label">盘点次数</span>
              </div>
              <div className="status-mini-card">
                {isLatestOverdue ? (
                  <>
                    <span className="status-num risk">⚠️</span>
                    <span className="status-label risk">逾期未复查</span>
                  </>
                ) : latestInspection?.next_review_date ? (
                  <>
                    <span className="status-num pending">⏰</span>
                    <span className="status-label">待复查</span>
                  </>
                ) : (
                  <>
                    <span className="status-num">—</span>
                    <span className="status-label">无复查计划</span>
                  </>
                )}
              </div>
              <div className="status-mini-card">
                {hasLatestRisk ? (
                  <>
                    <span className="status-num risk">⚠️</span>
                    <span className="status-label risk">存在风险</span>
                  </>
                ) : latestInspection ? (
                  <>
                    <span className="status-num confirmed">✓</span>
                    <span className="status-label">状态正常</span>
                  </>
                ) : (
                  <>
                    <span className="status-num">—</span>
                    <span className="status-label">暂无盘点</span>
                  </>
                )}
              </div>
            </div>
            {(hasLatestRisk || isLatestOverdue) && latestInspection && (
              <div className={`inspection-alert ${isLatestOverdue ? 'overdue' : 'risk'}`}>
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">
                  {isLatestOverdue
                    ? `复查已逾期（计划日期：${latestInspection.next_review_date}）`
                    : `最新盘点发现风险：${parseRiskList(latestInspection.environmental_risks).join('、')}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-info-section">
          <h1 className="item-name">{item.name}</h1>
          {item.usage_scene && <p className="item-origin">使用场景：{item.usage_scene}</p>}
          <p className="item-description">{item.description}</p>

          <div className="info-section">
            <h3 className="section-title">👨‍👩‍👧‍👦 关联家人</h3>
            <div className="member-list">
              {item.related_people.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">{member.name.charAt(0)}</div>
                  <div className="member-info">
                    <p className="member-name">{member.name}</p>
                    <p className="member-relation">{member.relation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasConfirmed && finalIntention && (
            <div className="info-section final-result">
              <div className="section-header">
                <h3 className="section-title">✅ 最终确认传承结果</h3>
                <span className="final-badge">v{finalIntention.version} 最终版</span>
              </div>
              <div className="final-card">
                <div className="final-row">
                  <span className="final-label">提议人</span>
                  <span className="final-value">{finalIntention.proposed_by}</span>
                </div>
                <div className="final-row">
                  <span className="final-label">传承人</span>
                  <span className="final-value highlight">
                    🏆 {finalIntention.proposed_recipient}
                  </span>
                </div>
                {finalIntention.reason && (
                  <div className="final-section">
                    <h4 className="final-subtitle">传承理由</h4>
                    <p className="final-text">{finalIntention.reason}</p>
                  </div>
                )}
                <div className="final-row">
                  <span className="final-label">确认时间</span>
                  <span className="final-value">
                    {formatDateTime(finalIntention.confirmed_at || finalIntention.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">📜 传承意向历史</h3>
              {!hasConfirmed && (
                <button
                  className="action-btn secondary small"
                  onClick={() => {
                    setIntentionForm({ proposed_by: '', proposed_recipient: '', reason: '' })
                    setShowIntentionModal(true)
                  }}
                >
                  + 提出新去向
                </button>
              )}
            </div>
            {sortedIntentions.length > 0 ? (
              <div className="intention-history">
                {sortedIntentions.map((intention) => (
                  <div
                    key={intention.id}
                    className={`intention-history-item ${intention.is_final ? 'is-final' : ''}`}
                  >
                    <div className="intention-header">
                      <div className="intention-version">
                        <span className="version-badge">v{intention.version}</span>
                        {intention.is_final && (
                          <span className="version-tag final">最终确认</span>
                        )}
                      </div>
                      <span className="intention-date">
                        {formatDate(intention.created_at)}
                      </span>
                    </div>
                    <div className="intention-body">
                      <div className="intention-row">
                        <span className="intention-k">提议人：</span>
                        <span className="intention-v">{intention.proposed_by}</span>
                      </div>
                      {intention.proposed_recipient && (
                        <div className="intention-row">
                          <span className="intention-k">传承人：</span>
                          <span className="intention-v">{intention.proposed_recipient}</span>
                        </div>
                      )}
                      {intention.reason && (
                        <div className="intention-reason">
                          <span className="intention-k">理由：</span>
                          <p className="intention-text">{intention.reason}</p>
                        </div>
                      )}
                    </div>
                    {!hasConfirmed && !intention.is_final && (
                      <div className="intention-actions">
                        <button
                          className="confirm-intention-btn"
                          onClick={() => handleConfirmIntention(intention.id)}
                          disabled={submitting}
                        >
                          {submitting ? '确认中...' : '确认此意向'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-hint">
                <p>暂无传承意向，可点击右上角按钮提出第一版去向方案</p>
              </div>
            )}
          </div>

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">💬 家庭讨论</h3>
              <span className="discussion-count-badge">
                共 {item.discussions?.length || 0} 条
              </span>
            </div>

            <div className="discussion-filter-bar">
              <div className="discussion-filter-item">
                <label>发言人：</label>
                <select
                  className="filter-select-sm"
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value)}
                >
                  <option value="">全部</option>
                  {allAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>
              <div className="discussion-filter-item grow">
                <label>关键词：</label>
                <input
                  type="text"
                  className="filter-input-sm"
                  placeholder="搜索讨论内容..."
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                />
              </div>
              {hasActiveDiscussionFilter && (
                <button
                  className="clear-filter-sm"
                  onClick={() => {
                    setFilterAuthor('')
                    setFilterKeyword('')
                  }}
                >
                  清除
                </button>
              )}
            </div>

            {displayedDiscussions.length > 0 ? (
              <div className="discussion-list-inline">
                {displayedDiscussions.map((discussion) => {
                  const isSystemConfirm = discussion.content.startsWith('【传承意向已确认】')
                  return (
                    <div
                      key={discussion.id}
                      className={`discussion-inline-item ${isSystemConfirm ? 'system-msg' : ''}`}
                    >
                      <div className="discussion-avatar-inline">
                        {discussion.author.charAt(0)}
                      </div>
                      <div className="discussion-body-inline">
                        <div className="discussion-header-inline">
                          <span className="discussion-author-inline">
                            {discussion.author}
                          </span>
                          {isSystemConfirm && (
                            <span className="system-tag">系统通知</span>
                          )}
                          <span className="discussion-time-inline">
                            {formatDateTime(discussion.created_at)}
                          </span>
                        </div>
                        <p className="discussion-content-inline">
                          {discussion.content.split('\n').map((line, idx) => (
                            <span key={idx}>
                              {line}
                              {idx < discussion.content.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : hasActiveDiscussionFilter ? (
              <p className="empty-text">未找到符合筛选条件的讨论</p>
            ) : (
              <p className="empty-text">暂无讨论，成为第一个发表意见的人吧！</p>
            )}

            <div className="add-discussion-inline">
              <div className="discussion-avatar-inline small">我</div>
              <div className="discussion-input-wrap">
                <textarea
                  className="discussion-input-inline"
                  placeholder="发表你的看法..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="discussion-submit-row">
                  <button
                    className="send-discussion-btn"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? '发表中...' : '发表讨论'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">🔧 修补记录</h3>
              <button
                className="action-btn secondary small"
                onClick={() => setShowRepairModal(true)}
              >
                + 添加修补记录
              </button>
            </div>
            {item.repair_records.length > 0 ? (
              <div className="repair-list">
                {item.repair_records.map((record) => (
                  <div key={record.id} className="repair-item">
                    <div className="repair-date">{record.date}</div>
                    <div className="repair-detail">
                      <p className="repair-desc">{record.description}</p>
                      <p className="repairer">修补人：{record.repaired_by}</p>
                      {record.cost != null && <p className="repair-cost">费用：¥{record.cost}</p>}
                      {record.notes && <p className="repair-notes">备注：{record.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">暂无修补记录</p>
            )}
          </div>

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">� 盘点记录</h3>
              <button
                className="action-btn secondary small"
                onClick={() => openInspectionModal()}
              >
                + 新增盘点
              </button>
            </div>
            {sortedInspections.length > 0 ? (
              <div className="inspection-list">
                {sortedInspections.map((rec) => {
                  const risks = parseRiskList(rec.environmental_risks)
                  const isRisk = risks.length > 0 || !rec.is_present
                  const isOverdue = isInspectionOverdue(rec.next_review_date)
                  const isDeteriorated = hasInspectionDeteriorated(rec)
                  return (
                    <div
                      key={rec.id}
                      className={`inspection-item ${
                        isOverdue ? 'overdue' : isRisk ? 'risk' : isDeteriorated ? 'deteriorated' : ''
                      }`}
                    >
                      <div className="inspection-header">
                        <div className="inspection-date-row">
                          <span className="inspection-date">📅 {rec.inspection_date}</span>
                          {!rec.is_present && (
                            <span className="inspection-badge missing">❌ 实物不在位</span>
                          )}
                          {isOverdue && (
                            <span className="inspection-badge overdue">⚠️ 复查已逾期</span>
                          )}
                          {isRisk && rec.is_present && (
                            <span className="inspection-badge risk">⚠️ 存在风险</span>
                          )}
                          {isDeteriorated && !isRisk && rec.is_present && (
                            <span className="inspection-badge deteriorated">📉 状态变差</span>
                          )}
                        </div>
                        <div className="inspection-actions">
                          <button
                            className="action-btn-link"
                            onClick={() => openInspectionModal(rec)}
                          >
                            编辑
                          </button>
                          <button
                            className="action-btn-link danger"
                            onClick={() => handleDeleteInspection(rec.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <div className="inspection-body">
                        <div className="inspection-row">
                          <span className="inspection-k">盘点人：</span>
                          <span className="inspection-v">{rec.inspector}</span>
                        </div>
                        {rec.condition_change && (
                          <div className="inspection-row">
                            <span className="inspection-k">状态变化：</span>
                            <span
                              className={`inspection-v ${
                                isDeteriorated ? 'text-danger' : ''
                              }`}
                            >
                              {rec.condition_change}
                            </span>
                          </div>
                        )}
                        {risks.length > 0 && (
                          <div className="inspection-row">
                            <span className="inspection-k">环境风险：</span>
                            <span className="inspection-v risk-tags">
                              {risks.map((r) => {
                                const meta = INSPECTION_RISK_META[r] || {
                                  icon: '⚠️',
                                  color: '#c25a3a',
                                }
                                return (
                                  <span
                                    key={r}
                                    className="risk-tag"
                                    style={{ backgroundColor: meta.color + '22', color: meta.color, borderColor: meta.color + '66' }}
                                  >
                                    {meta.icon} {r}
                                  </span>
                                )
                              })}
                            </span>
                          </div>
                        )}
                        {rec.handling_suggestions && (
                          <div className="inspection-row">
                            <span className="inspection-k">处理建议：</span>
                            <span className="inspection-v">{rec.handling_suggestions}</span>
                          </div>
                        )}
                        {rec.next_review_date && (
                          <div className="inspection-row">
                            <span className="inspection-k">下次复查：</span>
                            <span
                              className={`inspection-v ${isOverdue ? 'text-danger' : ''}`}
                            >
                              {rec.next_review_date}
                              {isOverdue && '（已逾期）'}
                            </span>
                          </div>
                        )}
                        {rec.notes && (
                          <div className="inspection-row">
                            <span className="inspection-k">备注：</span>
                            <span className="inspection-v">{rec.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="empty-text">暂无盘点记录，点击右上角按钮进行首次盘点</p>
            )}
          </div>

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">� 存放位置</h3>
              <button
                className="action-btn secondary small"
                onClick={handleOpenStorageModal}
              >
                {item.storage_location ? '编辑位置' : '+ 设置位置'}
              </button>
            </div>
            {item.storage_location ? (
              <div className="location-card">
                <div className="location-icon">🏠</div>
                <div className="location-info">
                  <p className="location-room">{item.storage_location.location}</p>
                  {item.storage_location.details && (
                    <p className="location-position">{item.storage_location.details}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="empty-text">暂无存放位置信息</p>
            )}
          </div>

          <div className="info-section">
            <div className="section-header">
              <h3 className="section-title">📎 资料附件</h3>
              <span className="discussion-count-badge">
                共 {item.attachments?.length || 0} 项
              </span>
            </div>

            <div className="attachment-filter-bar">
              <div className="attachment-visibility-tabs">
                <button
                  className={`visibility-tab ${attachmentVisibility === 'all' ? 'active' : ''}`}
                  onClick={() => setAttachmentVisibility('all')}
                >
                  全部 ({(item.attachments || []).length})
                </button>
                <button
                  className={`visibility-tab ${attachmentVisibility === 'public' ? 'active' : ''}`}
                  onClick={() => setAttachmentVisibility('public')}
                >
                  🔓 公开 ({(item.attachments || []).filter((a) => a.is_public).length})
                </button>
                <button
                  className={`visibility-tab ${attachmentVisibility === 'private' ? 'active' : ''}`}
                  onClick={() => setAttachmentVisibility('private')}
                >
                  🔒 私密 ({(item.attachments || []).filter((a) => !a.is_public).length})
                </button>
              </div>
              <button className="action-btn secondary small" onClick={openAttachmentModal}>
                + 添加资料附件
              </button>
            </div>

            {groupedAttachments.length > 0 ? (
              <div className="attachment-group-list">
                {groupedAttachments.map((group) => (
                  <div key={group.type} className="attachment-group">
                    <div className="attachment-group-header">
                      <span className="attachment-type-icon">{group.meta.icon}</span>
                      <span className="attachment-group-name">{group.type}</span>
                      <span className="attachment-group-count">{group.items.length}</span>
                    </div>
                    <div className="attachment-grid">
                      {group.items.map((att) => (
                        <div
                          key={att.id}
                          className={`attachment-card ${att.is_public ? '' : 'is-private'}`}
                          onClick={() => setSelectedAttachment(att)}
                        >
                          <div className="attachment-thumb">
                            {isAttachmentImageLike(att.url) ? (
                              <img src={att.url} alt={att.title} loading="lazy" />
                            ) : (
                              <span className="attachment-thumb-icon">{group.meta.icon}</span>
                            )}
                            <span className="attachment-privacy-badge">
                              {att.is_public ? '🔓' : '🔒'}
                            </span>
                          </div>
                          <div className="attachment-card-body">
                            <p className="attachment-card-title">{att.title}</p>
                            <p className="attachment-card-meta">
                              {att.capture_time || '未标注时间'}
                            </p>
                            <p className="attachment-card-uploader">
                              上传人：{att.uploader || '未标注'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">
                {(item.attachments || []).length === 0
                  ? '暂无资料附件，点击右上角添加'
                  : '当前筛选条件下无资料附件'}
              </p>
            )}
          </div>

          {item.story_card && (
            <div className="info-section">
              <h3 className="section-title">📖 故事卡摘要</h3>
              <div className="story-preview">
                <p className="story-text">
                  <strong>口述来历：</strong>
                  {item.story_card.oral_history.substring(0, 100)}...
                </p>
                <Link to={`/story-card/${item.id}`} className="read-more">
                  查看完整故事 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRepairModal && (
        <div className="modal-overlay" onClick={() => setShowRepairModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">添加修补记录</h2>
            <div className="form-group">
              <label>日期 *</label>
              <input
                type="date"
                value={repairForm.date || ''}
                onChange={(e) => setRepairForm({ ...repairForm, date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>修补内容 *</label>
              <textarea
                value={repairForm.description || ''}
                onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })}
                className="form-textarea"
                rows={3}
                placeholder="请描述修补的内容"
              />
            </div>
            <div className="form-group">
              <label>修补人/店铺</label>
              <input
                type="text"
                value={repairForm.repaired_by || ''}
                onChange={(e) => setRepairForm({ ...repairForm, repaired_by: e.target.value })}
                className="form-input"
                placeholder="请输入修补人或店铺名称"
              />
            </div>
            <div className="form-group">
              <label>费用（元）</label>
              <input
                type="number"
                value={repairForm.cost ?? ''}
                onChange={(e) =>
                  setRepairForm({
                    ...repairForm,
                    cost: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="form-input"
                placeholder="请输入费用"
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={repairForm.notes || ''}
                onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                className="form-textarea"
                rows={2}
                placeholder="其他需要说明的内容"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowRepairModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitRepair}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStorageModal && (
        <div className="modal-overlay" onClick={() => setShowStorageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {item.storage_location ? '编辑存放位置' : '设置存放位置'}
            </h2>
            <div className="form-group">
              <label>位置 *</label>
              <input
                type="text"
                value={storageForm.location || ''}
                onChange={(e) => setStorageForm({ ...storageForm, location: e.target.value })}
                className="form-input"
                placeholder="如：书房书架第二层"
              />
            </div>
            <div className="form-group">
              <label>详细说明</label>
              <textarea
                value={storageForm.details || ''}
                onChange={(e) => setStorageForm({ ...storageForm, details: e.target.value })}
                className="form-textarea"
                rows={3}
                placeholder="更详细的存放说明，如：从左数第3格，红色盒子里"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowStorageModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitStorage}
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIntentionModal && (
        <div className="modal-overlay" onClick={() => setShowIntentionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              提出新去向 - {item.name}（v{getNextVersion()}）
            </h2>
            <div className="form-group">
              <label>提议人 *</label>
              <input
                type="text"
                value={intentionForm.proposed_by}
                onChange={(e) =>
                  setIntentionForm({ ...intentionForm, proposed_by: e.target.value })
                }
                className="form-input"
                placeholder="请输入提议人姓名"
              />
            </div>
            <div className="form-group">
              <label>预期传承人 *</label>
              <input
                type="text"
                value={intentionForm.proposed_recipient}
                onChange={(e) =>
                  setIntentionForm({ ...intentionForm, proposed_recipient: e.target.value })
                }
                className="form-input"
                placeholder="请输入预期传承人姓名"
              />
            </div>
            <div className="form-group">
              <label>传承理由</label>
              <textarea
                value={intentionForm.reason}
                onChange={(e) =>
                  setIntentionForm({ ...intentionForm, reason: e.target.value })
                }
                className="form-textarea"
                rows={4}
                placeholder="请说明传承的理由和意义"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowIntentionModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitIntention}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttachmentModal && (
        <div className="modal-overlay" onClick={() => setShowAttachmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">添加资料附件</h2>
            <div className="form-group">
              <label>资料类型 *</label>
              <select
                className="form-input"
                value={attachmentForm.attachment_type || '实物照片'}
                onChange={(e) =>
                  setAttachmentForm({ ...attachmentForm, attachment_type: e.target.value })
                }
              >
                {ATTACHMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>附件名称 *</label>
              <input
                type="text"
                className="form-input"
                value={attachmentForm.title || ''}
                onChange={(e) => setAttachmentForm({ ...attachmentForm, title: e.target.value })}
                placeholder="如：怀表正面特写"
              />
            </div>
            <div className="form-group">
              <label>链接 / 图片地址 *</label>
              <input
                type="text"
                className="form-input"
                value={attachmentForm.url || ''}
                onChange={(e) => setAttachmentForm({ ...attachmentForm, url: e.target.value })}
                placeholder="图片URL、音频口述链接或扫描文档链接"
              />
            </div>
            <div className="form-group">
              <label>拍摄 / 形成时间</label>
              <input
                type="date"
                className="form-input"
                value={attachmentForm.capture_time || ''}
                onChange={(e) =>
                  setAttachmentForm({ ...attachmentForm, capture_time: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>上传人</label>
              <input
                type="text"
                className="form-input"
                value={attachmentForm.uploader || ''}
                onChange={(e) =>
                  setAttachmentForm({ ...attachmentForm, uploader: e.target.value })
                }
                placeholder="请输入上传人姓名"
              />
            </div>
            <div className="form-group">
              <label>说明备注</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={attachmentForm.remark || ''}
                onChange={(e) => setAttachmentForm({ ...attachmentForm, remark: e.target.value })}
                placeholder="补充说明，如拍摄背景、凭证金额等"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={attachmentForm.is_public ?? true}
                  onChange={(e) =>
                    setAttachmentForm({ ...attachmentForm, is_public: e.target.checked })
                  }
                />
                <span>对全家公开（不勾选则作为私密资料，仅自己可见）</span>
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowAttachmentModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitAttachment}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAttachment && (
        <div className="modal-overlay" onClick={() => setSelectedAttachment(null)}>
          <div className="modal-content attachment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{selectedAttachment.title}</h2>
            <div className="attachment-detail-preview">
              {isAttachmentImageLike(selectedAttachment.url) ? (
                <img src={selectedAttachment.url} alt={selectedAttachment.title} />
              ) : (
                <a
                  href={selectedAttachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="attachment-link-card"
                >
                  🔗 打开链接查看：{selectedAttachment.url}
                </a>
              )}
            </div>
            <div className="attachment-detail-meta">
              <div className="final-row">
                <span className="final-label">资料类型</span>
                <span className="final-value">{selectedAttachment.attachment_type}</span>
              </div>
              <div className="final-row">
                <span className="final-label">形成时间</span>
                <span className="final-value">
                  {selectedAttachment.capture_time || '未标注'}
                </span>
              </div>
              <div className="final-row">
                <span className="final-label">上传人</span>
                <span className="final-value">
                  {selectedAttachment.uploader || '未标注'}
                </span>
              </div>
              <div className="final-row">
                <span className="final-label">可见性</span>
                <span className="final-value">
                  {selectedAttachment.is_public ? '🔓 对全家公开' : '🔒 私密资料'}
                </span>
              </div>
              {selectedAttachment.remark && (
                <div className="final-section">
                  <h4 className="final-subtitle">说明备注</h4>
                  <p className="final-text">{selectedAttachment.remark}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedAttachment(null)}>
                关闭
              </button>
              <button
                className="btn-primary danger"
                onClick={() => handleDeleteAttachment(selectedAttachment.id)}
                disabled={submitting}
              >
                {submitting ? '删除中...' : '删除附件'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingInspection ? '编辑盘点记录' : '新增盘点记录'}
            </h2>
            <div className="form-row-two">
              <div className="form-group">
                <label>盘点日期 *</label>
                <input
                  type="date"
                  value={inspectionForm.inspection_date || ''}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, inspection_date: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>盘点人 *</label>
                <input
                  type="text"
                  value={inspectionForm.inspector || ''}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, inspector: e.target.value })
                  }
                  className="form-input"
                  placeholder="请输入盘点人姓名"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inspectionForm.is_present ?? true}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, is_present: e.target.checked })
                  }
                />
                <span>实物在位</span>
              </label>
            </div>
            <div className="form-group">
              <label>保存状态变化</label>
              <input
                type="text"
                className="form-input"
                value={inspectionForm.condition_change || ''}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, condition_change: e.target.value })
                }
                placeholder="如：状态稳定、釉面光泽减退、纸张脆化等"
              />
            </div>
            <div className="form-group">
              <label>环境风险（可多选）</label>
              <div className="checkbox-group risk-checkboxes">
                {INSPECTION_RISK_TYPES.map((risk) => {
                  const meta = INSPECTION_RISK_META[risk] || { icon: '⚠️', color: '#c25a3a' }
                  return (
                    <label
                      key={risk}
                      className={`checkbox-item risk-item ${
                        selectedInspectionRisks.includes(risk) ? 'checked' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedInspectionRisks.includes(risk)}
                        onChange={() => toggleInspectionRisk(risk)}
                      />
                      <span>
                        {meta.icon} {risk}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="form-group">
              <label>处理建议</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={inspectionForm.handling_suggestions || ''}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, handling_suggestions: e.target.value })
                }
                placeholder="针对当前状态的处理建议和措施"
              />
            </div>
            <div className="form-group">
              <label>下次复查日期</label>
              <input
                type="date"
                className="form-input"
                value={inspectionForm.next_review_date || ''}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, next_review_date: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={inspectionForm.notes || ''}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, notes: e.target.value })
                }
                placeholder="其他需要说明的内容"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowInspectionModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitInspection}
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemDetailPage
