import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi, intentionsApi } from '../services/api'
import { HeirloomItem, InheritanceIntention } from '../types'
import './InheritancePage.css'

type FilterType = 'all_items' | 'all' | 'confirmed' | 'pending'

function InheritancePage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [confirmingId, setConfirmingId] = useState<string | number | null>(null)
  const [showAddIntentionModal, setShowAddIntentionModal] = useState(false)
  const [currentItem, setCurrentItem] = useState<HeirloomItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [intentionForm, setIntentionForm] = useState({
    proposed_by: '',
    proposed_recipient: '',
    reason: '',
  })

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsApi.getItems()
        setItems(data)
      } catch (err: any) {
        setError(err.message || '加载传承意向失败')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const getItemIntentions = (item: HeirloomItem) => {
    return item.intentions || []
  }

  const getLatestIntention = (item: HeirloomItem): InheritanceIntention | null => {
    const intentions = getItemIntentions(item)
    if (intentions.length === 0) return null
    return intentions.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    )
  }

  const getFinalIntention = (item: HeirloomItem): InheritanceIntention | null => {
    const intentions = getItemIntentions(item)
    return intentions.find((i) => i.is_final) || null
  }

  const hasConfirmed = (item: HeirloomItem) => {
    return getItemIntentions(item).some((i) => i.is_final)
  }

  const hasIntentions = (item: HeirloomItem) => {
    return getItemIntentions(item).length > 0
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all_items') return true
    if (filter === 'all') return hasIntentions(item)
    if (filter === 'confirmed') return hasConfirmed(item)
    if (filter === 'pending') return hasIntentions(item) && !hasConfirmed(item)
    return true
  })

  const stats = {
    total: items.filter(hasIntentions).length,
    confirmed: items.filter(hasConfirmed).length,
    pending: items.filter((item) => hasIntentions(item) && !hasConfirmed(item)).length,
  }

  const handleConfirm = async (itemId: string | number, intentionId: string | number) => {
    try {
      setConfirmingId(intentionId)
      setError(null)
      await intentionsApi.confirmIntention(itemId, intentionId)
      const updatedItems = await itemsApi.getItems()
      setItems(updatedItems)
    } catch (err: any) {
      setError(err.message || '确认失败')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleOpenAddIntention = (item: HeirloomItem) => {
    setCurrentItem(item)
    setIntentionForm({
      proposed_by: '',
      proposed_recipient: '',
      reason: '',
    })
    setShowAddIntentionModal(true)
  }

  const getNextVersion = (item: HeirloomItem): number => {
    const intentions = getItemIntentions(item)
    if (intentions.length === 0) return 1
    const maxVersion = intentions.reduce((max, curr) => Math.max(max, curr.version), 0)
    return maxVersion + 1
  }

  const handleSubmitIntention = async () => {
    if (!currentItem) return
    if (!intentionForm.proposed_by.trim() || !intentionForm.proposed_recipient.trim()) {
      setError('请填写提议人和预期传承人')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const version = getNextVersion(currentItem)
      await intentionsApi.createIntention(currentItem.id, {
        ...intentionForm,
        version,
      })
      const updatedItems = await itemsApi.getItems()
      setItems(updatedItems)
      setShowAddIntentionModal(false)
      setCurrentItem(null)
    } catch (err: any) {
      setError(err.message || '创建传承意向失败')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="inheritance-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">传承意向</h2>
            <p className="page-subtitle">记录家族旧物的传承安排</p>
          </div>
        </div>
        <div className="loading-state">
          <p>📜 正在加载传承意向...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inheritance-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">传承意向</h2>
            <p className="page-subtitle">记录家族旧物的传承安排</p>
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
    <div className="inheritance-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">传承意向</h2>
          <p className="page-subtitle">记录家族旧物的传承安排</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card total">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">有传承安排</span>
        </div>
        <div className="stat-card confirmed">
          <span className="stat-number">{stats.confirmed}</span>
          <span className="stat-label">已确认</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-number">{stats.pending}</span>
          <span className="stat-label">待确认</span>
        </div>
      </div>

      <div className="filter-tabs">
        {[
          { key: 'all_items', label: '全部旧物' },
          { key: 'all', label: '全部' },
          { key: 'confirmed', label: '已确认' },
          { key: 'pending', label: '待确认' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key as FilterType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="intention-list">
        {filteredItems.map((item) => {
          const finalIntention = getFinalIntention(item)
          const latestIntention = getLatestIntention(item)
          const currentIntention = finalIntention || latestIntention
          const isConfirmed = !!finalIntention
          const hasAnyIntention = hasIntentions(item)

          return (
            <div key={item.id} className="intention-card">
              <div className="card-top">
                <Link to={`/items/${item.id}`} className="item-link">
                  <h3 className="item-name">{item.name}</h3>
                </Link>
                {hasAnyIntention ? (
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: isConfirmed ? '#5a8f5a15' : '#c8942e15',
                      color: isConfirmed ? '#5a8f5a' : '#c8942e',
                    }}
                  >
                    {isConfirmed ? '已确认' : '待确认'}
                  </span>
                ) : (
                  <span
                    className="status-badge"
                    style={{ backgroundColor: '#a0806015', color: '#a08060' }}
                  >
                    未安排
                  </span>
                )}
              </div>

              {currentIntention ? (
                <>
                  <div className="info-row">
                    <span className="info-label">提议人</span>
                    <span className="info-value">{currentIntention.proposed_by}</span>
                  </div>

                  {currentIntention.proposed_recipient && (
                    <div className="info-row">
                      <span className="info-label">预期传承人</span>
                      <span className="info-value">{currentIntention.proposed_recipient}</span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">版本</span>
                    <span className="info-value">第 {currentIntention.version} 版</span>
                  </div>

                  {currentIntention.reason && (
                    <div className="section">
                      <h4 className="section-label">📝 传承理由</h4>
                      <p className="section-content">{currentIntention.reason}</p>
                    </div>
                  )}

                  {getItemIntentions(item).length > 1 && (
                    <div className="section">
                      <h4 className="section-label">📋 历史版本</h4>
                      <div className="version-list">
                        {[...getItemIntentions(item)]
                          .sort((a, b) => b.version - a.version)
                          .map((version) => (
                            <div
                              key={version.id}
                              className={`version-item ${version.is_final ? 'final' : ''}`}
                            >
                              <span className="version-tag">v{version.version}</span>
                              <span className="version-desc">
                                {version.reason || '传承安排'}
                              </span>
                              {version.is_final && (
                                <span className="version-badge final">最终版</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="section">
                  <p className="empty-text">暂无传承意向，点击下方按钮添加</p>
                </div>
              )}

              <div className="card-bottom">
                <span className="confirm-date">
                  {currentIntention
                    ? `创建日期：${formatDate(currentIntention.created_at)}`
                    : '尚未安排'}
                </span>
                <div className="card-buttons">
                  {!isConfirmed && hasAnyIntention && (
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirm(item.id, currentIntention!.id)}
                      disabled={confirmingId === currentIntention!.id}
                    >
                      {confirmingId === currentIntention!.id ? '确认中...' : '确认此意向'}
                    </button>
                  )}
                  {!isConfirmed && (
                    <button
                      className="add-intention-btn"
                      onClick={() => handleOpenAddIntention(item)}
                    >
                      + 提出新去向
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <p>暂无该状态的传承意向</p>
        </div>
      )}

      {showAddIntentionModal && currentItem && (
        <div className="modal-overlay" onClick={() => setShowAddIntentionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              提出新去向 - {currentItem.name}（v{getNextVersion(currentItem)}）
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
                onClick={() => setShowAddIntentionModal(false)}
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
    </div>
  )
}

export default InheritancePage
