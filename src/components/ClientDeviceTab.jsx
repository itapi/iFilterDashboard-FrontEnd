import { useState, useEffect } from 'react'
import { Smartphone, Package, Cpu, HardDrive, Info, RefreshCw, Box, Zap, AlertTriangle, Database } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import apiClient from '../utils/api'

/**
 * ClientDeviceTab - Device information tab showing device details, Magisk and Xposed modules
 *
 * @param {Object} deviceData - Device data object
 * @param {boolean} loadingDeviceData - Whether device data is being loaded
 */
const ClientDeviceTab = ({ deviceData, loadingDeviceData }) => {
  const [syncLogs, setSyncLogs] = useState([])
  const [loadingSyncLogs, setLoadingSyncLogs] = useState(false)

  // Fetch sync logs when deviceData is available
  useEffect(() => {
    const fetchSyncLogs = async () => {
      if (!deviceData?.client_unique_id) return

      setLoadingSyncLogs(true)
      try {
        const response = await apiClient.getClientSyncLogs(deviceData.client_unique_id)
        if (response.success && Array.isArray(response.data)) {
          setSyncLogs(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch sync logs:', error)
      } finally {
        setLoadingSyncLogs(false)
      }
    }

    fetchSyncLogs()
  }, [deviceData?.client_unique_id])

  const formatDateTime = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleString('he-IL')
  }

  const formatStorage = (mb) => {
    if (!mb || mb === null) return 'לא זמין'
    const gb = (mb / 1024).toFixed(2)
    return `${gb} GB`
  }

  const calculateStoragePercentage = (total, available) => {
    if (!total || !available || total === null || available === null) return null
    const used = total - available
    return ((used / total) * 100).toFixed(1)
  }

  // Format relative time in Hebrew
  const formatRelativeTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'עכשיו'
    if (diffMins < 60) return `לפני ${diffMins} דקות`
    if (diffHours < 24) return `לפני ${diffHours} שעות`
    if (diffDays === 1) return 'אתמול'
    if (diffDays < 7) return `לפני ${diffDays} ימים`
    return formatDateTime(dateString)
  }

  // Get sync type label in Hebrew
  const getSyncTypeLabel = (syncType) => {
    const labels = {
      'manual': 'ידני',
      'automatic': 'אוטומטי',
      'aidl': 'AIDL'
    }
    return labels[syncType] || syncType
  }

  // Get sync result styling
  const getSyncResultStyle = (result) => {
    switch (result) {
      case 'success':
        return { label: 'הצליח', color: 'text-green-600', bg: 'bg-green-100' }
      case 'partial':
        return { label: 'חלקי', color: 'text-yellow-600', bg: 'bg-yellow-100' }
      case 'failed':
        return { label: 'נכשל', color: 'text-red-600', bg: 'bg-red-100' }
      default:
        return { label: result || 'לא ידוע', color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  if (loadingDeviceData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">טוען נתוני מכשיר...</span>
        </div>
      </div>
    )
  }

  if (!deviceData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">אין נתוני מכשיר</h3>
        <p className="text-gray-600">לא נמצאו נתוני מכשיר עבור לקוח זה</p>
      </div>
    )
  }

  const storagePercentage = calculateStoragePercentage(deviceData.storage_total_mb, deviceData.storage_available_mb)

  return (
    <div className="space-y-6">
      {/* Device Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {deviceData.manufacturer || 'לא זמין'} {deviceData.model || ''}
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Android {deviceData.android_version || 'לא זמין'}
              </p>
            </div>
          </div>

          {/* Sync Status Badge with History Tooltip */}
          <div className="text-left">
            <span
              data-tooltip-id="sync-history-tooltip"
              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border shadow-sm cursor-pointer transition-all hover:shadow-md ${
                deviceData.sync_status === 'recent' ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' :
                deviceData.sync_status === 'normal' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                deviceData.sync_status === 'stale' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${loadingSyncLogs ? 'animate-spin' : ''}`} />
              {{
                'recent': 'סונכרן לאחרונה',
                'normal': 'סינכרון רגיל',
                'stale': 'סינכרון מיושן',
                'never': 'לא סונכרן'
              }[deviceData.sync_status] || deviceData.sync_status}
            </span>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {formatDateTime(deviceData.last_sync)}
            </p>

            {/* Sync History Tooltip */}
            <Tooltip
              id="sync-history-tooltip"
              place="bottom"
              className="!bg-white !text-gray-900 !rounded-xl !shadow-xl !border !border-gray-200 !p-0 !opacity-100 z-50"
              style={{ maxWidth: '320px' }}
              clickable
            >
              <div className="p-4" dir="rtl">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  היסטוריית סנכרון
                </h4>

                {loadingSyncLogs ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mr-2 text-sm text-gray-500">טוען...</span>
                  </div>
                ) : syncLogs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">אין היסטוריית סנכרון</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {syncLogs.map((log) => {
                      const resultStyle = getSyncResultStyle(log.sync_result)
                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultStyle.bg} ${resultStyle.color}`}>
                              {resultStyle.label}
                            </span>
                            <span className="text-gray-600">{getSyncTypeLabel(log.sync_type)}</span>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Cpu className="w-4 h-4" />
              <span className="text-sm font-medium">מעבד</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {deviceData.cpu_architecture || 'לא זמין'}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm font-medium">מזהה מכשיר</span>
            </div>
            <p className="text-sm font-mono text-gray-900 truncate">
              {deviceData.device_id || 'לא זמין'}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">IMEI</span>
            </div>
            <p className="text-sm font-mono text-gray-900 truncate">
              {deviceData.imei || 'לא זמין'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">אחסון</h3>
          </div>

          {deviceData.storage_total_mb !== null && deviceData.storage_available_mb !== null ? (
            <div className="space-y-4">
              {/* Storage Visual */}
              <div className="relative">
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      parseFloat(storagePercentage) > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      parseFloat(storagePercentage) > 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">פנוי</span>
                  <span className={`text-sm font-bold ${
                    parseFloat(storagePercentage) > 90 ? 'text-red-600' :
                    parseFloat(storagePercentage) > 70 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {storagePercentage}% בשימוש
                  </span>
                  <span className="text-xs text-gray-500">מלא</span>
                </div>
              </div>

              {/* Storage Details */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">בשימוש</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatStorage(deviceData.storage_total_mb - deviceData.storage_available_mb)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">פנוי</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatStorage(deviceData.storage_available_mb)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">סה"כ</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatStorage(deviceData.storage_total_mb)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">נתוני אחסון לא זמינים</p>
            </div>
          )}
        </div>

        {/* Reboot Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              deviceData.needs_reboot ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              {deviceData.needs_reboot ? (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              ) : (
                <RefreshCw className="w-5 h-5 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">מצב המכשיר</h3>
          </div>

          {deviceData.needs_reboot !== null && deviceData.needs_reboot ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <p className="text-lg font-bold text-orange-900 mb-2">נדרשת הפעלה מחדש</p>
                <p className="text-sm text-orange-700">
                  המכשיר דורש הפעלה מחדש להשלמת עדכונים או שינויים במערכת
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl">✓</span>
                </div>
                <p className="text-lg font-bold text-green-900 mb-2">המכשיר פועל תקין</p>
                <p className="text-sm text-green-700">
                  כל המערכות פועלות כשורה ואין צורך בהפעלה מחדש
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Magisk Modules */}
        {deviceData.magisk_modules && deviceData.magisk_modules.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900"> רכיבי מערכת</h3>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {deviceData.magisk_module_count}
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {deviceData.magisk_modules.map((module, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{module.name || 'Unnamed Module'}</h4>
                        {module.version && (
                          <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full font-medium">
                            v{module.version}
                          </span>
                        )}
                      </div>
                      {module.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                      )}
                    </div>
                    {module.enabled !== undefined && (
                      <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
                        module.enabled
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}>
                        {module.enabled ? '✓ פעיל' : '○ כבוי'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Xposed Modules */}
        {deviceData.xposed_modules && deviceData.xposed_modules.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">תוספי מערכת </h3>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                {deviceData.xposed_module_count}
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {deviceData.xposed_modules.map((module, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{module.name || 'Unnamed Module'}</h4>
                        {module.version && (
                          <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full font-medium">
                            v{module.version}
                          </span>
                        )}
                      </div>
                      {module.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                      )}
                    </div>
                    {module.enabled !== undefined && (
                      <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
                        module.enabled
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}>
                        {module.enabled ? '✓ פעיל' : '○ כבוי'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State for Modules */}
      {(!deviceData.magisk_modules || deviceData.magisk_modules.length === 0) &&
       (!deviceData.xposed_modules || deviceData.xposed_modules.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">אין מודולים מותקנים</h3>
          <p className="text-gray-600">לא נמצאו מודולי Magisk או Xposed במכשיר זה</p>
        </div>
      )}
    </div>
  )
}

export default ClientDeviceTab
