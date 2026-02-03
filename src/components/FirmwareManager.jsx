import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { Toggle } from './Toggle'
import { Smartphone, HardDrive, Wrench, Loader2, Download } from 'lucide-react'
import { useGlobalState } from '../contexts/GlobalStateContext'

const FirmwareManager = () => {
  const { openModal } = useGlobalState()
  const [firmwares, setFirmwares] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [firmwareType, setFirmwareType] = useState('stock') // 'stock' or 'patched'
  const [patchingId, setPatchingId] = useState(null) // Track which firmware is being patched

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

        const response = await apiClient.getFirmwares(firmwareType, 1, itemsPerPage)

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
  }, [firmwareType])

  // Load more for pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const response = await apiClient.getFirmwares(firmwareType, nextPage, itemsPerPage)

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

        // Show additional info if available
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
      label: 'גרסת אנדרואיד',
      type: 'text',
      render: (row) => {

          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">
                {row.android_version || '-'}
              </span>
            </div>
          )

      }
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
            <div className="flex items-center justify-center">
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
    columns: tableColumns,
    data: firmwares,
    tableType: 'firmwares',
    onRowClick: handleRowClick
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
                  : 'bg-purple-100'
              }`}>
                {firmwareType === 'stock' ? (
                  <Smartphone className="w-6 h-6 text-green-600" />
                ) : (
                  <HardDrive className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {firmwareType === 'stock' ? 'קושחות מקור' : 'קושחות מותאמות'}
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
              לא נמצאו {firmwareType === 'stock' ? 'קושחות מקור' : 'קושחות מותאמות'}
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
