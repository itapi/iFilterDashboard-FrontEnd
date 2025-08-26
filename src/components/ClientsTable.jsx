import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Tooltip } from 'react-tooltip'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { Toggle } from './Toggle'
import { 
  Users, 
  Search, 
  Plus,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Smartphone,
  Crown,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Zap
} from 'lucide-react'

const ClientsTable = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    active: 0,
    trial: 0,
    expired: 0,
    pending: 0
  })
  const [selectedClients, setSelectedClients] = useState([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFilteredData()
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [statusFilter, searchTerm])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      const [clientsResponse, statsResponse] = await Promise.all([
        apiClient.getClientsWithDetails(1, itemsPerPage),
        apiClient.getClientStatistics()
      ])

      if (clientsResponse.success) {
        const responseData = clientsResponse.data?.data || clientsResponse.data || []
        const pagination = clientsResponse.data?.pagination
        
        setClients(responseData)
        setHasMore(pagination?.has_more || false)
      }

      if (statsResponse.success) {
        updateFilterCountsFromStats(statsResponse.data)
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
        plan_status: statusFilter,
        search: searchTerm
      }
      
      const response = await apiClient.getClientsWithDetails(1, itemsPerPage, filters)
      
      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination
        
        setClients(responseData)
        setHasMore(pagination?.has_more || false)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading filtered data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreClients = async () => {
    if (loadingMore || !hasMore) return
    
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      
      const filters = {
        plan_status: statusFilter,
        search: searchTerm
      }
      
      const response = await apiClient.getClientsWithDetails(nextPage, itemsPerPage, filters)
      
      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination
        
        setClients(prev => [...prev, ...responseData])
        setHasMore(pagination?.has_more || false)
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error('Error loading more clients:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const updateFilterCountsFromStats = (stats) => {
    const counts = {
      all: stats.totals?.all_clients || 0,
      active: stats.plan_status?.active || 0,
      trial: stats.plan_status?.trial || 0,
      expired: stats.plan_status?.expired || 0,
      pending: stats.plan_status?.pending || 0
    }
    setFilterCounts(counts)
  }

  const handleFilterChange = (filterId) => {
    setStatusFilter(filterId)
    setCurrentPage(1)
  }

  const handleClientClick = (client) => {
    navigate(`/clients/${client.client_unique_id}`, { state: { client } })
  }

  const handleStatusUpdate = async (clientUniqueId, newStatus) => {
    try {
      const response = await apiClient.updateClientStatus(clientUniqueId, newStatus)
      if (response.success) {
        setClients(prev => prev.map(client => 
          client.client_unique_id === clientUniqueId 
            ? { ...client, plan_status: newStatus }
            : client
        ))
      }
    } catch (err) {
      toast.error('שגיאה בעדכון סטטוס הלקוח')
      console.error('Error updating client status:', err)
    }
  }

  const handleSyncUpdate = async (clientUniqueId) => {
    try {
      const response = await apiClient.updateClientSyncStatus(clientUniqueId)
      if (response.success) {
        setClients(prev => prev.map(client => 
          client.client_unique_id === clientUniqueId 
            ? { 
                ...client, 
                last_sync: response.data.last_sync,
                sync_status: 'recent'
              }
            : client
        ))
      }
    } catch (err) {
      toast.error('שגיאה בעדכון סטטוס הסינכרון')
      console.error('Error updating sync status:', err)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'פעיל', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800', label: 'ניסיון', icon: Zap },
      expired: { color: 'bg-red-100 text-red-800', label: 'פג תוקף', icon: X },
      suspended: { color: 'bg-yellow-100 text-yellow-800', label: 'מושעה', icon: AlertTriangle },
      pending: { color: 'bg-gray-100 text-gray-800', label: 'ממתין', icon: Clock }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </span>
    )
  }

  const getSyncStatusBadge = (status) => {
    const statusConfig = {
      recent: { color: 'bg-green-100 text-green-800', label: 'עדכני' },
      normal: { color: 'bg-blue-100 text-blue-800', label: 'רגיל' },
      stale: { color: 'bg-yellow-100 text-yellow-800', label: 'מיושן' },
      never: { color: 'bg-gray-100 text-gray-800', label: 'לא סונכרן' }
    }
    
    const config = statusConfig[status] || statusConfig.never
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleString('he-IL')
  }

  // Define table columns
  const tableColumns = [
    {
      id: 'client_unique_id',
      key: 'client_unique_id',
      label: 'מספר לקוח',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          #{row.client_unique_id}
        </span>
      )
    },
    {
      id: 'client_info',
      key: 'full_name',
      label: 'פרטי לקוח',
      type: 'text',
      render: (row) => (
        <div className="flex items-center   space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {row.first_name?.charAt(0)?.toUpperCase() || 'L'}{row.last_name?.charAt(0)?.toUpperCase() || ''}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.full_name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
            <div className="text-xs text-gray-400">{row.phone}</div>
          </div>
        </div>
      )
    },
    {
      id: 'plan_info',
      key: 'plan_name',
      label: 'תוכנית',
      type: 'text',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.plan_name || 'ללא תוכנית'}</div>
          {row.plan_price && (
            <div className="text-sm text-gray-500">₪{row.plan_price}</div>
          )}
          {row.level_name && (
            <div className="text-xs flex items-center mt-1">
              <Crown className="w-3 h-3 ml-1 text-yellow-500" />
              <span className="text-yellow-600">
                {row.level_name}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'plan_status',
      key: 'plan_status',
      label: 'סטטוס תוכנית',
      type: 'custom',
      render: (row) => getStatusBadge(row.plan_status)
    },
    {
      id: 'trial_status',
      key: 'trial_status',
      label: 'ניסיון',
      type: 'text',
      render: (row) => {
        const trialConfig = {
          not_started: 'לא החל',
          active: 'פעיל',
          expired: 'פג תוקף',
          converted: 'הומר'
        }
        return trialConfig[row.trial_status] || row.trial_status
      }
    },
    {
      id: 'device_info',
      key: 'model',
      label: 'מכשיר',
      type: 'text',
      render: (row) => (
        <div className="flex items-center   space-x-2">
          <Smartphone className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium">{row.model || 'לא זמין'}</div>
            <div className="text-xs text-gray-500">{row.android_version}</div>
          </div>
        </div>
      )
    },
    {
      id: 'sync_status',
      key: 'sync_status',
      label: 'סטטוס סינכרון',
      type: 'custom',
      render: (row) => (
        <div>
          {getSyncStatusBadge(row.sync_status)}
          <div className="text-xs text-gray-500 mt-1">
            {formatDateTime(row.last_sync)}
          </div>
        </div>
      )
    },
    {
      id: 'registration_date',
      key: 'registration_date',
      label: 'תאריך הרשמה',
      type: 'date',
      render: (row) => formatDate(row.registration_date)
    },
    {
      id: 'actions',
      key: 'actions',
      label: 'פעולות',
      type: 'custom',
      render: (row) => (
        <div className="flex items-center   space-x-2">
          <select
            onChange={(e) => e.target.value && handleStatusUpdate(row.client_unique_id, e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            defaultValue=""
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">שנה סטטוס</option>
            <option value="active">פעיל</option>
            <option value="trial">ניסיון</option>
            <option value="suspended">מושעה</option>
            <option value="expired">פג תוקף</option>
          </select>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSyncUpdate(row.client_unique_id)
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            data-tooltip-id="sync-tooltip"
            data-tooltip-content="עדכן סינכרון"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const tableConfig = {
    columns: tableColumns,
    data: clients,
    onRowClick: handleClientClick,
    tableType: 'clients'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center   space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען לקוחות...</span>
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות</h1>
              <p className="text-gray-600">טבלת לקוחות עם אפשרויות מתקדמות</p>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center   space-x-2">
            <Plus className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>


     {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סך הכל לקוחות</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.all}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">לקוחות פעילים</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">בניסיון</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.trial}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center ml-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">פג תוקף</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.expired}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ml-4">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ממתינים</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="space-y-6">
            {/* Toggle Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">סינון לקוחות</label>
              <Toggle
                options={[
                  { 
                    id: 'all', 
                    label: 'כל הלקוחות', 
                    count: filterCounts.all,
                    icon: <Users className="w-4 h-4" />
                  },
                  { 
                    id: 'active', 
                    label: 'פעילים', 
                    count: filterCounts.active,
                    icon: <CheckCircle className="w-4 h-4" />
                  },
                  { 
                    id: 'trial', 
                    label: 'ניסיון', 
                    count: filterCounts.trial,
                    icon: <Zap className="w-4 h-4" />
                  },
                  { 
                    id: 'expired', 
                    label: 'פג תוקף', 
                    count: filterCounts.expired,
                    icon: <X className="w-4 h-4" />
                  },
                  { 
                    id: 'pending', 
                    label: 'ממתינים', 
                    count: filterCounts.pending,
                    icon: <Clock className="w-4 h-4" />
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
                  placeholder="חפש לפי שם, אימייל, טלפון או IMEI..."
                />
              </div>
            </div>
          </div>
        </div>

   
      </div>


      {/* Table */}
      <Table
        tableConfig={tableConfig}
        onLoadMore={loadMoreClients}
        hasMore={hasMore}
        loading={loadingMore}
        stickyHeader={true}
        onSelectionChange={setSelectedClients}
      />

      {/* Selection Actions */}
      {selectedClients.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="flex items-center   space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedClients.length} לקוחות נבחרו
            </span>
            <div className="flex   space-x-2">
              <button className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                עדכון מרוכז
              </button>
              <button className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                הפעל הכל
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip
        id="sync-tooltip"
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
}

export default ClientsTable