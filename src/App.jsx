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
import Sidebar from './components/Sidebar'
import GlobalModal from './components/GlobalModal'
import MagiskModules from './components/MagiskModules'
import Loader from './components/Loader'
import { ModalProvider } from './contexts/ModalContext'
import { UserProvider, useUser } from './contexts/UserContext'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

// Main App Component that uses UserContext
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
    <ModalProvider>
      {!isLoggedIn ? (
        <Login />
      ) : (
        <Router basename="/iFilterDashboard-FrontEnd">
          <div className="min-h-screen bg-gray-50 flex" dir="rtl">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/apps" element={<AppsManager />} />
                <Route path="/category-plans" element={<CategoryPlanManager />} />
                <Route path="/communities" element={<CommunitiesTable />} />
                <Route path="/communities/:communityId" element={<CommunityDetails />} />
                <Route path="/tickets" element={<TicketsTable />} />
                <Route path="/tickets/chat" element={<TicketsManager />} />
                <Route path="/clients" element={<ClientsTable />} />
                <Route path="/clients/:clientUniqueId" element={<ClientDetails />} />
                <Route path="/users" element={
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">ניהול משתמשים</h2>
                      <p className="text-gray-600">עמוד זה בפיתוח...</p>
                    </div>
                  </div>
                } />
                <Route path="/uploads/magisk-modules" element={<MagiskModules />} />
                <Route path="/uploads/xposed-modules" element={
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">מודולי Xposed</h2>
                      <p className="text-gray-600">העלאת מודולי Xposed (קבצי APK)</p>
                    </div>
                  </div>
                } />
                <Route path="/uploads/required-apps" element={
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">אפליקציות נדרשות</h2>
                      <p className="text-gray-600">העלאת אפליקציות נדרשות (קבצי APK)</p>
                    </div>
                  </div>
                } />
                <Route path="/uploads/other" element={
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">קבצים אחרים</h2>
                      <p className="text-gray-600">העלאת קבצים נוספים</p>
                    </div>
                  </div>
                } />
                <Route path="/settings" element={
                  <div className="p-8">
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות מערכת</h2>
                      <p className="text-gray-600">עמוד זה בפיתוח...</p>
                    </div>
                  </div>
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
    </ModalProvider>
  )
}

// Root App component that provides UserContext
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App
