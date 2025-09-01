import { useState } from 'react'
import { Edit3, Save, X, AlertCircle } from 'lucide-react'

const EditableCard = ({
  title,
  icon: Icon,
  children,
  onSave,
  canEdit = true,
  isEditing: globalEditMode = false,
  className = '',
  description = '',
  saveButtonText = 'שמור',
  cancelButtonText = 'ביטול'
}) => {
  const [localEditMode, setLocalEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const isEditing = globalEditMode || localEditMode

  const handleSave = async () => {
    if (!onSave) return
    
    try {
      setSaving(true)
      await onSave()
      setLocalEditMode(false)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalEditMode(false)
    setHasChanges(false)
    // In a real implementation, you'd want to restore original values
  }

  const handleEdit = () => {
    setLocalEditMode(true)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
      isEditing ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-md'
    } ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-100 ${
        isEditing ? 'bg-blue-50/50' : 'bg-gray-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${
                isEditing ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
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
          
          {canEdit && !globalEditMode && (
            <div className="flex items-center space-x-2">
              {localEditMode ? (
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
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'שומר...' : saveButtonText}</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleEdit}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1 group"
                >
                  <Edit3 className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                  <span>עריכה</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Pass editing state to children */}
        {typeof children === 'function' 
          ? children({ isEditing, setHasChanges })
          : children
        }
      </div>

      {/* Status indicator for changes */}
      {hasChanges && isEditing && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-center space-x-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>יש שינויים שלא נשמרו</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditableCard