import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { toast } from 'react-toastify'
import { Smartphone, Upload, File as FileIcon, X, Info, User, Phone, Mail, Calendar, Hash, Cpu, Tag, CheckCircle2, Clock } from 'lucide-react'
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
  const maker = (notification.manufacturer && notification.manufacturer !== '0') ? notification.manufacturer : notification.brand

  const buildDate = notification.build_date_utc
    ? new Date(notification.build_date_utc * 1000).toLocaleDateString('he-IL')
    : null

  return (
    <div className="p-6 space-y-4" dir="rtl">
      {/* Request header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {maker ? `${maker} ${deviceName}` : deviceName || '—'}
            </p>
            {notification.android_version && (
              <p className="text-xs text-gray-500">Android {notification.android_version}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notification.id && (
            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{notification.id}</span>
          )}
          {notification.notified
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />נשלחה התראה</span>
            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />ממתין</span>
          }
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">פרטי קשר</p>
        {notification.full_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-800">{notification.full_name}</span>
          </div>
        )}
        {notification.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{notification.email}</span>
          </div>
        )}
        {notification.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 font-mono">{notification.phone}</span>
          </div>
        )}
        {notification.created_at && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 text-xs">{new Date(notification.created_at).toLocaleString('he-IL')}</span>
          </div>
        )}
      </div>

      {/* Build / device info */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">פרטי מכשיר</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {notification.build_fingerprint && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Fingerprint</p>
              <p className="font-mono text-xs text-gray-700 break-all leading-tight">{notification.build_fingerprint}</p>
            </div>
          )}
          {notification.android_version && (
            <div>
              <p className="text-xs text-gray-400">Android</p>
              <p className="text-sm font-medium text-gray-700">{notification.android_version}</p>
            </div>
          )}
          {notification.brand && (
            <div>
              <p className="text-xs text-gray-400">Brand</p>
              <p className="text-sm font-medium text-gray-700">{notification.brand}</p>
            </div>
          )}
          {notification.product_device && (
            <div>
              <p className="text-xs text-gray-400">Product</p>
              <p className="text-sm font-medium text-gray-700">{notification.product_device}</p>
            </div>
          )}
          {notification.build_id && (
            <div>
              <p className="text-xs text-gray-400">Build ID</p>
              <p className="font-mono text-xs text-gray-700">{notification.build_id}</p>
            </div>
          )}
          {notification.build_incremental && (
            <div>
              <p className="text-xs text-gray-400">Incremental</p>
              <p className="font-mono text-xs text-gray-700">{notification.build_incremental}</p>
            </div>
          )}
          {notification.csc && (
            <div>
              <p className="text-xs text-gray-400">CSC</p>
              <p className="font-mono text-xs text-gray-700">{notification.csc}</p>
            </div>
          )}
          {buildDate && (
            <div>
              <p className="text-xs text-gray-400">Build Date</p>
              <p className="text-xs text-gray-700">{buildDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {notification.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1.5">הערות הלקוח</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {notification.notes.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}
          </p>
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
          accept=".zip,.tar,.img,.gz,.lz4,.br"
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
            <p className="text-xs text-gray-400 mt-1">zip, tar, img, gz, lz4, br</p>
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
