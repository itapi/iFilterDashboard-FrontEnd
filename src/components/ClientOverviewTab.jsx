import { User, Mail, Phone, Settings, Calendar, CheckCircle, X, Zap } from 'lucide-react'
import EditableSection from './EditableSection'

/**
 * ClientOverviewTab - Overview tab showing personal and account information
 *
 * @param {Object} client - Client data object
 * @param {string} clientUniqueId - Unique identifier for the client
 * @param {Function} onClientUpdate - Callback when client data is updated
 * @param {Function} apiClient - API client for making requests
 */
const ClientOverviewTab = ({ client, clientUniqueId, onClientUpdate, apiClient }) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'ניסיון', icon: Zap },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information - Using EditableSection */}
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
            onClientUpdate({ ...client, ...updatedData })
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
            <div className="flex items-center space-x-2">
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
  )
}

export default ClientOverviewTab
