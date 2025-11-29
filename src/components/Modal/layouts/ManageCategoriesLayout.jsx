import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import { Settings } from 'lucide-react'

/**
 * Manage Categories Layout
 *
 * Used for assigning categories to a filtering plan
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'manageCategories',
 *   title: 'ניהול קטגוריות',
 *   data: {
 *     plan: planObject,
 *     categories: allCategories,
 *     assignedCategoryIds: [1, 2, 3],
 *     onSave: async (selectedCategoryIds) => {
 *       // Handle save logic
 *     }
 *   },
 *   confirmText: 'שמור שינויים',
 *   cancelText: 'ביטול'
 * })
 */
export const ManageCategoriesLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const { plan, categories, assignedCategoryIds, onSave } = data

  const [selectedCategories, setSelectedCategories] = useState(
    new Set(assignedCategoryIds || [])
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expose submitForm method to parent
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await handleSubmit()
    }
  }))

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (onSave) {
        await onSave(Array.from(selectedCategories))
      }

      toast.success('קטגוריות עודכנו בהצלחה')
      closeModal()
    } catch (error) {
      console.error('Error updating categories:', error)
      toast.error('שגיאה בעדכון הקטגוריות')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{plan?.plan_name}</h3>
            <p className="text-sm text-gray-600">בחר קטגוריות להקצאה לתכנית</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {categories?.map(category => {
          const isSelected = selectedCategories.has(category.category_id)
          return (
            <label
              key={category.category_id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleCategory(category.category_id)}
                disabled={isSubmitting}
                className="w-5 h-5 text-blue-600 bg-gray-50 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />

              <div className="flex items-center gap-3 flex-1">
                {category.category_icon ? (
                  <img
                    src={category.category_icon}
                    alt={category.category_name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">📁</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{category.category_name}</p>
                  <p className="text-sm text-gray-500">{category.app_count || 0} אפליקציות</p>
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
})

ManageCategoriesLayout.displayName = 'ManageCategoriesLayout'
