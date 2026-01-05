import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { SuperAdminOnly } from './RoleGuard'
import { usePermissions } from '../hooks/usePermissions'
import {
  Users,
  Search,
  Plus,
  Shield,
  UserCog,
  Building2,
  Trash,
  Edit,
  MoreVertical
} from 'lucide-react'
import { Tooltip } from 'react-tooltip'

// Add Admin Form Component (defined BEFORE AdminsTable to avoid hoisting issues)
const AddAdminForm = ({ communityPlans, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'manager',
    community_unique_id: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.username || !formData.password || !formData.first_name || !formData.last_name) {
      toast.error('נא למלא את כל השדות הנדרשים')
      return
    }

    if (formData.user_type === 'community_manager' && !formData.community_unique_id) {
      toast.error('נא לבחור קהילה למנהל קהילה')
      return
    }

    try {
      setLoading(true)

      // Remove community_unique_id if not community manager
      const dataToSend = { ...formData }
      if (dataToSend.user_type !== 'community_manager') {
        delete dataToSend.community_unique_id
      }

      const response = await apiClient.createAdmin(dataToSend)

      if (response.success) {
        onSuccess(response.data)
      } else {
        toast.error(response.message || 'שגיאה ביצירת משתמש מערכת')
      }
    } catch (err) {
      toast.error('שגיאה ביצירת משתמש מערכת')
      console.error('Error creating admin:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם משתמש <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            סיסמה <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תפקיד <span className="text-red-500">*</span>
          </label>
          <select
            name="user_type"
            value={formData.user_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="super_admin">מנהל מערכת</option>
            <option value="manager">מנהל</option>
            <option value="community_manager">מנהל קהילה</option>
          </select>
        </div>

        {formData.user_type === 'community_manager' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קהילה <span className="text-red-500">*</span>
            </label>
            <select
              name="community_unique_id"
              value={formData.community_unique_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">בחר קהילה</option>
              {communityPlans.map(plan => (
                <option key={plan.community_unique_id} value={plan.community_unique_id}>
                  {plan.community_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'יוצר...' : 'צור משתמש'}
        </button>
      </div>
    </form>
  )
}

// Edit Admin Form Component (defined BEFORE AdminsTable to avoid hoisting issues)
const EditAdminForm = ({ admin, communityPlans, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    username: admin.username || '',
    password: '', // Leave empty for no change
    first_name: admin.first_name || '',
    last_name: admin.last_name || '',
    user_type: admin.user_type || 'manager',
    community_plan_unique_id: admin.community_plan_unique_id || ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.username || !formData.first_name || !formData.last_name) {
      toast.error('נא למלא את כל השדות הנדרשים')
      return
    }

    if (formData.user_type === 'community_manager' && !formData.community_unique_id) {
      toast.error('נא לבחור קהילה למנהל קהילה')
      return
    }

    try {
      setLoading(true)

      // Remove password if empty (no change)
      const dataToSend = { ...formData }
      if (!dataToSend.password) {
        delete dataToSend.password
      }

      // Remove community_plan_unique_id if not community manager
      if (dataToSend.user_type !== 'community_manager') {
        dataToSend.community_plan_unique_id = null
      }

      const response = await apiClient.updateAdmin(admin.id, dataToSend)

      if (response.success) {
        onSuccess(response.data)
      } else {
        toast.error(response.message || 'שגיאה בעדכון משתמש מערכת')
      }
    } catch (err) {
      toast.error('שגיאה בעדכון משתמש מערכת')
      console.error('Error updating admin:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם משתמש <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            סיסמה (השאר ריק אם אין שינוי)
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="השאר ריק כדי לשמור על הסיסמה הקיימת"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תפקיד <span className="text-red-500">*</span>
          </label>
          <select
            name="user_type"
            value={formData.user_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="super_admin">מנהל מערכת</option>
            <option value="manager">מנהל</option>
            <option value="community_manager">מנהל קהילה</option>
          </select>
        </div>

        {formData.user_type === 'community_manager' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קהילה <span className="text-red-500">*</span>
            </label>
            <select
              name="community_unique_id"
              value={formData.community_unique_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">בחר קהילה</option>
              {communityPlans.map(plan => (
                <option key={plan.community_unique_id} value={plan.community_unique_id}>
                  {plan.community_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'מעדכן...' : 'עדכן משתמש'}
        </button>
      </div>
    </form>
  )
}

// Main AdminsTable Component
const AdminsTable = () => {
  const { openModal, closeModal, openConfirmModal } = useGlobalState()
  const { getRoleBadgeColor, getRoleDisplayName } = usePermissions()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [communityPlans, setCommunityPlans] = useState([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

 // Better solution: Combine both into a single effect
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      setCurrentPage(1)

      const filters = {
        search: searchTerm,
        user_type: userTypeFilter !== 'all' ? userTypeFilter : undefined
      }

      // Load community plans only on initial load or when needed
      if (communityPlans.length === 0) {
        const [adminsResponse, plansResponse] = await Promise.all([
          apiClient.getAdminsWithDetails(1, itemsPerPage, filters),
          apiClient.getCommunityPlansForAdmins()
        ])

        if (adminsResponse.success) {
          const responseData = adminsResponse.data?.data || adminsResponse.data || []
          const pagination = adminsResponse.data?.pagination
          setAdmins(responseData)
          setHasMore(pagination?.has_more || false)
        }

        if (plansResponse.success) {
          setCommunityPlans(plansResponse.data || [])
        }
      } else {
        // Only load admins when filters change
        const response = await apiClient.getAdminsWithDetails(1, itemsPerPage, filters)
        if (response.success) {
          const responseData = response.data?.data || response.data || []
          const pagination = response.data?.pagination
          setAdmins(responseData)
          setHasMore(pagination?.has_more || false)
        }
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const timeoutId = setTimeout(() => {
    loadData()
  }, searchTerm ? 300 : 0) // Debounce only for search, not for initial load

  return () => clearTimeout(timeoutId)
}, [searchTerm, userTypeFilter])

  const loadMoreAdmins = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const filters = {
        search: searchTerm,
        user_type: userTypeFilter !== 'all' ? userTypeFilter : undefined
      }

      const response = await apiClient.getAdminsWithDetails(nextPage, itemsPerPage, filters)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setAdmins(prev => [...prev, ...responseData])
        setHasMore(pagination?.has_more || false)
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error('Error loading more admins:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleAddAdmin = () => {
    openModal({
      layout: 'custom',
      title: 'הוספת משתמש מערכת',
      size: 'lg',
      content: (
        <div className="p-6">
          <AddAdminForm
            communityPlans={communityPlans}
            onSuccess={handleAdminAdded}
            onClose={closeModal}
          />
        </div>
      ),
      showConfirmButton: false,
      showCancelButton: false
    })
  }

  const handleAdminAdded = (newAdmin) => {
    setAdmins(prev => [newAdmin, ...prev])
    closeModal()
    toast.success('משתמש מערכת נוסף בהצלחה')
    loadFilteredData() // Reload to get fresh data with community plan names
  }

  const handleEditAdmin = (admin) => {
    openModal({
      layout: 'custom',
      title: 'עריכת משתמש מערכת',
      size: 'lg',
      content: (
        <div className="p-6">
          <EditAdminForm
            admin={admin}
            communityPlans={communityPlans}
            onSuccess={handleAdminUpdated}
            onClose={closeModal}
          />
        </div>
      ),
      showConfirmButton: false,
      showCancelButton: false
    })
  }

  const handleAdminUpdated = (updatedAdmin) => {
    setAdmins(prev => prev.map(admin =>
      admin.id === updatedAdmin.id ? updatedAdmin : admin
    ))
    closeModal()
    toast.success('משתמש מערכת עודכן בהצלחה')
    loadFilteredData() // Reload to get fresh data
  }

  const handleDeleteAdmin = (admin) => {
    openConfirmModal({
      title: 'מחיקת משתמש מערכת',
      message: `האם אתה בטוח שברצונך למחוק את המשתמש ${admin.username}? פעולה זו אינה הפיכה.`,
      variant: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          const response = await apiClient.deleteAdmin(admin.id)
          if (response.success) {
            setAdmins(prev => prev.filter(a => a.id !== admin.id))
            toast.success('משתמש מערכת נמחק בהצלחה')
          }
        } catch (err) {
          toast.error('שגיאה במחיקת משתמש מערכת')
          console.error('Error deleting admin:', err)
        }
      }
    })
  }

  // Define table columns
  const tableColumns = [
    {
      id: 'id',
      key: 'id',
      label: 'מזהה',
      type: 'text',
      render: (row) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          #{row.id}
        </span>
      )
    },
    {
      id: 'username',
      key: 'username',
      label: 'שם משתמש',
      type: 'text',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {row.username?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <span className="font-medium">{row.username}</span>
        </div>
      )
    },
    {
      id: 'full_name',
      key: 'full_name',
      label: 'שם מלא',
      type: 'text',
      render: (row) => (
        <span>{`${row.first_name} ${row.last_name}`}</span>
      )
    },
    {
      id: 'user_type',
      key: 'user_type',
      label: 'תפקיד',
      type: 'custom',
      render: (row) => (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(row.user_type)}`}>
          {row.user_type === 'super_admin' && <Shield className="w-3 h-3 ml-1" />}
          {row.user_type === 'manager' && <UserCog className="w-3 h-3 ml-1" />}
          {row.user_type === 'community_manager' && <Building2 className="w-3 h-3 ml-1" />}
          {getRoleDisplayName(row.user_type)}
        </div>
      )
    },
    {
      id: 'community_plan',
      key: 'community_plan_name',
      label: 'תכנית קהילה',
      type: 'custom',
      render: (row) => {
        if (row.user_type !== 'community_manager') {
          return <span className="text-sm text-gray-400">-</span>
        }

        // Try multiple possible field names for the community ID
        const communityId = row.community_plan_unique_id || row.community_unique_id

        // Find the community plan name from communityPlans array
        const communityPlan = communityPlans.find(
          plan => plan.community_unique_id === communityId
        )
        const communityName = communityPlan?.community_name || row.community_plan_name || communityId || '-'

        return <span className="text-sm text-gray-700">{communityName}</span>
      }
    },
    {
      id: 'created_at',
      key: 'created_at',
      label: 'תאריך יצירה',
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
            data-tooltip-id={`admin-menu-${row.id}`}
            data-tooltip-place="bottom"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="תפריט פעולות"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          <Tooltip
            id={`admin-menu-${row.id}`}
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditAdmin(row)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-right w-full"
              >
                <Edit className="w-4 h-4" />
                <span>ערוך</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteAdmin(row)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors text-right w-full"
              >
                <Trash className="w-4 h-4" />
                <span>מחק</span>
              </button>
            </div>
          </Tooltip>
        </div>
      )
    }
  ]

  const tableConfig = {
    columns: tableColumns,
    data: admins,
    onRowClick: handleEditAdmin,
    tableType: 'admins'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען משתמשי מערכת...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminOnly>
      <div className="p-8" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשי מערכת</h1>
                <p className="text-gray-600">ניהול מנהלי מערכת, מנהלים ומנהלי קהילה</p>
              </div>
            </div>

            <button
              onClick={handleAddAdmin}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">הוסף משתמש מערכת</span>
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">סך הכל</p>
                  <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center ml-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">מנהלי מערכת</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {admins.filter(a => a.user_type === 'super_admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-4">
                  <UserCog className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">מנהלים</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {admins.filter(a => a.user_type === 'manager').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">מנהלי קהילה</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {admins.filter(a => a.user_type === 'community_manager').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="חפש לפי שם משתמש או שם מלא..."
                  />
                </div>
              </div>

              {/* User Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סינון לפי תפקיד</label>
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">כל התפקידים</option>
                  <option value="super_admin">מנהל מערכת</option>
                  <option value="manager">מנהל</option>
                  <option value="community_manager">מנהל קהילה</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          tableConfig={tableConfig}
          onLoadMore={loadMoreAdmins}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader={true}
        />
      </div>
    </SuperAdminOnly>
  )
}

export default AdminsTable
