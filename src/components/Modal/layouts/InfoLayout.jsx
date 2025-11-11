import React from 'react'
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

/**
 * Info Layout
 *
 * A simple information display layout with icon variants
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'info',
 *   title: 'מידע חשוב',
 *   data: {
 *     variant: 'success', // 'info', 'success', 'warning', 'error'
 *     message: 'הפעולה הושלמה בהצלחה',
 *     details: 'פרטים נוספים כאן...'
 *   },
 *   showConfirmButton: false,
 *   cancelText: 'סגור'
 * })
 */
export const InfoLayout = ({ data }) => {
  const variant = data?.variant || 'info'
  const message = data?.message || ''
  const details = data?.details || ''

  const variantConfig = {
    info: {
      icon: Info,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      borderClass: 'border-blue-200'
    },
    success: {
      icon: CheckCircle,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-100',
      borderClass: 'border-green-200'
    },
    warning: {
      icon: AlertCircle,
      iconClass: 'text-yellow-600',
      bgClass: 'bg-yellow-100',
      borderClass: 'border-yellow-200'
    },
    error: {
      icon: XCircle,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-100',
      borderClass: 'border-red-200'
    }
  }

  const config = variantConfig[variant] || variantConfig.info
  const Icon = config.icon

  return (
    <div className="p-6" dir="rtl">
      <div className={`flex items-start gap-4 p-4 rounded-lg border ${config.bgClass} ${config.borderClass}`}>
        <div className={`flex-shrink-0 w-10 h-10 ${config.bgClass} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${config.iconClass}`} />
        </div>
        <div className="flex-1">
          {message && (
            <p className="text-gray-900 font-medium mb-2">
              {message}
            </p>
          )}
          {details && (
            <p className="text-gray-600 text-sm">
              {details}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
