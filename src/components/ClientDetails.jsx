import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import PaymentsTab from './PaymentsTab'
import CustomPlanApps from './CustomPlanApps'
import ClientDetailsHeader from './ClientDetailsHeader'
import ClientOverviewTab from './ClientOverviewTab'
import ClientPlanTab from './ClientPlanTab'
import ClientDeviceTab from './ClientDeviceTab'
import ClientAppsTab from './ClientAppsTab'

/**
 * ClientDetails - Main component orchestrating client detail views
 *
 * This component manages state and data loading for client information,
 * and delegates rendering to specialized tab components.
 */
const ClientDetails = () => {
  const { clientUniqueId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // State management
  const [client, setClient] = useState(location.state?.client || null)
  const [loading, setLoading] = useState(!client)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [availablePlans, setAvailablePlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [showCustomPlanApps, setShowCustomPlanApps] = useState(false)
  const [deviceData, setDeviceData] = useState(null)
  const [loadingDeviceData, setLoadingDeviceData] = useState(false)

  // Load client details and plans on mount
  useEffect(() => {
    if (!client) {
      loadClientDetails()
    }
    loadAvailablePlans()
  }, [clientUniqueId, client])

  // Load device data when device tab is active
  useEffect(() => {
    if (activeTab === 'device') {
      loadDeviceData()
    }
  }, [activeTab])

  /**
   * Load client details from API
   */
  const loadClientDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getClientByUniqueId(clientUniqueId)

      if (response.success) {
        setClient(response.data)
      } else {
        toast.error('לקוח לא נמצא')
      }
    } catch (err) {
      toast.error('שגיאה בטעינת פרטי הלקוח')
      console.error('Error loading client details:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load available plans from API
   */
  const loadAvailablePlans = async () => {
    try {
      setLoadingPlans(true)
      const response = await apiClient.getFilteringPlans()
      if (response.success) {
        setAvailablePlans(response.data || [])
      }
    } catch (err) {
      console.error('❌ Error loading plans:', err)
    } finally {
      setLoadingPlans(false)
    }
  }

  /**
   * Load device data from API
   */
  const loadDeviceData = async () => {
    try {
      setLoadingDeviceData(true)
      const response = await apiClient.getClientDeviceData(clientUniqueId)
      if (response.success) {
        setDeviceData(response.data)
      }
    } catch (err) {
      console.error('❌ Error loading device data:', err)
      toast.error('שגיאה בטעינת נתוני מכשיר')
    } finally {
      setLoadingDeviceData(false)
    }
  }

  /**
   * Check if client has custom plan
   */
  const isCustomPlan = () => {
    return client?.plan_key === 'custom_plan' || client?.plan_name?.includes('מסלול אישי')
  }

  /**
   * Handle client data updates
   */
  const handleClientUpdate = (updatedClient) => {
    setClient(updatedClient)
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען פרטי לקוח...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">לקוח לא נמצא</h2>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            חזור לרשימת לקוחות
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8" dir="rtl">
      {/* Header with tabs */}
      <ClientDetailsHeader
        client={client}
        onBack={() => navigate('/clients')}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCustomPlan={isCustomPlan()}
      />

      {/* Tab Content */}
      <div className="mt-8 space-y-8">
        {activeTab === 'overview' && (
          <ClientOverviewTab
            client={client}
            clientUniqueId={clientUniqueId}
            onClientUpdate={handleClientUpdate}
            apiClient={apiClient}
          />
        )}

        {activeTab === 'plan' && (
          <ClientPlanTab
            client={client}
            clientUniqueId={clientUniqueId}
            onClientUpdate={handleClientUpdate}
            availablePlans={availablePlans}
            loadingPlans={loadingPlans}
            saving={saving}
            setSaving={setSaving}
            apiClient={apiClient}
          />
        )}

        {activeTab === 'device' && (
          <ClientDeviceTab
            deviceData={deviceData}
            loadingDeviceData={loadingDeviceData}
          />
        )}

        {activeTab === 'apps' && isCustomPlan() && (
          <ClientAppsTab
            onManageApps={() => setShowCustomPlanApps(true)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab clientUniqueId={clientUniqueId} />
        )}
      </div>

      {/* Custom Plan Apps Modal */}
      <CustomPlanApps
        isOpen={showCustomPlanApps}
        clientUniqueId={clientUniqueId}
        onClose={() => setShowCustomPlanApps(false)}
        onSave={(selectedApps) => {
          console.log('Apps saved:', selectedApps)
          setShowCustomPlanApps(false)
          toast.success(`נשמרו ${selectedApps.length} אפליקציות עבור הלקוח`)
        }}
      />
    </div>
  )
}

export default ClientDetails
