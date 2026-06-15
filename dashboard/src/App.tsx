import { Routes, Route } from 'react-router-dom'
import SessionsPage from './SessionsPage'
import SessionDetailPage from './SessionDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionsPage />} />
      <Route path="/sessions/:id" element={<SessionDetailPage />} />
    </Routes>
  )
}

export default App
