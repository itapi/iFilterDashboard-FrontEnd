/**
 * Modal System - Practical Usage Examples
 *
 * This file contains copy-paste ready examples for using the modal system
 */

import { useGlobalState } from '../../contexts/GlobalStateContext'
import { toast } from 'react-toastify'
import apiClient from '../../utils/api'

// ============================================
// Example 1: Simple Confirmation Dialog
// ============================================

export const DeleteItemExample = ({ itemId, itemName }) => {
  const { openConfirmModal } = useGlobalState()

  const handleDelete = () => {
    openConfirmModal({
      title: 'מחיקת פריט',
      message: `האם אתה בטוח שברצונך למחוק את "${itemName}"?`,
      variant: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/items/${itemId}`)
          toast.success('הפריט נמחק בהצלחה')
        } catch (error) {
          toast.error('שגיאה במחיקת הפריט')
        }
      }
    })
  }

  return (
    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">
      מחק
    </button>
  )
}

// ============================================
// Example 2: Custom Content Modal
// ============================================

export const UserDetailsExample = ({ userId }) => {
  const { openModal, closeModal } = useGlobalState()

  const handleShowDetails = async () => {
    // Show loading modal first
    openModal({
      title: 'פרטי משתמש',
      content: <div className="p-6 text-center">טוען...</div>,
      size: 'md',
      showConfirmButton: false,
      showCancelButton: true,
      cancelText: 'סגור'
    })

    try {
      const user = await apiClient.getUser(userId)

      // Update modal with data
      closeModal() // Close loading modal
      openModal({
        title: 'פרטי משתמש',
        size: 'lg',
        content: (
          <div className="p-6" dir="rtl">
            <div className="space-y-4">
              <div>
                <span className="font-bold">שם:</span> {user.name}
              </div>
              <div>
                <span className="font-bold">אימייל:</span> {user.email}
              </div>
              <div>
                <span className="font-bold">טלפון:</span> {user.phone}
              </div>
            </div>
          </div>
        ),
        showConfirmButton: false,
        cancelText: 'סגור'
      })
    } catch (error) {
      closeModal()
      toast.error('שגיאה בטעינת נתוני המשתמש')
    }
  }

  return (
    <button onClick={handleShowDetails} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      הצג פרטים
    </button>
  )
}

// ============================================
// Example 3: Using Form Layout
// ============================================

export const AddItemExample = ({ onItemAdded }) => {
  const { openModal } = useGlobalState()

  const handleAddItem = () => {
    openModal({
      layout: 'exampleForm',
      title: 'הוסף פריט חדש',
      size: 'md',
      data: {
        initialName: '',
        initialDescription: '',
        onDataReceived: async (formData) => {
          try {
            const newItem = await apiClient.createItem(formData)
            toast.success('הפריט נוסף בהצלחה')
            onItemAdded?.(newItem)
          } catch (error) {
            toast.error('שגיאה בהוספת הפריט')
          }
        }
      }
    })
  }

  return (
    <button onClick={handleAddItem} className="px-4 py-2 bg-green-600 text-white rounded-lg">
      הוסף פריט
    </button>
  )
}

// ============================================
// Example 4: Info/Success/Error Messages
// ============================================

export const NotificationExamples = () => {
  const { openModal } = useGlobalState()

  const showSuccess = () => {
    openModal({
      layout: 'info',
      title: 'פעולה הושלמה',
      size: 'md',
      data: {
        variant: 'success',
        message: 'הפעולה הושלמה בהצלחה!',
        details: 'כל הנתונים נשמרו כראוי במערכת'
      },
      showConfirmButton: false,
      cancelText: 'סגור'
    })
  }

  const showError = () => {
    openModal({
      layout: 'info',
      title: 'שגיאה',
      size: 'md',
      data: {
        variant: 'error',
        message: 'אירעה שגיאה במערכת',
        details: 'נא לנסות שוב או ליצור קשר עם התמיכה'
      },
      showConfirmButton: false,
      cancelText: 'סגור'
    })
  }

  const showWarning = () => {
    openModal({
      layout: 'info',
      title: 'אזהרה',
      size: 'md',
      data: {
        variant: 'warning',
        message: 'פעולה זו דורשת אישור',
        details: 'יש לוודא שכל הנתונים נכונים לפני המשך'
      },
      confirmText: 'אישור',
      cancelText: 'ביטול',
      onConfirm: () => {
        console.log('מאושר')
      }
    })
  }

  const showInfo = () => {
    openModal({
      layout: 'info',
      title: 'מידע',
      size: 'md',
      data: {
        variant: 'info',
        message: 'מידע חשוב',
        details: 'המערכת תעבור תחזוקה מתוכננת ביום רביעי'
      },
      showConfirmButton: false,
      cancelText: 'הבנתי'
    })
  }

  return (
    <div className="space-x-2">
      <button onClick={showSuccess} className="px-4 py-2 bg-green-600 text-white rounded-lg">Success</button>
      <button onClick={showError} className="px-4 py-2 bg-red-600 text-white rounded-lg">Error</button>
      <button onClick={showWarning} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Warning</button>
      <button onClick={showInfo} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Info</button>
    </div>
  )
}

// ============================================
// Example 5: Nested Modals (Modal Stack)
// ============================================

export const NestedModalsExample = () => {
  const { openModal, closeModal } = useGlobalState()

  const handleOpenNested = () => {
    openModal({
      title: 'מודל ראשון',
      size: 'lg',
      content: (
        <div className="p-6" dir="rtl">
          <p className="mb-4">זה המודל הראשון בסטאק</p>
          <button
            onClick={() => {
              openModal({
                title: 'מודל שני',
                size: 'md',
                content: (
                  <div className="p-6" dir="rtl">
                    <p className="mb-4">זה מודל שני, מעל הראשון</p>
                    <button
                      onClick={() => {
                        openModal({
                          title: 'מודל שלישי',
                          size: 'sm',
                          content: <div className="p-6">מודל שלישי!</div>,
                          showConfirmButton: false,
                          cancelText: 'סגור'
                        })
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                    >
                      פתח מודל שלישי
                    </button>
                  </div>
                ),
                showConfirmButton: false,
                cancelText: 'סגור'
              })
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            פתח מודל שני
          </button>
        </div>
      ),
      showConfirmButton: false,
      cancelText: 'סגור'
    })
  }

  return (
    <button onClick={handleOpenNested} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
      פתח מודלים מקוננים
    </button>
  )
}

// ============================================
// Example 6: Modal with Actions
// ============================================

export const ActionsModalExample = ({ item }) => {
  const { openModal, closeModal } = useGlobalState()

  const handleActions = () => {
    openModal({
      title: 'בחר פעולה',
      size: 'md',
      content: (
        <div className="p-6" dir="rtl">
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('עריכה')
                closeModal()
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ערוך
            </button>
            <button
              onClick={() => {
                console.log('שכפול')
                closeModal()
              }}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              שכפל
            </button>
            <button
              onClick={() => {
                closeModal()
                // Open delete confirmation
                openConfirmModal({
                  title: 'מחיקה',
                  message: 'האם למחוק?',
                  variant: 'danger',
                  onConfirm: () => console.log('מחיקה מאושרת')
                })
              }}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              מחק
            </button>
          </div>
        </div>
      ),
      showConfirmButton: false,
      showCancelButton: true,
      cancelText: 'ביטול'
    })
  }

  const { openConfirmModal } = useGlobalState()

  return (
    <button onClick={handleActions} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
      פעולות
    </button>
  )
}

// ============================================
// Example 7: Using Global State for Other Data
// ============================================

export const GlobalStateExample = () => {
  const { state, setTheme, setLanguage, setLoading } = useGlobalState()

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div>
        <p>ערכת נוכחית: {state.theme}</p>
        <button onClick={() => setTheme('dark')} className="px-4 py-2 bg-gray-800 text-white rounded">
          החלף לכהה
        </button>
        <button onClick={() => setTheme('light')} className="px-4 py-2 bg-gray-200 text-black rounded ml-2">
          החלף לבהירה
        </button>
      </div>

      <div>
        <p>שפה נוכחית: {state.language}</p>
        <button onClick={() => setLanguage('he')} className="px-4 py-2 bg-blue-600 text-white rounded">
          עברית
        </button>
        <button onClick={() => setLanguage('en')} className="px-4 py-2 bg-blue-600 text-white rounded ml-2">
          English
        </button>
      </div>

      <div>
        <p>טוען: {state.isLoading ? 'כן' : 'לא'}</p>
        <button onClick={() => setLoading(true)} className="px-4 py-2 bg-green-600 text-white rounded">
          התחל טעינה
        </button>
        <button onClick={() => setLoading(false)} className="px-4 py-2 bg-red-600 text-white rounded ml-2">
          הפסק טעינה
        </button>
      </div>
    </div>
  )
}
