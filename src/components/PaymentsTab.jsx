import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Filter,
  Download,
  Eye
} from 'lucide-react'

const PaymentsTab = ({ clientUniqueId }) => {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('payment_date')
  const [sortOrder, setSortOrder] = useState('DESC')
  
  const itemsPerPage = 10

  useEffect(() => {
    if (clientUniqueId) {
      loadPayments()
      loadSummary()
    }
  }, [clientUniqueId, sortBy, sortOrder])

  const loadPayments = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const response = await apiClient.getPaymentsByClient(
        clientUniqueId, 
        page, 
        itemsPerPage, 
        sortBy, 
        sortOrder
      )

      if (response.success) {
        const responseData = response.data?.data || []
        const pagination = response.data?.pagination
        
        if (append) {
          setPayments(prev => [...prev, ...responseData])
        } else {
          setPayments(responseData)
        }
        
        setHasMore(pagination?.has_more || false)
        setCurrentPage(page)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת תשלומים')
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await apiClient.getClientPaymentSummary(clientUniqueId)
      
      if (response.success) {
        setSummary(response.data)
      }
    } catch (err) {
      console.error('Error loading payment summary:', err)
    } finally {
      setSummaryLoading(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadPayments(currentPage + 1, true)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')
    } else {
      setSortBy(field)
      setSortOrder('DESC')
    }
    setCurrentPage(1)
    loadPayments(1, false)
  }

  const getStatusConfig = (status) => {
    const configs = {
      paid: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'שולם'
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'בהמתנה'
      },
      failed: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'נכשל'
      },
      refunded: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: RotateCcw,
        label: 'הוחזר'
      }
    }
    return configs[status] || configs.pending
  }

  const formatCurrency = (amount, currency = 'ILS') => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency === 'ILS' ? 'ILS' : currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2" dir="rtl">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">טוען תשלומים...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Payment Summary Cards */}
      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סך תשלומים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_paid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר תשלומים</p>
                <p className="text-2xl font-bold text-gray-900">{summary.successful_payments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ממוצע תשלום</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.average_payment)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center ml-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ממתינים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_pending)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">רשימת תשלומים</h3>
            <div className="flex items-center space-x-2">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="payment_date_DESC">תאריך תשלום (חדש לישן)</option>
                <option value="payment_date_ASC">תאריך תשלום (ישן לחדש)</option>
                <option value="amount_DESC">סכום (גבוה לנמוך)</option>
                <option value="amount_ASC">סכום (נמוך לגבוה)</option>
                <option value="status_ASC">סטטוס</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {payments.length > 0 ? (
            payments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status)
              const StatusIcon = statusConfig.icon

              return (
                <div key={payment.payment_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            <span>{payment.payment_date_formatted}</span>
                          </div>
                          
                          {payment.payment_method && (
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 ml-1" />
                              <span>{payment.payment_method}</span>
                            </div>
                          )}
                          
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.period_start_formatted} - {payment.period_end_formatted}
                            <span className="text-gray-500 mr-1">({payment.period_days} ימים)</span>
                          </div>
                        </div>

                        {payment.payment_reference && (
                          <div className="text-xs text-gray-500 font-mono">
                            מזהה: {payment.payment_reference}
                          </div>
                        )}

                        {payment.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">תקופת שירות</div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.period_days} ימים
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין תשלומים</h3>
              <p className="text-gray-600">טרם בוצעו תשלומים עבור לקוח זה</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>טוען...</span>
                </div>
              ) : (
                'טען עוד תשלומים'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentsTab