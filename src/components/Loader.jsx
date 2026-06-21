const Loader = ({
  size = 'md',
  variant = 'primary',
  text = '',
  className = '',
  fullScreen = false,
  overlay = false,
  center = false
}) => {
  const sizeMap = {
    xs: { dim: 12, border: 1 },
    sm: { dim: 16, border: 2 },
    md: { dim: 24, border: 2 },
    lg: { dim: 32, border: 2 },
    xl: { dim: 48, border: 3 },
    '2xl': { dim: 80, border: 4 },
  }

  const colorMap = {
    primary: { track: 'rgba(49,53,58,0.15)', spin: '#31353a' },
    white:   { track: 'rgba(255,255,255,0.3)', spin: '#ffffff' },
    muted:   { track: 'rgba(94,101,110,0.2)', spin: '#5e656e' },
    gray:    { track: 'rgba(156,163,175,0.3)', spin: '#9ca3af' },
    // legacy aliases
    purple:  { track: 'rgba(49,53,58,0.15)', spin: '#31353a' },
  }

  const textColorMap = {
    primary: '#31353a',
    white:   '#ffffff',
    muted:   '#5e656e',
    gray:    '#9ca3af',
    purple:  '#31353a',
  }

  const { dim, border } = sizeMap[size] || sizeMap.md
  const { track, spin } = colorMap[variant] || colorMap.primary
  const textColor = textColorMap[variant] || textColorMap.primary

  const spinnerStyle = {
    width:  dim,
    height: dim,
    borderRadius: size === '2xl' ? '16px' : '50%',
    border: `${border}px solid ${track}`,
    borderTopColor: spin,
    animation: 'ifSpin 0.75s linear infinite',
    display: 'inline-block',
    flexShrink: 0,
  }

  const spinCSS = `@keyframes ifSpin { to { transform: rotate(360deg); } }`

  const spinner = (
    <>
      <style>{spinCSS}</style>
      <div style={spinnerStyle} />
    </>
  )

  if (fullScreen) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 50%, #f0f4f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>{spinner}</div>
          {text && (
            <div>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e2124', marginBottom: '6px' }}>{text}</p>
              <p style={{ fontSize: '0.9rem', color: '#5e656e' }}>מעבד נתונים...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (overlay) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        borderRadius: 'inherit',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: text ? '10px' : 0 }}>{spinner}</div>
          {text && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: textColor }}>{text}</p>}
        </div>
      </div>
    )
  }

  if (center) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
        {spinner}
        {text && <span style={{ marginRight: '12px', fontSize: '0.875rem', fontWeight: 600, color: textColor }}>{text}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className={className}>
      {spinner}
      {text && <span style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor }}>{text}</span>}
    </div>
  )
}

export default Loader
