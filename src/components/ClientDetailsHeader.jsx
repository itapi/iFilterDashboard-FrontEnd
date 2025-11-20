import { ArrowRight, User, Crown, Smartphone, CreditCard, CheckCircle, X, Zap, Settings } from 'lucide-react'

/**
 * ClientDetailsHeader - Header section with avatar, client info, status badges, and tabs
 *
 * @param {Object} client - Client data object
 * @param {Function} onBack - Callback when back button is clicked
 * @param {string} activeTab - Currently active tab id
 * @param {Function} onTabChange - Callback when tab is changed
 * @param {boolean} isCustomPlan - Whether client has custom plan
 */
const ClientDetailsHeader = ({ client, onBack, activeTab, onTabChange, isCustomPlan }) => {

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'ניסיון', icon: Zap },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'לא פעיל', icon: X },
      // Legacy status mapping
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

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: User },
    { id: 'plan', label: 'תוכנית ומנוי', icon: Crown },
    { id: 'device', label: 'מידע מכשיר', icon: Smartphone },
    ...(isCustomPlan ? [{ id: 'apps', label: 'אפליקציות מותרות', icon: Smartphone }] : []),
    { id: 'settings', label: 'הגדרות נוספות', icon: Settings },
    { id: 'payments', label: 'תשלומים', icon: CreditCard },
  ]

  return (
    <div className="mb-8">
      {/* Header with avatar and client info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {client.first_name?.charAt(0)?.toUpperCase() || ''}{client.last_name?.charAt(0)?.toUpperCase() || ''}
              </span>
            </div>

            {/* Client Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-gray-600">לקוח #{client.client_unique_id}</p>

              {/* Status Badges */}
              <div className="flex items-center space-x-2 mt-2">
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

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
  )
}

export default ClientDetailsHeader
