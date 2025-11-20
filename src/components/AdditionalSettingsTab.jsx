import { useState, useEffect } from 'react'
import { Settings, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'

/**
 * AdditionalSettingsTab - Additional device settings with switch controls
 *
 * @param {number} clientUniqueId - Client unique identifier
 * @param {Object} apiClient - API client instance
 */
const AdditionalSettingsTab = ({ clientUniqueId, apiClient }) => {
  const [settings, setSettings] = useState({})
  const [settingsMeta, setSettingsMeta] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)

  useEffect(() => {
    loadSettingsMeta()
    loadSettings()
  }, [clientUniqueId])

  /**
   * Load settings metadata from database
   */
  const loadSettingsMeta = async () => {
    try {
      setLoadingMeta(true)
      const response = await apiClient.getClientSettingsMeta()

      if (response.success) {
        setSettingsMeta(response.data || [])
      } else {
        toast.error('שגיאה בטעינת מטא-דאטה של הגדרות')
      }
    } catch (err) {
      console.error('Error loading settings metadata:', err)
      toast.error('שגיאה בטעינת מטא-דאטה של הגדרות')
    } finally {
      setLoadingMeta(false)
    }
  }

  /**
   * Load client settings from API
   */
  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getClientSettings(clientUniqueId)

      if (response.success) {
        setSettings(response.data || {})
      } else {
        toast.error('שגיאה בטעינת הגדרות')
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      toast.error('שגיאה בטעינת הגדרות')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get setting value with fallback to default
   */
  const getSettingValue = (key, defaultValue) => {
    if (settings[key]) {
      return settings[key].value === 'true'
    }
    return defaultValue === 'true'
  }

  /**
   * Handle toggle switch change
   */
  const handleToggle = async (key, currentValue) => {
    const newValue = !currentValue

    try {
      // Optimistically update UI
      setSettings(prev => ({
        ...prev,
        [key]: {
          value: newValue.toString(),
          updated_at: new Date().toISOString()
        }
      }))

      const response = await apiClient.updateClientSetting(
        clientUniqueId,
        key,
        newValue.toString()
      )

      if (response.success) {
        toast.success('ההגדרה עודכנה בהצלחה')
      } else {
        // Revert on failure
        setSettings(prev => ({
          ...prev,
          [key]: {
            value: currentValue.toString(),
            updated_at: prev[key]?.updated_at
          }
        }))
        toast.error('שגיאה בעדכון ההגדרה')
      }
    } catch (err) {
      console.error('Error updating setting:', err)
      // Revert on error
      setSettings(prev => ({
        ...prev,
        [key]: {
          value: currentValue.toString(),
          updated_at: prev[key]?.updated_at
        }
      }))
      toast.error('שגיאה בעדכון ההגדרה')
    }
  }

  if (loading || loadingMeta) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">טוען הגדרות...</span>
        </div>
      </div>
    )
  }

  if (!settingsMeta || settingsMeta.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הגדרות זמינות</h3>
        <p className="text-gray-600">לא נמצאו הגדרות במערכת</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Device Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">הגדרות נוספות במכשיר</h3>
            <p className="text-sm text-gray-600">שלוט בהגדרות המכשיר והאבטחה</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {settingsMeta.map((setting) => {
            const isEnabled = getSettingValue(setting.setting_key, setting.default_value)

            return (
              <div
                key={setting.setting_key}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isEnabled ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <Settings className={`w-5 h-5 ${
                      isEnabled ? 'text-green-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {setting.display_label}
                    </h4>
                    {setting.description && (
                      <p className="text-sm text-gray-600">
                        {setting.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle Switch */}
                {setting.type === 'boolean' && (
                  <button
                    onClick={() => handleToggle(setting.setting_key, isEnabled)}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                שינויים נשמרים אוטומטית
              </p>
              <p className="text-sm text-blue-700">
                כל שינוי בהגדרות יישמר מיד ויסונכרן למכשיר הלקוח בסינכרון הבא
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for Second Block */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">הגדרות נוספות</h3>
            <p className="text-sm text-gray-600">בלוק נוסף להגדרות עתידיות</p>
          </div>
        </div>

        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">אזור זה מוכן להגדרות נוספות בעתיד</p>
        </div>
      </div>
    </div>
  )
}

export default AdditionalSettingsTab
