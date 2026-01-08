import { FileText, Image as ImageIcon, File, Download, X } from 'lucide-react'
import { BASE_URL } from '../utils/api'

/**
 * AttachmentPreview Component
 *
 * Clean, minimal component for displaying file attachments
 * Follows iFilter design guidelines: light, modern, elegant
 *
 * Props:
 * - attachments: Array of attachment objects
 * - onDelete: Optional callback for deleting attachments (shows delete button if provided)
 * - compact: Boolean for compact display mode
 */
export const AttachmentPreview = ({ attachments = [], onDelete, compact = false }) => {
  if (!attachments || attachments.length === 0) return null

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    if (fileType?.includes('pdf')) {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'קובץ'
    const parts = fileUrl.split('/')
    return parts[parts.length - 1] || 'קובץ'
  }

  const getFileUrl = (relativePath) => {
    if (!relativePath) return null
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath
    }
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath
    return `https://ikosher.me/${cleanPath}`
  }

  const isImage = (fileType) => {
    return fileType?.startsWith('image/')
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={getFileUrl(attachment.file_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-reverse space-x-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors group"
          >
            {getFileIcon(attachment.file_type)}
            <span className="max-w-[120px] truncate">{getFileName(attachment.file_url)}</span>
            <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const fileUrl = getFileUrl(attachment.file_url)
        const fileName = getFileName(attachment.file_url)
        const fileSize = formatFileSize(attachment.file_size)
        const fileIcon = getFileIcon(attachment.file_type)

        return (
          <div
            key={attachment.id}
            className="group relative bg-white border border-gray-200 rounded-xl p-3 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center space-x-reverse space-x-3">
              {/* File Preview/Icon */}
              {isImage(attachment.file_type) ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600">
                  {fileIcon}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-purple-600 transition-colors truncate block"
                >
                  {fileName}
                </a>
                <p className="text-sm text-gray-500">{fileSize}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-reverse space-x-2">
                <a
                  href={fileUrl}
                  download
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="הורד קובץ"
                >
                  <Download className="w-4 h-4" />
                </a>

                {onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחק קובץ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AttachmentPreview
