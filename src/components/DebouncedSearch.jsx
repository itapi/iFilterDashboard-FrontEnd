import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'

const DebouncedSearch = ({
  value = '',
  onChange,
  placeholder = 'חפש...',
  delay = 300,
  className = '',
  disabled = false,
  showClearButton = true,
  icon: CustomIcon = Search,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value)

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced callback to trigger onChange
  const debouncedOnChange = useCallback(
    debounce((searchValue) => {
      onChange?.(searchValue)
    }, delay),
    [onChange, delay]
  )

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  // Handle clear button
  const handleClear = () => {
    setLocalValue('')
    onChange?.('')
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <CustomIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          className={`
            w-full pr-10 pl-4 py-3 
            border border-gray-200 rounded-xl 
            focus:ring-2 focus:ring-purple-500 focus:border-transparent 
            transition-all duration-200
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
            ${showClearButton && localValue ? 'pl-10' : 'pl-4'}
          `}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        {showClearButton && localValue && !disabled && (
          <button
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            title="נקה חיפוש"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Simple debounce utility function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default DebouncedSearch