# Global Modal System - Usage Guide

## Overview

The new modal system uses a **unified global state management** pattern with **dispatch actions** and **custom layouts**. It supports:

- ✅ **Modal Stack** - Multiple modals can be open simultaneously
- ✅ **Custom Layouts** - Reusable modal templates
- ✅ **Form Refs** - Forms can be submitted via confirm button
- ✅ **Flexible Configuration** - Control buttons, size, callbacks, etc.
- ✅ **Global State** - Unified state management for the entire app

---

## Quick Start

### 1. Basic Modal with Content

```javascript
import { useGlobalState } from '../contexts/GlobalStateContext'

function MyComponent() {
  const { openModal, closeModal } = useGlobalState()

  const handleClick = () => {
    openModal({
      title: 'שם המודל',
      content: <div>התוכן שלך כאן</div>,
      size: 'lg',
      showConfirmButton: true,
      showCancelButton: true,
      confirmText: 'שמור',
      cancelText: 'ביטול',
      onConfirm: () => {
        console.log('נלחץ אישור')
        closeModal()
      }
    })
  }

  return <button onClick={handleClick}>פתח מודל</button>
}
```

---

### 2. Confirm Dialog

```javascript
const { openConfirmModal } = useGlobalState()

const handleDelete = () => {
  openConfirmModal({
    title: 'מחיקת פריט',
    message: 'האם אתה בטוח שברצונך למחוק פריט זה?',
    variant: 'danger', // 'danger', 'warning', 'info'
    confirmText: 'מחק',
    cancelText: 'ביטול',
    onConfirm: async () => {
      // Perform delete operation
      await apiClient.deleteItem(itemId)
      toast.success('הפריט נמחק בהצלחה')
    },
    onCancel: () => {
      console.log('המחיקה בוטלה')
    }
  })
}
```

---

### 3. Using Custom Layouts

#### Example: Form Layout

```javascript
const { openModal } = useGlobalState()

const handleOpenForm = () => {
  openModal({
    layout: 'exampleForm',
    title: 'הוסף פריט חדש',
    size: 'md',
    data: {
      initialName: 'ערך התחלתי',
      initialDescription: '',
      onDataReceived: (formData) => {
        console.log('נתוני הטופס:', formData)
        // Do something with the data
      }
    }
  })
}
```

#### Example: Info Layout

```javascript
const { openModal } = useGlobalState()

const showSuccess = () => {
  openModal({
    layout: 'info',
    title: 'פעולה הושלמה',
    size: 'md',
    data: {
      variant: 'success', // 'info', 'success', 'warning', 'error'
      message: 'הפעולה הושלמה בהצלחה!',
      details: 'כל הנתונים נשמרו כראוי במערכת'
    },
    showConfirmButton: false,
    cancelText: 'סגור'
  })
}
```

#### Example: Simple Text Layout

```javascript
const { openModal } = useGlobalState()

const showMessage = () => {
  openModal({
    layout: 'simpleText',
    title: 'הודעה',
    data: {
      text: 'הנתונים עודכנו בהצלחה במערכת',
      icon: 'success' // 'info', 'success', 'warning', 'error', or null
    },
    showConfirmButton: false,
    cancelText: 'סגור'
  })
}
```

#### Example: Delete Confirmation Layout

```javascript
const { openModal } = useGlobalState()

const handleDelete = (admin) => {
  openModal({
    layout: 'deleteConfirm',
    title: 'אישור מחיקה',
    data: {
      itemName: admin.name,
      itemType: 'מנהל',
      warningText: 'פעולה זו אינה ניתנת לביטול!',
      additionalInfo: 'כל הנתונים הקשורים למנהל זה יימחקו גם כן.'
    },
    confirmText: 'מחק',
    cancelText: 'ביטול',
    onConfirm: async () => {
      await apiClient.delete(`/admins/${admin.id}`)
      toast.success('המנהל נמחק בהצלחה')
      refreshAdmins()
    }
  })
}
```

#### Example: Admin Form Layout

