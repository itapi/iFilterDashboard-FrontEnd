import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { 
  ArrowRight,
  User,
  Mail,
  Phone,
  Smartphone,
  Calendar,
  Crown,
  Zap,
  Settings,
  History,
  CreditCard,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Edit3,
  Save,
  RefreshCw,
  Activity
} from 'lucide-react'

const ClientDetails = () => {
  const { clientUniqueId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [client, setClient] = useState(location.state?.client || null)
  const [loading, setLoading] = useState(!client)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (!client) {
      loadClientDetails()
    } else {
      setFormData(client)
    }
  }, [clientUniqueId])

  const loadClientDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getClientByUniqueId(clientUniqueId)
      
      if (response.success) {
        setClient(response.data)
        setFormData(response.data)
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

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Here you would typically update the client data
      // For now, we'll just update the local state
      setClient(formData)
      setEditMode(false)
      toast.success('פרטי הלקוח עודכנו בהצלחה')
    } catch (err) {
      toast.error('שגיאה בשמירת הנתונים')
      console.error('Error saving client:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true)
      const response = await apiClient.updateClientStatus(clientUniqueId, newStatus)
      
      if (response.success) {
        setClient(prev => ({ ...prev, plan_status: newStatus }))
        setFormData(prev => ({ ...prev, plan_status: newStatus }))
        toast.success('סטטוס הלקוח עודכן בהצלחה')
      }
    } catch (err) {
      toast.error('שגיאה בעדכון הסטטוס')
      console.error('Error updating status:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSyncUpdate = async () => {
    try {
      setSaving(true)
      const response = await apiClient.updateClientSyncStatus(clientUniqueId)
      
      if (response.success) {
        setClient(prev => ({ 
          ...prev, 
          last_sync: response.data.last_sync,
          sync_status: 'recent'
        }))
        toast.success('סטטוס הסינכרון עודכן')
      }
    } catch (err) {
      toast.error('שגיאה בעדכון הסינכרון')
      console.error('Error updating sync:', err)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'ניסיון', icon: Zap },
      expired: { color: 'bg-red-100 text-red-800 border-red-200', label: 'פג תוקף', icon: X },
      suspended: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'מושעה', icon: AlertTriangle },
      pending: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'ממתין', icon: Clock }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="w-4 h-4 ml-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleString('he-IL')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center   space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען פרטי לקוח...</span>
          </div>
        </div>
      </div>
    )
  }

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center   space-x-4">
            <button 
              onClick={() => navigate('/clients')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center   space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {client.first_name?.charAt(0)?.toUpperCase() || ''}{client.last_name?.charAt(0)?.toUpperCase() || ''}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-gray-600">לקוח #{client.client_unique_id}</p>
                <div className="flex items-center   space-x-2 mt-2">
                  {getStatusBadge(client.plan_status)}
                  {client.level_name && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs text-yellow-600">
                      <Crown className="w-3 h-3 ml-1" />
                      {client.level_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex   space-x-2">
            <button 
              onClick={handleSyncUpdate}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center   space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>סנכרן</span>
            </button>
            
            {editMode ? (
              <>
                <button 
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center   space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'שומר...' : 'שמור'}</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center   space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>עריכה</span>
              </button>
            )}
          </div>
        </div>


        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8  ">
            {[
              { id: 'overview', label: 'סקירה כללית', icon: User },
              { id: 'plan', label: 'תוכנית ומנוי', icon: Crown },
              { id: 'device', label: 'מכשיר', icon: Smartphone },
              { id: 'activity', label: 'פעילות', icon: Activity },
              { id: 'settings', label: 'הגדרות', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center   space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 ml-2" />
                פרטים אישיים
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-gray-900">{client.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-gray-900">{client.last_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="flex items-center   space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{client.email}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="flex items-center   space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{client.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 ml-2" />
                מידע חשבון
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מזהה לקוח</label>
                  <p className="text-gray-900 font-mono">{client.client_unique_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך הרשמה</label>
                  <div className="flex items-center   space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{formatDate(client.registration_date)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס תוכנית</label>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(client.plan_status)}
                    {!editMode && (
                      <select
                        onChange={(e) => handleStatusChange(e.target.value)}
                        value=""
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">שנה סטטוס</option>
                        <option value="active">פעיל</option>
                        <option value="trial">ניסיון</option>
                        <option value="suspended">מושעה</option>
                        <option value="expired">פג תוקף</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">יתרת נקודות</label>
                  <p className="text-gray-900 font-semibold">{client.points_balance || 0} נקודות</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 ml-2" />
                תוכנית נוכחית
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם התוכנית</label>
                  <p className="text-gray-900 font-medium">{client.plan_name || 'ללא תוכנית'}</p>
                </div>
                {client.plan_price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר</label>
                    <p className="text-gray-900">₪{client.plan_price}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
                  <p className="text-gray-900">{formatDate(client.plan_start_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך תפוגה</label>
                  <p className={`font-medium ${
                    client.days_until_expiry < 0 ? 'text-red-600' : 
                    client.days_until_expiry < 7 ? 'text-yellow-600' : 
                    'text-gray-900'
                  }`}>
                    {formatDate(client.plan_expiry_date)}
                    {client.days_until_expiry !== undefined && (
                      <span className="text-sm text-gray-500 mr-2">
                        ({client.days_until_expiry < 0 ? 'פג תוקף' : `${client.days_until_expiry} ימים נותרו`})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 ml-2" />
                מידע ניסיון
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס ניסיון</label>
                  <p className="text-gray-900">
                    {{
                      'not_started': 'לא החל',
                      'active': 'פעיל',
                      'expired': 'פג תוקף',
                      'converted': 'הומר למנוי'
                    }[client.trial_status] || client.trial_status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלת ניסיון</label>
                  <p className="text-gray-900">{formatDate(client.trial_started_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך תפוגת ניסיון</label>
                  <p className="text-gray-900">{formatDate(client.trial_expiry_date)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 ml-2" />
              פרטי מכשיר
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">דגם</label>
                  <p className="text-gray-900">{client.model || 'לא זמין'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">גרסת אנדרויד</label>
                  <p className="text-gray-900">{client.android_version || 'לא זמין'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                  <p className="text-gray-900 font-mono">{client.imei}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מזהה מכשיר</label>
                  <p className="text-gray-900 font-mono text-sm">{client.deviceID || 'לא זמין'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סינכרון אחרון</label>
                  <p className="text-gray-900">{formatDateTime(client.last_sync)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס סינכרון</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    client.sync_status === 'recent' ? 'bg-green-100 text-green-800' :
                    client.sync_status === 'normal' ? 'bg-blue-100 text-blue-800' :
                    client.sync_status === 'stale' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {{
                      'recent': 'עדכני',
                      'normal': 'רגיל',
                      'stale': 'מיושן',
                      'never': 'לא סונכרן'
                    }[client.sync_status] || client.sync_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 ml-2" />
              היסטוריית פעילות
            </h3>
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>אין פעילות להצגה</p>
              <p className="text-sm">היסטוריית הפעילות תופיע כאן</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 ml-2" />
              הגדרות חשבון
            </h3>
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>אין הגדרות זמינות</p>
              <p className="text-sm">הגדרות החשבון יופיעו כאן</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetails