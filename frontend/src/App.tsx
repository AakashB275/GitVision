import { Routes, Route } from 'react-router'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import MainPage from './pages/MainPage'
import SettingsPage from './pages/SettingsPage'
import DashboardPage from './pages/DashBoardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/project" element={<MainPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App