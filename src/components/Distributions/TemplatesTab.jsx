import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, Copy, FileText } from 'lucide-react'
import { useGlobalState } from '../../contexts/GlobalStateContext'
import apiClient from '../../utils/api'

export default function TemplatesTab() {
  const { openModal } = useGlobalState()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getTemplates()
      if (res.success) setTemplates(res.data)
    } catch {
      toast.error('שגיאה בטעינת תבניות')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    openModal({
      layout: 'templateForm',
      title: 'תבנית חדשה',
      size: 'md',
      confirmText: 'הוסף',
      cancelText: 'ביטול',
      data: { onSave: (t) => setTemplates((prev) => [...prev, t]) },
    })
  }

  const openEdit = (template) => {
    openModal({
      layout: 'templateForm',
      title: 'עריכת תבנית',
      size: 'md',
      confirmText: 'שמור',
      cancelText: 'ביטול',
      data: {
        template,
        onSave: (updated) =>
          setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t))),
      },
    })
  }

  const confirmDelete = (template) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת תבנית',
      size: 'sm',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      data: { message: `האם למחוק את התבנית "${template.title}"?` },
      onConfirm: async () => {
        try {
          await apiClient.deleteTemplate(template.id)
          setTemplates((prev) => prev.filter((t) => t.id !== template.id))
          toast.success('נמחקה')
        } catch {
          toast.error('שגיאה במחיקה')
        }
      },
    })
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('הועתק ללוח')
    } catch {
      toast.error('לא ניתן להעתיק')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        טוען תבניות...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{templates.length} תבניות</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          תבנית חדשה
        </button>
      </div>

      {/* Template cards */}
      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">אין תבניות עדיין</p>
          <button
            onClick={openAdd}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            הוסף תבנית ראשונה
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{t.title}</h3>
                  {t.category ? (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {t.category}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      ברירת מחדל
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                  <button
                    onClick={() => copyToClipboard(t.body)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="העתק תוכן"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="עריכה"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(t)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחיקה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body preview */}
              <div className="px-5 py-4">
                <p
                  className={`text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ${
                    expanded === t.id ? '' : 'line-clamp-4'
                  }`}
                >
                  {t.body}
                </p>
                {t.body.length > 200 && (
                  <button
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    className="mt-2 text-xs text-blue-500 hover:underline"
                  >
                    {expanded === t.id ? 'הצג פחות' : 'הצג יותר'}
                  </button>
                )}
              </div>

              {/* Footer: char count */}
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-50 text-xs text-gray-400 text-left" dir="ltr">
                {t.body.length} chars
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
