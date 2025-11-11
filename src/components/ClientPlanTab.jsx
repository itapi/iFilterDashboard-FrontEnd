import { useState } from 'react'
import { toast } from 'react-toastify'
import EditableSection from './EditableSection'
import { useModal } from '../contexts/GlobalStateContext'
import {
  Crown,
  Settings,
  History,
  RefreshCw,
  CalendarPlus,
  Calendar,
  Target,
  CheckCircle2,
  Search,
  ArrowRight,
  CheckCircle,
  X,
  Zap
} from 'lucide-react'

/**
 * ClientPlanTab - Plan management tab with plan display, quick actions, and history
 *
 * @param {Object} client - Client data object
 * @param {string} clientUniqueId - Unique identifier for the client
 * @param {Function} onClientUpdate - Callback when client data is updated
 * @param {Array} availablePlans - List of available plans
 * @param {boolean} loadingPlans - Whether plans are being loaded
 * @param {boolean} saving - Whether a save operation is in progress
 * @param {Function} setSaving - Function to set saving state
 * @param {Function} apiClient - API client for making requests
 */
const ClientPlanTab = ({
  client,
  clientUniqueId,
  onClientUpdate,
  availablePlans,
  loadingPlans,
  saving,
  setSaving,
  apiClient
}) => {
  const { openConfirmModal } = useModal()

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'ניסיון', icon: Zap },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X }
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
      onConfirm: () => executePlanChange(newPlanId, planName)
    })
  }

  const executePlanChange = async (newPlanId, planName) => {
    try {
      setSaving(true)

      const updateData = {
        plan_unique_id: newPlanId,
        plan_status: 'active'
      }

      if (client.plan_status === 'inactive' || !client.plan_start_date) {
        updateData.plan_start_date = new Date().toISOString().split('T')[0]
      }

      const response = await apiClient.updateClient(clientUniqueId, updateData)

      if (response.success) {
        onClientUpdate({
          ...client,
          plan_unique_id: newPlanId,
          plan_name: planName,
          plan_status: 'active',
          plan_start_date: updateData.plan_start_date || client.plan_start_date
        })
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

  const showPlanSelectionModal = () => {
    const otherPlans = availablePlans.filter(p => p.plan_unique_id !== client.plan_unique_id)

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
                key={plan.plan_unique_id}
                onClick={() => handlePlanChange(plan.plan_unique_id, plan.plan_name)}
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
  }

  return (
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

            {/* Change Plan Button */}
            <button
              onClick={showPlanSelectionModal}
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

      {/* Quick Actions for Plan Management */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h4 className="text-sm font-medium text-blue-900 mb-3">פעולות מהירות</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                setSaving(true)
                const response = await apiClient.extendSubscription(clientUniqueId, 'week')

                if (response.success) {
                  onClientUpdate({
                    ...client,
                    plan_expiry_date: response.data.new_expiry_date,
                    days_until_expiry: response.data.days_until_expiry
                  })
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
                הארך בשבוע
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}

export default ClientPlanTab
