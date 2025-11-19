import React from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

/**
 * Generic Confirmation Action Layout
 *
 * A flexible confirmation layout for various actions with customizable styling
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'confirmAction',
 *   title: 'אישור סגירה',
 *   data: {
 *     message: 'האם אתה בטוח שברצונך לסגור את הפנייה?',
 *     description: 'פנייה מספר rgba(51, 19, 17, 1)',
 *     warningText: 'לא ניתן לבטל פעולה זו',
 *     variant: 'success' // success | warning | info | danger
 *   },
 *   confirmText: 'סגור פנייה',
 *   cancelText: 'ביטול',
 *   showConfirmButton: true,
 *   showCancelButton: true,
 *   onConfirm: async () => {
 *     // Handle action
 *   }
 * })
 */
export const ConfirmActionLayout = ({ data }) => {
  const message = data?.message || 'האם אתה בטוח?'
  const description = data?.description || ''
  const warningText = data?.warningText || ''
  const variant = data?.variant || 'info' // success | warning | info | danger

  // Variant configurations
  const variantConfig = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      warningBg: 'bg-green-50',
      warningBorder: 'border-green-200',
      warningText: 'text-green-800'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      warningBg: 'bg-yellow-50',
      warningBorder: 'border-yellow-200',
      warningText: 'text-yellow-800'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      warningBg: 'bg-blue-50',
      warningBorder: 'border-blue-200',
      warningText: 'text-blue-800'
    },
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      warningBg: 'bg-red-50',
      warningBorder: 'border-red-200',
      warningText: 'text-red-800'
    }
  }

  const config = variantConfig[variant] || variantConfig.info
  const IconComponent = config.icon

  return (
    <div className="p-6" dir="rtl">
      {/* Icon */}
      <div className="flex items-center justify-center mb-6">
        <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
          <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4">
        <p className="text-gray-900 text-lg font-medium">
          {message}
        </p>

        {description && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">{description}</p>
          </div>
        )}

        {warningText && (
          <div className={`${config.warningBg} border ${config.warningBorder} rounded-lg p-4`}>
            <p className={`text-sm ${config.warningText} font-medium`}>
              {warningText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
