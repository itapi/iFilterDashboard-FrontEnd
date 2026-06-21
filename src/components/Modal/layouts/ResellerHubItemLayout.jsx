import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Upload, X, FileText as FileTextIcon, ExternalLink, CheckCircle } from 'lucide-react'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient, { getImageUrl } from '../../../utils/api'

const ICON_OPTIONS = [
  { value: 'FileText',      label: 'PDF / מסמך' },
  { value: 'MessageCircle', label: 'ווטסאפ / צ׳אט' },
  { value: 'Palette',       label: 'עיצוב / מיתוג' },
  { value: 'Layers',        label: 'שכבות / מאגר' },
  { value: 'ShoppingBag',   label: 'חנות / קניות' },
  { value: 'Award',         label: 'פרס / תעודה' },
  { value: 'Smartphone',    label: 'סלולר / דיגיטל' },
  { value: 'Printer',       label: 'מדפסת / הדפסה' },
  { value: 'Image',         label: 'תמונה / גרפיקה' },
  { value: 'Download',      label: 'הורדה' },
  { value: 'Link',          label: 'קישור' },
  { value: 'Star',          label: 'כוכב / מומלץ' },
]

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'כחול' },
  { value: 'green',  label: 'ירוק' },
  { value: 'purple', label: 'סגול' },
  { value: 'orange', label: 'כתום' },
  { value: 'yellow', label: 'צהוב' },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

