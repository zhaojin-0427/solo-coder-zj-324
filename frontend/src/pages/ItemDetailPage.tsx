import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { itemsApi, repairRecordsApi, storageApi, intentionsApi, discussionsApi } from '../services/api'
import {
  HeirloomItem,
  RepairRecord,
  StorageLocation,
  InheritanceIntention,
  Discussion,
} from '../types'
import './ItemDetailPage.css'

function isImageUrl(str?: string): boolean {
  if (!str) return false
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')
}

function getConditionColor(condition: string): string {
  const c = condition || ''
  if (c.includes('完好') || c.includes('优秀') || c.includes('完美')) return '#5a8f5a'
  if (c.includes('良好') || c.includes('不错')) return '#8b6914'
  if (c.includes('一般') || c.includes('划痕') || c.includes('泛黄')) return '#c8942e'
  if (c.includes('修复') || c.includes('保养') || c.includes('破损')) return '#c25a3a'
  return '#a08060'
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

  const sortedIntentions = (item?.intentions || []).slice().sort((a, b) => b.version - a.version)
  const finalIntention = sortedIntentions.find((i) => i.is_final) || null
  const hasConfirmed = !!finalIntention

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
              <h3 className="section-title">📍 存放位置</h3>
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
    </div>
  )
}

export default ItemDetailPage
