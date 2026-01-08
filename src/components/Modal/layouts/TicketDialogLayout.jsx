import React, { forwardRef, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import apiClient from '../../../utils/api'
import AttachmentPreview from '../../AttachmentPreview'
import {
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Archive,
  UserCheck,
  ExternalLink,
  Edit2,
  X,
  Save,
  Paperclip,
  Loader
} from 'lucide-react'

/**
 * Message Bubble Component
 */
const MessageBubble = ({
  update,
  currentUser,
  editingMessageId,
  editedMessageText,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditedMessageChange,
  formatDate
}) => {
  const isFromAdmin = update.sender_type === 'user'
  const isEditing = editingMessageId === update.id
  const canEdit = isFromAdmin && currentUser && update.updated_by === currentUser.id

  return (
    <div className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
        isFromAdmin
          ? 'bg-purple-600 text-white ml-4'
          : 'bg-gray-100 text-gray-900 mr-4'
      }`}>
        <div className="flex items-start justify-between mb-1">
          <div className="text-sm font-medium">
            {update.sender_name}
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => onStartEdit(update)}
              className={`p-1 rounded hover:bg-opacity-20 hover:bg-white transition-colors ${
                isFromAdmin ? 'text-purple-100 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
              data-tooltip-id="edit-tooltip"
              data-tooltip-content="ערוך הודעה"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedMessageText}
              onChange={(e) => onEditedMessageChange(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              disabled={savingEdit}
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSaveEdit(update.id)}
                disabled={!editedMessageText.trim() || savingEdit}
                className="px-3 py-1.5 bg-white text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center space-x-reverse space-x-1"
              >
                {savingEdit ? (
                  <>
                    <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>שומר...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>שמור</span>
                  </>
                )}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={savingEdit}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center space-x-reverse space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>ביטול</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {update.message}
            </div>

            {/* Display attachments if any */}
            {update.attachments && update.attachments.length > 0 && (
              <div className="mt-3">
                <AttachmentPreview attachments={update.attachments} compact={true} />
              </div>
            )}

            <div className={`text-xs mt-2 flex items-center justify-between ${
              isFromAdmin ? 'text-purple-100' : 'text-gray-500'
            }`}>
              <span>{formatDate(update.created_at)}</span>
              {update.updated_at && update.updated_at !== update.created_at && (
                <span className="text-xs opacity-75">(נערך)</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Ticket Dialog Layout
 *
 * Used for viewing and responding to customer tickets
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'ticketDialog',
 *   title: `פנייה #${ticket.id} - ${ticket.subject}`,
 *   size: 'xl',
 *   data: {
 *     ticket: ticketObject,
 *     currentUser: currentUserObject,
 *     users: usersArray,
 *     onTicketUpdate: (ticketId, updateType, updateData) => { ... }
 *   }
 * })
 */
export const TicketDialogLayout = forwardRef(({ data }, ref) => {
  const navigate = useNavigate()
  const { ticket, currentUser, users = [], onTicketUpdate, onClose } = data || {}

  const [ticketUpdates, setTicketUpdates] = useState([])
  const [ticketAttachments, setTicketAttachments] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editedMessageText, setEditedMessageText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (ticket) {
      loadTicketUpdates()
      markTicketAsRead()
    }
  }, [ticket])

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
        // Handle new response structure with updates and ticket_attachments
        if (response.data.updates) {
          setTicketUpdates(response.data.updates)
          setTicketAttachments(response.data.ticket_attachments || [])
        } else {
          // Fallback for old response format
          setTicketUpdates(response.data)
        }
      }
    } catch (err) {
      console.error('Error loading ticket updates:', err)
      toast.error('שגיאה בטעינת ההודעות')
    } finally {
      setLoading(false)
    }
  }

  const markTicketAsRead = async () => {
    if (!ticket) return

    try {
      await apiClient.markTicketAsRead(ticket.id)
    } catch (err) {
      console.error('Error marking ticket as read:', err)
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !ticket || !currentUser || sending) return

    try {
      setSending(true)

      let updateId = null

      // Send message if there's text
      if (newMessage.trim()) {
        const response = await apiClient.addTicketUpdate(
          ticket.id,
          newMessage.trim(),
          currentUser.id,
          'user'
        )

        if (response.success) {
          updateId = response.data.id
          setTicketUpdates(prev => [...prev, response.data])
          setNewMessage('')

          // Notify parent component about the update
          if (onTicketUpdate) {
            onTicketUpdate(ticket.id, 'message_added', response.data)
          }
        } else {
          throw new Error(response.message || 'Failed to send message')
        }
      }

      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        await handleFileUpload(updateId)
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
        if (onClose) {
          onClose()
        }
        toast.success('הפנייה נסגרה בהצלחה')
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
        toast.success('הפנייה הוקצתה בהצלחה')
      }
    } catch (err) {
      toast.error('שגיאה בהקצאת הפנייה')
      console.error('Error assigning ticket:', err)
    }
  }

  const handleStartEdit = (update) => {
    setEditingMessageId(update.id)
    setEditedMessageText(update.message)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditedMessageText('')
  }

  const handleSaveEdit = async (updateId) => {
    if (!editedMessageText.trim() || !currentUser) return

    try {
      setSavingEdit(true)
      const response = await apiClient.editTicketUpdate(updateId, editedMessageText.trim(), currentUser.id)

      if (response.success) {
        setTicketUpdates(prev => prev.map(update =>
          update.id === updateId ? response.data : update
        ))
        setEditingMessageId(null)
        setEditedMessageText('')
        toast.success('ההודעה נערכה בהצלחה')
      } else {
        throw new Error(response.message || 'Failed to edit message')
      }
    } catch (err) {
      toast.error('שגיאה בעריכת ההודעה: ' + (err.message || 'אירעה שגיאה לא צפויה'))
      console.error('Error editing message:', err)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (updateId) => {
    if (selectedFiles.length === 0) return

    try {
      setUploadingFiles(true)

      // Upload all selected files
      const uploadPromises = selectedFiles.map(file =>
        apiClient.uploadTicketAttachment(ticket.id, file, updateId)
      )

      await Promise.all(uploadPromises)

      // Clear selected files
      setSelectedFiles([])

      // Reload ticket updates to show new attachments
      await loadTicketUpdates()

      toast.success('הקבצים הועלו בהצלחה')
    } catch (err) {
      console.error('Error uploading files:', err)
      toast.error('שגיאה בהעלאת הקבצים')
    } finally {
      setUploadingFiles(false)
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

  if (!ticket) return null

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Ticket Header */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center space-x-1.5">
                <span>לקוח:</span>
                {ticket.client_unique_id ? (
                  <button
                    onClick={() => {
                      navigate(`/clients/${ticket.client_unique_id}`)
                      if (onClose) onClose()
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center space-x-reverse space-x-1 transition-colors"
                    data-tooltip-id="client-link-tooltip"
                    data-tooltip-content="עבור לעמוד הלקוח"
                  >
                    <span>{ticket.client_name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="font-medium">{ticket.client_name}</span>
                )}
              </div>
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

          {/* Display ticket-level attachments */}
          {ticketAttachments && ticketAttachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">קבצים מצורפים:</h4>
              <AttachmentPreview attachments={ticketAttachments} />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-25" style={{ maxHeight: '400px' }}>
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
              <MessageBubble
                key={update.id}
                update={update}
                currentUser={currentUser}
                editingMessageId={editingMessageId}
                editedMessageText={editedMessageText}
                savingEdit={savingEdit}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onEditedMessageChange={setEditedMessageText}
                formatDate={formatDate}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input (only for open tickets) */}
      {ticket.status === 'open' && (
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3">
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-reverse space-x-2 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <Paperclip className="w-4 h-4 text-purple-600" />
                    <span className="max-w-[150px] truncate text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      disabled={sending || uploadingFiles}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                      sending || uploadingFiles
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    rows={3}
                    disabled={sending || uploadingFiles}
                  />
                  {(sending || uploadingFiles) && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center">
                      <div className="text-sm text-purple-600 flex items-center">
                        <Loader className="w-4 h-4 ml-2 animate-spin" />
                        {uploadingFiles ? 'מעלה קבצים...' : 'שולח הודעה...'}
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
                  {(newMessage.trim() || selectedFiles.length > 0) && (
                    <div className="text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      מוכן לשליחה
                    </div>
                  )}
                </div>
              </div>

              {/* File Attach Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploadingFiles}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="צרף קובץ"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploadingFiles}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center min-w-[100px] justify-center ${
                  (!newMessage.trim() && selectedFiles.length === 0) || sending || uploadingFiles
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {sending || uploadingFiles ? (
                  <>
                    <Loader className="w-4 h-4 ml-1 animate-spin" />
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
          </div>
        </div>
      )}

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
      <Tooltip
        id="client-link-tooltip"
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
      <Tooltip
        id="edit-tooltip"
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
    </div>
  )
})

TicketDialogLayout.displayName = 'TicketDialogLayout'
