import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, ClipboardList, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { useGlobalState } from '../../contexts/GlobalStateContext'
import apiClient from '../../utils/api'

const STATUS_META = {
  pending:     { label: 'ממתין',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'בביצוע', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  done:        { label: 'הושלם',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const STATUS_CYCLE = ['pending', 'in_progress', 'done']

export default function TasksTab() {
  const { openModal } = useGlobalState()
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getDistributionTasks()
      if (res.success) setTasks(res.data)
    } catch {
      toast.error('שגיאה בטעינת משימות')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    openModal({
      layout: 'distributionTaskForm',
      title: 'משימה חדשה',
      size: 'md',
      confirmText: 'הוסף',
      cancelText: 'ביטול',
      data: { onSave: (t) => setTasks((prev) => [t, ...prev]) },
    })
  }

  const openEdit = (task) => {
    openModal({
      layout: 'distributionTaskForm',
      title: 'עריכת משימה',
      size: 'md',
      confirmText: 'שמור',
      cancelText: 'ביטול',
      data: {
        task,
        onSave: (updated) =>
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t))),
      },
    })
  }

  const confirmDelete = (task) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת משימה',
      size: 'sm',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      data: { message: `האם למחוק את המשימה "${task.title}"?` },
      onConfirm: async () => {
        try {
          await apiClient.deleteDistributionTask(task.id)
          setTasks((prev) => prev.filter((t) => t.id !== task.id))
          toast.success('נמחקה')
        } catch {
          toast.error('שגיאה במחיקה')
        }
      },
    })
  }

  const cycleStatus = async (task) => {
    const currentIdx = STATUS_CYCLE.indexOf(task.status)
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]

    setToggling(task.id)
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))

    try {
      await apiClient.updateDistributionTaskStatus(task.id, nextStatus)
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      toast.error('שגיאה בעדכון סטטוס')
    } finally {
      setToggling(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  const counts = {
    pending:     tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done:        tasks.filter((t) => t.status === 'done').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        טוען משימות...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <StatPill label="ממתין"  value={counts.pending}     color="yellow" />
          <StatPill label="בביצוע" value={counts.in_progress} color="blue" />
          <StatPill label="הושלם"  value={counts.done}        color="emerald" />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          משימה חדשה
        </button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">אין משימות עדיין</p>
          <button onClick={openAdd} className="mt-4 text-blue-600 text-sm hover:underline">
            הוסף משימה ראשונה
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const meta = STATUS_META[task.status] || STATUS_META.pending
            const isToggling = toggling === task.id
            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex-1 min-w-0 ml-2">
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(task.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => cycleStatus(task)}
                      disabled={isToggling}
                      title="שנה סטטוס"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${meta.color}`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : task.status === 'done' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {meta.label}
                    </button>
                    <button
                      onClick={() => openEdit(task)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="עריכה"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDelete(task)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחיקה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {task.description ? (
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {task.description}
                    </p>
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-300 italic">אין תיאור</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, color }) {
  const colors = {
    yellow:  'bg-yellow-50  text-yellow-700',
    blue:    'bg-blue-50    text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${colors[color]}`}>
      <span className="font-bold text-sm">{value}</span>
      {label}
    </div>
  )
}
