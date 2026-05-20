import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'ממתין' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'done',        label: 'הושלם' },
]

export const DistributionTaskFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEdit = !!data?.task

  const [form, setForm] = useState({
    title:       data?.task?.title       || '',
    description: data?.task?.description || '',
    status:      data?.task?.status      || 'pending',
  })
  const [saving, setSaving] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }))

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('כותרת היא שדה חובה')
      return
    }

    try {
      setSaving(true)
      let result
      if (isEdit) {
        result = await apiClient.updateDistributionTask(data.task.id, form)
      } else {
        result = await apiClient.createDistributionTask(form)
      }

      if (!result.success) throw new Error(result.message)

      toast.success(isEdit ? 'משימה עודכנה' : 'משימה נוספה')
      data?.onSave?.(result.data)
      closeModal()
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          כותרת <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={set('title')}
          disabled={saving}
          placeholder="שם המשימה..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          disabled={saving}
          rows={4}
          placeholder="פרטים נוספים על המשימה..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
        <select
          value={form.status}
          onChange={set('status')}
          disabled={saving}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
})

DistributionTaskFormLayout.displayName = 'DistributionTaskFormLayout'
