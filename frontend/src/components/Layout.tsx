import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { path: '/items', label: '旧物档案', icon: '📦' },
  { path: '/inheritance', label: '传承意向', icon: '📜' },
  { path: '/discussions', label: '家庭讨论', icon: '💬' },
  { path: '/statistics', label: '统计概览', icon: '📊' },
]

function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">🏡 家族旧物</h1>
          <p className="subtitle">珍藏时光，传承记忆</p>
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="footer-text">© 2024 家族记忆档案馆</p>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
