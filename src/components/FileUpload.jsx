import { useState, useRef } from 'react'
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle } from 'lucide-react'

const FileUpload = ({
  acceptedTypes = ['*/*'],
  maxSize = 50 * 1024 * 1024, // 50MB default
  multiple = false,
  onFileSelect,
  onUpload,
  className = '',
  uploadButtonText = 'העלה קובץ',
  dragText = 'גרור קובץ לכאן',
  clickText = 'או לחץ לבחירת קובץ',
  icon: CustomIcon = Upload,
  disabled = false,
  showPreview = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Validate file
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `קובץ גדול מדי. גודל מקסימלי: ${formatFileSize(maxSize)}`
    }

    // Check file type if specified
    if (acceptedTypes[0] !== '*/*') {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      const mimeType = file.type
      
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase()
        }
        if (type.includes('/*')) {
          return mimeType.startsWith(type.split('/')[0] + '/')
        }
        return mimeType === type
      })

      if (!isValidType) {
        return `סוג קובץ לא נתמך. סוגים מותרים: ${acceptedTypes.join(', ')}`
      }
    }

    return null
  }

  // Handle file selection
  const handleFiles = async (files) => {
    const fileArray = Array.from(files)
    const validFiles = []
    const errors = []

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        try {
          const base64 = await fileToBase64(file)
          validFiles.push({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            base64,
            id: Math.random().toString(36).substr(2, 9)
          })
        } catch (error) {
          errors.push(`${file.name}: שגיאה בקריאת הקובץ`)
        }
      }
    }

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
      // You can add toast notifications here if needed
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles
      setSelectedFiles(newFiles)
      
      if (onFileSelect) {
        onFileSelect(multiple ? newFiles : validFiles[0])
      }
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (!disabled) {
      const files = e.dataTransfer.files
      handleFiles(files)
    }
  }

  // File input change handler
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  // Remove file
  const removeFile = (fileId) => {
    const newFiles = selectedFiles.filter(f => f.id !== fileId)
    setSelectedFiles(newFiles)
    
    if (onFileSelect) {
      onFileSelect(multiple ? newFiles : null)
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload handler
  const handleUpload = async () => {
    if (!onUpload || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await onUpload(multiple ? selectedFiles : selectedFiles[0])
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Clear files on successful upload
      setTimeout(() => {
        setSelectedFiles([])
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 1000)

      return result
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`file-upload ${className}`} dir="rtl">
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : dragActive
            ? 'border-blue-500 bg-blue-50'
            : selectedFiles.length > 0
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          <CustomIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">{dragText}</p>
          <p className="text-sm text-gray-500">{clickText}</p>
          {acceptedTypes[0] !== '*/*' && (
            <p className="text-xs text-gray-400 mt-2">
              סוגי קבצים מותרים: {acceptedTypes.join(', ')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            גודל מקסימלי: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* File Preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          {selectedFiles.map((fileData) => (
            <div key={fileData.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{fileData.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(fileData.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(fileData.id)
                  }}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">מעלה קובץ...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {onUpload && selectedFiles.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={uploading || disabled}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מעלה...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>{uploadButtonText}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUpload