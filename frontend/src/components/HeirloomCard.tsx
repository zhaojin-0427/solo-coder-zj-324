import { Link } from 'react-router-dom'
import { HeirloomItem, FamilyMember } from '../types'
import './HeirloomCard.css'

interface HeirloomCardProps {
  item: HeirloomItem
}

function getConditionColor(condition: string): string {
  const c = condition || ''
  if (c.includes('完好') || c.includes('优秀') || c.includes('完美')) return '#5a8f5a'
  if (c.includes('良好') || c.includes('不错')) return '#8b6914'
  if (c.includes('一般') || c.includes('划痕') || c.includes('泛黄')) return '#c8942e'
  if (c.includes('修复') || c.includes('保养') || c.includes('破损')) return '#c25a3a'
  return '#a08060'
}

function isImageUrl(str?: string): boolean {
  if (!str) return false
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')
}

function HeirloomCard({ item }: HeirloomCardProps) {
  return (
    <Link to={`/items/${item.id}`} className="heirloom-card">
      <div className="card-image">
        {item.cover_image ? (
          isImageUrl(item.cover_image) ? (
            <img src={item.cover_image} alt={item.name} />
          ) : (
            <div className="image-placeholder emoji-placeholder">
              <span className="placeholder-emoji">{item.cover_image}</span>
            </div>
          )
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-icon">📷</span>
          </div>
        )}
        <span
          className="condition-badge"
          style={{ backgroundColor: getConditionColor(item.condition) }}
        >
          {item.condition || '未标注'}
        </span>
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.name}</h3>
        <p className="card-category">{item.category} · {item.era}</p>
        <p className="card-description">{item.description}</p>
        <div className="card-footer">
          <div className="related-people">
            {item.related_people.slice(0, 3).map((member: FamilyMember) => (
              <span key={member.id} className="person-tag">
                {member.name}
              </span>
            ))}
            {item.related_people.length > 3 && (
              <span className="more-tag">+{item.related_people.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default HeirloomCard
