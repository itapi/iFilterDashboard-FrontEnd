import React from 'react'

const ConfirmModal = ({ message, confirmText, cancelText, variant, onConfirm, onCancel }) => {
  const getVariantStyles = () => {
    const variants = {
      danger: {
        icon: (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H5a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        iconBg: 'bg-red-100',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
      },
      warning: {
        icon: (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L12.732 4.5c-.77-.833-2.694-.833-3.464 0L2.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        iconBg: 'bg-yellow-100',
        confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      },
      info: {
        icon: (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        iconBg: 'bg-blue-100',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
      }
    }
    return variants[variant] || variants.info
  }

  const styles = getVariantStyles()

  return (
    <div className="p-6" dir="rtl">
      {/* Icon */}
      <div className="flex items-center justify-center mb-6">
        <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center`}>
          {styles.icon}
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-8">
        {typeof message === 'string' ? (
          <p className="text-gray-600">{message}</p>
        ) : (
          message
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-6 py-3 rounded-xl transition-colors font-medium ${styles.confirmBtn}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}

export default ConfirmModal