import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Users,
  ArrowRight,
  Package,
  Info
} from 'lucide-react'
import apiClient from '../utils/api'
import Loader from './Loader'
import { useModal } from '../contexts/GlobalStateContext'
import { Toggle } from './Toggle'
import CommunityInfo from './CommunityInfo'
import CommunityApps from './CommunityApps'

const CommunityDetails = () => {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const { openModal } = useModal()

  const [community, setCommunity] = useState(null)
  const [communityApps, setCommunityApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    loadCommunityData()
  }, [communityId])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      setAppsLoading(true)

      // Load community details
      const communityResponse = await apiClient.getCommunityDetails(communityId)

      if (communityResponse.success) {
        setCommunity(communityResponse.data)

        // Load apps for the community's plan if it has one
        if (communityResponse.data.plan_unique_id) {
          try {
            const appsResponse = await apiClient.getPlanSelectedApps(communityResponse.data.plan_unique_id)
            if (appsResponse.success) {
              setCommunityApps(appsResponse.data || [])
            }
          } catch (err) {
            console.error('Error loading community apps:', err)
            // Don't fail the whole page if apps fail to load
            setCommunityApps([])
          }
        }
      } else {
        toast.error('שגיאה בטעינת פרטי הקהילה')
        navigate('/communities')
        return
      }

    } catch (err) {
      console.error('Error loading community data:', err)
      toast.error('שגיאה בטעינת נתוני הקהילה')
      navigate('/communities')
    } finally {
      setLoading(false)
      setAppsLoading(false)
    }
  }

  const handleAppClick = (app) => {
    const formContent = (
      <div className="p-6" dir="rtl">
        <div className="space-y-6">
          {/* App Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              {app.icon_url ? (
                <img
                  src={app.icon_url}
                  alt={app.app_name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{app.app_name}</h3>
              <p className="text-sm text-blue-600 font-medium">{app.category_name || 'אפליקציה'}</p>
            </div>
          </div>

          {/* App Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">פרטי האפליקציה</h4>
                <div className="space-y-2">
                  {app.package_name && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">שם החבילה</span>
                      <span className="font-mono text-sm text-gray-900">{app.package_name}</span>
                    </div>
                  )}
                  {app.version_name && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">גרסה</span>
                      <span className="font-bold text-gray-900">{app.version_name}</span>
                    </div>
                  )}
                  {app.size && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">גודל</span>
                      <span className="font-bold text-gray-900">{app.size} MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">תאריך הוספה</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">
                    {app.selected_date ? new Date(app.selected_date).toLocaleDateString('he-IL') : 'לא זמין'}
                  </span>
                </div>
              </div>

              {app.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">תיאור</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{app.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )

    openModal({
      type: 'custom',
      title: 'פרטי אפליקציה',
      content: formContent,
      size: 'xl'
    })
  }

  const handleEditApps = () => {
    if (!community?.plan_unique_id) {
      toast.error('לקהילה זו אין תכנית משויכת')
      return
    }

    openModal({
      layout: 'customPlanApps',
      title: 'בחירת אפליקציות - קהילה',
      size: 'xl',
      data: {
        clientUniqueId: null,
        planUniqueId: community.plan_unique_id,
        onSave: async (selectedAppIds) => {
          // Reload community apps after successful save
          setAppsLoading(true)
          try {
            const appsResponse = await apiClient.getPlanSelectedApps(community.plan_unique_id)
            if (appsResponse.success) {
              setCommunityApps(appsResponse.data || [])
              toast.success('רשימת האפליקציות עודכנה בהצלחה')
            }
          } catch (error) {
            console.error('Error reloading apps:', error)
            toast.error('שגיאה בטעינת רשימת האפליקציות המעודכנת')
          } finally {
            setAppsLoading(false)
          }
        }
      },
      closeOnBackdropClick: true,
      closeOnEscape: true
    })
  }

  const handleWatermarkUpdate = (newWatermarkUrl) => {
    // Update the community state with the new watermark
    setCommunity(prev => ({
      ...prev,
      watermark_logo: newWatermarkUrl
    }))
  }

  if (loading) {
    return <Loader fullScreen size="2xl" text="טוען פרטי קהילה" />
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-24 h-24 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">קהילה לא נמצאה</h2>
          <p className="text-gray-600 mb-6">הקהילה המבוקשת לא קיימת או נמחקה</p>
          <button
            onClick={() => navigate('/communities')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            חזור לקהילות
          </button>
        </div>
      </div>
    )
  }

  const toggleOptions = [
    {
      id: 'info',
      label: 'פרטי קהילה',
      icon: <Info className="w-4 h-4" />
    },
    {
      id: 'apps',
      label: 'אפליקציות',
      icon: <Package className="w-4 h-4" />,
      count: communityApps.length
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => navigate('/communities')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>קהילות</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{community.community_name}</span>
          </div>

          {/* Toggle */}
          <div className="mb-8">
            <Toggle
              options={toggleOptions}
              value={activeTab}
              onChange={setActiveTab}
              toggleStyle="tabs"
            />
          </div>

          {/* Content based on active tab */}
          {activeTab === 'info' ? (
            <CommunityInfo
              community={community}
              communityAppsCount={communityApps.length}
              onWatermarkUpdate={handleWatermarkUpdate}
            />
          ) : (
            <CommunityApps
              communityApps={communityApps}
              appsLoading={appsLoading}
              onAppClick={handleAppClick}
              onEditApps={handleEditApps}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunityDetails