import { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../../../utils/api'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import { Smartphone, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import AppCard from '../../AppCard'
import Loader from '../../Loader'

export const CategoryAppsLayout = forwardRef(({ data }, ref) => {
  const { category, onAppsUpdated } = data
  const { closeModal, openModal } = useGlobalState()

  const [availableApps, setAvailableApps] = useState([])
  const [selectedApps, setSelectedApps] = useState(new Set())
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingGrid, setLoadingGrid] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [initialSelectedAppIds, setInitialSelectedAppIds] = useState(new Set())
  const [hasLoadedInitialApps, setHasLoadedInitialApps] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Handle search input with timeout
  const handleSearchChange = (value) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
      setCurrentPage(1)
    }, 500)
  }

  // Reset state when category changes
  useEffect(() => {
    if (category) {
      setCurrentPage(1)
      setSearchTerm('')
      setSelectedCategory('all')
      setSelectedApps(new Set())
      setInitialSelectedAppIds(new Set())
      setHasLoadedInitialApps(false)
      setAvailableApps([])
      setCategories([])
    }
  }, [category?.category_id])

  useEffect(() => {
    if (category) {
      loadData()
    }
  }, [category, currentPage, searchTerm, selectedCategory])

  const loadData = async () => {
    try {
      const isInitialLoad = categories.length === 0 && currentPage === 1 && !searchTerm && selectedCategory === 'all'
      if (isInitialLoad) setLoading(true)
      else setLoadingGrid(true)

      // Load categories (for filter dropdown)
      if (categories.length === 0) {
        const categoriesResponse = await apiClient.getCategories()
        if (categoriesResponse.success) setCategories(categoriesResponse.data)
      }

      // Load currently selected apps for this category (only on initial load)
      if (!hasLoadedInitialApps) {
        const selectedAppsResponse = await apiClient.getCategorySelectedApps(category.category_id)
        if (selectedAppsResponse.success && selectedAppsResponse.data) {
          // Normalize app IDs to numbers to ensure consistent comparison
          const currentlySelectedIds = new Set(
            selectedAppsResponse.data.map(app => Number(app.app_id))
          )
          console.log('Loaded selected apps for category:', category.category_id, currentlySelectedIds)
          setInitialSelectedAppIds(currentlySelectedIds)
          setSelectedApps(currentlySelectedIds)
          setHasLoadedInitialApps(true)
        }
      }

      // Load all available apps with pagination
      const filters = { page: currentPage, limit: 20 }
      if (searchTerm) filters.search = searchTerm
      if (selectedCategory !== 'all') filters.categoryId = selectedCategory

      const appsResponse = await apiClient.getAllApps(filters)
      if (appsResponse.success && appsResponse.data) {
        setAvailableApps(appsResponse.data.data || [])
        setPagination(appsResponse.data.pagination || null)
      } else {
        setAvailableApps([])
        setPagination(null)
        if (appsResponse.error) toast.error(appsResponse.error)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('שגיאה בטעינת הנתונים: ' + error.message)
      setAvailableApps([])
      setPagination(null)
    } finally {
      setLoading(false)
      setLoadingGrid(false)
    }
  }

  const handleAppToggle = useCallback((appId) => {
    setSelectedApps(prev => {
      const newSet = new Set(prev)
      const normalizedId = Number(appId)
      if (newSet.has(normalizedId)) newSet.delete(normalizedId)
      else newSet.add(normalizedId)
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (!availableApps || availableApps.length === 0) return
    const currentPageAppIds = availableApps.map(app => Number(app.app_id))
    const allSelected = currentPageAppIds.every(id => selectedApps.has(id))
    setSelectedApps(prev => {
      const newSet = new Set(prev)
      if (allSelected) currentPageAppIds.forEach(id => newSet.delete(id))
      else currentPageAppIds.forEach(id => newSet.add(id))
      return newSet
    })
  }, [availableApps, selectedApps])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      const selectedArray = Array.from(selectedApps)
      const response = await apiClient.bulkUpdateAppCategories(selectedArray, category.category_id)
      if (response.success) {
        toast.success(`נשמרו ${selectedArray.length} אפליקציות בקטגוריה ${category.category_name}`)
        setInitialSelectedAppIds(new Set(selectedApps))
        onAppsUpdated && onAppsUpdated()
        closeModal()
      } else {
        throw new Error(response.message || 'שגיאה בשמירת האפליקציות')
      }
    } catch (error) {
      console.error('Error saving apps:', error)
      toast.error('שגיאה בשמירת האפליקציות')
    } finally {
      setSaving(false)
    }
  }, [category, selectedApps, onAppsUpdated, closeModal])

  const handleReset = useCallback(() => {
    setSelectedApps(new Set(initialSelectedAppIds))
    toast.info('האפליקציות הנבחרות אופסו למצב ההתחלתי')
  }, [initialSelectedAppIds])

  const handleDeleteApp = useCallback((app) => {
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
            toast.success('האפליקציה נמחקה בהצלחה')
            // Remove from available apps list
            setAvailableApps(prev => prev.filter(a => a.app_id !== app.app_id))
            // Remove from selected apps if it was selected
            setSelectedApps(prev => {
              const newSet = new Set(prev)
              newSet.delete(Number(app.app_id))
              return newSet
            })
            // Refresh parent if callback provided
            onAppsUpdated && onAppsUpdated()
            closeModal() // Close the confirmation modal
          } else {
            toast.error('שגיאה במחיקת האפליקציה')
          }
        } catch (err) {
          toast.error('שגיאה במחיקת האפליקציה')
          console.error('Error deleting app:', err)
        }
      }
    })
  }, [openModal, closeModal, onAppsUpdated])

  const hasChanges = useCallback(() => {
    if (selectedApps.size !== initialSelectedAppIds.size) return true
    for (let id of selectedApps) if (!initialSelectedAppIds.has(id)) return true
    return false
  }, [selectedApps, initialSelectedAppIds])

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    submitForm: handleSave
  }))

  if (loading && currentPage === 1) {
    return (
      <div className="p-8">
        <Loader center variant="primary" text="טוען אפליקציות..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-8 py-6">
      {/* Search & Filter */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש אפליקציות..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-reverse space-x-4">
            <button
              onClick={handleSelectAll}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {availableApps && availableApps.length > 0 && availableApps.every(app => selectedApps.has(Number(app.app_id))) ? 'בטל בחירת הכל' : 'בחר הכל'}
            </button>
          </div>
          <div className="text-sm text-gray-600 font-medium">נבחרו {selectedApps.size} אפליקציות</div>
        </div>
      </div>

      {/* Apps Grid */}
      {loadingGrid ? (
        <Loader center variant="primary" text="טוען..." />
      ) : !availableApps || availableApps.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו אפליקציות</h3>
          <p className="text-gray-500">נסה לשנות את החיפוש או הסינון</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {availableApps.map(app => (
            <AppCard
              key={app.app_id}
              app={app}
              isSelected={selectedApps.has(Number(app.app_id))}
              onToggle={handleAppToggle}
              onDelete={handleDeleteApp}
              showDelete={true}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex items-center space-x-reverse space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-4 py-2 text-sm text-gray-600">
              עמוד {currentPage} מתוך {pagination.total_pages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
              disabled={currentPage === pagination.total_pages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-500">{pagination.total} אפליקציות בסך הכל</div>
        </div>
      )}

      {/* Footer buttons - shown in modal footer */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          נבחרו {selectedApps.size} אפליקציות
          {availableApps && availableApps.length > 0 && ` (${availableApps.length} בעמוד זה)`}
        </div>
        <div className="flex items-center space-x-reverse space-x-3">
          {hasChanges() && (
            <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              איפוס
            </button>
          )}
          <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-reverse space-x-2"
          >
            {saving ? (
              <Loader size="sm" variant="white" text="שומר..." />
            ) : (
              <span>שמור שינויים</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})

CategoryAppsLayout.displayName = 'CategoryAppsLayout'
