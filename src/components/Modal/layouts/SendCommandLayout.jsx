import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

const SCRIPT_PREFIX = 'https://ikosher.me/iFilter/scripts/'

const COMMAND_TYPES = [
  { value: 'FILTER_UPDATE',  label: 'עדכון פילטר' },
  { value: 'RESTART',        label: 'הפעל מחדש' },
  { value: 'LOCK_DEVICE',    label: 'נעל מכשיר' },
  { value: 'INSTALL_APP',    label: 'התקן אפליקציה' },
  { value: 'UNINSTALL_APP',  label: 'הסר אפליקציה' },
  { value: 'COLLECT_LOGS',   label: 'אסוף לוגים' },
  { value: 'EXECUTE_SCRIPT', label: 'הרץ סקריפט' },
]

/**
 * SendCommandLayout
 *
 * Usage:
 * openModal({
 *   layout: 'sendCommand',
 *   title: 'שלח פקודה',
 *   size: 'md',
 *   data: {
 *     clients: [...],          // pre-loaded clients list
 *     preselectedClientId: 5,  // optional
 *     onSent: () => {}         // refresh callback
 *   }
 * })
 */
export const SendCommandLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()

  const [target, setTarget] = useState(data?.preselectedClientId ? 'client' : 'client')
  const [clientId, setClientId] = useState(data?.preselectedClientId ?? '')
  const [commandType, setCommandType] = useState('')
  const [commandData, setCommandData] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState([])

  useEffect(() => {
    apiClient.getClientsWithDetails(1, 500)
      .then(res => setClients(res.data?.data || res.data || []))
      .catch(() => {})
  }, [])

  useImperativeHandle(ref, () => ({
    submitForm: async () => { await handleSubmit() }
  }))

  const handleSubmit = async () => {
    if (!commandType) {
      toast.error('נא לבחור סוג פקודה')
      return
    }
    if (target === 'client' && !clientId) {
      toast.error('נא לבחור לקוח')
      return
    }

    if (commandType === 'EXECUTE_SCRIPT' && !commandData.trim()) {
      toast.error('נא להזין שם סקריפט')
      return
    }

    const parsedData = commandType === 'EXECUTE_SCRIPT'
      ? SCRIPT_PREFIX + commandData.trim()
      : commandData.trim() || null

    try {
      setIsSubmitting(true)

      if (target === 'broadcast') {
        const res = await apiClient.sendBroadcastCommand(commandType, parsedData)
        toast.success(`הפקודה נשלחה ל-${res.data?.total_clients ?? 'כל'} הלקוחות`)
      } else {
        await apiClient.sendRemoteCommand(Number(clientId), commandType, parsedData)
        toast.success('הפקודה נשלחה בהצלחה')
      }

      data?.onSent?.()
      closeModal()
    } catch {
      toast.error('שגיאה בשליחת הפקודה')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">

      {/* Target selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">יעד הפקודה</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'client',    label: 'לקוח ספציפי' },
            { value: 'broadcast', label: 'כל הלקוחות' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTarget(opt.value)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                target === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {target === 'broadcast' && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            הפקודה תישלח לכל הלקוחות הפעילים במערכת
          </p>
        )}
      </div>

      {/* Client selector */}
      {target === 'client' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            לקוח <span className="text-red-500">*</span>
          </label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            disabled={isSubmitting}
          >
            <option value="">בחר לקוח...</option>
            {clients.map(c => (
              <option key={c.client_unique_id} value={c.client_unique_id}>
                {c.first_name} {c.last_name} — #{c.client_unique_id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Command type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          סוג פקודה <span className="text-red-500">*</span>
        </label>
        <select
          value={commandType}
          onChange={e => { setCommandType(e.target.value); setCommandData('') }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          disabled={isSubmitting}
        >
          <option value="">בחר סוג פקודה...</option>
          {COMMAND_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.label}</option>
          ))}
        </select>
      </div>

      {/* Command data */}
      {commandType === 'EXECUTE_SCRIPT' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            נתיב סקריפט <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all" dir="ltr">
            <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm font-mono whitespace-nowrap border-r border-gray-300 select-none">
              {SCRIPT_PREFIX}
            </span>
            <input
              type="text"
              value={commandData}
              onChange={e => setCommandData(e.target.value)}
              className="flex-1 px-3 py-2 text-sm font-mono outline-none bg-white"
              placeholder="script-name.sh"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">הכנס את שם הסקריפט בלבד</p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            נתוני פקודה
            <span className="text-gray-400 font-normal mr-1">(אופציונלי)</span>
          </label>
          <textarea
            value={commandData}
            onChange={e => setCommandData(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
            placeholder='לדוגמה: {"package": "com.example.app"}'
            rows={3}
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-400 mt-1">ניתן להזין מחרוזת חופשית או JSON</p>
        </div>
      )}
    </div>
  )
})

SendCommandLayout.displayName = 'SendCommandLayout'
