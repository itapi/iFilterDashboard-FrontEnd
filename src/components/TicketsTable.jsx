import { useState, useEffect, useCallback, useRef } from 'react'
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
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  MoreVertical,
  Trash,
  Star
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TicketsTable = () => {
  const { openModal, closeModal } = useGlobalState()
  const { hasPermission, PERMISSIONS } = usePermissions()

  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('open')
  const [filterCounts, setFilterCounts] = useState({ all: 0, open: 0, closed: 0, unassigned: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedTickets, setSelectedTickets] = useState([])

  // Sort — empty string = use backend's urgency-first default
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  const isInitialMount = useRef(true)

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const id = setTimeout(loadData, searchTerm ? 300 : 0)
    return () => clearTimeout(id)
  }, [statusFilter, searchTerm, sortBy, sortOrder])

  const buildFilters = () => ({
    status: statusFilter,
    search: searchTerm,
    ...(sortBy ? { sort: sortBy, order: sortOrder } : {})
  })

  const loadData = async () => {
    try {
      if (isInitialMount.current) {
        setInitialLoading(true)
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

        await updateFilterCounts()
        isInitialMount.current = false
      } else {
        const res = await apiClient.getTicketsWithDetails(1, itemsPerPage, filters)
        if (res.success) {
          setTickets(res.data?.data || res.data || [])
          setHasMore(res.data?.pagination?.has_more || false)
        }
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading data:', err)
    } finally {
      setInitialLoading(false)
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
      console.error('Error loading more:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const updateFilterCounts = async () => {
    try {
      const res = await apiClient.getTicketsWithDetails(1, 555)
      if (res.success) {
        const all = res.data?.data || res.data || []
        setFilterCounts({
          all: all.length,
          open: all.filter(t => t.status === 'open').length,
          closed: all.filter(t => t.status === 'closed').length,
          unassigned: all.filter(t => !t.assigned_user_name && t.status === 'open').length
        })
      }
    } catch (err) {
      console.error('Error updating filter counts:', err)
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

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
            updateFilterCounts()
          }
          closeModal()
        } catch (err) {
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
            updateFilterCounts()
          }
          closeModal()
        } catch (err) {
          toast.error('שגיאה במחיקת הפנייה')
          closeModal()
        }
      }
    })
  }

  const handleFilterChange = (filterId) => {
    setStatusFilter(filterId)
    setCurrentPage(1)
  }

  const handleSortChange = (column, direction) => {
    setSortBy(column)
    setSortOrder(direction.toUpperCase())
  }

  // ---------------------------------------------------------------------------
  // Row urgency styling
  // ---------------------------------------------------------------------------

  const getRowClassName = (row) => {
    if (row.status === 'closed') return ''
    const waitingHours = parseInt(row.waiting_time_hours) || 0
    if (row.last_message_sender_type === 'client' && waitingHours >= 24) {
      return 'bg-red-50 hover:bg-red-100'
    }
    if (row.last_message_sender_type === 'client') {
      return 'bg-amber-50 hover:bg-amber-100'
    }
    return ''
  }

  // ---------------------------------------------------------------------------
  // Response status helper (for badge column)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const tableColumns = [
    {
      id: 'id',
      key: 'id',
      label: 'מס׳',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          #{row.id}
        </span>
      )
    },
    {
      id: 'subject',
      key: 'subject',
      label: 'נושא',
      type: 'custom',
      render: (row) => (
        <span className="font-medium text-gray-900">{getHebrewSubject(row.subject)}</span>
      )
    },
    {
      id: 'client_name',
      key: 'client_name',
      label: 'לקוח',
      type: 'custom',
      render: (row) => (
        <span className="text-sm text-gray-800">{row.client_name}</span>
      )
    },
    {
      id: 'last_activity',
      key: 'last_update',
      label: 'פעילות אחרונה',
      type: 'custom',
      sortable: true,
      sortKey: 'last_update',
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
              {unread > 0 && (
                <span className="text-red-500 font-medium">· {unread} חדשות</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      id: 'response_status',
      key: 'response_status',
      label: 'סטטוס מענה',
      type: 'custom',
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
            {rs.time > 0 && (
              <span className="text-xs text-gray-500">{formatWaitingTime(rs.time)}</span>
            )}
          </div>
        )
      }
    },
    {
      id: 'points_spent',
      key: 'points_spent',
      label: 'נקודות',
      type: 'custom',
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
      id: 'actions',
      key: 'actions',
      label: 'פעולות',
      type: 'custom',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => e.stopPropagation()}
            data-tooltip-id={`ticket-menu-${row.id}`}
            data-tooltip-place="bottom"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="תפריט פעולות"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          <Tooltip
            id={`ticket-menu-${row.id}`}
            clickable
            openOnClick
            closeOnScroll
            style={{
              backgroundColor: 'white',
              color: '#1f2937',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb',
              zIndex: 10000
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">טוען פניות...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול פניות לקוחות</h1>
            <p className="text-gray-600">ממוין לפי דחיפות — פניות ממתינות למענה קודם</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סך הכל פניות</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.all}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">פניות פתוחות</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ml-4">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">פניות סגורות</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.closed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center ml-4">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">לא מוקצות</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.unassigned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgency legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span>מקרא:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-200 inline-block" />
            מחכה מעל 24 שעות
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-200 inline-block" />
            ממתין למענה
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">סינון פניות</label>
              <Toggle
                options={[
                  { id: 'all', label: 'כל הפניות', count: filterCounts.all, icon: <MessageCircle className="w-4 h-4" /> },
                  { id: 'open', label: 'פתוחות', count: filterCounts.open, icon: <AlertCircle className="w-4 h-4" /> },
                  { id: 'unassigned', label: 'לא מוקצות', count: filterCounts.unassigned, icon: <User className="w-4 h-4" /> },
                  { id: 'closed', label: 'סגורות', count: filterCounts.closed, icon: <CheckCircle className="w-4 h-4" /> }
                ]}
                value={statusFilter}
                onChange={handleFilterChange}
                toggleStyle="tabs"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="חפש לפי נושא, לקוח או תיאור..."
                />
              </div>
            </div>
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
      ) : (
        <Table
          tableConfig={{ columns: tableColumns, data: tickets, onRowClick: handleTicketClick, tableType: 'tickets' }}
          onLoadMore={loadMoreTickets}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader={true}
          onSelectionChange={setSelectedTickets}
          getRowClassName={getRowClassName}
          onSortChange={handleSortChange}
          sortColumn={sortBy || null}
          sortDirection={sortOrder ? sortOrder.toLowerCase() : 'desc'}
        />
      )}

      {/* Bulk selection bar */}
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{selectedTickets.length} פניות נבחרו</span>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                הקצה בבת אחת
              </button>
              <button className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                סגור הכל
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketsTable
