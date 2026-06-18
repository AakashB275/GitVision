import { BrowserRouter, Routes, Route } from 'react-router'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import MainPage from './pages/MainPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/project" element={<MainPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
