import React from 'react'
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

/**
 * Simple Text Layout
 *
 * A clean, minimal layout for displaying text content with optional icon
 * Perfect for notifications, confirmations, or simple messages
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'simpleText',
 *   title: 'הודעה חשובה',
 *   data: {
 *     text: 'הפעולה בוצעה בהצלחה!',
 *     icon: 'success', // 'info', 'success', 'warning', 'error', or null
 *   },
 *   showConfirmButton: false,
 *   cancelText: 'סגור'
 * })
 */
export const SimpleTextLayout = ({ data }) => {
  const text = data?.text || data?.message || ''
  const iconType = data?.icon || null

  const iconConfig = {
    info: {
      Icon: Info,
      className: 'text-blue-500'
    },
    success: {
      Icon: CheckCircle,
      className: 'text-green-500'
    },
    warning: {
      Icon: AlertTriangle,
      className: 'text-yellow-500'
    },
    error: {
      Icon: AlertCircle,
      className: 'text-red-500'
    }
  }

  const config = iconType ? iconConfig[iconType] : null
  const IconComponent = config?.Icon

  return (
    <div className="p-8" dir="rtl">
      <div className="flex flex-col items-center text-center space-y-4">
        {IconComponent && (
          <div className={`w-16 h-16 ${config.className}`}>
            <IconComponent className="w-full h-full" strokeWidth={1.5} />
          </div>
        )}

        {typeof text === 'string' ? (
          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
            {text}
          </p>
        ) : (
          text
        )}
      </div>
    </div>
  )
}
