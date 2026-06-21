import { useState } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { useUser } from '../contexts/GlobalStateContext'

function Login() {
  const { login } = useUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!username || !password) {
      toast.error('נא למלא את כל השדות')
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.login(username, password)
      if (response.success) {
        toast.success('התחברת בהצלחה!')
        login(response.user, response.token)
      } else {
        toast.error(response.error || 'שגיאה בהתחברות')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('שם משתמש או סיסמה שגויים')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div dir="rtl" style={styles.page}>
      {/* Animated gradient background */}
      <div style={styles.bgGradient} />

      {/* Dot pattern overlay */}
      <div style={styles.dotPattern} />

      {/* Card */}
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
          <p style={styles.logoSub}>פאנל ניהול</p>
          <div style={styles.logoDivider} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Username */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>שם משתמש</label>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הכנס שם משתמש"
                disabled={isLoading}
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.input)}
              />
              <span style={styles.inputIcon}>
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>סיסמה</label>
            <div style={styles.inputWrapper}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה"
                disabled={isLoading}
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.input)}
              />
              <span style={styles.inputIcon}>
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              ...(isLoading ? styles.submitBtnDisabled : {})
            }}
          >
            {isLoading ? (
              <span style={styles.loadingRow}>
                <span style={styles.spinnerSmall} />
                מתחבר...
              </span>
            ) : (
              'התחבר'
            )}
          </button>
        </form>

        <p style={styles.footer}>iFilter Dashboard &copy; 2025</p>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spinLogin {
          to { transform: rotate(360deg); }
        }
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
    maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(49, 53, 58, 0.12)',
    border: '1px solid rgba(237, 240, 242, 0.8)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    background: '#1e2124',
    borderRadius: '20px',
    marginBottom: '16px',
    boxShadow: '0 10px 25px rgba(30, 33, 36, 0.25)',
  },
  logoTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#1e2124',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
    fontFamily: 'Assistant, sans-serif',
  },
  logoSub: {
    fontSize: '1rem',
    color: '#5e656e',
    margin: 0,
    fontWeight: 400,
  },
  logoDivider: {
    width: '48px',
    height: '3px',
    background: '#31353a',
    borderRadius: '2px',
    margin: '16px auto 0',
    opacity: 0.2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: 700,
    fontSize: '0.92rem',
    color: '#1e2124',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 18px 14px 48px',
    border: '1.5px solid #e8eaed',
    background: '#fafbfc',
    borderRadius: '14px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '1rem',
    color: '#1e2124',
    outline: 'none',
    boxSizing: 'border-box',
    direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  inputFocus: {
    width: '100%',
    padding: '14px 18px 14px 48px',
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
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none',
    display: 'flex',
  },
  submitBtn: {
    width: '100%',
    padding: '15px 28px',
    background: '#31353a',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 10px 20px rgba(49, 53, 58, 0.2)',
    transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  loadingRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  spinnerSmall: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spinLogin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#9ca3af',
    marginTop: '28px',
    marginBottom: 0,
  },
}

export default Login
