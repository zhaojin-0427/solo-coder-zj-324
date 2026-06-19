import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi, discussionsApi } from '../services/api'
import { HeirloomItem, Discussion } from '../types'
import './DiscussionsPage.css'

type ViewMode = 'all' | 'has_discussion' | 'no_discussion'

function DiscussionsPage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | number | null>(null)
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const [filterItemId, setFilterItemId] = useState<string | number | ''>('')
  const [filterAuthor, setFilterAuthor] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([])
  const [filterLoading, setFilterLoading] = useState(false)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsApi.getItems()
        setItems(data)
        if (data.length > 0) {
          const firstWithDiscussion = data.find(
            (item) => item.discussions && item.discussions.length > 0
          )
          if (firstWithDiscussion) {
            setExpandedId(firstWithDiscussion.id)
          }
        }
      } catch (err: any) {
        setError(err.message || '加载讨论列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const allAuthors = useMemo(() => {
    const authorSet = new Set<string>()
    items.forEach((item) => {
      item.discussions?.forEach((d) => {
        if (d.author) authorSet.add(d.author)
      })
    })
    return Array.from(authorSet)
  }, [items])

  const applyFilter = async () => {
    const hasAnyFilter = filterItemId !== '' || filterAuthor.trim() !== '' || filterKeyword.trim() !== ''
    if (!hasAnyFilter) {
      setFilteredDiscussions([])
      return
    }
    try {
      setFilterLoading(true)
      setError(null)
      const params: any = {}
      if (filterItemId !== '') params.item_id = filterItemId
      if (filterAuthor.trim()) params.author = filterAuthor.trim()
      if (filterKeyword.trim()) params.keyword = filterKeyword.trim()
      const result = await discussionsApi.getAllDiscussions(params)
      setFilteredDiscussions(result)
    } catch (err: any) {
      setError(err.message || '筛选讨论失败')
    } finally {
      setFilterLoading(false)
    }
  }

  const clearFilter = () => {
    setFilterItemId('')
    setFilterAuthor('')
    setFilterKeyword('')
    setFilteredDiscussions([])
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilter()
    }, 300)
    return () => clearTimeout(timer)
  }, [filterItemId, filterAuthor, filterKeyword])

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
      setItems(updatedItems)

      setNewComments((prev) => ({
        ...prev,
        [itemId]: '',
      }))
      setExpandedId(itemId)
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

  const getItemNameById = (id: string | number): string => {
    const item = items.find((i) => String(i.id) === String(id))
    return item?.name || `旧物 #${id}`
  }

  const displayedItems = items.filter((item) => {
    const hasDiscussion = item.discussions && item.discussions.length > 0
    if (viewMode === 'has_discussion') return hasDiscussion
    if (viewMode === 'no_discussion') return !hasDiscussion
    return true
  })

  const hasActiveFilter = filteredDiscussions.length > 0 || filterItemId !== '' || filterAuthor !== '' || filterKeyword !== ''

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
          <p className="page-subtitle">记录家族事务的讨论过程，开启家庭协商闭环</p>
        </div>
      </div>

      <div className="filter-panel">
        <h4 className="filter-title">🔍 讨论筛选</h4>
        <div className="filter-row">
          <div className="filter-item">
            <label>按旧物筛选</label>
            <select
              className="filter-select"
              value={filterItemId}
              onChange={(e) => setFilterItemId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">全部旧物</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>按发言人筛选</label>
            <select
              className="filter-select"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
            >
              <option value="">全部发言人</option>
              {allAuthors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item grow">
            <label>关键词搜索</label>
            <input
              type="text"
              className="filter-input"
              placeholder="输入关键词搜索讨论内容..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
          {hasActiveFilter && (
            <button className="clear-filter-btn" onClick={clearFilter}>
              清除筛选
            </button>
          )}
        </div>
      </div>

      {hasActiveFilter && (
        <div className="filter-results">
          <div className="filter-results-header">
            <h4>📋 筛选结果（共 {filteredDiscussions.length} 条）</h4>
          </div>
          {filterLoading ? (
            <div className="loading-state small">
              <p>正在筛选...</p>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="empty-state small">
              <p>未找到符合条件的讨论</p>
            </div>
          ) : (
            <div className="comments-list">
              {filteredDiscussions.map((discussion) => (
                <div key={`${discussion.id}-${discussion.item_id}`} className="comment-item with-item">
                  <div className="comment-avatar">
                    {discussion.author.charAt(0)}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{discussion.author}</span>
                      <Link to={`/items/${discussion.item_id}`} className="comment-item-link">
                        📦 {getItemNameById(discussion.item_id)}
                      </Link>
                      <span className="comment-time">
                        {formatDateTime(discussion.created_at)}
                      </span>
                    </div>
                    <p className="comment-text">{discussion.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="view-tabs">
        {[
          { key: 'all', label: '全部旧物', count: items.length },
          {
            key: 'has_discussion',
            label: '已有讨论',
            count: items.filter((i) => i.discussions && i.discussions.length > 0).length,
          },
          {
            key: 'no_discussion',
            label: '尚无讨论',
            count: items.filter((i) => !i.discussions || i.discussions.length === 0).length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`view-tab ${viewMode === tab.key ? 'active' : ''}`}
            onClick={() => setViewMode(tab.key as ViewMode)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <div className="empty-state">
          <p>该分类下暂无旧物</p>
        </div>
      ) : (
        <div className="discussion-list">
          {displayedItems.map((item) => {
            const hasDiscussion = item.discussions && item.discussions.length > 0
            return (
              <div key={item.id} className={`discussion-card ${!hasDiscussion ? 'no-discussion' : ''}`}>
                <div
                  className="discussion-header"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="header-main">
                    <Link to={`/items/${item.id}`} className="item-link" onClick={(e) => e.stopPropagation()}>
                      <h3 className="discussion-topic">{item.name}</h3>
                    </Link>
                    <div className="header-tags">
                      <span className="related-item">📦 {item.category}</span>
                      {hasDiscussion ? (
                        <span className="status-tag active">💬 讨论中</span>
                      ) : (
                        <span className="status-tag pending">📝 待发起讨论</span>
                      )}
                    </div>
                  </div>
                  <div className="header-info">
                    <span className="comment-count">
                      💬 {item.discussions?.length || 0} 条讨论
                    </span>
                    <span className={`expand-icon ${expandedId === item.id ? 'expanded' : ''}`}>
                      ▾
                    </span>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="discussion-content">
                    <div className="discussion-meta">
                      <span>共 {item.discussions?.length || 0} 条讨论</span>
                      {!hasDiscussion && (
                        <span className="meta-tip">✨ 成为第一个发起讨论的人吧！</span>
                      )}
                    </div>

                    {hasDiscussion && (
                      <div className="comments-section">
                        <h4 className="comments-title">讨论列表</h4>
                        <div className="comments-list">
                          {item.discussions!.map((discussion) => (
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
                    )}

                    <div className="add-comment">
                      <div className="comment-avatar small">
                        我
                      </div>
                      <div className="comment-input-area">
                        <textarea
                          className="comment-input"
                          placeholder={hasDiscussion ? '写下你的想法...' : '发起第一条讨论，开启家庭协商...'}
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
                            {submittingId === item.id
                              ? '发表中...'
                              : hasDiscussion
                              ? '发表评论'
                              : '📝 发起讨论'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscussionsPage
