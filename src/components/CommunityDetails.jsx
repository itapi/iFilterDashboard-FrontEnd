import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Users,
  ArrowRight,
  Star,
  Package,
  Eye,
  Globe,
  Lock,
  Download,
  Search,
  Filter,
  Grid,
  List,
  Settings
} from 'lucide-react'
import apiClient from '../utils/api'
import Loader from './Loader'
import { useModal } from '../contexts/ModalContext'
import CustomPlanApps from './CustomPlanApps'

const CommunityDetails = () => {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const { openModal } = useModal()

  const [community, setCommunity] = useState(null)
  const [communityApps, setCommunityApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [appsLoading, setAppsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showAppsModal, setShowAppsModal] = useState(false)

  useEffect(() => {
    loadCommunityData()
  }, [communityId])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      setAppsLoading(true)

      // Load community details and apps in parallel
      const [communityResponse, appsResponse] = await Promise.all([
        apiClient.getCommunityPlanDetails(communityId),
        apiClient.getPlanSelectedApps(communityId) // Using unified API
      ])

      if (communityResponse.success) {
        setCommunity(communityResponse.data)
      } else {
        toast.error('שגיאה בטעינת פרטי הקהילה')
        navigate('/communities')
        return
      }

      if (appsResponse.success) {
        setCommunityApps(appsResponse.data || [])
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
    setShowAppsModal(true)
  }

  const handleAppsModalClose = () => {
    setShowAppsModal(false)
  }

  const handleAppsSave = async (selectedAppIds) => {
    // Reload community apps after successful save
    setAppsLoading(true)
    try {
      const appsResponse = await apiClient.getPlanSelectedApps(communityId)
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
    setShowAppsModal(false)
  }

  const filteredApps = communityApps.filter(app =>
    app.app_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
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
            <span className="text-gray-900 font-medium">{community.plan_name}</span>
          </div>

          {/* Community Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                {community.image_url ? (
                  <img
                    src={community.image_url}
                    alt={community.plan_name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{community.plan_name}</h1>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                    <Users className="w-4 h-4" />
                    קהילת סינון
                  </span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                    community.is_public
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {community.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {community.is_public ? 'ציבורית' : 'פרטית'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-1">{communityApps.length}</div>
                <div className="text-sm text-gray-600">אפליקציות</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-1">₪{community.price_monthly}</div>
                <div className="text-sm text-gray-600">מחיר חודשי</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-1">₪{community.price_yearly || (community.price_monthly * 12)}</div>
                <div className="text-sm text-gray-600">מחיר שנתי</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                <div className="text-3xl font-bold text-orange-600 mb-1">{community.plan_unique_id.slice(0, 8)}</div>
                <div className="text-sm text-gray-600">מזהה קהילה</div>
              </div>
            </div>

            {/* Features */}
            {(community.feature1 || community.feature2 || community.feature3) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">תכונות הקהילה</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[community.feature1, community.feature2, community.feature3].filter(Boolean).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apps Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Apps Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">אפליקציות הקהילה</h2>
                  <p className="text-gray-600">{communityApps.length} אפליקציות בקהילה</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Edit Apps Button */}
                  <button
                    onClick={handleEditApps}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>עריכת אפליקציות</span>
                  </button>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="חיפוש אפליקציות..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Apps Content */}
            <div className="p-6">
              {appsLoading ? (
                <Loader center variant="purple" text="טוען אפליקציות..." />
              ) : filteredApps.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredApps.map((app) => (
                      <div
                        key={app.app_id}
                        onClick={() => handleAppClick(app)}
                        className="group p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            {app.icon_url ? (
                              <img
                                src={app.icon_url}
                                alt={app.app_name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                              {app.app_name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">{app.category_name || 'אפליקציה'}</p>
                          </div>
                        </div>
                        {app.package_name && (
                          <p className="text-xs text-gray-400 font-mono truncate">{app.package_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredApps.map((app) => (
                      <div
                        key={app.app_id}
                        onClick={() => handleAppClick(app)}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          {app.icon_url ? (
                            <img
                              src={app.icon_url}
                              alt={app.app_name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{app.app_name}</h3>
                          <p className="text-sm text-gray-500">{app.category_name || 'אפליקציה'}</p>
                          {app.package_name && (
                            <p className="text-xs text-gray-400 font-mono">{app.package_name}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.selected_date && new Date(app.selected_date).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'לא נמצאו אפליקציות התואמות לחיפוש' : 'אין אפליקציות בקהילה'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'הקהילה עדיין לא מכילה אפליקציות'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apps Selection Modal */}
      {showAppsModal && (
        <CustomPlanApps
          planUniqueId={communityId}
          clientUniqueId={null}
          isOpen={showAppsModal}
          onClose={handleAppsModalClose}
          onSave={handleAppsSave}
        />
      )}
    </div>
  )
}

export default CommunityDetails