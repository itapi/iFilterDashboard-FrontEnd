import { useState, useEffect, useRef } from 'react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { Toggle } from './Toggle'
import { RoleGuard } from './RoleGuard'
import { usePermissions } from '../hooks/usePermissions'
import { useGlobalState } from '../contexts/GlobalStateContext'
import {
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  MoreVertical,
  Trash,
  Star,
  Search
} from 'lucide-react'

const SUBJECT_LABELS = {
  app_upload: 'העלאת אפליקציה',
  report: 'דיווח',
  other: 'אחר'
}

const getHebrewSubject = (subject) => SUBJECT_LABELS[subject] ?? subject

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק׳`
  if (hours < 24) return `לפני ${hours} שע׳`
  if (days < 7) return `לפני ${days} ימים`
  return new Date(dateStr).toLocaleDateString('he-IL')
}

const ClientTicketsTab = ({ clientUniqueId }) => {
  const { openModal, closeModal } = useGlobalState()
  const { hasPermission, PERMISSIONS } = usePermissions()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  const isInitialMount = useRef(true)

  useEffect(() => {
    const id = setTimeout(loadTickets, searchTerm ? 300 : 0)
    return () => clearTimeout(id)
  }, [statusFilter, searchTerm])

  const buildFilters = () => ({
    client_unique_id: clientUniqueId,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(searchTerm ? { search: searchTerm } : {})
  })

  const loadTickets = async () => {
    try {
      if (isInitialMount.current) {
        setLoading(true)
      } else {
        setTableLoading(true)
      }
      setCurrentPage(1)

      const filters = buildFilters()

      if (isInitialMount.current) {
        const stored = localStorage.getItem('iFilter_userData')
        if (stored) {
          try { setCurrentUser(JSON.parse(stored)) } catch {}
        }
        const [ticketsRes, usersRes, userRes] = await Promise.all([
          apiClient.getTicketsWithDetails(1, itemsPerPage, filters),
          apiClient.getUsers(),
          apiClient.getCurrentUser()
        ])
        if (ticketsRes.success) {
          setTickets(ticketsRes.data?.data || ticketsRes.data || [])
          setHasMore(ticketsRes.data?.pagination?.has_more || false)
        }
        if (usersRes.success) setUsers(usersRes.data)
        if (userRes.success && userRes.user) setCurrentUser(userRes.user)
        isInitialMount.current = false
      } else {
        const res = await apiClient.getTicketsWithDetails(1, itemsPerPage, filters)
        if (res.success) {
          setTickets(res.data?.data || res.data || [])
          setHasMore(res.data?.pagination?.has_more || false)
        }
      }
    } catch (err) {
      toast.error('שגיאה בטעינת פניות')
      console.error(err)
    } finally {
      setLoading(false)
      setTableLoading(false)
    }
  }

  const loadMoreTickets = async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      const res = await apiClient.getTicketsWithDetails(nextPage, itemsPerPage, buildFilters())
      if (res.success) {
        setTickets(prev => [...prev, ...(res.data?.data || res.data || [])])
        setHasMore(res.data?.pagination?.has_more || false)
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleTicketUpdate = (ticketId, updateType, updateData) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id !== ticketId) return ticket
      switch (updateType) {
        case 'message_added':
          return { ...ticket, update_count: (parseInt(ticket.update_count) + 1).toString(), last_update: updateData.created_at }
        case 'closed':
          return { ...ticket, status: 'closed', closed_at: new Date().toISOString() }
        case 'assigned':
          return { ...ticket, assigned_to: updateData.assigned_to, assigned_user_name: updateData.assigned_user_name }
        default:
          return ticket
      }
    }))
  }

  const handleTicketClick = (ticket) => {
    openModal({
      layout: 'ticketDialog',
      title: `פנייה #${ticket.id} - ${getHebrewSubject(ticket.subject)}`,
      size: 'xl',
      data: { ticket, currentUser, users, onTicketUpdate: handleTicketUpdate, onClose: closeModal },
      closeOnBackdropClick: true,
      closeOnEscape: true
    })
  }

  const handleCloseTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId)
    openModal({
      layout: 'confirmAction',
      title: 'סגירת פנייה',
      size: 'sm',
      data: {
        message: 'האם אתה בטוח שברצונך לסגור את הפנייה?',
        description: ticket ? `פנייה #${ticketId} - ${ticket.subject}` : `פנייה #${ticketId}`,
        warningText: 'ניתן לפתוח את הפנייה מחדש במידת הצורך',
        variant: 'success'
      },
      confirmText: 'סגור פנייה',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onConfirm: async () => {
        try {
          const res = await apiClient.closeTicket(ticketId)
          if (res.success) {
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed', closed_at: new Date().toISOString() } : t))
            toast.success('הפנייה נסגרה בהצלחה')
          }
          closeModal()
        } catch {
          toast.error('שגיאה בסגירת הפנייה')
          closeModal()
        }
      }
    })
  }

  const handleDeleteTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId)
    openModal({
      layout: 'confirmAction',
      title: 'מחיקת פנייה',
      size: 'sm',
      data: {
        message: 'האם אתה בטוח שברצונך למחוק את הפנייה?',
        description: ticket ? `פנייה #${ticketId} - ${ticket.subject}` : `פנייה #${ticketId}`,
        warningText: 'פעולה זו אינה ניתנת לביטול!',
        variant: 'danger'
      },
      confirmText: 'מחק פנייה',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onConfirm: async () => {
        try {
          const res = await apiClient.deleteTicket(ticketId)
          if (res.success) {
            setTickets(prev => prev.filter(t => t.id !== ticketId))
            toast.success('הפנייה נמחקה בהצלחה')
          }
          closeModal()
        } catch {
          toast.error('שגיאה במחיקת הפנייה')
          closeModal()
        }
      }
    })
  }

  const getResponseStatus = (ticket) => {
    if (ticket.status === 'closed') return null
    const lastFromClient = ticket.last_message_sender_type === 'client'
    const hasUnread = parseInt(ticket.unread_count) > 0
    const waitingHours = parseInt(ticket.waiting_time_hours) || 0
    if (lastFromClient || hasUnread) {
      if (waitingHours >= 24) {
        return { label: 'דחוף', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, time: waitingHours }
      }
      return { label: 'צריך מענה', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, time: waitingHours }
    }
    return { label: 'ממתין לתגובה', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User, time: null }
  }

  const formatWaitingTime = (hours) => {
    if (!hours) return ''
    if (hours < 1) return 'פחות משעה'
    if (hours < 24) return `${hours} שע׳`
    const days = Math.floor(hours / 24)
    return `${days} ${days === 1 ? 'יום' : 'ימים'}`
  }

  const getRowClassName = (row) => {
    if (row.status === 'closed') return ''
    const waitingHours = parseInt(row.waiting_time_hours) || 0
    if (row.last_message_sender_type === 'client' && waitingHours >= 24) return 'bg-red-50 hover:bg-red-100'
    if (row.last_message_sender_type === 'client') return 'bg-amber-50 hover:bg-amber-100'
    return ''
  }

  const tableColumns = [
    {
      id: 'id', key: 'id', label: 'מס׳', type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{row.id}</span>
      )
    },
    {
      id: 'subject', key: 'subject', label: 'נושא', type: 'custom',
      render: (row) => (
        <span className="font-medium text-gray-900">{getHebrewSubject(row.subject)}</span>
      )
    },
    {
      id: 'last_activity', key: 'last_update', label: 'פעילות אחרונה', type: 'custom',
      render: (row) => {
        const relative = formatRelativeTime(row.last_update)
        const sender = row.last_message_sender_type
        const total = parseInt(row.update_count) || 0
        const unread = parseInt(row.unread_count) || 0
        if (!relative) return <span className="text-gray-400 text-xs">—</span>
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{relative}</span>
              {sender && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  sender === 'client' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {sender === 'client' ? 'לקוח' : 'נציג'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>({total} הודעות)</span>
              {unread > 0 && <span className="text-red-500 font-medium">· {unread} חדשות</span>}
            </div>
          </div>
        )
      }
    },
    {
      id: 'response_status', key: 'response_status', label: 'סטטוס מענה', type: 'custom',
      render: (row) => {
        const rs = getResponseStatus(row)
        if (!rs) return <span className="text-gray-400 text-xs">—</span>
        const Icon = rs.icon
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${rs.color}`}>
              <Icon className="w-3 h-3 ml-1" />
              {rs.label}
            </span>
            {rs.time > 0 && <span className="text-xs text-gray-500">{formatWaitingTime(rs.time)}</span>}
          </div>
        )
      }
    },
    {
      id: 'points_spent', key: 'points_spent', label: 'נקודות', type: 'custom',
      render: (row) => {
        const pts = parseInt(row.points_spent) || 0
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              pts > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <Star className="w-3 h-3" />
              {pts}
            </span>
          </div>
        )
      }
    },
    {
      id: 'actions', key: 'actions', label: 'פעולות', type: 'custom',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => e.stopPropagation()}
            data-tooltip-id={`client-ticket-menu-${row.id}`}
            data-tooltip-place="bottom"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="תפריט פעולות"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          <Tooltip
            id={`client-ticket-menu-${row.id}`}
            clickable
            openOnClick
            closeOnScroll
            style={{
              backgroundColor: 'white', color: '#1f2937', borderRadius: '12px',
              padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb', zIndex: 10000
            }}
          >
            <div className="flex flex-col gap-1 min-w-[140px]" dir="rtl">
              {row.status === 'open' && (
                <RoleGuard allowedPermissions={[PERMISSIONS.CLOSE_TICKET]}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCloseTicket(row.id) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors text-right w-full"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>סגור פנייה</span>
                  </button>
                </RoleGuard>
              )}
              <RoleGuard allowedPermissions={[PERMISSIONS.DELETE_TICKET]}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTicket(row.id) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors text-right w-full"
                >
                  <Trash className="w-4 h-4" />
                  <span>מחק פנייה</span>
                </button>
              </RoleGuard>
            </div>
          </Tooltip>
        </div>
      )
    }
  ]

  const openCount = tickets.filter(t => t.status === 'open').length
  const closedCount = tickets.filter(t => t.status === 'closed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">טוען פניות...</span>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          <Toggle
            options={[
              { id: 'all', label: 'הכל', count: tickets.length, icon: <MessageCircle className="w-4 h-4" /> },
              { id: 'open', label: 'פתוחות', count: openCount, icon: <AlertCircle className="w-4 h-4" /> },
              { id: 'closed', label: 'סגורות', count: closedCount, icon: <CheckCircle className="w-4 h-4" /> }
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}
            toggleStyle="tabs"
          />
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="חפש לפי נושא..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {tableLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center min-h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">מעדכן נתונים...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">אין פניות להצגה</p>
        </div>
      ) : (
        <Table
          tableConfig={{ columns: tableColumns, data: tickets, onRowClick: handleTicketClick, tableType: 'tickets' }}
          onLoadMore={loadMoreTickets}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader={true}
          getRowClassName={getRowClassName}
        />
      )}
    </div>
  )
}

export default ClientTicketsTab
