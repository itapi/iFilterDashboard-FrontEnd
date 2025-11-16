import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
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
import Sidebar from './components/Sidebar'
import GlobalModal from './components/GlobalModal'
import MagiskModules from './components/MagiskModules'
import Loader from './components/Loader'
import { ProtectedRoute, SuperAdminRoute, ManagerRoute } from './components/ProtectedRoute'
import { GlobalStateProvider, useUser } from './contexts/GlobalStateContext'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

// Main App Component that uses GlobalStateContext
function AppContent() {
  const { user, isLoggedIn, loading, logout } = useUser()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="טוען..." />
      </div>
    )
  }

  return (
    <>
      {!isLoggedIn ? (
        <Login />
      ) : (
        <Router basename="/iFilterDashboard-FrontEnd">
          <div className="min-h-screen bg-gray-50 flex" dir="rtl">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard - Accessible to all authenticated users */}
                <Route path="/dashboard" element={<Dashboard />} />

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
                    <div className="p-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות מערכת</h2>
                        <p className="text-gray-600">עמוד זה בפיתוח...</p>
                      </div>
                    </div>
                  </SuperAdminRoute>
                } />
              </Routes>
            </main>
          </div>
          <GlobalModal />
        </Router>
      )}
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
    </>
  )
}

// Root App component with unified GlobalStateProvider
function App() {
  return (
    <GlobalStateProvider>
      <AppContent />
    </GlobalStateProvider>
  )
}

export default App
