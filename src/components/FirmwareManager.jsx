import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { Toggle } from './Toggle'
import { Smartphone, HardDrive, Wrench, Loader2, Download, Bell, Trash2 } from 'lucide-react'
import { useGlobalState } from '../contexts/GlobalStateContext'

const FirmwareManager = () => {
  const { openModal } = useGlobalState()
  const [firmwares, setFirmwares] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [firmwareType, setFirmwareType] = useState('stock') // 'stock' or 'patched'
  const [patchingId, setPatchingId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  // Track if this is the initial mount
  const isInitialMount = useRef(true)

  // Load firmwares when type changes
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isInitialMount.current) {
          setLoading(true)
        } else {
          setTableLoading(true)
        }

        setCurrentPage(1)

        const response = firmwareType === 'notifications'
          ? await apiClient.getSupportNotifications(1, itemsPerPage)
          : await apiClient.getFirmwares(firmwareType, 1, itemsPerPage)

        if (response.success) {
          const responseData = response.data?.data || response.data || []
          const pagination = response.data?.pagination

          setFirmwares(responseData)
          setHasMore(pagination?.has_more || false)
        }

        isInitialMount.current = false
      } catch (error) {
        console.error('Error loading firmwares:', error)
        toast.error('שגיאה בטעינת הנתונים')
      } finally {
        setLoading(false)
        setTableLoading(false)
      }
    }

    loadData()
  }, [firmwareType, refreshTrigger])

  // Load more for pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const response = firmwareType === 'notifications'
          ? await apiClient.getSupportNotifications(nextPage, itemsPerPage)
          : await apiClient.getFirmwares(firmwareType, nextPage, itemsPerPage)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setFirmwares((prev) => [...prev, ...responseData])
        setCurrentPage(nextPage)
        setHasMore(pagination?.has_more || false)
      }
    } catch (error) {
      console.error('Error loading more firmwares:', error)
      toast.error('שגיאה בטעינת נתונים נוספים')
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle firmware patching
  const handleStartPatch = async (firmwareId) => {
    if (patchingId) return // Prevent multiple simultaneous patches

    try {
      setPatchingId(firmwareId)

      const response = await apiClient.startFirmwarePatch(firmwareId)

      console.log('Patch response:', response)

      if (response.success) {
        toast.success('תיקון הקושחה הושלם בהצלחה!')
        setRefreshTrigger((n) => n + 1)

        if (response.data?.size_mb) {
          console.log('Patched firmware size:', response.data.size_mb, 'MB')
        }
      } else {
        toast.error(response.message || 'שגיאה בהפעלת התהליך')
      }
    } catch (error) {
      console.error('Error starting patch:', error)
      toast.error(`שגיאה בהפעלת התהליך: ${error.message}`)
    } finally {
      setPatchingId(null)
    }
  }

  // Handle delete patched firmware
  const handleDeletePatched = (firmware) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת קושחה מותאמת',
      size: 'sm',
      data: {
        itemType: 'קושחה מותאמת',
        itemName: firmware.build_fingerprint || `#${firmware.id}`,
        warningText: 'פעולה זו תמחק את הקושחה המותאמת לצמיתות ואינה ניתנת לביטול!'
      },
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: async () => {
        const response = await apiClient.deletePatchedFirmware(firmware.id)
        if (response.success) {
          toast.success('הקושחה המותאמת נמחקה בהצלחה')
          setFirmwares((prev) => prev.filter((f) => f.id !== firmware.id))
        } else {
          toast.error(response.message || 'שגיאה במחיקת הקושחה')
        }
      }
    })
  }

  // Handle row click to show firmware details
  const handleRowClick = (firmware) => {
    openModal({
      layout: 'firmwareDetails',
      title: 'פרטי קושחה',
      size: 'xl',
      data: {
        firmware: firmware,
        type: firmwareType
      },
      showCancelButton: true,
      cancelText: 'סגור'
    })
  }

  const handleNotificationRowClick = (notification) => {
    openModal({
      layout: 'uploadFirmware',
      title: 'העלאת קושחת מקור',
      size: 'lg',
      data: {
        notification,
        onSuccess: () => setRefreshTrigger((n) => n + 1)
      },
      showCancelButton: true,
      cancelText: 'ביטול'
    })
  }

  // Toggle options
  const toggleOptions = [
    {
      id: 'stock',
      label: 'קושחות מקור',
      icon: <Smartphone className="w-4 h-4" />
    },
    {
      id: 'patched',
      label: 'קושחות מותאמות',
      icon: <HardDrive className="w-4 h-4" />
    },
    {
      id: 'notifications',
      label: 'בקשות התראה',
      icon: <Bell className="w-4 h-4" />
    }
  ]

  // Notifications columns
  const notificationColumns = [
    {
      id: 'id',
      key: 'id',
      label: 'מזהה',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{row.id}</span>
      )
    },
    {
      id: 'contact',
      key: 'email',
      label: 'פרטי קשר',
      type: 'text',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{row.full_name || '—'}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
          {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
        </div>
      )
    },
    {
      id: 'device',
      key: 'model',
      label: 'מכשיר',
      type: 'text',
      render: (row) => {
        const name = row.model || row.product_device
        const maker = row.manufacturer || row.brand
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm leading-tight">
                {maker ? `${maker} ${name}` : name || '—'}
              </p>
              {row.android_version && (
                <p className="text-xs text-gray-500">Android {row.android_version}</p>
              )}
            </div>
          </div>
        )
      }
    },
    {
      id: 'build_fingerprint',
      key: 'build_fingerprint',
      label: 'טביעת אצבע',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-xs text-gray-700 break-all">{row.build_fingerprint}</span>
      )
    },
    {
      id: 'notified',
      key: 'notified',
      label: 'סטטוס',
      type: 'custom',
      render: (row) => row.notified
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">נשלחה התראה</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">ממתין</span>
    },
    {
      id: 'created_at',
      key: 'created_at',
      label: 'תאריך רישום',
      type: 'text',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('he-IL') : '—'}
        </span>
      )
    }
  ]

  // Define table columns
  const tableColumns = [
    {
      id: 'id',
      key: 'id',
      label: 'מזהה',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          #{row.id}
        </span>
      )
    },
    {
      id: 'build_fingerprint',
      key: 'build_fingerprint',
      label: 'טביעת אצבע',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-xs text-gray-700">
          {row.build_fingerprint}
        </span>
      )
    },
    {
      id: 'android_version',
      key: 'android_version',
      label: 'מכשיר / גרסה',
      type: 'text',
      render: (row) => {
        const deviceName = row.model || row.device_name || row.product_device
        const manufacturer = row.manufacturer || row.brand
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              {deviceName && (
                <p className="font-medium text-gray-900 text-sm leading-tight">
                  {manufacturer ? `${manufacturer} ${deviceName}` : deviceName}
                </p>
              )}
              <p className={`text-gray-500 ${deviceName ? 'text-xs' : 'text-sm font-medium text-gray-900'}`}>
                {row.android_version ? `Android ${row.android_version}` : '-'}
              </p>
            </div>
          </div>
        )
      }
    },
    {
      id: 'linked_firmware',
      key: 'linked_firmware',
      label: firmwareType === 'stock' ? 'קושחה מותאמת' : 'קושחת מקור',
      type: 'custom',
      render: (row) => {
        const linkedId = firmwareType === 'stock' ? row.patched_firmware_id : row.original_firmware_id
        if (!linkedId) return <span className="text-gray-400 text-sm">—</span>
        return (
          <span className="font-mono text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded">
            #{linkedId}
          </span>
        )
      }
    },
    {
      id: 'is_stock',
      key: 'is_stock',
      label: 'סוג',
      type: 'custom',
      render: (row) => row.is_stock
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">מקורי</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">מותאם אישית</span>
    },
    {
      id: 'actions',
      key: 'actions',
      label: 'פעולות',
      type: 'custom',
      render: (row) => {
        const isPatching = patchingId === row.id

        // For patched firmwares, show download button
        if (firmwareType === 'patched') {
          const downloadUrl = row.firmware_url
            ? `https://ikosher.me/iFilter/${row.firmware_url}`
            : null

          return (
            <div className="flex items-center justify-center gap-2">
              <a
                href={downloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!downloadUrl) {
                    e.preventDefault()
                    toast.error('קישור ההורדה אינו זמין')
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  downloadUrl
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="הורד קושחה"
              >
                <Download className="w-4 h-4" />
                <span>הורדה</span>
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePatched(row)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                title="מחק קושחה"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחיקה</span>
              </button>
            </div>
          )
        }

        // For stock firmwares, show patch button
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStartPatch(row.id)
              }}
              disabled={isPatching || patchingId !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPatching
                  ? 'bg-purple-100 text-purple-600 cursor-wait'
                  : patchingId !== null
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              title={isPatching ? 'מעבד...' : 'התחל תיקון'}
            >
              {isPatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>מעבד...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>תיקון</span>
                </>
              )}
            </button>
          </div>
        )
      }
    }
  ]

  const tableConfig = {
    columns: firmwareType === 'notifications' ? notificationColumns : tableColumns,
    data: firmwares,
    tableType: 'firmwares',
    onRowClick: firmwareType === 'notifications' ? handleNotificationRowClick : handleRowClick
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Smartphone className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">טוען קושחות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ניהול קושחות</h1>
              <p className="text-sm text-gray-600">
                צפייה וניהול קושחות מקור וקושחות מותאמות
              </p>
            </div>
          </div>
        </div>

        {/* Toggle between Stock and Patched */}
        <div className="mb-6 flex justify-start">
          <Toggle
            options={toggleOptions}
            value={firmwareType}
            onChange={setFirmwareType}
            toggleStyle="tabs"
          />
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                firmwareType === 'stock'
                  ? 'bg-green-100'
                  : firmwareType === 'patched'
                  ? 'bg-purple-100'
                  : 'bg-blue-100'
              }`}>
                {firmwareType === 'stock' ? (
                  <Smartphone className="w-6 h-6 text-green-600" />
                ) : firmwareType === 'patched' ? (
                  <HardDrive className="w-6 h-6 text-purple-600" />
                ) : (
                  <Bell className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {firmwareType === 'stock' ? 'קושחות מקור' : firmwareType === 'patched' ? 'קושחות מותאמות' : 'בקשות התראה'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{firmwares.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {tableLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Smartphone className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      ) : firmwares.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Smartphone className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין קושחות</h3>
            <p className="text-gray-600">
              {firmwareType === 'stock' ? 'לא נמצאו קושחות מקור' : firmwareType === 'patched' ? 'לא נמצאו קושחות מותאמות' : 'לא נמצאו בקשות התראה'}
            </p>
          </div>
        </div>
      ) : (
        <Table
          tableConfig={tableConfig}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader={true}
        />
      )}
    </div>
  )
}

export default FirmwareManager
