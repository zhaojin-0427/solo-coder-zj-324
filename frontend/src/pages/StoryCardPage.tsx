import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { storyCardApi, itemsApi } from '../services/api'
import { StoryCard, HeirloomItem } from '../types'
import './StoryCardPage.css'

function StoryCardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<HeirloomItem | null>(null)
  const [storyCard, setStoryCard] = useState<StoryCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState<StoryCard>({
    id: '',
    item_id: '',
    oral_history: '',
    special_memory: '',
    intended_recipient: '',
    narrator: '',
    recorded_by: '',
  })

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const itemData = await itemsApi.getItem(id)
        setItem(itemData)

        try {
          const storyData = await storyCardApi.getStoryCard(id)
          setStoryCard(storyData)
          setFormData(storyData)
        } catch (storyErr: any) {
          if (storyErr.response?.status === 404) {
            setStoryCard(null)
            setFormData({
              id: '',
              item_id: id,
              oral_history: '',
              special_memory: '',
              intended_recipient: '',
              narrator: '',
              recorded_by: '',
            })
          } else {
            throw storyErr
          }
        }
      } catch (err: any) {
        setError(err.message || '加载数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="story-card-page">
        <div className="loading-state">
          <p>📜 正在加载故事卡...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="story-card-page">
        <div className="error-state">
          <p>😢 {error}</p>
          <button onClick={() => navigate('/items')}>返回列表</button>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="story-card-page">
        <div className="not-found">
          <p>未找到该旧物</p>
          <button onClick={() => navigate('/items')}>返回列表</button>
        </div>
      </div>
    )
  }

  const handleChange = (field: keyof StoryCard, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!id) return

    try {
      setSaving(true)
      setError(null)

      if (storyCard) {
        const updated = await storyCardApi.updateStoryCard(id, formData)
        setStoryCard(updated)
        setFormData(updated)
      } else {
        const created = await storyCardApi.createStoryCard(id, formData)
        setStoryCard(created)
        setFormData(created)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <div className="story-card-page">
      <div className="page-header">
        <div>
          <Link to={`/items/${item.id}`} className="back-link">
            ← 返回详情
          </Link>
          <h2 className="page-title">故事卡编辑</h2>
          <p className="page-subtitle">{item.name}</p>
        </div>
        <div className="header-actions">
          {saved && <span className="save-tip">✓ 已保存</span>}
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存故事卡'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="story-card-container">
        <div className="card-decoration top-left"></div>
        <div className="card-decoration top-right"></div>
        <div className="card-decoration bottom-left"></div>
        <div className="card-decoration bottom-right"></div>

        <div className="card-header">
          <h3 className="card-title">📜 家族故事卡</h3>
          <p className="card-item-name">{item.name}</p>
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🎙️</span>
            口述来历
          </label>
          <textarea
            className="form-textarea large"
            value={formData.oral_history}
            onChange={(e) => handleChange('oral_history', e.target.value)}
            placeholder="请记录这件旧物的来龙去脉，它是怎么来到我们家的？背后有什么故事？"
            rows={5}
          />
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">💭</span>
            特殊记忆
          </label>
          <textarea
            className="form-textarea large"
            value={formData.special_memory}
            onChange={(e) => handleChange('special_memory', e.target.value)}
            placeholder="你和这件旧物有什么特别的回忆？有哪些难忘的瞬间？"
            rows={5}
          />
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🎁</span>
            预期传承人
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.intended_recipient || ''}
            onChange={(e) => handleChange('intended_recipient', e.target.value)}
            placeholder="你希望这件旧物未来传给谁？"
          />
        </div>

        <div className="form-row">
          <div className="form-section half">
            <label className="form-label">
              <span className="label-icon">🗣️</span>
              讲述人
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.narrator || ''}
              onChange={(e) => handleChange('narrator', e.target.value)}
              placeholder="是谁讲述的这个故事"
            />
          </div>

          <div className="form-section half">
            <label className="form-label">
              <span className="label-icon">✍️</span>
              记录人
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.recorded_by || ''}
              onChange={(e) => handleChange('recorded_by', e.target.value)}
              placeholder="是谁记录的这个故事"
            />
          </div>
        </div>

        <div className="card-footer">
          <div className="meta-info">
            {formData.updated_at && (
              <span>最后编辑：{formatDate(formData.updated_at)}</span>
            )}
            {formData.recorded_by && (
              <span>记录人：{formData.recorded_by}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h4 className="tips-title">💡 记录小贴士</h4>
        <ul className="tips-list">
          <li>尽量记录具体的时间、地点和人物，让故事更真实可感</li>
          <li>可以写多个小故事，不用限制篇幅</li>
          <li>记得请家中长辈一起回忆，他们知道更多故事</li>
          <li>可以补充照片、音频等资料，让记忆更立体</li>
        </ul>
      </div>
    </div>
  )
}

export default StoryCardPage
