import { useState, useEffect } from 'react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { Toggle } from './Toggle'
import { RoleGuard, SuperAdminOnly } from './RoleGuard'
import { usePermissions } from '../hooks/usePermissions'
import { useGlobalState } from '../contexts/GlobalStateContext'
import {
  MessageCircle,
  Search,
  Filter,
  Plus,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  X,
  Bell,
  MoreVertical,
  Trash
} from 'lucide-react'

const TicketsTable = () => {
  // Global modal state
  const { openModal, closeModal } = useGlobalState()

  // Role-based permissions
  const { hasPermission, isCommunityManager, PERMISSIONS } = usePermissions()

  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    open: 0,
    closed: 0,
    unassigned: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [sortBy, setSortBy] = useState('last_update')
  const [sortOrder, setSortOrder] = useState('DESC')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload data when filters or sorting change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFilteredData()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [statusFilter, searchTerm, sortBy, sortOrder])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Get user data from localStorage as fallback
      const storedUserData = localStorage.getItem('userData')
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          setCurrentUser(userData)
        } catch (e) {
          console.error('Error parsing stored user data:', e)
        }
      }
      
      const [ticketsResponse, usersResponse, currentUserResponse] = await Promise.all([
        apiClient.getTicketsWithDetails(1, itemsPerPage),
        apiClient.getUsers(),
        apiClient.getCurrentUser()
      ])

      if (ticketsResponse.success) {
        const responseData = ticketsResponse.data?.data || ticketsResponse.data || []
        const pagination = ticketsResponse.data?.pagination
        
        setTickets(responseData)
        setHasMore(pagination?.has_more || false)
        updateFilterCounts()
      }

      if (usersResponse.success) {
        setUsers(usersResponse.data)
      }

      if (currentUserResponse.success && currentUserResponse.user) {
        setCurrentUser(currentUserResponse.user)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFilteredData = async () => {
    try {
      setLoading(true)
      setCurrentPage(1)

      const filters = {
        status: statusFilter,
        search: searchTerm,
        sort: sortBy,
        order: sortOrder
      }

      const response = await apiClient.getTicketsWithDetails(1, itemsPerPage, filters)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setTickets(responseData)
        setHasMore(pagination?.has_more || false)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading filtered data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreTickets = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const filters = {
        status: statusFilter,
        search: searchTerm,
        sort: sortBy,
        order: sortOrder
      }

      const response = await apiClient.getTicketsWithDetails(nextPage, itemsPerPage, filters)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        // Append new tickets to existing ones
        setTickets(prev => [...prev, ...responseData])
        setHasMore(pagination?.has_more || false)
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error('Error loading more tickets:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleTicketClick = (ticket) => {
    const getHebrewSubject = (subject) => {
      switch (subject) {
        case 'app_upload':
          return 'העלאת אפליקציה'
        case 'report':
          return 'דיווח'
        case 'other':
          return 'אחר'
        default:
          return subject
      }
    }

    openModal({
      layout: 'ticketDialog',
      title: `פנייה #${ticket.id} - ${getHebrewSubject(ticket.subject)}`,
      size: 'xl',
      data: {
        ticket,
        currentUser,
        users,
        onTicketUpdate: handleTicketUpdate,
        onClose: closeModal
      },
      closeOnBackdropClick: true,
      closeOnEscape: true
    })
  }

  const handleTicketUpdate = (ticketId, updateType, updateData) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        switch (updateType) {
          case 'message_added':
            return {
              ...ticket,
              update_count: (parseInt(ticket.update_count) + 1).toString(),
              last_update: updateData.created_at
            }
          case 'closed':
            return {
              ...ticket,
              status: 'closed',
              closed_at: new Date().toISOString()
            }
          case 'assigned':
            return {
              ...ticket,
              assigned_to: updateData.assigned_to,
              assigned_user_name: updateData.assigned_user_name
            }
          default:
            return ticket
        }
      }
      return ticket
    }))
  }

  const handleAssignTicket = async (ticketId, userId) => {
    try {
      const response = await apiClient.assignTicket(ticketId, userId)
      if (response.success) {
        const assignedUser = users.find(user => user.id === userId)
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, assigned_to: userId, assigned_user_name: assignedUser?.username }
            : ticket
        ))
      }
    } catch (err) {
      toast.error('שגיאה בהקצאת הפנייה')
      console.error('Error assigning ticket:', err)
    }
  }

  const handleCloseTicket = async (ticketId) => {
    try {
      const response = await apiClient.closeTicket(ticketId)
      if (response.success) {
        setTickets(prev => prev.map(ticket =>
          ticket.id === ticketId
            ? { ...ticket, status: 'closed', closed_at: new Date().toISOString() }
            : ticket
        ))
        toast.success('הפנייה נסגרה בהצלחה')
      }
    } catch (err) {
      toast.error('שגיאה בסגירת הפנייה')
      console.error('Error closing ticket:', err)
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    try {
      const response = await apiClient.deleteTicket(ticketId)
      if (response.success) {
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
        toast.success('הפנייה נמחקה בהצלחה')
      }
    } catch (err) {
      toast.error('שגיאה במחיקת הפנייה')
      console.error('Error deleting ticket:', err)
    }
  }

  const updateFilterCounts = async (ticketsData = null) => {
    try {
      // For accurate counts, fetch all tickets without pagination
      const response = await apiClient.getTicketsWithDetails(1, 1000)
      if (response.success) {
        const allTickets = response.data?.data || response.data || []
        const counts = {
          all: allTickets.length,
          open: allTickets.filter(t => t.status === 'open').length,
          closed: allTickets.filter(t => t.status === 'closed').length,
          unassigned: allTickets.filter(t => !t.assigned_user_name && t.status === 'open').length
        }
        setFilterCounts(counts)
      }
    } catch (err) {
      console.error('Error updating filter counts:', err)
      // Fallback to local data if available
      if (ticketsData) {
        const counts = {
          all: ticketsData.length,
          open: ticketsData.filter(t => t.status === 'open').length,
          closed: ticketsData.filter(t => t.status === 'closed').length,
          unassigned: ticketsData.filter(t => !t.assigned_user_name && t.status === 'open').length
        }
        setFilterCounts(counts)
      }
    }
  }

  const handleFilterChange = (filterId) => {
    setStatusFilter(filterId)
    setCurrentPage(1) // Reset pagination when filter changes
  }

  // Helper function to get response status with visual indicators
  const getResponseStatus = (ticket) => {
    // If ticket is closed, no response needed
    if (ticket.status === 'closed') {
      return null
    }

    // Check if awaiting admin response
    const lastMessageFromClient = ticket.last_message_sender_type === 'client'
    const hasUnread = parseInt(ticket.unread_count) > 0
    const waitingHours = parseInt(ticket.waiting_time_hours) || 0

    if (lastMessageFromClient || hasUnread) {
      // Urgent: waiting more than 24 hours
      if (waitingHours >= 24) {
        return {
          status: 'urgent',
          label: 'דחוף',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          time: waitingHours
        }
      }
      // Needs reply: waiting less than 24 hours
      return {
        status: 'needs_reply',
        label: 'צריך מענה',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        time: waitingHours
      }
    }

    // Waiting for client
    return {
      status: 'waiting_client',
      label: 'ממתין לתגובה',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: User,
      time: null
    }
  }

  // Helper function to format waiting time
  const formatWaitingTime = (hours) => {
    if (!hours) return ''

    if (hours < 1) {
      return 'פחות משעה'
    } else if (hours < 24) {
      return `${hours} שעות`
    } else {
      const days = Math.floor(hours / 24)
      return `${days} ${days === 1 ? 'יום' : 'ימים'}`
    }
  }

  // Define table columns
  const tableColumns = [
    {
      id: 'id',
      key: 'id',
      label: 'מספר פנייה',
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
      render: (row) => {
        const getHebrewSubject = (subject) => {
          switch (subject) {
            case 'app_upload':
              return 'העלאת אפליקציה'
            case 'report':
              return 'דיווח'
            case 'other':
              return 'אחר'
            default:
              return subject // fallback to original value
          }
        }
        
        return (
          <div>
            <div className="font-medium text-gray-900">{getHebrewSubject(row.subject)}</div>
          </div>
        )
      }
    },
    {
      id: 'client_name',
      key: 'client_name',
      label: 'לקוח',
      type: 'text',
      render: (row) => (
        <div className="flex items-center   space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {row.client_name?.charAt(0)?.toUpperCase() || 'L'}
            </span>
          </div>
          <span className="font-medium">{row.client_name}</span>
        </div>
      )
    },
    {
      id: 'response_status',
      key: 'response_status',
      label: 'סטטוס מענה',
      type: 'custom',
      render: (row) => {
        const responseStatus = getResponseStatus(row)

        if (!responseStatus) return null

        const StatusIcon = responseStatus.icon

        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${responseStatus.color}`}>
              <StatusIcon className="w-3 h-3 ml-1" />
              {responseStatus.label}
            </span>
            {responseStatus.time && responseStatus.time > 0 && (
              <span className="text-xs text-gray-500">
                {formatWaitingTime(responseStatus.time)}
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: 'status',
      key: 'status',
      label: 'סטטוס',
      type: 'status'
    },
    {
      id: 'update_count',
      key: 'update_count',
      label: 'הודעות',
      type: 'text',
      render: (row) => {
        const unreadCount = parseInt(row.unread_count) || 0;
        const totalCount = parseInt(row.update_count) || 0;

        return (
          <div className="flex items-center justify-center gap-2">
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-medium">
              {totalCount}
            </span>
            {unreadCount > 0 && (
              <div className="relative">
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 animate-pulse">
                  <Bell className="w-3 h-3" />
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      id: 'created_at',
      key: 'created_at',
      label: 'נפתח',
      type: 'date'
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTicket(row.id)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors text-right w-full"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>סגור פנייה</span>
                  </button>
                </RoleGuard>
              )}

              <RoleGuard allowedPermissions={[PERMISSIONS.DELETE_TICKET]}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTicket(row.id)
                  }}
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

  const tableConfig = {
    columns: tableColumns,
    data: tickets, // Now using filtered data from backend
    onRowClick: handleTicketClick,
    tableType: 'tickets'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center   space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען פניות...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center   space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול פניות לקוחות</h1>
              <p className="text-gray-600">טבלת פניות עם אפשרויות מתקדמות</p>
            </div>
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
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === 'closed').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => !t.assigned_user_name).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="space-y-6">
            {/* Toggle Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">סינון פניות</label>
              <Toggle
                options={[
                  { 
                    id: 'all', 
                    label: 'כל הפניות', 
                    count: filterCounts.all,
                    icon: <MessageCircle className="w-4 h-4" />
                  },
                  { 
                    id: 'open', 
                    label: 'פתוחות', 
                    count: filterCounts.open,
                    icon: <AlertCircle className="w-4 h-4" />
                  },
                  { 
                    id: 'unassigned', 
                    label: 'לא מוקצות', 
                    count: filterCounts.unassigned,
                    icon: <User className="w-4 h-4" />
                  },
                  { 
                    id: 'closed', 
                    label: 'סגורות', 
                    count: filterCounts.closed,
                    icon: <CheckCircle className="w-4 h-4" />
                  }
                ]}
                value={statusFilter}
                onChange={handleFilterChange}
                toggleStyle="tabs"
                className="w-full"
              />
            </div>

            {/* Search */}
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
      <Table
        tableConfig={tableConfig}
        onLoadMore={loadMoreTickets}
        hasMore={hasMore}
        loading={loadingMore}
        stickyHeader={true}
        onSelectionChange={setSelectedTickets}
      />

      {/* Selection Actions */}
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="flex items-center   space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedTickets.length} פניות נבחרו
            </span>
            <div className="flex   space-x-2">
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