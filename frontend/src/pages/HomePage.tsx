import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@clerk/react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ImportRepositoryModal from '../components/ImportRepositoryModal'

export default function HomePage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/')
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded || !isSignedIn) return null

  return (
    <DashboardLayout activeSidebarItem="explorer">
      <div className="h-full bg-background" />
      <ImportRepositoryModal />
    </DashboardLayout>
  )
}