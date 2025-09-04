import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import PaymentsTab from './PaymentsTab'
import EditableSection from './EditableSection'
import CustomPlanApps from './CustomPlanApps'
import { useModal } from '../contexts/ModalContext'
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
  Activity,
  Shield,
  MapPin,
  Globe,
  Wifi,
  RefreshCw,
  CalendarPlus,
  Target,
  CheckCircle2,
  Search,
  Package
} from 'lucide-react'

const ClientDetails = () => {
  const { clientUniqueId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [client, setClient] = useState(location.state?.client || null)
  const [loading, setLoading] = useState(!client)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [availablePlans, setAvailablePlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [showCustomPlanApps, setShowCustomPlanApps] = useState(false)
  const { openConfirmModal } = useModal()

  useEffect(() => {
    if (!client) {
      loadClientDetails()
    }
    loadAvailablePlans()
  }, [clientUniqueId, client])

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

  const handlePlanChange = (newPlanId, planName) => {
    const currentPlanName = client.plan_name || 'ללא תוכנית'
    
    openConfirmModal({
      title: 'שינוי תוכנית מנוי',
      message: (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            האם אתה בטוח שברצונך לשנות את התוכנית של הלקוח?
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">מ:</span>
                <span className="font-medium text-gray-900 mr-2">{currentPlanName}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">אל:</span>
                <span className="font-medium text-purple-600 mr-2">{planName}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            פעולה זו תעדכן את התוכנית מיידית
          </p>
        </div>
      ),
      variant: 'info',
      confirmText: 'שנה תוכנית',
      cancelText: 'ביטול',
      onConfirm: () => executeplanChange(newPlanId, planName)
    })
  }

  const executeplanChange = async (newPlanId, planName) => {
    try {
      setSaving(true)
      
      // Set plan start date to today if changing from inactive
      const updateData = {
        plan_id: newPlanId,
        plan_status: 'active'
      }
      
      if (client.plan_status === 'inactive' || !client.plan_start_date) {
        updateData.plan_start_date = new Date().toISOString().split('T')[0]
      }
      
      const response = await apiClient.updateClient(clientUniqueId, updateData)
      
      if (response.success) {
        setClient(prev => ({
          ...prev,
          plan_id: newPlanId,
          plan_name: planName,
          plan_status: 'active',
          plan_start_date: updateData.plan_start_date || prev.plan_start_date
        }))
        toast.success(`התוכנית עודכנה בהצלחה ל"${planName}"`)
      } else {
        toast.error(response.message || 'שגיאה בשינוי התוכנית')
      }
    } catch (error) {
      console.error('Error changing plan:', error)
      toast.error('שגיאה בשינוי התוכנית')
    } finally {
      setSaving(false)
    }
  }




  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'ניסיון', icon: Zap },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X },
      // Legacy status mapping for backward compatibility
      expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X },
      suspended: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X },
      pending: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X }
    }
    
    const config = statusConfig[status] || statusConfig.inactive
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

  const isCustomPlan = () => {
    return client?.plan_key === 'custom_plan' || client?.plan_name?.includes('מסלול אישי')
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
          
        </div>


        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'סקירה כללית', icon: User },
              { id: 'plan', label: 'תוכנית ומנוי', icon: Crown },
              { id: 'device', label: 'מכשיר', icon: Smartphone },
              ...(isCustomPlan() ? [{ id: 'apps', label: 'אפליקציות מותרות', icon: Smartphone }] : []),
              { id: 'payments', label: 'תשלומים', icon: CreditCard },
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
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content with better spacing */}
      <div className="mt-8 space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information - Now using EditableSection */}
            <EditableSection
              title="פרטים אישיים"
              description="מידע בסיסי על הלקוח"
              icon={User}
              data={client}
              onSave={async (updatedData) => {
                const allowedFields = ['first_name', 'last_name', 'email', 'phone']
                const updateData = Object.keys(updatedData)
                  .filter(key => allowedFields.includes(key))
                  .reduce((obj, key) => {
                    obj[key] = updatedData[key]
                    return obj
                  }, {})
                
                const response = await apiClient.updateClient(clientUniqueId, updateData)
                if (response.success) {
                  setClient(prev => ({ ...prev, ...updatedData }))
                } else {
                  throw new Error(response.message || 'שגיאה בשמירת הנתונים')
                }
              }}
              fields={[
                {
                  key: 'first_name',
                  label: 'שם פרטי',
                  type: 'text',
                  required: true,
                  placeholder: 'הכנס שם פרטי',
                  validate: (value) => value && value.length < 2 ? 'שם פרטי חייב להיות לפחות 2 תווים' : true
                },
                {
                  key: 'last_name',
                  label: 'שם משפחה',
                  type: 'text',
                  required: true,
                  placeholder: 'הכנס שם משפחה',
                  validate: (value) => value && value.length < 2 ? 'שם משפחה חייב להיות לפחות 2 תווים' : true
                },
                {
                  key: 'email',
                  label: 'כתובת אימייל',
                  type: 'email',
                  icon: Mail,
                  required: true,
                  placeholder: 'example@domain.com'
                },
                {
                  key: 'phone',
                  label: 'מספר טלפון',
                  type: 'tel',
                  icon: Phone,
                  placeholder: '050-1234567',
                  validate: (value) => {
                    const phoneRegex = /^[0-9-+\s()]+$/
                    return value && !phoneRegex.test(value) ? 'מספר טלפון לא תקין' : true
                  }
                }
              ]}
            />

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
                  {getStatusBadge(client.plan_status)}
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
            {/* Current Plan Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 ml-2" />
                תוכנית נוכחית ומנוי
              </h3>
              
              {/* Current Plan Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {client.plan_name || 'ללא תוכנית מוגדרת'}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {client.plan_price && (
                        <span className="font-medium">₪{client.plan_price}/חודש</span>
                      )}
                      <span>סטטוס: {getStatusBadge(client.plan_status)}</span>
                    </div>
                  </div>
                  
                  {/* Change Plan Button - Right in the plan display */}
                  <button 
                    onClick={() => {
                      const otherPlans = availablePlans.filter(p => p.plan_id !== client.plan_id)
                      
                      if (otherPlans.length === 0) {
                        toast.info('אין תוכניות זמינות לשינוי')
                        return
                      }
                      
                      openConfirmModal({
                        title: 'בחירת תוכנית חדשה',
                        message: (
                          <div className="space-y-4" dir="rtl">
                            <p className="text-gray-600 text-center mb-4">
                              בחר תוכנית חדשה עבור הלקוח:
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {otherPlans.map(plan => (
                                <button
                                  key={plan.plan_id}
                                  onClick={() => {
                                    handlePlanChange(plan.plan_id, plan.plan_name)
                                  }}
                                  className="w-full p-3 text-right border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{plan.plan_name}</h4>
                                      <p className="text-sm text-gray-500">
                                        ₪{plan.price_monthly}/חודש
                                      </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ),
                        variant: 'info',
                        confirmText: '',
                        cancelText: 'סגור'
                      })
                    }}
                    disabled={loadingPlans || saving || availablePlans.length <= 1}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    שנה תוכנית
                  </button>
                </div>
              </div>
              
              {/* Plan Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1">תאריך התחלה</label>
                  <p className="font-medium text-gray-900">{formatDate(client.plan_start_date)}</p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">תאריך תפוגה</label>
                  <p className={`font-medium ${
                    client.days_until_expiry < 0 ? 'text-red-600' : 
                    client.days_until_expiry < 7 ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {formatDate(client.plan_expiry_date)}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">ימים נותרו</label>
                  <p className={`font-medium ${
                    client.days_until_expiry < 0 ? 'text-red-600' : 
                    client.days_until_expiry < 7 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {client.days_until_expiry < 0 ? 'פג תוקף' : `${client.days_until_expiry} ימים`}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">יתרת נקודות</label>
                  <p className="font-medium text-gray-900">{client.points_balance || 0} נקודות</p>
                </div>
              </div>
            </div>

            {/* Plan Management Section */}
            <EditableSection
              title="עריכת פרטי מנוי"
              description="עדכון סטטוס מנוי ותאריכים"
              icon={Settings}
              data={client}
              editButtonText="ערוך מנוי"
              saveButtonText="עדכן מנוי"
              onSave={async (updatedData) => {
                // Handle plan management updates
                const planFields = ['plan_status', 'plan_expiry_date', 'plan_start_date']
                const updateData = Object.keys(updatedData)
                  .filter(key => planFields.includes(key))
                  .reduce((obj, key) => {
                    obj[key] = updatedData[key]
                    return obj
                  }, {})
                
                const response = await apiClient.updateClientPlan(clientUniqueId, updateData)
                if (response.success) {
                  setClient(prev => ({ ...prev, ...updatedData }))
                } else {
                  throw new Error(response.message || 'שגיאה בעדכון המנוי')
                }
              }}
              fields={[
                {
                  key: 'plan_status',
                  label: 'סטטוס מנוי',
                  type: 'select',
                  options: [
                    { value: 'active', label: '✅ פעיל' },
                    { value: 'trial', label: '🔍 תקופת ניסיון' },
                    { value: 'inactive', label: '❌ לא פעיל' }
                  ],
                  className: 'font-semibold'
                },
                {
                  key: 'plan_expiry_date',
                  label: 'תאריך תפוגה',
                  type: 'date',
                  placeholder: 'בחר תאריך תפוגה חדש',
                  className: client.days_until_expiry < 0 ? 'text-red-600 font-semibold' : 
                            client.days_until_expiry < 7 ? 'text-yellow-600 font-semibold' : 'text-gray-900',
                  validate: (value) => {
                    const selectedDate = new Date(value)
                    const today = new Date()
                    return selectedDate < today ? 'תאריך התפוגה צריך להיות עתידי' : true
                  }
                }
              ]}
            >
           
                <div className="space-y-4">
                  {/* Quick Actions - Always visible */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">פעולות מהירות {console.log('🎯 Quick Actions section rendering')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {/* Change Plan Button */}
                        <button 
                          onClick={() => {
                            console.log('🔄 Change Plan button clicked!')
                            console.log('📊 Current client:', client)
                            console.log('📋 Available plans:', availablePlans)
                            console.log('🆔 Client plan_id:', client.plan_id)
                            
                            const otherPlans = availablePlans.filter(p => p.plan_id !== client.plan_id)
                            console.log('🎯 Other plans:', otherPlans)
                            
                            if (otherPlans.length === 0) {
                              console.log('⚠️ No other plans available')
                              toast.info('אין תוכניות זמינות לשינוי')
                              return
                            }
                            
                            // Show plan selection modal
                            openConfirmModal({
                              title: 'בחירת תוכנית חדשה',
                              message: (
                                <div className="space-y-4" dir="rtl">
                                  <p className="text-gray-600 text-center mb-4">
                                    בחר תוכנית חדשה עבור הלקוח:
                                  </p>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {otherPlans.map(plan => (
                                      <button
                                        key={plan.plan_id}
                                        onClick={() => {
                                          handlePlanChange(plan.plan_id, plan.plan_name)
                                        }}
                                        className="w-full p-3 text-right border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h4 className="font-medium text-gray-900">{plan.plan_name}</h4>
                                            <p className="text-sm text-gray-500">
                                              ₪{plan.price_monthly}/חודש
                                            </p>
                                          </div>
                                          <ArrowRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ),
                              variant: 'info',
                              confirmText: '',
                              cancelText: 'סגור'
                            })
                          }}
                          disabled={loadingPlans || saving || availablePlans.length <= 1}
                          className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {/* Debug info */}
                          {console.log('🔘 Button render - loadingPlans:', loadingPlans, 'saving:', saving, 'availablePlans.length:', availablePlans.length)}
                          {/* End debug */}
                          {saving ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              מעדכן...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              שנה תוכנית
                            </>
                          )}
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              // Extend by 1 month
                              const newDate = new Date(client.plan_expiry_date || new Date())
                              newDate.setMonth(newDate.getMonth() + 1)
                              
                              const response = await apiClient.updateClient(clientUniqueId, {
                                plan_expiry_date: newDate.toISOString().split('T')[0]
                              })
                              
                              if (response.success) {
                                setClient(prev => ({ 
                                  ...prev, 
                                  plan_expiry_date: newDate.toISOString().split('T')[0]
                                }))
                                toast.success('המנוי הוארך בחודש')
                              } else {
                                toast.error('שגיאה בהארכת המנוי')
                              }
                            } catch {
                              toast.error('שגיאה בהארכת המנוי')
                            }
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          🗓️ הארך חודש
                        </button>
                        
                        {client.plan_status === 'trial' && (
                          <button 
                            onClick={async () => {
                              try {
                                const response = await apiClient.updateClient(clientUniqueId, {
                                  plan_status: 'active'
                                })
                                
                                if (response.success) {
                                  setClient(prev => ({ ...prev, plan_status: 'active' }))
                                  toast.success('הלקוח הוחל לפעיל')
                                } else {
                                  toast.error('שגיאה בעדכון סטטוס')
                                }
                              } catch {
                                toast.error('שגיאה בעדכון סטטוס')
                              }
                            }}
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            ✅ הפוך לפעיל
                          </button>
                        )}
                        
                        {client.plan_status !== 'trial' && (
                          <button 
                            onClick={async () => {
                              try {
                                // Start 30-day trial
                                const trialEndDate = new Date()
                                trialEndDate.setDate(trialEndDate.getDate() + 30)
                                
                                const response = await apiClient.updateClient(clientUniqueId, {
                                  plan_status: 'trial',
                                  plan_expiry_date: trialEndDate.toISOString().split('T')[0]
                                })
                                
                                if (response.success) {
                                  setClient(prev => ({ 
                                    ...prev, 
                                    plan_status: 'trial',
                                    plan_expiry_date: trialEndDate.toISOString().split('T')[0]
                                  }))
                                  toast.success('תקופת ניסיון של 30 יום הופעלה')
                                } else {
                                  toast.error('שגיאה בהפעלת תקופת ניסיון')
                                }
                              } catch {
                                toast.error('שגיאה בהפעלת תקופת ניסיון')
                              }
                            }}
                            className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                          >
                            🔍 תקופת ניסיון 30 יום
                          </button>
                        )}
                      </div>
                    </div>
                  
                  {/* Current Plan Info - Always visible */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">מידע נוכחי</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">תוכנית:</span>
                        <span className="font-medium text-gray-900 mr-2">{client.plan_name || 'ללא תוכנית'}</span>
                      </div>
                      {client.plan_price && (
                        <div>
                          <span className="text-gray-600">מחיר:</span>
                          <span className="font-medium text-gray-900 mr-2">₪{client.plan_price}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">התחלה:</span>
                        <span className="font-medium text-gray-900 mr-2">{formatDate(client.plan_start_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ימים נותרו:</span>
                        <span className={`font-medium mr-2 ${
                          client.days_until_expiry < 0 ? 'text-red-600' : 
                          client.days_until_expiry < 7 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {client.days_until_expiry < 0 ? 'פג תוקף' : `${client.days_until_expiry} ימים`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
             
            </EditableSection>

            {/* Quick Actions for Plan Management */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900 mb-3">פעולות מהירות</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={async () => {
                    try {
                      setSaving(true)
                      
                      const response = await apiClient.extendSubscription(clientUniqueId, 'month')
                      
                      if (response.success) {
                        // Update client with new expiry date from backend
                        setClient(prev => ({ 
                          ...prev, 
                          plan_expiry_date: response.data.new_expiry_date,
                          days_until_expiry: response.data.days_until_expiry
                        }))
                        toast.success(`המנוי הוארך בחודש - תפוגה חדשה: ${new Date(response.data.new_expiry_date).toLocaleDateString('he-IL')}`)
                      } else {
                        toast.error(response.message || 'שגיאה בהארכת המנוי')
                      }
                    } catch (error) {
                      console.error('Extend subscription error:', error)
                      toast.error('שגיאה בהארכת המנוי')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      מאריך...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3 h-3" />
                      הארך חודש
                    </>
                  )}
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      setSaving(true)
                      
                      const response = await apiClient.extendSubscription(clientUniqueId, 'week')
                      
                      if (response.success) {
                        setClient(prev => ({ 
                          ...prev, 
                          plan_expiry_date: response.data.new_expiry_date,
                          days_until_expiry: response.data.days_until_expiry
                        }))
                        toast.success(`המנוי הוארך בשבוע - תפוגה חדשה: ${new Date(response.data.new_expiry_date).toLocaleDateString('he-IL')}`)
                      } else {
                        toast.error(response.message || 'שגיאה בהארכת המנוי')
                      }
                    } catch (error) {
                      console.error('Extend subscription error:', error)
                      toast.error('שגיאה בהארכת המנוי')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      מאריך...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3" />
                      הארך שבוע
                    </>
                  )}
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      setSaving(true)
                      
                      const response = await apiClient.extendSubscription(clientUniqueId, 'year')
                      
                      if (response.success) {
                        setClient(prev => ({ 
                          ...prev, 
                          plan_expiry_date: response.data.new_expiry_date,
                          days_until_expiry: response.data.days_until_expiry
                        }))
                        toast.success(`המנוי הוארך בשנה - תפוגה חדשה: ${new Date(response.data.new_expiry_date).toLocaleDateString('he-IL')}`)
                      } else {
                        toast.error(response.message || 'שגיאה בהארכת המנוי')
                      }
                    } catch (error) {
                      console.error('Extend subscription error:', error)
                      toast.error('שגיאה בהארכת המנוי')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      מאריך...
                    </>
                  ) : (
                    <>
                      <Target className="w-3 h-3" />
                      הארך שנה
                    </>
                  )}
                </button>
                
                {client.plan_status === 'trial' && (
                  <button 
                    onClick={async () => {
                      try {
                        const response = await apiClient.updateClient(clientUniqueId, {
                          plan_status: 'active'
                        })
                        
                        if (response.success) {
                          setClient(prev => ({ ...prev, plan_status: 'active' }))
                          toast.success('הלקוח הוחל לפעיל')
                        } else {
                          toast.error('שגיאה בעדכון סטטוס')
                        }
                      } catch {
                        toast.error('שגיאה בעדכון סטטוס')
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    הפוך לפעיל
                  </button>
                )}
                
                {client.plan_status !== 'trial' && (
                  <button 
                    onClick={async () => {
                      try {
                        // Start 30-day trial
                        const trialEndDate = new Date()
                        trialEndDate.setDate(trialEndDate.getDate() + 30)
                        
                        const response = await apiClient.updateClient(clientUniqueId, {
                          plan_status: 'trial',
                          plan_expiry_date: trialEndDate.toISOString().split('T')[0]
                        })
                        
                        if (response.success) {
                          setClient(prev => ({ 
                            ...prev, 
                            plan_status: 'trial',
                            plan_expiry_date: trialEndDate.toISOString().split('T')[0]
                          }))
                          toast.success('תקופת ניסיון של 30 יום הופעלה')
                        } else {
                          toast.error('שגיאה בהפעלת תקופת ניסיון')
                        }
                      } catch {
                        toast.error('שגיאה בהפעלת תקופת ניסיון')
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    תקופת ניסיון 30 יום
                  </button>
                )}
              </div>
            </div>

            {/* Plan History & Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <History className="w-5 h-5 ml-2" />
                היסטוריה ונתונים
              </h3>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">היסטוריית מנויים ושינויים</p>
                  <p className="text-sm text-gray-500">בפיתוח...</p>
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

        {activeTab === 'apps' && isCustomPlan() && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Smartphone className="w-5 h-5 ml-2" />
                  אפליקציות מותרות - מסלול אישי
                </h3>
                <p className="text-gray-600 mt-1">
                  נהל את רשימת האפליקציות המותרות עבור הלקוח במסלול האישי
                </p>
              </div>
              
              <button
                onClick={() => setShowCustomPlanApps(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>נהל אפליקציות</span>
              </button>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">מסלול אישי פעיל</h4>
                  <p className="text-sm text-purple-700">
                    הלקוח נמצא במסלול האישי. ניתן לבחור באופן ידני אילו אפליקציות יהיו מותרות עבורו.
                    הגדרה זו עוקפת את הקטגוריות הסטנדרטיות ומאפשרת שליטה מלאה.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">לחץ על "נהל אפליקציות" כדי לבחור אפליקציות</p>
              <p className="text-sm text-gray-500">תוכל לחפש, לסנן ולבחור אפליקציות ספציפיות עבור הלקוח</p>
            </div>
          </div>
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