```javascript
const { openModal } = useGlobalState()

// Create new admin
const handleAddAdmin = () => {
  openModal({
    layout: 'adminForm',
    title: 'הוספת מנהל חדש',
    size: 'lg',
    data: {
      admin: null, // null for new admin
      onSave: async (adminData) => {
        await apiClient.post('/admins', adminData)
        toast.success('המנהל נוסף בהצלחה')
        refreshAdmins()
      }
    },
    confirmText: 'שמור',
    cancelText: 'ביטול'
  })
}

// Edit existing admin
const handleEditAdmin = (admin) => {
  openModal({
    layout: 'adminForm',
    title: 'עריכת מנהל',
    size: 'lg',
    data: {
      admin, // existing admin object
      onSave: async (adminData) => {
        await apiClient.put(`/admins/${admin.id}`, adminData)
        toast.success('המנהל עודכן בהצלחה')
        refreshAdmins()
      }
    },
    confirmText: 'עדכן',
    cancelText: 'ביטול'
  })
}
```

---

### 4. Modal Stack (Multiple Modals)

```javascript
const { openModal } = useGlobalState()

// First modal
openModal({
  title: 'מודל ראשון',
  content: (
    <div>
      <p>זה המודל הראשון</p>
      <button onClick={() => {
        // Open second modal on top
        openModal({
          title: 'מודל שני',
          content: <div>זה מודל שני מעל הראשון</div>
        })
      }}>
        פתח מודל נוסף
      </button>
    </div>
  )
})
```

---

## Configuration Options

### openModal() Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | string | 'default' | Layout type: 'confirm', 'deleteConfirm', 'simpleText', 'info', 'adminForm', 'exampleForm', 'custom', 'default' |
| `title` | string | '' | Modal title |
| `content` | ReactNode | null | Modal content (for default layout) |
| `data` | object | {} | Data passed to layout component |
| `size` | string | 'lg' | Modal size: 'sm', 'md', 'lg', 'xl', '2xl', 'full' |
| `showConfirmButton` | boolean | true | Show confirm button in footer |
| `showCancelButton` | boolean | true | Show cancel button in footer |
| `confirmText` | string | 'אישור' | Confirm button text |
| `cancelText` | string | 'ביטול' | Cancel button text |
| `onConfirm` | function | null | Callback when confirm clicked |
| `onCancel` | function | null | Callback when cancel clicked |
| `onClose` | function | null | Callback when modal closes |
| `onDataReceived` | function | null | Callback to receive data from layout |
| `closeOnBackdropClick` | boolean | true | Close modal when backdrop clicked |
| `closeOnEscape` | boolean | true | Close modal when ESC pressed |
| `variant` | string | 'info' | Variant for confirm modal: 'danger', 'warning', 'info' |

---

## Creating Custom Layouts

### 1. Create Layout Component

Create a new file in `src/components/Modal/layouts/YourLayout.jsx`:

```javascript
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

export const YourLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const [formData, setFormData] = useState({
    field1: data?.initialValue || '',
  })

  // Expose submitForm method (optional, for forms)
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await handleSubmit()
    }
  }))

  const handleSubmit = async () => {
    try {
      // Your submission logic
      if (data?.onDataReceived) {
        data.onDataReceived(formData)
      }

      toast.success('נשמר בהצלחה')
      closeModal()
    } catch (error) {
      toast.error('שגיאה בשמירה')
    }
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Your layout content */}
    </div>
  )
})

YourLayout.displayName = 'YourLayout'
```

### 2. Register Layout in GlobalModal

Edit `src/components/GlobalModal.jsx`:

```javascript
// Import your layout
import { YourLayout } from './Modal/layouts/YourLayout'

// In getModalLayout function, add your layout:
const layouts = {
  // ... existing layouts

  yourLayout: {
    component: <YourLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
    showFooter: true,
    hasRef: true, // Set to true if using forwardRef
  },
}
```

### 3. Use Your Layout

```javascript
const { openModal } = useGlobalState()

openModal({
  layout: 'yourLayout',
  title: 'הכותרת שלך',
  data: {
    initialValue: 'some value',
    onDataReceived: (data) => {
      console.log(data)
    }
  }
})
```

---

## Using Global State

The `GlobalStateContext` also manages other global state:

```javascript
const {
  state,           // Access all global state
  dispatch,        // Dispatch custom actions
  ACTIONS,         // Action types

  // Modal helpers
  openModal,
  closeModal,
  closeAllModals,
  openConfirmModal,

  // Other state helpers
  setTheme,
  setLanguage,
  setLoading,
} = useGlobalState()

// Access state
console.log(state.modalStack)
console.log(state.theme)
console.log(state.language)
console.log(state.isLoading)

// Update theme
setTheme('dark')

// Update language
setLanguage('en')

// Set loading state
setLoading(true)
```

---

## Adding Custom Global State

### 1. Add Action Type

In `src/contexts/GlobalStateContext.jsx`:

```javascript
export const ACTIONS = {
  // ... existing actions
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
}
```

### 2. Add Initial State

```javascript
const initialState = {
  // ... existing state
  userPreferences: {},
}
```

### 3. Add Reducer Case

```javascript
const globalReducer = (state, action) => {
  switch (action.type) {
    // ... existing cases

    case ACTIONS.SET_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: action.payload
      }

    default:
      return state
  }
}
```

### 4. Add Helper Function

```javascript
const setUserPreferences = useCallback((preferences) => {
  dispatch({ type: ACTIONS.SET_USER_PREFERENCES, payload: preferences })
}, [])

// Add to value object
const value = {
  // ... existing
  setUserPreferences,
}
```

### 5. Use in Components

```javascript
const { state, setUserPreferences } = useGlobalState()

// Access
console.log(state.userPreferences)

// Update
setUserPreferences({ darkMode: true, notifications: false })
```

---

## Migration from Old System

### Old Code (ModalContext)

```javascript
import { useModal } from '../contexts/ModalContext'

const { openConfirmModal } = useModal()

openConfirmModal({
  title: 'מחיקה',
  message: 'האם למחוק?',
  onConfirm: () => handleDelete()
})
```

### New Code (GlobalStateContext)

```javascript
import { useGlobalState } from '../contexts/GlobalStateContext'

const { openConfirmModal } = useGlobalState()

openConfirmModal({
  title: 'מחיקה',
  message: 'האם למחוק?',
  onConfirm: () => handleDelete()
})
```

**OR** use the backwards-compatible hook:

```javascript
import { useModal } from '../contexts/GlobalStateContext'

const { openConfirmModal } = useModal()
// Works exactly the same!
```

---

## Best Practices

1. **Keep Layouts Reusable** - Make layouts generic and configurable via `data` prop
2. **Use forwardRef for Forms** - Allow GlobalModal to trigger form submission
3. **Close Modal in Callbacks** - Call `closeModal()` after successful operations
4. **Handle Errors** - Show toast notifications for errors
5. **Validate Input** - Validate data before submission
6. **Clean Up** - Use `onClose` callback for cleanup if needed

---

## Available Layouts

The following layouts are available out of the box:

- **confirm** - Generic confirmation dialog with variants (info, warning, danger)
- **deleteConfirm** - Specialized delete confirmation with warning styling
- **simpleText** - Clean text display with optional icon
- **info** - Information display with colored variants
- **adminForm** - Form for creating/editing admin users
- **exampleForm** - Template form layout for creating custom forms
- **custom** - Pass any React component directly
- **default** - Basic layout for simple content

## Examples in Codebase

See these files for working examples:

- `src/components/Modal/layouts/ExampleFormLayout.jsx` - Form with ref
- `src/components/Modal/layouts/InfoLayout.jsx` - Simple info display
- `src/components/Modal/layouts/AdminFormLayout.jsx` - Admin user form
- `src/components/Modal/layouts/SimpleTextLayout.jsx` - Simple text with icon
- `src/components/Modal/layouts/DeleteConfirmLayout.jsx` - Delete confirmation
- `src/components/CommunitiesTable.jsx` - Uses openConfirmModal
- `src/components/CategoryPlanManager.jsx` - Uses openModal

---

## Troubleshooting

### Modal doesn't close after confirm
- Make sure to call `closeModal()` in your `onConfirm` callback
- For forms with refs, the layout component should call `closeModal()` after successful submission

### Multiple modals not stacking
- Check that `GlobalModal` is rendered in `App.jsx`
- Ensure `GlobalStateProvider` wraps your app

### Layout not found
- Verify layout is registered in `GlobalModal.jsx` `getModalLayout()` function
- Check the `layout` name matches exactly (case-sensitive)

### Ref not working
- Ensure component uses `forwardRef`
- Implement `useImperativeHandle` with `submitForm` method
- Set `hasRef: true` in layout registration

---

## Support

For issues or questions, check the component source code or ask the team!
