import { useState, useEffect } from 'react'
import HeirloomCard from '../components/HeirloomCard'
import { itemsApi } from '../services/api'
import { HeirloomItem } from '../types'
import './ItemsPage.css'

function ItemsPage() {
  const [items, setItems] = useState<HeirloomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('全部')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsApi.getItems()
        setItems(data)
      } catch (err: any) {
        setError(err.message || '加载旧物列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const categories = ['全部', ...new Set(items.map((item) => item.category))]

  const filteredItems =
    selectedCategory === '全部'
      ? items
      : items.filter((item) => item.category === selectedCategory)

  if (loading) {
    return (
      <div className="items-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">旧物档案</h2>
            <p className="page-subtitle">加载中...</p>
          </div>
        </div>
        <div className="loading-state">
          <p>📦 正在加载旧物档案...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="items-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">旧物档案</h2>
            <p className="page-subtitle">加载失败</p>
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
    <div className="items-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">旧物档案</h2>
          <p className="page-subtitle">共 {items.length} 件珍藏旧物</p>
        </div>
      </div>

      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="items-grid">
        {filteredItems.map((item) => (
          <HeirloomCard key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <p>暂无该类别的旧物</p>
        </div>
      )}
    </div>
  )
}

export default ItemsPage
