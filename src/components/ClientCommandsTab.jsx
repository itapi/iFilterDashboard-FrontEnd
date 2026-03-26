import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Send, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import apiClient from '../utils/api'
import { useGlobalState } from '../contexts/GlobalStateContext'
import Loader from './Loader'

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
    PENDING:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock size={12} />,       label: 'ממתין' },
    EXECUTED: { cls: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle size={12} />, label: 'בוצע'  },
    FAILED:   { cls: 'bg-red-50   text-red-700   border-red-200',    icon: <XCircle size={12} />,     label: 'נכשל'  },
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

const ClientCommandsTab = ({ clientUniqueId }) => {
  const { openModal } = useGlobalState()
  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCommands = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.getRemoteCommands(null, clientUniqueId)
      setCommands(res.data ?? [])
    } catch {
      toast.error('שגיאה בטעינת פקודות')
    } finally {
      setLoading(false)
    }
  }, [clientUniqueId])

  useEffect(() => { loadCommands() }, [loadCommands])

  const handleSendCommand = () => {
    openModal({
      layout: 'sendCommand',
      title: 'שלח פקודה ללקוח',
      size: 'md',
      confirmText: 'שלח',
      cancelText: 'ביטול',
      data: {
        preselectedClientId: clientUniqueId,
        onSent: loadCommands
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-800">פקודות מרחוק</h3>
          <p className="text-xs text-gray-400 mt-0.5">{commands.length} פקודות</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCommands}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            title="רענן"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleSendCommand}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Send size={14} />
            שלח פקודה
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="טוען פקודות..." />
        </div>
      ) : commands.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Send size={36} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium text-sm">אין פקודות עבור לקוח זה</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-5 py-3 font-medium text-gray-500">סוג פקודה</th>
              <th className="px-5 py-3 font-medium text-gray-500">סטטוס</th>
              <th className="px-5 py-3 font-medium text-gray-500">נתונים</th>
              <th className="px-5 py-3 font-medium text-gray-500">נוצר</th>
              <th className="px-5 py-3 font-medium text-gray-500">בוצע</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commands.map(cmd => (
              <tr key={cmd.command_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                    {COMMAND_LABELS[cmd.command_type] ?? cmd.command_type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={cmd.status} />
                  {cmd.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate max-w-[180px]" title={cmd.error_message}>
                      {cmd.error_message}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs truncate max-w-[200px]" title={cmd.command_data}>
                  {cmd.command_data || '—'}
                </td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(cmd.created_at)}</td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(cmd.executed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClientCommandsTab
