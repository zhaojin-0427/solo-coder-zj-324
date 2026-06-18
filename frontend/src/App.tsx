import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ItemsPage from './pages/ItemsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import StoryCardPage from './pages/StoryCardPage'
import InheritancePage from './pages/InheritancePage'
import DiscussionsPage from './pages/DiscussionsPage'
import StatisticsPage from './pages/StatisticsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/items" replace />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="story-card/:id" element={<StoryCardPage />} />
        <Route path="inheritance" element={<InheritancePage />} />
        <Route path="discussions" element={<DiscussionsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
      </Route>
    </Routes>
  )
}

export default App
