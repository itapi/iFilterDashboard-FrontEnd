import { Loader2 } from 'lucide-react'

const Loader = ({
  size = 'md',
  variant = 'primary',
  text = '',
  className = '',
  fullScreen = false,
  overlay = false,
  center = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-20 h-20'
  }

  const variantClasses = {
    primary: {
      xs: 'border border-blue-600 border-t-transparent',
      sm: 'border-2 border-blue-600 border-t-transparent',
      md: 'border-2 border-blue-600 border-t-transparent',
      lg: 'border-2 border-blue-600 border-t-transparent',
      xl: 'border-3 border-blue-600 border-t-transparent',
      '2xl': 'border-4 border-blue-200 border-t-blue-600'
    },
    white: {
      xs: 'border border-white/60 border-t-white',
      sm: 'border-2 border-white/30 border-t-white',
      md: 'border-2 border-white/30 border-t-white',
      lg: 'border-2 border-white/30 border-t-white',
      xl: 'border-3 border-white/30 border-t-white',
      '2xl': 'border-4 border-white/30 border-t-white'
    },
    purple: {
      xs: 'border border-purple-600 border-t-transparent',
      sm: 'border-2 border-purple-600 border-t-transparent',
      md: 'border-2 border-purple-600 border-t-transparent',
      lg: 'border-2 border-purple-600 border-t-transparent',
      xl: 'border-3 border-purple-600 border-t-transparent',
      '2xl': 'border-4 border-purple-200 border-t-purple-600'
    },
    gray: {
      xs: 'border border-gray-400 border-t-transparent',
      sm: 'border-2 border-gray-400 border-t-transparent',
      md: 'border-2 border-gray-400 border-t-transparent',
      lg: 'border-2 border-gray-400 border-t-transparent',
      xl: 'border-3 border-gray-400 border-t-transparent',
      '2xl': 'border-4 border-gray-300 border-t-gray-400'
    }
  }

  const roundedClass = size === '2xl' ? 'rounded-2xl' : 'rounded-full'

  const spinnerClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant][size]}
    ${roundedClass}
    animate-spin
    ${className}
  `.trim()

  const textColorClasses = {
    primary: 'text-gray-700',
    white: 'text-white',
    purple: 'text-gray-700',
    gray: 'text-gray-600'
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`${spinnerClasses} mx-auto mb-6`}></div>
          {text && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{text}</h3>
              <p className="text-gray-600">מעבד נתונים...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
        <div className="text-center">
          <div className={`${spinnerClasses} mx-auto ${text ? 'mb-3' : ''}`}></div>
          {text && (
            <p className={`text-sm font-medium ${textColorClasses[variant]}`}>{text}</p>
          )}
        </div>
      </div>
    )
  }

  if (center) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className={spinnerClasses}></div>
        {text && (
          <span className={`mr-3 text-sm font-medium ${textColorClasses[variant]}`}>{text}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className={spinnerClasses}></div>
      {text && (
        <span className={`text-sm font-medium ${textColorClasses[variant]}`}>{text}</span>
      )}
    </div>
  )
}

export default Loader