import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Login from './components/Login'
import Apps from './components/Apps'
import AppsManager from './components/AppsManager'
import CategoryPlanManager from './components/CategoryPlanManager'
import CommunitiesTable from './components/CommunitiesTable'
import CommunityDetails from './components/CommunityDetails'
import TicketsManager from './components/TicketsManager'
import TicketsTable from './components/TicketsTable'
import ClientsTable from './components/ClientsTable'
import ClientDetails from './components/ClientDetails'
import AdminsTable from './components/AdminsTable'
import BroadcastMessages from './components/BroadcastMessages'
import FirmwareManager from './components/FirmwareManager'
import RemoteCommandsManager from './components/RemoteCommandsManager'
import SafeBrowserManager from './components/SafeBrowserManager'
import Sidebar from './components/Sidebar'
import GlobalModal from './components/GlobalModal'
import MagiskModules from './components/MagiskModules'
import Distributions from './components/Distributions'
import WebInquiriesTable from './components/WebInquiriesTable'
import ResellersTable from './components/ResellersTable'
import ResellerSetupPassword from './components/ResellerSetupPassword'
import ResellerHub from './components/ResellerHub'
import SettingsPage from './components/SettingsPage'
import Loader from './components/Loader'
import { ProtectedRoute, SuperAdminRoute, ManagerRoute } from './components/ProtectedRoute'
import { GlobalStateProvider, useUser } from './contexts/GlobalStateContext'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

// Main App Component that uses GlobalStateContext
function AppContent() {
  const { user, isLoggedIn, loading, logout } = useUser()
  const location = useLocation()

  // Public route — accessible without login
  if (location.pathname === '/reseller/setup-password') {
    return <ResellerSetupPassword />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--if-bg)' }}>
        <Loader text="טוען..." />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login />
  }

  return (
    <>
      <div className="min-h-screen flex" style={{ background: 'var(--if-bg)' }} dir="rtl">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/clients" replace />} />

              {/* Apps Management - Managers and Super Admins only */}
              <Route path="/apps" element={
                <ManagerRoute showForbidden={true}>
                  <AppsManager />
                </ManagerRoute>
              } />

              {/* Category Plans - Managers and Super Admins only */}
              <Route path="/category-plans" element={
                <ManagerRoute showForbidden={true}>
                  <CategoryPlanManager />
                </ManagerRoute>
              } />

              {/* Communities - Managers and Super Admins only */}
              <Route path="/communities" element={
                <ManagerRoute showForbidden={true}>
                  <CommunitiesTable />
                </ManagerRoute>
              } />
              <Route path="/communities/:communityId" element={
                <ManagerRoute showForbidden={true}>
                  <CommunityDetails />
                </ManagerRoute>
              } />

              {/* Web Inquiries - Managers and Super Admins */}
              <Route path="/web-inquiries" element={
                <ManagerRoute showForbidden={true}>
                  <WebInquiriesTable />
                </ManagerRoute>
              } />

              {/* Reseller Registrations - Managers and Super Admins */}
              <Route path="/resellers" element={
                <ManagerRoute showForbidden={true}>
                  <ResellersTable />
                </ManagerRoute>
              } />

              {/* Reseller Hub - Managers, Super Admins, and Resellers */}
              <Route path="/reseller-hub" element={
                <ProtectedRoute allowedRoles={['super_admin', 'manager', 'reseller']} showForbidden={true}>
                  <ResellerHub />
                </ProtectedRoute>
              } />

              {/* Tickets - Accessible to all roles (filtered by permissions in component) */}
              <Route path="/tickets" element={<TicketsTable />} />
              <Route path="/tickets/chat" element={<TicketsManager />} />

              {/* Clients - Accessible to all roles (filtered by permissions in component) */}
              <Route path="/clients" element={<ClientsTable />} />
              <Route path="/clients/:clientUniqueId" element={<ClientDetails />} />

              {/* User Management - Super Admin only */}
              <Route path="/admins" element={
                <SuperAdminRoute showForbidden={true}>
                  <AdminsTable />
                </SuperAdminRoute>
              } />

              {/* Distributions - Super Admin only */}
              <Route path="/distributions" element={
                <SuperAdminRoute showForbidden={true}>
                  <Distributions />
                </SuperAdminRoute>
              } />

              {/* Broadcast Messages - Super Admin only */}
              <Route path="/broadcast-messages" element={
                <SuperAdminRoute showForbidden={true}>
                  <BroadcastMessages />
                </SuperAdminRoute>
              } />

              {/* SafeBrowser - Managers and Super Admins */}
              <Route path="/safe-browser" element={
                <ManagerRoute showForbidden={true}>
                  <SafeBrowserManager />
                </ManagerRoute>
              } />

              {/* Remote Commands - Managers and Super Admins */}
              <Route path="/remote-commands" element={
                <ManagerRoute showForbidden={true}>
                  <RemoteCommandsManager />
                </ManagerRoute>
              } />

              {/* Firmware Management - Super Admin only */}
              <Route path="/firmwares" element={
                <SuperAdminRoute showForbidden={true}>
                  <FirmwareManager />
                </SuperAdminRoute>
              } />

              {/* Upload Pages - Managers and Super Admins only */}
              <Route path="/uploads/magisk-modules" element={
                <ManagerRoute showForbidden={true}>
                  <MagiskModules />
                </ManagerRoute>
              } />
              <Route path="/uploads/xposed-modules" element={
                <ManagerRoute showForbidden={true}>
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">מודולי Xposed</h2>
                      <p className="text-gray-600">העלאת מודולי Xposed (קבצי APK)</p>
                    </div>
                  </div>
                </ManagerRoute>
              } />
              <Route path="/uploads/required-apps" element={
                <ManagerRoute showForbidden={true}>
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">אפליקציות נדרשות</h2>
                      <p className="text-gray-600">העלאת אפליקציות נדרשות (קבצי APK)</p>
                    </div>
                  </div>
                </ManagerRoute>
              } />
              <Route path="/uploads/other" element={
                <ManagerRoute showForbidden={true}>
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">קבצים אחרים</h2>
                      <p className="text-gray-600">העלאת קבצים נוספים</p>
                    </div>
                  </div>
                </ManagerRoute>
              } />

              {/* Settings - Super Admin only */}
              <Route path="/settings" element={
                <SuperAdminRoute showForbidden={true}>
                  <SettingsPage />
                </SuperAdminRoute>
              } />
            </Routes>
          </main>
        </div>
      <GlobalModal />
    </>
  )
}

// Root App component with unified GlobalStateProvider
function App() {
  return (
    <GlobalStateProvider>
      <Router basename="/iFilterDashboard-FrontEnd">
        <AppContent />
        <ToastContainer
          position="top-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </GlobalStateProvider>
  )
}

export default App
