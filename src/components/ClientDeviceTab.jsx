import { Smartphone, Package, Cpu, HardDrive, Info, RefreshCw, Box, Zap } from 'lucide-react'

/**
 * ClientDeviceTab - Device information tab showing device details, Magisk and Xposed modules
 *
 * @param {Object} deviceData - Device data object
 * @param {boolean} loadingDeviceData - Whether device data is being loaded
 */
const ClientDeviceTab = ({ deviceData, loadingDeviceData }) => {

  const formatDateTime = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleString('he-IL')
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

  return (
    <div className="space-y-6">
      {/* Device Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Smartphone className="w-5 h-5 ml-2" />
            סקירת מכשיר
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manufacturer & Model */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <Smartphone className="w-4 h-4 ml-1" />
              יצרן ודגם
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {deviceData.manufacturer || 'לא זמין'}
            </p>
            <p className="text-sm text-gray-600">{deviceData.model || 'לא זמין'}</p>
          </div>

          {/* Android Version */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <Package className="w-4 h-4 ml-1" />
              גרסת Android
            </label>
            <p className="text-lg font-semibold text-gray-900">
              Android {deviceData.android_version || 'לא זמין'}
            </p>
          </div>

          {/* CPU Architecture */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <Cpu className="w-4 h-4 ml-1" />
              ארכיטקטורת מעבד
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {deviceData.cpu_architecture || 'לא זמין'}
            </p>
          </div>

          {/* Device ID */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <HardDrive className="w-4 h-4 ml-1" />
              מזהה מכשיר
            </label>
            <p className="text-sm font-mono text-gray-900 break-all">
              {deviceData.device_id || 'לא זמין'}
            </p>
          </div>

          {/* IMEI */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <Info className="w-4 h-4 ml-1" />
              IMEI
            </label>
            <p className="text-sm font-mono text-gray-900">
              {deviceData.imei || 'לא זמין'}
            </p>
          </div>

          {/* Sync Status */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <RefreshCw className="w-4 h-4 ml-1" />
              סטטוס סינכרון
            </label>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                deviceData.sync_status === 'recent' ? 'bg-green-100 text-green-800 border-green-200' :
                deviceData.sync_status === 'normal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                deviceData.sync_status === 'stale' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {{
                  'recent': '✓ עדכני',
                  'normal': '○ רגיל',
                  'stale': '⚠ מיושן',
                  'never': '✗ לא סונכרן'
                }[deviceData.sync_status] || deviceData.sync_status}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(deviceData.last_sync)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Magisk Modules Card */}
      {deviceData.has_magisk && deviceData.magisk_modules && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Box className="w-5 h-5 ml-2 text-blue-600" />
              מודולי Magisk
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {deviceData.magisk_module_count} מותקנים
            </span>
          </div>
          <div className="space-y-2">
            {deviceData.magisk_modules.map((module, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{module.name || 'Unnamed Module'}</h4>
                    {module.version && (
                      <p className="text-xs text-gray-600 mt-1">גרסה: {module.version}</p>
                    )}
                    {module.description && (
                      <p className="text-sm text-gray-700 mt-1">{module.description}</p>
                    )}
                  </div>
                  {module.enabled !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      module.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {module.enabled ? 'פעיל' : 'כבוי'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Xposed Modules Card */}
      {deviceData.has_xposed && deviceData.xposed_modules && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 ml-2 text-purple-600" />
              מודולי Xposed
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {deviceData.xposed_module_count} מותקנים
            </span>
          </div>
          <div className="space-y-2">
            {deviceData.xposed_modules.map((module, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{module.name || 'Unnamed Module'}</h4>
                    {module.version && (
                      <p className="text-xs text-gray-600 mt-1">גרסה: {module.version}</p>
                    )}
                    {module.description && (
                      <p className="text-sm text-gray-700 mt-1">{module.description}</p>
                    )}
                  </div>
                  {module.enabled !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      module.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {module.enabled ? 'פעיל' : 'כבוי'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDeviceTab
