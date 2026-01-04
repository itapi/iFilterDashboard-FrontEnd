import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/api'
import { Table } from './Table/Table'
import { useGlobalState } from '../contexts/GlobalStateContext'
import DebouncedSearch from './DebouncedSearch'
import {
  Smartphone,
  Search,
  Package,
  Trash2,
  Edit,
  Calendar,
  Download,
  Star
} from 'lucide-react'

const AllAppsTable = ({ onAppsUpdated }) => {
  const { openModal, closeModal } = useGlobalState()
  const [apps, setApps] = useState([])
  const [categories, setCategories] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Sorting state
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsPerPage = 25

  // Load data
  useEffect(() => {
    loadData()
  }, [categoryFilter, searchTerm, sortColumn, sortDirection])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories()
      if (response.success) {
        setCategories(response.data || [])
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadData = async () => {
    try {
      if (currentPage === 1) {
        setInitialLoading(true)
      } else {
        setTableLoading(true)
      }

      setCurrentPage(1)

      const filters = {
        page: 1,
        limit: itemsPerPage,
        search: searchTerm,
        sort: sortColumn,
        order: sortDirection
      }

      if (categoryFilter !== 'all') {
        filters.categoryId = categoryFilter
      }

      const response = await apiClient.getAllApps(filters)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setApps(responseData)
        setHasMore(pagination?.has_more || false)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת האפליקציות')
      console.error('Error loading apps:', err)
    } finally {
      setInitialLoading(false)
      setTableLoading(false)
    }
  }

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm)
  }

  const loadMoreApps = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1

      const filters = {
        page: nextPage,
        limit: itemsPerPage,
        search: searchTerm,
        sort: sortColumn,
        order: sortDirection
      }

      if (categoryFilter !== 'all') {
        filters.categoryId = categoryFilter
      }

      const response = await apiClient.getAllApps(filters)

      if (response.success) {
        const responseData = response.data?.data || response.data || []
        const pagination = response.data?.pagination

        setApps(prev => [...prev, ...responseData])
        setHasMore(pagination?.has_more || false)
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error('Error loading more apps:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDeleteClick = (app) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת אפליקציה',
      size: 'md',
      data: {
        message: (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              האם אתה בטוח שברצונך למחוק את האפליקציה?
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{app.app_name}</p>
              <p className="text-sm text-gray-600">{app.package_name}</p>
              {app.category_name && (
                <p className="text-xs text-gray-500 mt-1">קטגוריה: {app.category_name}</p>
              )}
            </div>
            <p className="text-sm text-red-600">
              פעולה זו לא ניתנת לביטול ותמחק את האפליקציה מהמערכת
            </p>
          </div>
        ),
      },
      showConfirmButton: true,
      showCancelButton: true,
      confirmText: 'מחק אפליקציה',
      cancelText: 'ביטול',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onConfirm: async () => {
        try {
          const response = await apiClient.deleteApp(app.app_id)
          if (response.success) {
            setApps(prev => prev.filter(a => a.app_id !== app.app_id))
            toast.success('האפליקציה נמחקה בהצלחה')
            onAppsUpdated && onAppsUpdated()
            closeModal()
          } else {
            toast.error('שגיאה במחיקת האפליקציה')
          }
        } catch (err) {
          toast.error('שגיאה במחיקת האפליקציה')
          console.error('Error deleting app:', err)
        }
      }
    })
  }

  const handleCategoryChange = async (app, newCategoryId) => {
    try {
      const response = await apiClient.updateAppCategory(app.app_id, newCategoryId)
      if (response.success) {
        setApps(prev => prev.map(a =>
          a.app_id === app.app_id
            ? { ...a, category_id: newCategoryId, category_name: categories.find(c => c.category_id === parseInt(newCategoryId))?.category_name }
            : a
        ))
        toast.success('הקטגוריה עודכנה בהצלחה')
        onAppsUpdated && onAppsUpdated()
      }
    } catch (err) {
      toast.error('שגיאה בעדכון הקטגוריה')
      console.error('Error updating category:', err)
    }
  }

  const handleSortChange = (column, direction) => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  const formatBytes = (bytes) => {
    if (!bytes) return 'לא זמין'
    const mb = parseFloat(bytes)
    return `${mb.toFixed(2)} MB`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  // Component for app icon with fallback
  const AppIcon = ({ iconUrl, appName }) => {
    const [imageError, setImageError] = useState(false)

    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
        {iconUrl && !imageError ? (
          <img
            src={iconUrl}
            alt={appName}
            className="w-10 h-10 rounded-lg object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Smartphone className="w-6 h-6 text-blue-600" />
        )}
      </div>
    )
  }

  // Define table columns
  const tableColumns = [
    {
      id: 'app_info',
      key: 'app_name',
      label: 'אפליקציה',
      type: 'custom',
      sortable: true,
      sortKey: 'app_name',

      render: (row) => (
        <div className="flex items-center space-x-3">
          <AppIcon iconUrl={row.icon_url} appName={row.app_name} />
          <div>
            <div className="font-medium text-gray-900">{row.app_name}</div>
            <div className="text-sm text-gray-500">{row.package_name}</div>
          </div>
        </div>
      )
    },
    {
      id: 'version',
      key: 'version_name',
      label: 'גרסה',
      type: 'text',
      sortable: true,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.version_name || 'לא זמין'}</div>
          {row.version_code && (
            <div className="text-xs text-gray-500">({row.version_code})</div>
          )}
        </div>
      )
    },
    {
      id: 'category',
      key: 'category_name',
      label: 'קטגוריה',
      type: 'text',
      sortable: true,
      sortKey: 'category_name',
      render: (row) => (
        <div>
          {row.category_name ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {row.category_name}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">ללא קטגוריה</span>
          )}
        </div>
      )
    },
    {
      id: 'size',
      key: 'size',
      label: 'גודל',
      type: 'text',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">{formatBytes(row.size)}</div>
      )
    },
    {
      id: 'score',
      key: 'score',
      label: 'ציון',
      type: 'text',
      sortable: true,
      render: (row) => (
        <div className="flex items-center">
          {row.score ? (
            <>
              <Star className="w-4 h-4 text-yellow-500 ml-1" />
              <span className="text-sm font-medium text-gray-900">{parseFloat(row.score).toFixed(1)}</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">אין</span>
          )}
        </div>
      )
    },
    {
      id: 'update_date',
      key: 'update_date',
      label: 'תאריך עדכון',
      type: 'date',
      sortable: true,
      render: (row) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 ml-1" />
          {formatDate(row.update_date)}
        </div>
      )
    },
    {
      id: 'actions',
      key: 'actions',
      label: 'פעולות',
      type: 'custom',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <select
            onChange={(e) => e.target.value && handleCategoryChange(row, e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue={row.category_id || ''}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">שנה קטגוריה</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(row)
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק אפליקציה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const tableConfig = {
    columns: tableColumns,
    data: apps,
    tableType: 'apps'
  }

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען אפליקציות...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סינון לפי קטגוריה</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
              <DebouncedSearch
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="חפש לפי שם אפליקציה או package name..."
                delay={300}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {tableLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex items-center justify-center min-h-64">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">מעדכן נתונים...</span>
            </div>
          </div>
        </div>
      ) : (
        <Table
          tableConfig={tableConfig}
          onLoadMore={loadMoreApps}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader={true}
          sortable={true}
          onSortChange={handleSortChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      )}
    </div>
  )
}

export default AllAppsTable
