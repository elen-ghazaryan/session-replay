import { Routes, Route } from 'react-router-dom'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionsPage />} />
      <Route path="/sessions/:id" element={<SessionDetailPage />} />
    </Routes>
  )
}

export default App