// ─── Inline file uploader ──────────────────────────────────────────────────────
const MediaUploader = ({ currentUrl, onUploaded, disabled }) => {
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedName, setUploadedName] = useState(null)

  const isImage = (url) => url && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)

  const processFile = async (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('סוג קובץ לא נתמך. מותר: JPG, PNG, GIF, WEBP, PDF')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('הקובץ גדול מ-10MB')
      return
    }

    setUploading(true)
    setProgress(20)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        setProgress(50)
        const res = await apiClient.apiRequest('upload/reseller-media', {
          method: 'POST',
          body: {
            file_data: ev.target.result,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          },
        })
        setProgress(100)
        if (res?.success && res?.url) {
          onUploaded(res.url)
          setUploadedName(file.name)
          toast.success('הקובץ הועלה בהצלחה')
        } else {
          toast.error(res?.error || 'שגיאה בהעלאת הקובץ')
        }
      } catch {
        toast.error('שגיאה בהעלאת הקובץ')
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 800)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleInput = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div>
      {/* Drag-drop zone */}
      <div
        onClick={() => !disabled && !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none ${
          disabled   ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' :
          dragging   ? 'border-blue-400 bg-blue-50' :
          currentUrl ? 'border-green-400 bg-green-50' :
                       'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleInput} className="hidden" disabled={disabled || uploading} />

        {uploading ? (
          /* Upload progress */
          <div className="py-2">
            <div className="flex items-center justify-center gap-2 mb-3 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">מעלה קובץ...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : currentUrl ? (
          /* Uploaded / existing file preview */
          <div className="flex flex-col items-center gap-2">
            {isImage(currentUrl) ? (
              <img src={getImageUrl(currentUrl) || currentUrl} alt="preview" className="h-20 object-contain rounded-lg border border-gray-200" />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div className="flex items-center gap-1 text-green-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              {uploadedName || 'קובץ קיים'}
            </div>
            <p className="text-xs text-gray-400">לחץ כאן להחלפת הקובץ</p>
          </div>
        ) : (
          /* Empty zone */
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">גרור קובץ לכאן או לחץ לבחירה</p>
            <p className="text-xs text-gray-400">JPG, PNG, GIF, WEBP, PDF — עד 10MB</p>
          </div>
        )}
      </div>

      {/* Clear button when there's a file */}
      {currentUrl && !uploading && (
        <button
          type="button"
          onClick={() => { onUploaded(''); setUploadedName(null) }}
          className="mt-1.5 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="w-3 h-3" /> הסר קובץ
        </button>
      )}
    </div>
  )
}

/**
 * ResellerHubItemLayout
 *
 * Usage:
 * openModal({
 *   layout: 'resellerHubItem',
 *   title: 'הוספת פריט',
 *   data: { section: 'digital', item: null, onSave: async () => { ... } },
 *   confirmText: 'שמור', cancelText: 'ביטול',
 *   showConfirmButton: true, showCancelButton: true,
 * })
 */
export const ResellerHubItemLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const item    = data?.item    || null
  const section = item?.section || data?.section || 'digital'
  const isEdit  = !!item
  const isWA    = section === 'whatsapp'

  const [form, setForm] = useState({
    section,
    title:         item?.title         || '',
    description:   item?.description   || '',
    badge:         item?.badge         || '',
    icon_name:     item?.icon_name     || 'FileText',
    color_scheme:  item?.color_scheme  || 'blue',
    download_url:  item?.download_url  || '',
    template_text: item?.template_text || '',
    sort_order:    item?.sort_order    ?? 0,
  })

  // 'url' | 'file' — default to 'file' when adding, 'url' if editing an existing URL
  const [linkMode, setLinkMode] = useState(
    item?.download_url ? 'url' : 'file'
  )
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  useImperativeHandle(ref, () => ({ submitForm: handleSubmit }))

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('נא להזין כותרת'); return }
    if (isWA && !form.template_text.trim()) { toast.error('נא להזין טקסט התבנית'); return }

    try {
      setSaving(true)
      let saved
      if (isEdit) {
        const res = await apiClient.updateResellerHubItem(item.id, form)
        saved = res?.data ?? res
      } else {
        const res = await apiClient.createResellerHubItem(form)
        saved = res?.data ?? res
      }
      await data?.onSave?.(saved)
      toast.success(isEdit ? 'הפריט עודכן בהצלחה' : 'הפריט נוצר בהצלחה')
      closeModal()
    } catch (e) {
      console.error(e)
      toast.error('שגיאה בשמירת הפריט')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">

      {/* Section badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
          {{ digital: 'דיגיטל', print: 'פרינט', whatsapp: 'ווטסאפ' }[section]}
        </span>
        {isEdit && <span className="text-xs text-gray-400">עריכת פריט קיים</span>}
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>{isWA ? 'תווית תבנית' : 'כותרת'} <span className="text-red-500">*</span></label>
        <input
          type="text"
          className={inputCls}
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder={isWA ? 'תבנית #1 — פנייה ראשונה' : 'כותרת הכרטיס...'}
          disabled={saving}
        />
      </div>

      {isWA ? (
        <div>
          <label className={labelCls}>טקסט התבנית <span className="text-red-500">*</span></label>
          <textarea
            className={inputCls + ' resize-none'}
            rows={7}
            value={form.template_text}
            onChange={e => set('template_text', e.target.value)}
            placeholder={'שלום [שם הלקוח] 👋\n\nתוכן ההודעה...'}
            disabled={saving}
          />
          <p className="text-xs text-gray-400 mt-1">השתמש ב-[שם הלקוח] כתבנית לשם הדינמי</p>
        </div>
      ) : (
        <>
          {/* Description */}
          <div>
            <label className={labelCls}>תיאור</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="תיאור קצר של הפריט..."
              disabled={saving}
            />
          </div>

          {/* Badge + Icon + Color */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>תגית</label>
              <input
                type="text"
                className={inputCls}
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
                placeholder="PDF / חדש..."
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>אייקון</label>
              <select className={inputCls} value={form.icon_name} onChange={e => set('icon_name', e.target.value)} disabled={saving}>
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>צבע</label>
              <select className={inputCls} value={form.color_scheme} onChange={e => set('color_scheme', e.target.value)} disabled={saving}>
                {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Download URL / File Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>קובץ / קישור להורדה</label>
              {/* Toggle pills */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {[
                  { key: 'file', icon: <Upload className="w-3 h-3" />, label: 'העלאה' },
                  { key: 'url',  icon: <ExternalLink className="w-3 h-3" />, label: 'קישור' },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLinkMode(key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      linkMode === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            {linkMode === 'file' ? (
              <MediaUploader
                currentUrl={form.download_url}
                onUploaded={(url) => set('download_url', url)}
                disabled={saving}
              />
            ) : (
              <input
                type="url"
                className={inputCls}
                value={form.download_url}
                onChange={e => set('download_url', e.target.value)}
                placeholder="https://..."
                disabled={saving}
                dir="ltr"
              />
            )}
          </div>
        </>
      )}

      {/* Sort order */}
      <div>
        <label className={labelCls}>סדר הצגה</label>
        <input
          type="number"
          className={inputCls + ' w-24'}
          value={form.sort_order}
          onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
          disabled={saving}
        />
      </div>
    </div>
  )
})

ResellerHubItemLayout.displayName = 'ResellerHubItemLayout'
