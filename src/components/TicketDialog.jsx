import { useState, useEffect, useRef } from 'react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import { Modal } from './Modal/Modal'
import apiClient from '../utils/api'
import { 
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Archive,
  UserCheck
} from 'lucide-react'

export const TicketDialog = ({ 
  isOpen, 
  onClose, 
  ticket, 
  currentUser, 
  users = [],
  onTicketUpdate 
}) => {
  const [ticketUpdates, setTicketUpdates] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && ticket) {
      loadTicketUpdates()
    }
  }, [isOpen, ticket])

  useEffect(() => {
    scrollToBottom()
  }, [ticketUpdates])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadTicketUpdates = async () => {
    if (!ticket) return
    
    try {
      setLoading(true)
      const response = await apiClient.getTicketUpdates(ticket.id)
      if (response.success) {
        setTicketUpdates(response.data)
      }
    } catch (err) {
      console.error('Error loading ticket updates:', err)
      toast.error('שגיאה בטעינת ההודעות')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !currentUser || sending) return

    try {
      setSending(true)
      
      const response = await apiClient.addTicketUpdate(
        ticket.id,
        newMessage.trim(),
        currentUser.id,
        'user'
      )

      if (response.success) {
        setTicketUpdates(prev => [...prev, response.data])
        setNewMessage('')
        
        // Notify parent component about the update
        if (onTicketUpdate) {
          onTicketUpdate(ticket.id, 'message_added', response.data)
        }
      } else {
        throw new Error(response.message || 'Failed to send message')
      }
    } catch (err) {
      toast.error('שגיאה בשליחת ההודעה: ' + (err.message || 'אירעה שגיאה לא צפויה'))
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!ticket) return
    
    try {
      const response = await apiClient.closeTicket(ticket.id)
      if (response.success) {
        if (onTicketUpdate) {
          onTicketUpdate(ticket.id, 'closed')
        }
        onClose() // Close the dialog
      }
    } catch (err) {
      toast.error('שגיאה בסגירת הפנייה')
      console.error('Error closing ticket:', err)
    }
  }

  const handleAssignTicket = async (userId) => {
    if (!ticket) return
    
    try {
      const response = await apiClient.assignTicket(ticket.id, userId)
      if (response.success) {
        const assignedUser = users.find(user => user.id === userId)
        if (onTicketUpdate) {
          onTicketUpdate(ticket.id, 'assigned', { 
            assigned_to: userId, 
            assigned_user_name: assignedUser?.username 
          })
        }
      }
    } catch (err) {
      toast.error('שגיאה בהקצאת הפנייה')
      console.error('Error assigning ticket:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const MessageBubble = ({ update }) => {
    const isFromAdmin = update.user_type === 'user'
    
    return (
      <div className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isFromAdmin 
            ? 'bg-purple-600 text-white ml-4' 
            : 'bg-gray-100 text-gray-900 mr-4'
        }`}>
          <div className="text-sm font-medium mb-1">
            {update.sender_name}
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {update.message}
          </div>
          <div className={`text-xs mt-2 ${
            isFromAdmin ? 'text-purple-100' : 'text-gray-500'
          }`}>
            {formatDate(update.created_at)}
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) return null

  const modalFooter = ticket.status === 'open' ? (
    <div className="flex items-end space-x-reverse space-x-3">
      <div className="flex-1">
        <div className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="כתוב תגובה... (לחץ Enter לשליחה, Shift+Enter לשורה חדשה)"
            className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 ${
              sending 
                ? 'border-purple-300 bg-purple-50' 
                : 'border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            }`}
            rows={3}
            disabled={sending}
          />
          {sending && (
            <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center">
              <div className="text-sm text-purple-600 flex items-center">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin ml-2" />
                שולח הודעה...
              </div>
            </div>
          )}
        </div>
        
        {/* Character counter and help text */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-reverse space-x-4">
            <span>תווים: {newMessage.length}</span>
            <span>Enter = שלח, Shift+Enter = שורה חדשה</span>
          </div>
          {newMessage.trim() && (
            <div className="text-green-600 flex items-center">
              <CheckCircle className="w-3 h-3 ml-1" />
              מוכן לשליחה
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={handleSendMessage}
        disabled={!newMessage.trim() || sending}
        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center min-w-[100px] justify-center ${
          !newMessage.trim() || sending
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        {sending ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin ml-1" />
            שולח...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 ml-1" />
            שלח
          </>
        )}
      </button>
    </div>
  ) : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`פנייה #${ticket.id} - ${ticket.subject}`}
      size="xl"
      footer={modalFooter}
      bodyClassName="p-0"
      footerClassName="bg-gray-50"
    >
      <div className="flex flex-col h-full max-h-[60vh]" dir="rtl">
        {/* Ticket Header */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-reverse space-x-4 text-sm text-gray-600 mb-2">
                <span>לקוח: {ticket.client_name}</span>
                <span>נפתח: {formatDate(ticket.created_at)}</span>
                {ticket.assigned_user_name && (
                  <span>מוקצה ל: {ticket.assigned_user_name}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-2">
              {ticket.status === 'open' && (
                <>
                  {/* Assign Dropdown */}
                  <select
                    onChange={(e) => e.target.value && handleAssignTicket(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="">הקצה לעובד</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  
                  {/* Close Button */}
                  <button
                    onClick={handleCloseTicket}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                    data-tooltip-id="close-ticket-tooltip"
                    data-tooltip-content="סגור פנייה"
                  >
                    <CheckCircle className="w-4 h-4 ml-1" />
                    סגור
                  </button>
                </>
              )}
              
              {ticket.status === 'closed' && (
                <div className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  <Archive className="w-4 h-4 ml-1" />
                  פנייה סגורה
                </div>
              )}
            </div>
          </div>
          
          {/* Ticket Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-25">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">טוען הודעות...</span>
              </div>
            </div>
          ) : (
            <>
              {ticketUpdates.map(update => (
                <MessageBubble key={update.id} update={update} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

      </div>

      {/* Tooltips */}
      <Tooltip
        id="close-ticket-tooltip"
        style={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10000
        }}
      />
    </Modal>
  )
}