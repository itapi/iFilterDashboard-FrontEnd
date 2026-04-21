import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { toast } from 'react-toastify'
import { Smartphone, Upload, File as FileIcon, X, Info } from 'lucide-react'
import apiClient from '../../../utils/api'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

export const UploadFirmwareLayout = forwardRef(({ data }, ref) => {
  const notification = data?.notification || {}
  const onSuccess = data?.onSuccess
  const { closeModal } = useGlobalState()

  const [file, setFile] = useState(null)
  const [cpuArch, setCpuArch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit
  }))

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error('יש לבחור קובץ קושחה')
      return
    }
    if (uploading) return

    try {
      setUploading(true)
      setProgress(10)

      const formData = new FormData()
      formData.append('firmware', file)
      formData.append('build_fingerprint', notification.build_fingerprint || '')
      formData.append('build_id', notification.build_id || '')
      formData.append('build_incremental', notification.build_incremental || '')
      formData.append('android_version', notification.android_version || '')
      formData.append('product_device', notification.product_device || '')
      formData.append('manufacturer', notification.manufacturer || '')
      formData.append('brand', notification.brand || '')
      formData.append('model', notification.model || '')
      formData.append('build_date_utc', notification.build_date_utc || 0)
      formData.append('cpu_arch', cpuArch)
      if (notification.id) formData.append('notification_id', notification.id)

      setProgress(40)
      const response = await apiClient.uploadStockFirmware(formData)
      setProgress(100)

      if (response.success) {
        toast.success('קושחת המקור הועלתה בהצלחה!')
        onSuccess?.()
        closeModal()
      } else {
        toast.error(response.message || 'שגיאה בהעלאה')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('שגיאה בהעלאת הקושחה')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const deviceName = notification.model || notification.product_device
  const maker = notification.manufacturer || notification.brand

  return (
    <div className="p-6" dir="rtl">
      {/* Device info */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {maker ? `${maker} ${deviceName}` : deviceName || '—'}
          </p>
          {notification.android_version && (
            <p className="text-xs text-gray-500">Android {notification.android_version}</p>
          )}
          {notification.build_fingerprint && (
            <p className="font-mono text-xs text-gray-400 truncate mt-0.5">
              {notification.build_fingerprint}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {notification.build_incremental && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-500">Build:</span> {notification.build_incremental}
              </p>
            )}
            {notification.csc && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-500">CSC:</span> {notification.csc}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      {(notification.full_name || notification.email) && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mb-5 text-sm">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            {notification.full_name && <p className="font-medium text-gray-800">{notification.full_name}</p>}
            {notification.email && <p className="text-gray-500">{notification.email}</p>}
          </div>
        </div>
      )}

      {/* CPU arch (optional) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">ארכיטקטורת CPU (אופציונלי)</label>
        <input
          type="text"
          value={cpuArch}
          onChange={(e) => setCpuArch(e.target.value)}
          placeholder="למשל: arm64-v8a"
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* File drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.img,.tar,.gz,.lz4,.br"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div className="text-right">
              <p className="font-medium text-gray-900 text-sm">{file.name}</p>
              <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="mr-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <p className="font-medium text-gray-700 text-sm">גרור קובץ קושחה לכאן</p>
            <p className="text-xs text-gray-400 mt-1">או לחץ לבחירת קובץ</p>
            <p className="text-xs text-gray-400 mt-1">zip, img, tar, gz, lz4, br</p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>מעלה...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>מעלה קושחה...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>העלה קושחת מקור</span>
          </>
        )}
      </button>
    </div>
  )
})

UploadFirmwareLayout.displayName = 'UploadFirmwareLayout'
