import { useState, useEffect, useCallback } from 'react'

const ICON = '/favicon.ico'
const AUTO_CLOSE_MS = 6000
const LS_KEY = 'iFilter_notificationsEnabled'

const getStoredEnabled = () => {
  const v = localStorage.getItem(LS_KEY)
  return v === null ? true : v === 'true'
}

export const useWebNotifications = () => {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [enabled, setEnabledState] = useState(getStoredEnabled)

  // Request permission if not yet decided
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setPermission(p))
    }
  }, [])

  // Keep permission state in sync when user changes it in the browser
  useEffect(() => {
    if (!('Notification' in window) || !navigator.permissions) return
    navigator.permissions.query({ name: 'notifications' }).then(status => {
      const handler = () => setPermission(status.state === 'granted' ? 'granted' : status.state)
      status.addEventListener('change', handler)
      return () => status.removeEventListener('change', handler)
    }).catch(() => {})
  }, [])

  const setEnabled = useCallback((value) => {
    localStorage.setItem(LS_KEY, String(value))
    setEnabledState(value)
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setPermission(p)
    return p
  }, [])

  const notify = useCallback((title, body = '', options = {}) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!getStoredEnabled()) return

    const n = new Notification(title, {
      body,
      icon: ICON,
      badge: ICON,
      ...options,
    })

    n.onclick = () => { window.focus(); n.close() }
    setTimeout(() => n.close(), AUTO_CLOSE_MS)
  }, [])

  return { notify, permission, enabled, setEnabled, requestPermission }
}
