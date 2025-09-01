import { useState } from 'react'
import { Edit3, Save, X, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

const EditableSection = ({
  title,
  icon: Icon,
  fields = [],
  data = {},
  onSave,
  className = '',
  description = '',
  saveButtonText = 'שמור',
  cancelButtonText = 'ביטול',
  editButtonText = 'עריכה'
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Field types supported
  const FIELD_TYPES = {
    text: 'text',
    email: 'email',
    tel: 'tel',
    number: 'number',
    date: 'date',
    select: 'select',
    textarea: 'textarea'
  }

  const handleEdit = () => {
    setFormData(data) // Reset form data to current data
    setValidationErrors({})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(data)
    setValidationErrors({})
    setIsEditing(false)
  }

  const handleFieldChange = (fieldKey, value) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }))
    
    // Clear validation error for this field
    if (validationErrors[fieldKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }
  }

  const validateFields = () => {
    const errors = {}
    
    fields.forEach(field => {
      const value = formData[field.key]
      
      // Required field validation
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.key] = 'שדה זה הוא חובה'
        return
      }
      
      // Custom validation
      if (field.validate && value) {
        const result = field.validate(value)
        if (result !== true) {
          errors[field.key] = result
        }
      }
      
      // Type-specific validation
      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors[field.key] = 'כתובת אימייל לא תקינה'
        }
      }
    })
    
    return errors
  }

  const handleSave = async () => {
    const errors = validateFields()
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setSaving(true)
      
      if (onSave) {
        await onSave(formData)
      }
      
      setIsEditing(false)
      toast.success('הנתונים נשמרו בהצלחה')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('שגיאה בשמירת הנתונים')
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field) => {
    const value = isEditing ? formData[field.key] : data[field.key]
    const hasError = validationErrors[field.key]

    // Format date values for input field
    const getInputValue = () => {
      if (field.type === 'date' && value) {
        const date = new Date(value)
        return date.toISOString().split('T')[0] // Format as YYYY-MM-DD for date input
      }
      return value || ''
    }

    if (isEditing) {
      // Edit mode - show input
      switch (field.type) {
        case FIELD_TYPES.select:
          return (
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">בחר אפשרות</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        
        case FIELD_TYPES.textarea:
          return (
            <textarea
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          )
        
        default:
          return (
            <input
              type={field.type || 'text'}
              value={getInputValue()}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          )
      }
    } else {
      // Display mode - show value
      const getDisplayValue = () => {
        if (!value) return field.placeholder || 'לא זמין'
        
        if (field.type === 'date') {
          const date = new Date(value)
          return date.toLocaleDateString('he-IL')
        }
        
        return value
      }
      
      const displayValue = getDisplayValue()
      
      return (
        <div className="flex items-center space-x-2 py-2">
          {field.icon && <field.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className={`${!value ? 'text-gray-500 italic' : 'text-gray-900'} ${field.className || ''}`}>
            {displayValue}
          </span>
        </div>
      )
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
      isEditing ? 'ring-2 ring-purple-100 shadow-md' : 'hover:shadow-md'
    } ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-100 ${
        isEditing ? 'bg-purple-50/50' : 'bg-gray-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${
                isEditing ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {cancelButtonText}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'שומר...' : saveButtonText}</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleEdit}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors flex items-center space-x-1 group"
              >
                <Edit3 className="w-4 h-4 group-hover:text-purple-600 transition-colors" />
                <span>{editButtonText}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
              </label>
              
              {renderField(field)}
              
              {validationErrors[field.key] && (
                <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors[field.key]}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EditableSection