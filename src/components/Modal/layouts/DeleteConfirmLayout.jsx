import React from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Delete Confirmation Layout
 *
 * A specialized layout for delete confirmations with warning styling
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'deleteConfirm',
 *   title: 'אישור מחיקה',
 *   data: {
 *     itemName: 'המנהל יוסי כהן',
 *     itemType: 'מנהל',
 *     warningText: 'פעולה זו אינה ניתנת לביטול!'
 *   },
 *   confirmText: 'מחק',
 *   cancelText: 'ביטול',
 *   onConfirm: async () => {
 *     // Handle deletion
 *   }
 * })
 */
export const DeleteConfirmLayout = ({ data }) => {
  const itemName = data?.itemName || ''
  const itemType = data?.itemType || 'פריט'
  const warningText = data?.warningText || 'פעולה זו אינה ניתנת לביטול!'
  const additionalInfo = data?.additionalInfo || null

  return (
    <div className="p-6" dir="rtl">
      {/* Warning Icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4">
        <p className="text-gray-900 text-lg">
          האם אתה בטוח שברצונך למחוק את {itemType}
          {itemName && (
            <span className="font-bold"> "{itemName}"</span>
          )}?
        </p>

        {additionalInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-right">
            <p className="text-sm text-gray-700">{additionalInfo}</p>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">
            {warningText}
          </p>
        </div>
      </div>
    </div>
  )
}
