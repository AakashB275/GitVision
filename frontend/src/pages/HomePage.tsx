import DashboardLayout from '../components/layout/DashboardLayout'
import ImportRepositoryModal from '../components/ImportRepositoryModal'

export default function HomePage() {
  return (
    <DashboardLayout activeSidebarItem="explorer">
      <div className="h-full bg-background" />
      <ImportRepositoryModal />
    </DashboardLayout>
  )
}
