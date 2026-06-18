import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { itemsApi } from '../services/api'
import { HeirloomItem } from '../types'
import './ItemDetailPage.css'

const conditionLabels: Record<string, string> = {
  excellent: '完好',
  good: '良好',
  fair: '一般',
  poor: '需修复',
}

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<HeirloomItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <Link to="/items" className="back-link">← 返回列表</Link>
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
              <img src={item.cover_image} alt={item.name} />
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
            <span className="tag condition">
              状态：{conditionLabels[item.condition]}
            </span>
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

          <div className="info-section">
            <h3 className="section-title">🔧 修补记录</h3>
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
            <h3 className="section-title">📍 存放位置</h3>
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
    </div>
  )
}

export default ItemDetailPage
