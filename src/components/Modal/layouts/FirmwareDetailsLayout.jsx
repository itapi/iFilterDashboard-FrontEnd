import React from 'react'
import {
  Smartphone,
  HardDrive,
  Calendar,
  Hash,
  Cpu,
  Download,
  Shield,
  Package,
  FileCode,
  Layers,
  Info
} from 'lucide-react'

/**
 * Firmware Details Layout
 *
 * Displays detailed information about a firmware (stock or patched)
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'firmwareDetails',
 *   title: 'פרטי קושחה',
 *   size: 'xl',
 *   data: {
 *     firmware: {...firmware data...},
 *     type: 'stock' // or 'patched'
 *   },
 *   showCancelButton: true,
 *   cancelText: 'סגור'
 * })
 */
export const FirmwareDetailsLayout = ({ data }) => {
  const firmware = data?.firmware || {}
  const type = data?.type || 'stock'

  // Format date from UTC timestamp or datetime string
  const formatDate = (dateValue) => {
    if (!dateValue) return '-'

    let date
    if (typeof dateValue === 'number') {
      // Unix timestamp
      date = new Date(dateValue * 1000)
    } else {
      // Date string
      date = new Date(dateValue)
    }

    if (isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format file size from bytes to MB
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '-'
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // Detail row component
  const DetailRow = ({ icon: Icon, label, value, fullWidth = false }) => {
    if (!value || value === '-') return null

    return (
      <div className={`${fullWidth ? 'col-span-2' : ''} flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100`}>
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header with type badge */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          type === 'stock' ? 'bg-green-100' : 'bg-purple-100'
        }`}>
          {type === 'stock' ? (
            <Smartphone className="w-6 h-6 text-green-600" />
          ) : (
            <HardDrive className="w-6 h-6 text-purple-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'stock' ? 'קושחת מקור' : 'קושחה מותאמת'}
          </h3>
          <p className="text-sm text-gray-500">מזהה: #{firmware.id}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type === 'stock' ? (
          <>
            {/* Stock firmware details */}
            <DetailRow
              icon={Hash}
              label="טביעת אצבע"
              value={firmware.build_fingerprint}
              fullWidth={true}
            />

            <DetailRow
              icon={Smartphone}
              label="גרסת אנדרואיד"
              value={firmware.android_version}
            />

            <DetailRow
              icon={FileCode}
              label="רמת SDK"
              value={firmware.sdk_level}
            />

            <DetailRow
              icon={Package}
              label="מזהה Build"
              value={firmware.build_id}
            />

            <DetailRow
              icon={Package}
              label="Build Incremental"
              value={firmware.build_incremental}
            />

            <DetailRow
              icon={Smartphone}
              label="שם מכשיר"
              value={firmware.device_name || firmware.product_device}
            />

            <DetailRow
              icon={Info}
              label="דגם"
              value={firmware.model}
            />

            <DetailRow
              icon={Layers}
              label="יצרן"
              value={firmware.manufacturer}
            />

            <DetailRow
              icon={Layers}
              label="מותג"
              value={firmware.brand}
            />

            <DetailRow
              icon={Cpu}
              label="ארכיטקטורת CPU"
              value={firmware.cpu_arch}
            />

            <DetailRow
              icon={Layers}
              label="Board"
              value={firmware.board}
            />

            <DetailRow
              icon={Layers}
              label="Hardware"
              value={firmware.hardware}
            />

            <DetailRow
              icon={Info}
              label="שם מוצר"
              value={firmware.product_name}
            />

            <DetailRow
              icon={Calendar}
              label="תאריך Build"
              value={formatDate(firmware.build_date_utc)}
            />

            <DetailRow
              icon={Calendar}
              label="תאריך העלאה"
              value={formatDate(firmware.timestamp)}
            />

            <DetailRow
              icon={Shield}
              label="סוג העלאה"
              value={firmware.upload_type === 'manual' ? 'ידנית' : 'אוטומטית'}
            />

            {firmware.firmware_hash && (
              <DetailRow
                icon={Hash}
                label="SHA256 Hash"
                value={firmware.firmware_hash}
                fullWidth={true}
              />
            )}

            {firmware.firmware_url && (
              <div className="col-span-2">
                <a
                  href={`https://ikosher.me/${firmware.firmware_url}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  <span>הורד קושחת מקור</span>
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Patched firmware details */}
            <DetailRow
              icon={Hash}
              label="טביעת אצבע"
              value={firmware.build_fingerprint}
              fullWidth={true}
            />

            <DetailRow
              icon={Shield}
              label="נדרש פתיחת Bootloader"
              value={firmware.bl_unlock_required ? 'כן' : 'לא'}
            />

            <DetailRow
              icon={Calendar}
              label="תאריך יצירה"
              value={formatDate(firmware.timestamp)}
            />

            {firmware.firmware_hash && (
              <DetailRow
                icon={Hash}
                label="SHA256 Hash"
                value={firmware.firmware_hash}
                fullWidth={true}
              />
            )}

            {firmware.firmware_url && (
              <div className="col-span-2">
                <a
                  href={`https://ikosher.me/iFilter/${firmware.firmware_url}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  <span>הורד קושחה מותאמת</span>
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Empty state if no data */}
      {Object.keys(firmware).length === 0 && (
        <div className="text-center py-12">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">אין מידע זמין</p>
        </div>
      )}
    </div>
  )
}
