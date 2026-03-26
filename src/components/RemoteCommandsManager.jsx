import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Send, RefreshCw, CheckCircle, Clock, XCircle, Layers } from 'lucide-react'
import apiClient from '../utils/api'
import { useGlobalState } from '../contexts/GlobalStateContext'
import Loader from './Loader'

const STATUS_TABS = [
  { key: null,       label: 'הכל' },
  { key: 'PENDING',  label: 'ממתין' },
  { key: 'EXECUTED', label: 'בוצע' },
  { key: 'FAILED',   label: 'נכשל' },
]

const COMMAND_LABELS = {
  FILTER_UPDATE:  'עדכון פילטר',
  RESTART:        'הפעל מחדש',
  LOCK_DEVICE:    'נעל מכשיר',
  INSTALL_APP:    'התקן אפליקציה',
  UNINSTALL_APP:  'הסר אפליקציה',
  COLLECT_LOGS:   'אסוף לוגים',
  EXECUTE_SCRIPT: 'הרץ סקריפט',
  LIVE_SESSION:   'סשן חי',
}

function StatusBadge({ status }) {
  const map = {
    PENDING:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock size={12} />,        label: 'ממתין'  },
    EXECUTED: { cls: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle size={12} />,  label: 'בוצע'   },
    FAILED:   { cls: 'bg-red-50   text-red-700   border-red-200',    icon: <XCircle size={12} />,      label: 'נכשל'   },
  }
  const cfg = map[status] ?? { cls: 'bg-gray-50 text-gray-600 border-gray-200', icon: null, label: status }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function RemoteCommandsManager() {
  const { openModal } = useGlobalState()
  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [clients, setClients] = useState([])

  const loadCommands = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.getRemoteCommands(activeTab)
      setCommands(res.data ?? [])
    } catch {
      toast.error('שגיאה בטעינת הפקודות')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { loadCommands() }, [loadCommands])

  // Pre-load clients list once for the modal
  useEffect(() => {
    apiClient.getClientsWithDetails(1, 500)
      .then(res => setClients(res.data?.data || res.data || []))
      .catch(() => {})
  }, [])

  const handleSendCommand = () => {
    openModal({
      layout: 'sendCommand',
      title: 'שלח פקודה',
      size: 'md',
      confirmText: 'שלח',
      cancelText: 'ביטול',
      data: {
        clients,
        onSent: loadCommands
      }
    })
  }

  // Stats
  const counts = commands.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  const batchIds = new Set(commands.filter(c => c.batch_id).map(c => c.batch_id))

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">פקודות מרחוק</h1>
          <p className="text-sm text-gray-500 mt-1">ניהול ושליחת פקודות למכשירים</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCommands}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="רענן"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleSendCommand}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Send size={16} />
            שלח פקודה
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'סה"כ',   value: commands.length,        cls: 'text-gray-700',   bg: 'bg-white' },
          { label: 'ממתין',  value: counts.PENDING  ?? 0,   cls: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'בוצע',   value: counts.EXECUTED ?? 0,   cls: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'נכשל',   value: counts.FAILED   ?? 0,   cls: 'text-red-600',    bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map(tab => (
          <button
            key={String(tab.key)}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader text="טוען פקודות..." />
          </div>
        ) : commands.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Send size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">אין פקודות להצגה</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-right">
                <th className="px-4 py-3 font-medium text-gray-500">#</th>
                <th className="px-4 py-3 font-medium text-gray-500">לקוח</th>
                <th className="px-4 py-3 font-medium text-gray-500">סוג פקודה</th>
                <th className="px-4 py-3 font-medium text-gray-500">סטטוס</th>
                <th className="px-4 py-3 font-medium text-gray-500">נוצר</th>
                <th className="px-4 py-3 font-medium text-gray-500">בוצע</th>
                <th className="px-4 py-3 font-medium text-gray-500">Broadcast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commands.map(cmd => (
                <tr key={cmd.command_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{cmd.command_id}</td>
                  <td className="px-4 py-3">
                    {cmd.client_name?.trim()
                      ? <span className="font-medium text-gray-800">{cmd.client_name}</span>
                      : <span className="text-gray-400">#{cmd.client_unique_id}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                      {COMMAND_LABELS[cmd.command_type] ?? cmd.command_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cmd.status} />
                    {cmd.error_message && (
                      <p className="text-xs text-red-500 mt-1 truncate max-w-[160px]" title={cmd.error_message}>
                        {cmd.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(cmd.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(cmd.executed_at)}</td>
                  <td className="px-4 py-3">
                    {cmd.batch_id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                        <Layers size={11} />
                        Broadcast
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
