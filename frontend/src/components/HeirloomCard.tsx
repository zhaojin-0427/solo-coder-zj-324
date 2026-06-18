import { Link } from 'react-router-dom'
import { HeirloomItem } from '../types'
import './HeirloomCard.css'

interface HeirloomCardProps {
  item: HeirloomItem
}

const conditionLabels: Record<string, string> = {
  excellent: '完好',
  good: '良好',
  fair: '一般',
  poor: '需修复',
}

const conditionColors: Record<string, string> = {
  excellent: '#5a8f5a',
  good: '#8b6914',
  fair: '#c8942e',
  poor: '#c25a3a',
}

function HeirloomCard({ item }: HeirloomCardProps) {
  return (
    <Link to={`/items/${item.id}`} className="heirloom-card">
      <div className="card-image">
        {item.cover_image ? (
          <img src={item.cover_image} alt={item.name} />
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-icon">📷</span>
          </div>
        )}
        <span
          className="condition-badge"
          style={{ backgroundColor: conditionColors[item.condition] }}
        >
          {conditionLabels[item.condition]}
        </span>
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.name}</h3>
        <p className="card-category">{item.category} · {item.era}</p>
        <p className="card-description">{item.description}</p>
        <div className="card-footer">
          <div className="related-people">
            {item.related_people.slice(0, 3).map((member) => (
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
