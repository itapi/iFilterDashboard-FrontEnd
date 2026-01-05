import { useState, useEffect } from 'react'
import { Settings, Smartphone, Package } from 'lucide-react'
import { toast } from 'react-toastify'
import { getImageUrl } from '../utils/api'
import Select from 'react-select'

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
  const [appsWithTags, setAppsWithTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [selectedTags, setSelectedTags] = useState({}) // { package_name: [tag_ids] }
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettingsMeta()
    loadSettings()
    loadAppsWithTags()
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
   * Load apps with tags from API
   */
  const loadAppsWithTags = async () => {
    try {
      setLoadingApps(true)
      const response = await apiClient.getAppsWithTags(clientUniqueId)

      if (response.success) {
        const apps = response.data.apps || []
        setAppsWithTags(apps)
        setAllTags(response.data.all_tags || [])

        // Initialize selected tags from current selections
        const initialSelections = {}
        apps.forEach(app => {
          // Backend now returns selected_tag_ids as an array
          // Ensure all IDs are numbers for consistent comparison
          let tagIds = (app.selected_tag_ids || []).map(id => Number(id))

          // If no tags are selected, auto-select default tags
          if (tagIds.length === 0 && app.available_tags && app.available_tags.length > 0) {
            const defaultTags = app.available_tags.filter(tag => tag.is_default === 1)
            tagIds = defaultTags.map(tag => Number(tag.id))
          }

          initialSelections[app.package_name] = tagIds

          // Debug log
          console.log('App:', app.app_name, 'Selected tag IDs:', tagIds, 'Available tags:', app.available_tags)
        })
        setSelectedTags(initialSelections)
      } else {
        toast.error('שגיאה בטעינת אפליקציות עם תגיות')
      }
    } catch (err) {
      console.error('Error loading apps with tags:', err)
      toast.error('שגיאה בטעינת אפליקציות עם תגיות')
    } finally {
      setLoadingApps(false)
    }
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

  /**
   * Component to display app icon with fallback
   */
  const AppIcon = ({ iconUrl, appName }) => {
    const [imageError, setImageError] = useState(false)

    return (
      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
        {iconUrl && !imageError ? (
          <img
            src={getImageUrl(iconUrl)}
            alt={appName}
            className="w-10 h-10 rounded-lg object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Package className="w-6 h-6 text-purple-600" />
        )}
      </div>
    )
  }

  /**
   * Handle tag selection change for an app
   */
  const handleTagSelectionChange = (packageName, newSelectedTagIds) => {
    setSelectedTags(prev => ({
      ...prev,
      [packageName]: newSelectedTagIds
    }))
    setHasChanges(true)
  }

  /**
   * Save all tag selections
   */
  const handleSaveTags = async () => {
    try {
      setSaving(true)

      // Build app_tags array for API
      const appTags = []
      Object.entries(selectedTags).forEach(([packageName, tagIds]) => {
        tagIds.forEach(tagId => {
          appTags.push({
            package_name: packageName,
            tag_id: tagId
          })
        })
      })

      const response = await apiClient.updateClientAppTags(clientUniqueId, appTags)

      if (response.success) {
        toast.success('התגיות עודכנו בהצלחה')
        setHasChanges(false)
        // Reload to get fresh data
        loadAppsWithTags()
      } else {
        toast.error('שגיאה בעדכון התגיות')
      }
    } catch (err) {
      console.error('Error saving tags:', err)
      toast.error('שגיאה בעדכון התגיות')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Custom styles for react-select to match design
   */
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minWidth: '250px',
      borderColor: state.isFocused ? '#a855f7' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #a855f7' : 'none',
      '&:hover': {
        borderColor: '#a855f7'
      },
      borderRadius: '0.5rem',
      padding: '2px'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f3e8ff',
      borderRadius: '9999px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#6b21a8',
      fontWeight: '500',
      fontSize: '0.75rem'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6b21a8',
      borderRadius: '9999px',
      '&:hover': {
        backgroundColor: '#e9d5ff',
        color: '#581c87'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      border: '1px solid #e5e7eb'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#f3e8ff'
        : state.isFocused
        ? '#f9fafb'
        : 'white',
      color: state.isSelected ? '#6b21a8' : '#111827',
      '&:active': {
        backgroundColor: '#f3e8ff'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '0.875rem'
    })
  }

  /**
   * Component for multi-select tag dropdown using react-select
   */
  const TagMultiSelect = ({ app, selectedTagIds, onChange }) => {
    // Transform app tags to react-select format
    const options = (app.available_tags || []).map(tag => ({
      value: Number(tag.id), // Ensure value is a number
      label: `${tag.display_name || tag.tag_name}${tag.is_default === 1 ? ' ⭐' : ''}`,
      tag: tag
    }))

    // Get selected options - ensure both are numbers for comparison
    const normalizedSelectedIds = selectedTagIds.map(id => Number(id))
    const selectedOptions = options.filter(opt => normalizedSelectedIds.includes(opt.value))

    // Debug log
    console.log('TagMultiSelect for', app.app_name, {
      selectedTagIds,
      normalizedSelectedIds,
      options,
      selectedOptions
    })

    const handleChange = (selected) => {
      const newSelectedIds = selected ? selected.map(opt => opt.value) : []
      onChange(app.package_name, newSelectedIds)
    }

    return (
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        styles={customSelectStyles}
        placeholder="בחר תגיות..."
        noOptionsMessage={() => 'אין תגיות זמינות'}
        closeMenuOnSelect={false}
        isSearchable={false}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    )
  }

  /**
   * Component to display an app with its tag multi-select
   */
  const AppWithTags = ({ app }) => {
    const currentSelectedTags = selectedTags[app.package_name] || []

    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
        {/* App Icon and Name */}
        <AppIcon iconUrl={app.icon_url} appName={app.app_name} />

        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-900 mb-1">
            {app.app_name}
          </h4>
          <p className="text-sm text-gray-600 truncate">
            {app.package_name}
          </p>
        </div>

        {/* Tag Multi-Select */}
        <TagMultiSelect
          app={app}
          selectedTagIds={currentSelectedTags}
          onChange={handleTagSelectionChange}
        />
      </div>
    )
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

      {/* Apps with Tags Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">הגדרות נוספות</h3>
            <p className="text-sm text-gray-600">תגיות זמינות עבור כל אפליקציה</p>
          </div>
        </div>

        {loadingApps ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">טוען אפליקציות...</span>
            </div>
          </div>
        ) : appsWithTags.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">אין אפליקציות זמינות עם תגיות</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {appsWithTags.map((app) => (
                <AppWithTags key={app.package_name} app={app} />
              ))}
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="mt-6 flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      יש לך שינויים שלא נשמרו
                    </p>
                    <p className="text-xs text-purple-700">
                      לחץ על שמור כדי לעדכן את התגיות
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSaveTags}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>שומר...</span>
                    </>
                  ) : (
                    <span>שמור שינויים</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdditionalSettingsTab
