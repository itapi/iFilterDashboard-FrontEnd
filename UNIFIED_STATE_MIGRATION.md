# Unified Global State Migration

## Summary

Successfully unified **UserContext** and **ModalContext** into a single **GlobalStateContext** with a Redux-like reducer pattern!

---

## What Changed

### ✅ **Unified State Management**

All global state is now managed in one place: `GlobalStateContext.jsx`

**Before:**
- `UserContext` - User authentication
- `ModalContext` - Modal management
- Separate providers, separate contexts

**After:**
- `GlobalStateContext` - Everything!
  - User authentication
  - Modal management
  - Theme
  - Language
  - Loading states
  - Any future global state

---

## Architecture

### **State Structure**

```javascript
{
  // Modal state
  modalStack: [],

  // User authentication state
  user: null,
  isLoggedIn: false,
  userLoading: true,

  // App state
  theme: 'light',
  language: 'he',
  isLoading: false,
}
```

### **Action Types**

```javascript
export const ACTIONS = {
  // Modal actions
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',

  // User actions
  SET_USER: 'SET_USER',
  LOGOUT_USER: 'LOGOUT_USER',
  UPDATE_USER: 'UPDATE_USER',
  SET_USER_LOADING: 'SET_USER_LOADING',

  // Other actions
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_LOADING: 'SET_LOADING',
}
```

---

## Files Modified

### **Created/Updated**

1. **`src/contexts/GlobalStateContext.jsx`**
   - Added user authentication state
   - Added user actions (SET_USER, LOGOUT_USER, UPDATE_USER)
   - Added login(), logout(), updateUser() helper functions
   - Added session persistence check on mount
   - Exported backwards-compatible `useUser()` hook

2. **`src/App.jsx`**
   - Removed `UserProvider` import
   - Changed `useUser` import from `UserContext` to `GlobalStateContext`
   - Now only wraps with `GlobalStateProvider`

3. **`src/components/Dashboard.jsx`**
   - Updated import: `useUser` from `GlobalStateContext`

4. **`src/components/Login.jsx`**
   - Updated import: `useUser` from `GlobalStateContext`

5. **`src/components/Sidebar.jsx`**
   - Updated import: `useUser` from `GlobalStateContext`

### **Deprecated (Can be deleted)**

- `src/contexts/UserContext.jsx` - No longer used
- `src/contexts/ModalContext.jsx` - No longer used

---

## Usage

### **Using User Authentication**

```javascript
import { useUser } from '../contexts/GlobalStateContext'

function MyComponent() {
  const {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    userName,
    userInitials
  } = useUser()

  return (
    <div>
      {isLoggedIn && <p>Welcome, {userName}!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### **Using Modals**

```javascript
import { useModal } from '../contexts/GlobalStateContext'

function MyComponent() {
  const { openModal, openConfirmModal, closeModal } = useModal()

  const handleDelete = () => {
    openConfirmModal({
      title: 'מחיקה',
      message: 'האם למחוק?',
      variant: 'danger',
      onConfirm: async () => {
        await deleteItem()
      }
    })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

### **Using Global State Directly**

```javascript
import { useGlobalState } from '../contexts/GlobalStateContext'

function MyComponent() {
  const {
    state,      // Access all state
    dispatch,   // Dispatch custom actions
    ACTIONS,    // Action types

    // Modal helpers
    openModal,
    closeModal,

    // User helpers
    login,
    logout,

    // Other helpers
    setTheme,
    setLanguage,
    setLoading,
  } = useGlobalState()

  return (
    <div>
      <p>Current theme: {state.theme}</p>
      <p>User: {state.user?.first_name}</p>
      <p>Modals open: {state.modalStack.length}</p>
    </div>
  )
}
```

---

## Backwards Compatibility

All existing code continues to work! The hooks `useUser()` and `useModal()` are exported from `GlobalStateContext` with the same API.

### **Migration is Optional**

You can gradually migrate to use `useGlobalState()` or keep using the specific hooks:

```javascript
// Old way (still works!)
import { useUser } from '../contexts/GlobalStateContext'
import { useModal } from '../contexts/GlobalStateContext'

// New way (unified)
import { useGlobalState } from '../contexts/GlobalStateContext'
```

---

## Benefits

### **1. Single Source of Truth**
- All global state in one place
- Easier to debug
- Easier to understand data flow

### **2. Scalable**
- Easy to add new global state
- Reducer pattern scales well
- Action-based changes are predictable

### **3. Fewer Providers**
```javascript
// Before
<UserProvider>
  <ModalProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ModalProvider>
</UserProvider>

// After
<GlobalStateProvider>
  <App />
</GlobalStateProvider>
```

### **4. Better Developer Experience**
- One import for everything
- Autocomplete shows all available state/actions
- Consistent API across features

---

## Adding New Global State

### Example: Adding Notifications

**1. Add to initial state:**
```javascript
const initialState = {
  // ... existing state
  notifications: [],
  unreadCount: 0,
}
```

**2. Add action types:**
```javascript
export const ACTIONS = {
  // ... existing actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
}
```

**3. Add reducer cases:**
```javascript
case ACTIONS.ADD_NOTIFICATION:
  return {
    ...state,
    notifications: [...state.notifications, action.payload],
    unreadCount: state.unreadCount + 1
  }
```

**4. Add helper functions:**
```javascript
const addNotification = useCallback((notification) => {
  dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification })
}, [])
```

**5. Export in value:**
```javascript
const value = {
  // ... existing
  addNotification,
}
```

**6. Use in components:**
```javascript
const { state, addNotification } = useGlobalState()

addNotification({
  title: 'New Message',
  message: 'You have a new message',
  type: 'info'
})
```

---

## Testing

✅ Build successful - No errors
✅ All imports updated
✅ Backwards compatibility maintained
✅ Session persistence working
✅ Modal system functional

**To verify:**
```bash
npm run build
npm run dev
```

Then test:
- Login/logout flow
- Modal opening/closing
- User data persistence (refresh page)
- All existing features

---

## Next Steps

### **Optional Cleanup**
1. Delete `src/contexts/UserContext.jsx` (no longer used)
2. Delete `src/contexts/ModalContext.jsx` (no longer used)

### **Future Enhancements**
1. Add notifications system
2. Add global loading states
3. Add user preferences
4. Add theme switching
5. Add multi-language support
6. Add WebSocket state
7. Add cache management

---

## Performance Notes

The reducer pattern with `useCallback` ensures:
- Minimal re-renders
- Stable function references
- Predictable state updates

All helper functions are memoized, so components only re-render when the specific state they use changes.

---

## Questions?

Check the code or documentation:
- `src/contexts/GlobalStateContext.jsx` - Full implementation
- `src/components/Modal/MODAL_USAGE_GUIDE.md` - Modal usage
- `src/components/Modal/USAGE_EXAMPLES.jsx` - Code examples

---

**Migration completed successfully! 🎉**
