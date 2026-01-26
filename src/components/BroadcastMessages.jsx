import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { useUser } from '../contexts/GlobalStateContext'
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react'

const BroadcastMessages = () => {
  const { openModal, closeModal } = useGlobalState()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  // Track if this is the initial mount
  const isInitialMount = useRef(true)

  // Load messages
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isInitialMount.current) {
          setInitialLoading(true)
        } else {
          setTableLoading(true)
        }

        setCurrentPage(1)

        const response = await apiClient.getBroadcastMessagesWithDetails(1, itemsPerPage, {
          sort: sortColumn,
          order: sortDirection
        })

        if (response.success) {
          const responseData = response.data?.data || response.data || []
          const pagination = response.data?.pagination

          setMessages(responseData)
          setHasMore(pagination?.has_more || false)
        }

        isInitialMount.current = false
      } catch (error) {
        console.error('Error loading messages:', error)
        toast.error('שגיאה בטעינת ההודעות')
      } finally {
        setInitialLoading(false)
        setTableLoading(false)
      }
    }

    loadData()
  }, [sortColumn, sortDirection])

  // Load more for pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const response = await apiClient.getBroadcastMessagesWithDetails(nextPage, itemsPerPage, {
        sort: sortColumn,
        order: sortDirection
      })

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setMessages((prev) => [...prev, ...responseData])
        setCurrentPage(nextPage)
        setHasMore(pagination?.has_more || false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('שגיאה בטעינת הודעות נוספות')
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle sort change
  const handleSortChange = (column, direction) => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  // Create new message
  const handleCreateMessage = () => {
    openModal({
      layout: 'broadcastMessage',
      title: 'שדר הודעה חדשה',
      size: 'lg',
      data: {
        message: null,
        onSave: async (messageData) => {
          await apiClient.createBroadcastMessage(messageData)
          // Reload messages
          const response = await apiClient.getBroadcastMessagesWithDetails(1, itemsPerPage, {
            sort: sortColumn,
            order: sortDirection
          })
          if (response.success) {
            setMessages(response.data?.data || response.data || [])
            setCurrentPage(1)
          }
        }
      },
      confirmText: 'שדר',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true
    })
  }

  // Edit message
  const handleEditMessage = (message) => {
    openModal({
      layout: 'broadcastMessage',
      title: 'ערוך הודעה',
      size: 'lg',
      data: {
        message: message,
        onSave: async (messageData) => {
          await apiClient.updateBroadcastMessage(message.id, messageData)
          // Reload messages
          const response = await apiClient.getBroadcastMessagesWithDetails(1, itemsPerPage, {
            sort: sortColumn,
            order: sortDirection
          })
          if (response.success) {
            setMessages(response.data?.data || response.data || [])
            setCurrentPage(1)
          }
        }
      },
      confirmText: 'שמור',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true
    })
  }

  // Delete message
  const handleDeleteMessage = (message) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת הודעה',
      data: {
        itemName: message.title,
        message: 'האם אתה בטוח שברצונך למחוק הודעה זו?'
      },
      confirmText: 'מחק',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      onConfirm: async () => {
        try {
          await apiClient.deleteBroadcastMessage(message.id)
          closeModal()
          toast.success('ההודעה נמחקה בהצלחה')
          // Reload messages
          const response = await apiClient.getBroadcastMessagesWithDetails(1, itemsPerPage, {
            sort: sortColumn,
            order: sortDirection
          })
          if (response.success) {
            setMessages(response.data?.data || response.data || [])
            setCurrentPage(1)
          }
        } catch (error) {
          console.error('Error deleting message:', error)
          toast.error('שגיאה במחיקת ההודעה')
          closeModal()
        }
      }
    })
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if message is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // Render message card
  const MessageCard = ({ message }) => {
    const expired = isExpired(message.expiry_date)
    const isActive = message.is_active && !expired

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        {/* Header with status and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{message.title}</h3>
              {isActive ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  פעיל
                </span>
              ) : expired ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  פג תוקף
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  לא פעיל
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditMessage(message)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="ערוך"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteMessage(message)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="מחק"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message content */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{message.message}</p>
        </div>

        {/* Footer with metadata */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>נוצר ב: {formatDate(message.created_at)}</span>
          </div>

          {message.expiry_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className={expired ? 'text-red-500 font-medium' : ''}>
                תפוגה: {formatDate(message.expiry_date)}
              </span>
            </div>
          )}

          {message.sent_by_admin_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>נשלח על ידי: {message.sent_by_admin_name}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">טוען הודעות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">הודעות משודרות</h1>
              <p className="text-sm text-gray-600">
                ניהול הודעות לכלל המשתמשים במערכת
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMessage}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>הודעה חדשה</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {tableLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הודעות עדיין</h3>
            <p className="text-gray-600 mb-6">צור הודעה חדשה כדי להתחיל</p>
            <button
              onClick={handleCreateMessage}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>צור הודעה ראשונה</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'טוען...' : 'טען עוד הודעות'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BroadcastMessages
