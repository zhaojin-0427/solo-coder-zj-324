import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi, intentionsApi } from '../services/api'
import { HeirloomItem, InheritanceIntention } from '../types'
import './InheritancePage.css'

type FilterType = 'all' | 'confirmed' | 'pending'

function InheritancePage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [confirmingId, setConfirmingId] = useState<string | number | null>(null)

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

          if (!currentIntention) return null

          return (
            <div key={item.id} className="intention-card">
              <div className="card-top">
                <Link to={`/items/${item.id}`} className="item-link">
                  <h3 className="item-name">{item.name}</h3>
                </Link>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: isConfirmed ? '#5a8f5a15' : '#c8942e15',
                    color: isConfirmed ? '#5a8f5a' : '#c8942e',
                  }}
                >
                  {isConfirmed ? '已确认' : '待确认'}
                </span>
              </div>

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

              <div className="card-bottom">
                <span className="confirm-date">
                  创建日期：{formatDate(currentIntention.created_at)}
                </span>
                {!isConfirmed && (
                  <button
                    className="confirm-btn"
                    onClick={() => handleConfirm(item.id, currentIntention.id)}
                    disabled={confirmingId === currentIntention.id}
                  >
                    {confirmingId === currentIntention.id ? '确认中...' : '确认此意向'}
                  </button>
                )}
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
    </div>
  )
}

export default InheritancePage
