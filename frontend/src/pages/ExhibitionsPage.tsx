import { useCallback, useEffect, useState } from 'react'
import { exhibitionsApi, itemsApi } from '../services/api'
import {
  ExhibitionPlan,
  ExhibitionPlanCreate,
  ExhibitionFilterParams,
  ExhibitionItem,
  HeirloomItem,
  EXHIBITION_STATUSES,
  EXHIBITION_STATUS_META,
  EXHIBITION_RETURN_STATUSES,
  EXHIBITION_RETURN_META,
} from '../types'
import './ExhibitionsPage.css'

interface FormItem {
  item_id: string | number
  narrative_focus: string
  return_status: string
  transport_risk: boolean
}

const emptyForm = {
  theme: '',
  event_time: '',
  location: '',
  planner: '',
  required_materials: '',
  transport_notes: '',
  status: EXHIBITION_STATUSES[0],
}

const ExhibitionsPage: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<ExhibitionPlan[]>([])
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExhibitionFilterParams>({})

  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<ExhibitionPlan | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<{
    theme: string
    event_time: string
    location: string
    planner: string
    required_materials: string
    transport_notes: string
    status: string
  }>({ ...emptyForm })
  const [formItems, setFormItems] = useState<FormItem[]>([])

  const [showDetail, setShowDetail] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<ExhibitionPlan | null>(null)
  const [detailItems, setDetailItems] = useState<ExhibitionItem[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [narrativeDrafts, setNarrativeDrafts] = useState<Record<string, string>>({})

  const fetchExhibitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: ExhibitionFilterParams = {}
      if (filters.status) params.status = filters.status
      if (filters.location) params.location = filters.location
      if (filters.theme) params.theme = filters.theme
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date + ' 23:59'
      const data = await exhibitionsApi.getExhibitions(params)
      setExhibitions(data)
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '加载展陈方案失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchExhibitions()
    }, 300)
    return () => clearTimeout(t)
  }, [fetchExhibitions])

  useEffect(() => {
    itemsApi
      .getItems()
      .then(setItems)
      .catch(() => {})
  }, [])

  const refreshListSilently = useCallback(async () => {
    try {
      const params: ExhibitionFilterParams = {}
      if (filters.status) params.status = filters.status
      if (filters.location) params.location = filters.location
      if (filters.theme) params.theme = filters.theme
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date + ' 23:59'
      const data = await exhibitionsApi.getExhibitions(params)
      setExhibitions(data)
      if (selectedPlan) {
        const updated = data.find((p) => String(p.id) === String(selectedPlan.id))
        if (updated) setSelectedPlan(updated)
      }
    } catch {
      // ignore silent refresh errors
    }
  }, [filters, selectedPlan])

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...emptyForm })
    setFormItems([])
    setShowForm(true)
    setError(null)
  }

  const openEdit = (plan: ExhibitionPlan) => {
    setEditingPlan(plan)
    setForm({
      theme: plan.theme,
      event_time: plan.event_time || '',
      location: plan.location || '',
      planner: plan.planner || '',
      required_materials: plan.required_materials || '',
      transport_notes: plan.transport_notes || '',
      status: plan.status,
    })
    setFormItems(
      [...plan.items]
        .sort((a, b) => a.display_order - b.display_order)
        .map((it) => ({
          item_id: it.item_id,
          narrative_focus: it.narrative_focus || '',
          return_status: it.return_status,
          transport_risk: it.transport_risk,
        }))
    )
    setShowForm(true)
    setShowDetail(false)
    setError(null)
  }

  const openDetail = async (plan: ExhibitionPlan) => {
    setShowDetail(true)
    setDetailLoading(true)
    setError(null)
    try {
      const full = await exhibitionsApi.getExhibition(plan.id)
      setSelectedPlan(full)
      const sorted = [...full.items].sort((a, b) => a.display_order - b.display_order)
      setDetailItems(sorted)
      const drafts: Record<string, string> = {}
      sorted.forEach((it) => {
        drafts[String(it.item_id)] = it.narrative_focus || ''
      })
      setNarrativeDrafts(drafts)
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '加载展陈详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleFormItem = (item: HeirloomItem) => {
    setFormItems((prev) => {
      const exists = prev.find((p) => String(p.item_id) === String(item.id))
      if (exists) return prev.filter((p) => String(p.item_id) !== String(item.id))
      return [
        ...prev,
        {
          item_id: item.id,
          narrative_focus: '',
          return_status: EXHIBITION_RETURN_STATUSES[0],
          transport_risk: false,
        },
      ]
    })
  }

  const updateFormItem = (itemId: string | number, patch: Partial<FormItem>) => {
    setFormItems((prev) =>
      prev.map((p) =>
        String(p.item_id) === String(itemId) ? { ...p, ...patch } : p
      )
    )
  }

  const moveFormItem = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= formItems.length) return
    setFormItems((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSubmit = async () => {
    if (!form.theme.trim()) {
      setError('请填写展陈主题')
      return
    }
    if (formItems.length === 0) {
      setError('请至少选择一件参与旧物')
      return
    }
    setSubmitting(true)
    setError(null)
    const payload: ExhibitionPlanCreate = {
      theme: form.theme.trim(),
      event_time: form.event_time.trim() || undefined,
      location: form.location.trim() || undefined,
      planner: form.planner.trim() || undefined,
      required_materials: form.required_materials.trim() || undefined,
      transport_notes: form.transport_notes.trim() || undefined,
      status: form.status,
      items: formItems.map((it) => ({
        item_id: it.item_id,
        narrative_focus: it.narrative_focus.trim() || undefined,
        return_status: it.return_status,
        transport_risk: it.transport_risk,
      })),
    }
    try {
      if (editingPlan) {
        await exhibitionsApi.updateExhibition(editingPlan.id, payload)
      } else {
        await exhibitionsApi.createExhibition(payload)
      }
      setShowForm(false)
      await fetchExhibitions()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '保存展陈方案失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (plan: ExhibitionPlan) => {
    if (!window.confirm(`确定删除展陈方案「${plan.theme}」吗？`)) return
    try {
      await exhibitionsApi.deleteExhibition(plan.id)
      if (selectedPlan && String(selectedPlan.id) === String(plan.id)) {
        setShowDetail(false)
        setSelectedPlan(null)
      }
      await fetchExhibitions()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '删除展陈方案失败')
    }
  }

  const persistOrder = async (newItems: ExhibitionItem[]) => {
    if (!selectedPlan) return
    try {
      await exhibitionsApi.reorderItems(
        selectedPlan.id,
        newItems.map((i) => i.item_id)
      )
      await refreshListSilently()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '调整顺序失败')
      if (selectedPlan) await openDetail(selectedPlan)
    }
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    const next = [...detailItems]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDetailItems(next)
    setDragIndex(null)
    persistOrder(next)
  }

  const moveDetailItem = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= detailItems.length) return
    const next = [...detailItems]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDetailItems(next)
    persistOrder(next)
  }

  const handleItemFieldChange = async (
    itemId: string | number,
    patch: Partial<ExhibitionItem>
  ) => {
    if (!selectedPlan) return
    try {
      const updated = await exhibitionsApi.updateExhibitionItem(
        selectedPlan.id,
        itemId,
        patch
      )
      setDetailItems((prev) =>
        prev.map((i) =>
          String(i.item_id) === String(itemId) ? { ...i, ...updated } : i
        )
      )
      const allReturned =
        detailItems
          .map((i) =>
            String(i.item_id) === String(itemId)
              ? { ...i, ...updated }
              : i
          )
          .every((i) => i.return_status === EXHIBITION_RETURN_STATUSES[1])
      if (allReturned) {
        setSelectedPlan((prev) =>
          prev ? { ...prev, status: EXHIBITION_STATUSES[3] } : prev
        )
      }
      await refreshListSilently()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail || err?.message || '更新展陈旧物失败')
    }
  }

  const saveNarrative = async (itemId: string | number) => {
    const value = narrativeDrafts[String(itemId)] ?? ''
    await handleItemFieldChange(itemId, { narrative_focus: value })
  }

  const itemById = (id: string | number) =>
    items.find((i) => String(i.id) === String(id))

  return (
    <div className="exhibitions-page">
      <div className="page-header">
        <h1 className="page-title">家族旧物展陈策划</h1>
        <p className="page-subtitle">
          围绕节日、纪念日或家族聚会，策划小型旧物展陈方案，记录展示顺序与归位状态
        </p>
      </div>

      <div className="exhibition-toolbar">
        <div className="filter-tabs">
          <button
            className={`tab-btn ${!filters.status ? 'active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, status: undefined }))}
          >
            全部
          </button>
          {EXHIBITION_STATUSES.map((s) => (
            <button
              key={s}
              className={`tab-btn ${filters.status === s ? 'active' : ''}`}
              onClick={() => setFilters((f) => ({ ...f, status: s }))}
            >
              {EXHIBITION_STATUS_META[s]?.icon} {s}
            </button>
          ))}
        </div>
        <div className="exhibition-filters">
          <input
            className="form-input exhibition-filter-input"
            placeholder="主题关键词"
            value={filters.theme || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, theme: e.target.value || undefined }))
            }
          />
          <input
            className="form-input exhibition-filter-input"
            placeholder="地点"
            value={filters.location || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, location: e.target.value || undefined }))
            }
          />
          <input
            type="date"
            className="form-input exhibition-filter-input"
            value={filters.start_date || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, start_date: e.target.value || undefined }))
            }
          />
          <input
            type="date"
            className="form-input exhibition-filter-input"
            value={filters.end_date || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, end_date: e.target.value || undefined }))
            }
          />
          <button className="btn-primary" onClick={openCreate}>
            ＋ 新增展陈方案
          </button>
        </div>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchExhibitions}>重试</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>加载中…</p>
        </div>
      ) : exhibitions.length === 0 ? (
        <div className="empty-state">
          <p>暂无展陈方案，点击「新增展陈方案」开始策划。</p>
        </div>
      ) : (
        <div className="exhibition-list">
          {exhibitions.map((plan) => {
            const meta = EXHIBITION_STATUS_META[plan.status] || {}
            const pendingCount = plan.items.filter(
              (i) => i.return_status === EXHIBITION_RETURN_STATUSES[0]
            ).length
            return (
              <div key={plan.id} className="exhibition-card">
                <div className="exhibition-card-head">
                  <div className="exhibition-card-title">
                    <h3>{plan.theme}</h3>
                    <span
                      className="exhibition-status-badge"
                      style={{ backgroundColor: meta.color ? `${meta.color}22` : '#f0e6d6', color: meta.color || '#8b6914' }}
                    >
                      {meta.icon} {plan.status}
                    </span>
                  </div>
                  <div className="card-buttons">
                    <button
                      className="action-btn small"
                      onClick={() => openDetail(plan)}
                    >
                      查看
                    </button>
                    <button
                      className="action-btn small secondary"
                      onClick={() => openEdit(plan)}
                    >
                      编辑
                    </button>
                    <button
                      className="action-btn small danger"
                      onClick={() => handleDelete(plan)}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="exhibition-card-meta">
                  <div className="meta-item">
                    <span className="meta-label">举办时间</span>
                    <span className="meta-value">{plan.event_time || '待定'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">地点</span>
                    <span className="meta-value">{plan.location || '待定'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">策划人</span>
                    <span className="meta-value">{plan.planner || '—'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">参与旧物</span>
                    <span className="meta-value">{plan.items.length} 件</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="meta-item">
                      <span className="meta-label">待归位</span>
                      <span className="meta-value warn">{pendingCount} 件</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay exhibition-modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-content exhibition-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">
              {editingPlan ? '编辑展陈方案' : '新增展陈方案'}
            </h2>

            <div className="form-group">
              <label>展陈主题 *</label>
              <input
                className="form-input"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                placeholder="如 奶奶八十大寿家族旧物展"
              />
            </div>
            <div className="exhibition-form-row">
              <div className="form-group">
                <label>举办时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.event_time ? form.event_time.replace(' ', 'T') : ''}
                  onChange={(e) =>
                    setForm({ ...form, event_time: e.target.value.replace('T', ' ') })
                  }
                />
              </div>
              <div className="form-group">
                <label>地点</label>
                <input
                  className="form-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="如 老宅堂屋"
                />
              </div>
            </div>
            <div className="exhibition-form-row">
              <div className="form-group">
                <label>策划人</label>
                <input
                  className="form-input"
                  value={form.planner}
                  onChange={(e) => setForm({ ...form, planner: e.target.value })}
                  placeholder="如 大伯"
                />
              </div>
              <div className="form-group">
                <label>展陈状态</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {EXHIBITION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>所需附件资料</label>
              <textarea
                className="form-textarea"
                value={form.required_materials}
                onChange={(e) =>
                  setForm({ ...form, required_materials: e.target.value })
                }
                placeholder="如 展板、说明卡、防尘罩、射灯"
              />
            </div>
            <div className="form-group">
              <label>借出/搬运注意事项</label>
              <textarea
                className="form-textarea"
                value={form.transport_notes}
                onChange={(e) =>
                  setForm({ ...form, transport_notes: e.target.value })
                }
                placeholder="如 怀表需水平放置，瓷器全程戴手套搬运"
              />
            </div>

            <div className="form-group">
              <label>参与旧物（勾选后可设置讲述重点、搬运与归位）</label>
              <div className="checkbox-group exhibition-item-picker">
                {items.length === 0 && <p className="picker-empty">暂无旧物</p>}
                {items.map((item) => {
                  const checked = !!formItems.find(
                    (p) => String(p.item_id) === String(item.id)
                  )
                  return (
                    <label
                      key={item.id}
                      className={`checkbox-item ${checked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFormItem(item)}
                      />
                      <span className="picker-name">{item.name}</span>
                      <span className="picker-tag">{item.category}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {formItems.length > 0 && (
              <div className="form-group">
                <label>展示顺序与讲述重点（上下移动调整顺序）</label>
                <div className="exhibition-form-items">
                  {formItems.map((fi, idx) => {
                    const item = itemById(fi.item_id)
                    return (
                      <div key={String(fi.item_id)} className="exhibition-form-item">
                        <div className="efi-head">
                          <span className="efi-order">{idx + 1}</span>
                          <span className="efi-name">{item?.name || '已删除旧物'}</span>
                          <div className="efi-move">
                            <button
                              type="button"
                              className="action-btn small secondary"
                              disabled={idx === 0}
                              onClick={() => moveFormItem(idx, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="action-btn small secondary"
                              disabled={idx === formItems.length - 1}
                              onClick={() => moveFormItem(idx, 1)}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        <input
                          className="form-input"
                          placeholder="讲述重点（如 这只怀表是爷爷创业时唯一的计时工具）"
                          value={fi.narrative_focus}
                          onChange={(e) =>
                            updateFormItem(fi.item_id, { narrative_focus: e.target.value })
                          }
                        />
                        <div className="efi-controls">
                          <label className="efi-control">
                            归位状态
                            <select
                              className="form-input"
                              value={fi.return_status}
                              onChange={(e) =>
                                updateFormItem(fi.item_id, { return_status: e.target.value })
                              }
                            >
                              {EXHIBITION_RETURN_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="efi-control efi-risk">
                            <input
                              type="checkbox"
                              checked={fi.transport_risk}
                              onChange={(e) =>
                                updateFormItem(fi.item_id, {
                                  transport_risk: e.target.checked,
                                })
                              }
                            />
                            存在搬运风险
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {error && <p className="exhibition-form-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                {submitting ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && selectedPlan && (
        <div
          className="modal-overlay exhibition-modal-overlay"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="modal-content exhibition-modal-content exhibition-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">{selectedPlan.theme}</h2>
            {detailLoading ? (
              <div className="loading-state">
                <p>加载中…</p>
              </div>
            ) : (
              <>
                <div className="exhibition-detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">举办时间</span>
                    <span className="meta-value">{selectedPlan.event_time || '待定'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">地点</span>
                    <span className="meta-value">{selectedPlan.location || '待定'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">策划人</span>
                    <span className="meta-value">{selectedPlan.planner || '—'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">状态</span>
                    <span
                      className="exhibition-status-badge"
                      style={{
                        backgroundColor: `${EXHIBITION_STATUS_META[selectedPlan.status]?.color || '#8b6914'}22`,
                        color: EXHIBITION_STATUS_META[selectedPlan.status]?.color || '#8b6914',
                      }}
                    >
                      {EXHIBITION_STATUS_META[selectedPlan.status]?.icon} {selectedPlan.status}
                    </span>
                  </div>
                </div>

                {selectedPlan.required_materials && (
                  <div className="detail-section">
                    <div className="section-label">所需附件资料</div>
                    <div className="section-content">{selectedPlan.required_materials}</div>
                  </div>
                )}
                {selectedPlan.transport_notes && (
                  <div className="detail-section">
                    <div className="section-label">借出/搬运注意事项</div>
                    <div className="section-content warn">
                      {selectedPlan.transport_notes}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <div className="section-header">
                    <span className="section-label">
                      展示顺序（拖拽或上下移动调整）
                    </span>
                    <span className="detail-count">共 {detailItems.length} 件</span>
                  </div>
                  <div className="exhibition-detail-list">
                    {detailItems.map((ei, idx) => {
                      const meta = EXHIBITION_RETURN_META[ei.return_status] || {}
                      return (
                        <div
                          key={String(ei.item_id)}
                          className={`detail-item ${dragIndex === idx ? 'dragging' : ''}`}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(idx)}
                        >
                          <div className="detail-item-main">
                            <div className="detail-item-head">
                              <span className="drag-handle" title="拖拽排序">
                                ⠿
                              </span>
                              <span className="detail-order">{idx + 1}</span>
                              <span className="detail-item-name">
                                {ei.item?.name || `旧物 #${ei.item_id}`}
                              </span>
                              {ei.item?.category && (
                                <span className="detail-item-tag">{ei.item.category}</span>
                              )}
                              <span
                                className="return-badge"
                                style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                              >
                                {meta.icon} {ei.return_status}
                              </span>
                              {ei.transport_risk && (
                                <span className="risk-badge">⚠ 搬运风险</span>
                              )}
                            </div>
                            <textarea
                              className="form-input detail-narrative"
                              placeholder="讲述重点"
                              value={narrativeDrafts[String(ei.item_id)] ?? ''}
                              onChange={(e) =>
                                setNarrativeDrafts((prev) => ({
                                  ...prev,
                                  [String(ei.item_id)]: e.target.value,
                                }))
                              }
                            />
                            <div className="detail-item-controls">
                              <div className="detail-move">
                                <button
                                  className="action-btn small secondary"
                                  disabled={idx === 0}
                                  onClick={() => moveDetailItem(idx, -1)}
                                >
                                  ↑ 上移
                                </button>
                                <button
                                  className="action-btn small secondary"
                                  disabled={idx === detailItems.length - 1}
                                  onClick={() => moveDetailItem(idx, 1)}
                                >
                                  ↓ 下移
                                </button>
                              </div>
                              <div className="detail-toggles">
                                <select
                                  className="form-input"
                                  value={ei.return_status}
                                  onChange={(e) =>
                                    handleItemFieldChange(ei.item_id, {
                                      return_status: e.target.value,
                                    })
                                  }
                                >
                                  {EXHIBITION_RETURN_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                                <label className="detail-risk-toggle">
                                  <input
                                    type="checkbox"
                                    checked={ei.transport_risk}
                                    onChange={(e) =>
                                      handleItemFieldChange(ei.item_id, {
                                        transport_risk: e.target.checked,
                                      })
                                    }
                                  />
                                  搬运风险
                                </label>
                                <button
                                  className="action-btn small"
                                  onClick={() => saveNarrative(ei.item_id)}
                                >
                                  保存讲述
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {error && <p className="exhibition-form-error">{error}</p>}
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(selectedPlan)}
                  >
                    编辑方案
                  </button>
                  <button className="btn-primary" onClick={() => setShowDetail(false)}>
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExhibitionsPage
