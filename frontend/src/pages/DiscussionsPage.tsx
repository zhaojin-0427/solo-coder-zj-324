import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi, discussionsApi } from '../services/api'
import { HeirloomItem, Discussion } from '../types'
import './DiscussionsPage.css'

function DiscussionsPage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | number | null>(null)
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | number | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsApi.getItems()
        const itemsWithDiscussions = data.filter((item) => item.discussions && item.discussions.length > 0)
        setItems(itemsWithDiscussions)
        if (itemsWithDiscussions.length > 0) {
          setExpandedId(itemsWithDiscussions[0].id)
        }
      } catch (err: any) {
        setError(err.message || '加载讨论列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const toggleExpand = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCommentChange = (itemId: string | number, value: string) => {
    setNewComments((prev) => ({
      ...prev,
      [itemId]: value,
    }))
  }

  const handleAddComment = async (itemId: string | number) => {
    const content = newComments[itemId]?.trim()
    if (!content) return

    try {
      setSubmittingId(itemId)
      setError(null)

      await discussionsApi.addDiscussion(itemId, {
        content,
        author: '当前用户',
      })

      const updatedItems = await itemsApi.getItems()
      const itemsWithDiscussions = updatedItems.filter(
        (item) => item.discussions && item.discussions.length > 0
      )
      setItems(itemsWithDiscussions)

      setNewComments((prev) => ({
        ...prev,
        [itemId]: '',
      }))
    } catch (err: any) {
      setError(err.message || '发表评论失败')
    } finally {
      setSubmittingId(null)
    }
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

  const itemsWithDiscussions = items.filter(
    (item) => item.discussions && item.discussions.length > 0
  )

  if (loading) {
    return (
      <div className="discussions-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">家庭讨论</h2>
            <p className="page-subtitle">记录家族事务的讨论过程</p>
          </div>
        </div>
        <div className="loading-state">
          <p>💬 正在加载讨论列表...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="discussions-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">家庭讨论</h2>
            <p className="page-subtitle">记录家族事务的讨论过程</p>
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
    <div className="discussions-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">家庭讨论</h2>
          <p className="page-subtitle">记录家族事务的讨论过程</p>
        </div>
      </div>

      {itemsWithDiscussions.length === 0 ? (
        <div className="empty-state">
          <p>暂无讨论内容</p>
        </div>
      ) : (
        <div className="discussion-list">
          {itemsWithDiscussions.map((item) => (
            <div key={item.id} className="discussion-card">
              <div
                className="discussion-header"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="header-main">
                  <Link to={`/items/${item.id}`} className="item-link">
                    <h3 className="discussion-topic">{item.name}</h3>
                  </Link>
                  <span className="related-item">📦 旧物讨论</span>
                </div>
                <div className="header-info">
                  <span className="comment-count">
                    💬 {item.discussions.length} 条讨论
                  </span>
                  <span className={`expand-icon ${expandedId === item.id ? 'expanded' : ''}`}>
                    ▾
                  </span>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="discussion-content">
                  <div className="discussion-meta">
                    <span>共 {item.discussions.length} 条讨论</span>
                  </div>

                  <div className="comments-section">
                    <h4 className="comments-title">讨论列表</h4>
                    <div className="comments-list">
                      {item.discussions.map((discussion) => (
                        <div key={discussion.id} className="comment-item">
                          <div className="comment-avatar">
                            {discussion.author.charAt(0)}
                          </div>
                          <div className="comment-body">
                            <div className="comment-header">
                              <span className="comment-author">{discussion.author}</span>
                              <span className="comment-time">
                                {formatDateTime(discussion.created_at)}
                              </span>
                            </div>
                            <p className="comment-text">{discussion.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="add-comment">
                    <div className="comment-avatar small">
                      我
                    </div>
                    <div className="comment-input-area">
                      <textarea
                        className="comment-input"
                        placeholder="写下你的想法..."
                        value={newComments[item.id] || ''}
                        onChange={(e) =>
                          handleCommentChange(item.id, e.target.value)
                        }
                        rows={3}
                      />
                      <div className="comment-actions">
                        <button
                          className="send-btn"
                          onClick={() => handleAddComment(item.id)}
                          disabled={
                            !newComments[item.id]?.trim() ||
                            submittingId === item.id
                          }
                        >
                          {submittingId === item.id ? '发表中...' : '发表评论'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DiscussionsPage
