import { useState, useEffect } from 'react'
import { statisticsApi } from '../services/api'
import { StatisticsResponse } from '../types'
import './StatisticsPage.css'

const RECIPIENT_COLORS = [
  '#8b6914',
  '#c8942e',
  '#5a8f5a',
  '#6b8cae',
  '#a08060',
  '#c25a3a',
  '#9b7bb8',
  '#5e9e9c',
]

function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await statisticsApi.getStatistics()
        setStats(data)
      } catch (err: any) {
        setError(err.message || '加载统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchStatistics()
  }, [])

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">统计概览</h2>
            <p className="page-subtitle">家族旧物档案数据一览</p>
          </div>
        </div>
        <div className="loading-state">
          <p>📊 正在加载统计数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="statistics-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">统计概览</h2>
            <p className="page-subtitle">家族旧物档案数据一览</p>
          </div>
        </div>
        <div className="error-state">
          <p>😢 {error}</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const maxCategoryCount = Math.max(...stats.category_distribution.map((c) => c.count), 1)
  const maxMemberCount = Math.max(...stats.top_related_family_members.map((m) => m.count), 1)
  const maxRecipientCount = Math.max(
    ...stats.pending_recipient_distribution.map((r) => r.count),
    1
  )

  const pendingCount = stats.pending_intentions_count
  const confirmedCount = stats.confirmed_inheritance_count
  const totalItems = stats.total_items

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">统计概览</h2>
          <p className="page-subtitle">家族旧物档案数据一览</p>
        </div>
      </div>

      <div className="stats-overview">
        <div className="overview-card main">
          <div className="overview-icon">📦</div>
          <div className="overview-info">
            <span className="overview-number">{stats.total_items}</span>
            <span className="overview-label">旧物总数</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">✅</div>
          <div className="overview-info">
            <span className="overview-number confirmed">{stats.confirmed_inheritance_count}</span>
            <span className="overview-label">已确认传承</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">⏳</div>
          <div className="overview-info">
            <span className="overview-number pending">
              {stats.pending_intentions_count}
            </span>
            <span className="overview-label">待确认意向</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">📊 各类别占比</h3>
          <div className="category-chart">
            {stats.category_distribution.map((item) => (
              <div key={item.category} className="category-row">
                <span className="category-name">{item.category}</span>
                <div className="category-bar-container">
                  <div
                    className="category-bar"
                    style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                  ></div>
                </div>
                <span className="category-count">{item.count} 件</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">👨‍👩‍👧‍👦 高频关联人物</h3>
          <div className="member-chart">
            {stats.top_related_family_members.map((item, index) => (
              <div key={item.id} className="member-row">
                <span className="member-rank">{index + 1}</span>
                <div className="member-avatar">{item.name.charAt(0)}</div>
                <div className="member-info">
                  <span className="member-name">{item.name}</span>
                  <span className="member-relation">{item.relation}</span>
                </div>
                <div className="member-bar-container">
                  <div
                    className="member-bar"
                    style={{ width: `${(item.count / maxMemberCount) * 100}%` }}
                  ></div>
                </div>
                <span className="member-count">{item.count} 件</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card full-width">
          <h3 className="chart-title">📋 待确认去向分布</h3>
          {stats.pending_recipient_distribution.length > 0 ? (
            <div className="recipient-chart">
              <div className="recipient-bars">
                {stats.pending_recipient_distribution.map((item, index) => (
                  <div key={item.recipient} className="recipient-bar-item">
                    <div
                      className="recipient-bar"
                      style={{
                        height: `${(item.count / maxRecipientCount) * 100 * 2.5}%`,
                        backgroundColor:
                          RECIPIENT_COLORS[index % RECIPIENT_COLORS.length],
                      }}
                    ></div>
                    <span className="recipient-value">{item.count}</span>
                    <span className="recipient-label">{item.recipient}</span>
                  </div>
                ))}
              </div>
              <div className="recipient-legend">
                {stats.pending_recipient_distribution.map((item, index) => (
                  <div key={item.recipient} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{
                        backgroundColor: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length],
                      }}
                    ></span>
                    <span className="legend-text">
                      {item.recipient}（{item.count}件）
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>暂无待确认的传承意向</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage
