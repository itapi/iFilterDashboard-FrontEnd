import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import apiClient from '../utils/api'

const STATE = { LOADING: 'loading', READY: 'ready', DONE: 'done', ERROR: 'error' }

function ResellerSetupPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [state, setState]         = useState(STATE.LOADING)
  const [resellerName, setName]   = useState('')
  const [resellerEmail, setEmail] = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [submitting, setSubmit]   = useState(false)

  useEffect(() => {
    if (!token) {
      setErrorMsg('קישור לא תקין — לא נמצא טוקן.')
      setState(STATE.ERROR)
      return
    }
    apiClient.validateResellerToken(token)
      .then(res => {
        if (res.success) {
          setName(res.data.full_name)
          setEmail(res.data.email)
          setState(STATE.READY)
        } else {
          setErrorMsg(res.error || 'הקישור אינו תקין.')
          setState(STATE.ERROR)
        }
      })
      .catch(() => {
        setErrorMsg('שגיאת שרת — נסה שוב מאוחר יותר.')
        setState(STATE.ERROR)
      })
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      setErrorMsg('הסיסמה חייבת להכיל לפחות 8 תווים.')
      return
    }
    if (password !== confirm) {
      setErrorMsg('הסיסמאות אינן תואמות.')
      return
    }
    setErrorMsg('')
    setSubmit(true)
    try {
      const res = await apiClient.setupResellerPassword(token, password)
      if (res.success) {
        setState(STATE.DONE)
      } else {
        setErrorMsg(res.error || 'שגיאה בהגדרת הסיסמה.')
      }
    } catch {
      setErrorMsg('שגיאת שרת — נסה שוב.')
    } finally {
      setSubmit(false)
    }
  }

  return (
    <div dir="rtl" style={styles.page}>
      <div style={styles.bgGradient} />
      <div style={styles.dotPattern} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h1 style={styles.logoTitle}>iFilter</h1>
          <p style={styles.logoSub}>הגדרת סיסמה — פאנל משווקים</p>
          <div style={styles.logoDivider} />
        </div>

        {/* Loading */}
        {state === STATE.LOADING && (
          <div style={styles.centerBox}>
            <span style={styles.spinner} />
            <p style={{ color: '#5e656e', marginTop: 14 }}>מאמת קישור...</p>
          </div>
        )}

        {/* Error */}
        {state === STATE.ERROR && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{errorMsg}</p>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 8 }}>
              לקישור חדש, אנא פנה ל-<a href="mailto:support@ifilter.me" style={{ color: '#497fc5' }}>support@ifilter.me</a>
            </p>
          </div>
        )}

        {/* Done */}
        {state === STATE.DONE && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e2124', margin: '0 0 8px' }}>
              הסיסמה הוגדרה בהצלחה!
            </h2>
            <p style={{ color: '#5e656e', fontSize: '0.95rem', margin: 0 }}>
              כעת ניתן להתחבר לפאנל המשווקים.
            </p>
          </div>
        )}

        {/* Form */}
        {state === STATE.READY && (
          <form onSubmit={handleSubmit} style={styles.form}>
            {resellerName && (
              <p style={styles.greeting}>שלום, <strong>{resellerName}</strong> ({resellerEmail})</p>
            )}

            {errorMsg && (
              <div style={styles.inlineError}>{errorMsg}</div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="לפחות 8 תווים"
                disabled={submitting}
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.input)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="הכנס שוב את הסיסמה"
                disabled={submitting}
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.input)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
            >
              {submitting
                ? <span style={styles.loadingRow}><span style={styles.spinnerSmall} />שומר...</span>
                : 'הגדר סיסמה'
              }
            </button>
          </form>
        )}

        <p style={styles.footer}>iFilter Dashboard &copy; 2025</p>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 40%, #f0f4f7 70%, #e8eef2 100%)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 15s ease infinite',
    zIndex: 0,
  },
  dotPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(rgba(243, 156, 18, 0.12) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    background: '#ffffff',
    borderRadius: '28px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 60px rgba(49, 53, 58, 0.12)',
    border: '1px solid rgba(237, 240, 242, 0.8)',
  },
  logoSection: { textAlign: 'center', marginBottom: '32px' },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #1e2124 0%, #2d4a6e 60%, #497fc5 100%)',
    borderRadius: '20px',
    marginBottom: '16px',
    boxShadow: '0 12px 28px rgba(73, 127, 197, 0.35)',
  },
  logoTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#1e2124',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
    fontFamily: 'Assistant, sans-serif',
  },
  logoSub: { fontSize: '0.95rem', color: '#5e656e', margin: 0 },
  logoDivider: {
    width: '48px',
    height: '3px',
    background: 'linear-gradient(90deg, #497fc5, #3a6ab8)',
    borderRadius: '2px',
    margin: '14px auto 0',
    opacity: 0.6,
  },
  centerBox: { textAlign: 'center', padding: '20px 0' },
  spinner: {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    border: '3px solid #e8eaed',
    borderTopColor: '#497fc5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '14px',
    padding: '18px',
    textAlign: 'center',
  },
  errorText: { color: '#dc2626', fontWeight: 600, margin: 0 },
  successBox: {
    textAlign: 'center',
    padding: '12px 0 4px',
  },
  successIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '1.6rem',
    fontWeight: 700,
    borderRadius: '50%',
    marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  greeting: { color: '#5e656e', fontSize: '0.92rem', margin: 0 },
  inlineError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '0.88rem',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontWeight: 700, fontSize: '0.92rem', color: '#1e2124' },
  input: {
    width: '100%',
    padding: '13px 16px',
    border: '1.5px solid #e8eaed',
    background: '#fafbfc',
    borderRadius: '14px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '1rem',
    color: '#1e2124',
    outline: 'none',
    boxSizing: 'border-box',
    direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: {
    width: '100%',
    padding: '13px 16px',
    border: '1.5px solid #31353a',
    background: '#ffffff',
    borderRadius: '14px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '1rem',
    color: '#1e2124',
    outline: 'none',
    boxSizing: 'border-box',
    direction: 'rtl',
    boxShadow: '0 0 0 4px rgba(49, 53, 58, 0.07)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #31353a 0%, #497fc5 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 10px 24px rgba(73, 127, 197, 0.35)',
    transition: 'opacity 0.2s',
  },
  submitBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  loadingRow: { display: 'inline-flex', alignItems: 'center', gap: '10px' },
  spinnerSmall: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#9ca3af',
    marginTop: '28px',
    marginBottom: 0,
  },
}

export default ResellerSetupPassword
