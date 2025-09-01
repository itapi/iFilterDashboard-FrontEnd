import { useState } from 'react'
import { Check, X, Edit3 } from 'lucide-react'

const EditableField = ({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  editable = true,
  isEditing = false,
  placeholder = '',
  className = '',
  required = false,
  validation,
  multiline = false,
  options = null // For select fields
}) => {
  const [isValid, setIsValid] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const validateField = (val) => {
    if (required && (!val || val.toString().trim() === '')) {
      setIsValid(false)
      setErrorMessage('שדה זה הוא חובה')
      return false
    }
    
    if (validation && val) {
      const result = validation(val)
      if (result !== true) {
        setIsValid(false)
        setErrorMessage(result)
        return false
      }
    }
    
    setIsValid(true)
    setErrorMessage('')
    return true
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    validateField(newValue)
    onChange(newValue)
  }

  const displayValue = value || placeholder || 'לא זמין'
  
  return (
    <div className={`group ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
        {!isEditing && editable && (
          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      
      {isEditing && editable ? (
        <div className="space-y-1">
          {multiline ? (
            <textarea
              value={value || ''}
              onChange={handleChange}
              placeholder={placeholder}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
            />
          ) : options ? (
            <select
              value={value || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
            >
              <option value="">בחר אפשרות</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
            />
          )}
          {!isValid && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <X className="w-3 h-3" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2 py-2 px-3 bg-gray-50 rounded-lg min-h-[42px] transition-colors group-hover:bg-gray-100">
          {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className={`text-gray-900 ${!value && 'text-gray-500 italic'}`}>
            {displayValue}
          </span>
          {isValid === false && (
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {isValid === true && value && required && (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  )
}

export default EditableField