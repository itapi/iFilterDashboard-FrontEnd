import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Modal } from './Modal/Modal'
import { Smartphone, Search, Filter, Check, Package, Star, Download, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import AppCard from './AppCard'
import Loader from './Loader'

const CustomPlanApps = ({ clientUniqueId, planUniqueId, onClose, onSave, isOpen = true }) => {
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
  const searchTimeoutRef = useRef(null)

  // handle search input with timeout
  const handleSearchChange = (value) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
      setCurrentPage(1)
    }, 500)
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [clientUniqueId, planUniqueId, currentPage, searchTerm, selectedCategory, isOpen])

  const loadData = async () => {
    try {
      const isInitialLoad = categories.length === 0 && currentPage === 1 && !searchTerm && selectedCategory === 'all'
      if (isInitialLoad) setLoading(true)
      else setLoadingGrid(true)

      // load categories
      if (categories.length === 0) {
        const categoriesResponse = await apiClient.getCategories()
        if (categoriesResponse.success) setCategories(categoriesResponse.data)
      }

      // load currently selected apps from database (only on initial load)
      if (currentPage === 1 && searchTerm === '' && selectedCategory === 'all' && selectedApps.size === 0) {
        const selectedAppsResponse = await apiClient.getPlanSelectedApps(planUniqueId, clientUniqueId) // Using unified API
        if (selectedAppsResponse.success) {
          const currentlySelectedIds = new Set(
            selectedAppsResponse.data.map(app => app.app_id)
          )
          setInitialSelectedAppIds(currentlySelectedIds)
          setSelectedApps(currentlySelectedIds)
        }
      }

      // load available apps
      const filters = {
        planId: planUniqueId,
        clientId: clientUniqueId,
        page: currentPage,
        limit: 20
      }
      if (searchTerm) filters.search = searchTerm
      if (selectedCategory !== 'all') filters.categoryId = selectedCategory

      const appsResponse = await apiClient.getPlanAvailableApps(filters) // Using unified API
      if (appsResponse.success) {
        const newApps = appsResponse.data.data
        setAvailableApps(newApps)
        setPagination(appsResponse.data.pagination)
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
      setLoadingGrid(false)
    }
  }

  // toggle app selection
  const handleAppToggle = useCallback((appId) => {
    setSelectedApps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appId)) newSet.delete(appId)
      else newSet.add(appId)
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const currentPageAppIds = availableApps.map(app => app.app_id)
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
      const response = await apiClient.updatePlanSelectedApps(planUniqueId, clientUniqueId, selectedArray) // Using unified API
      if (response.success) {
        const entityType = planUniqueId ? 'הקהילה' : 'הלקוח'
        toast.success(`נשמרו ${selectedArray.length} אפליקציות עבור ${entityType}`)
        setInitialSelectedAppIds(new Set(selectedApps))
        onSave && onSave(selectedArray)
      } else {
        throw new Error(response.message || 'שגיאה בשמירת האפליקציות')
      }
    } catch (error) {
      console.error('Error saving apps:', error)
      toast.error('שגיאה בשמירת האפליקציות')
    } finally {
      setSaving(false)
    }
  }, [clientUniqueId, planUniqueId, selectedApps, onSave])

  const handleReset = useCallback(() => {
    setSelectedApps(new Set(initialSelectedAppIds))
    toast.info('האפליקציות הנבחרות אופסו למצב ההתחלתי')
  }, [initialSelectedAppIds])

  const hasChanges = useCallback(() => {
    if (selectedApps.size !== initialSelectedAppIds.size) return true
    for (let id of selectedApps) if (!initialSelectedAppIds.has(id)) return true
    return false
  }, [selectedApps, initialSelectedAppIds])

  const modalFooter = useMemo(() => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">נבחרו {selectedApps.size} אפליקציות</div>
      <div className="flex items-center space-x-3">
        {hasChanges() && (
          <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            איפוס
          </button>
        )}
        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {saving ? (
            <Loader size="sm" variant="white" text="שומר..." />
          ) : (
            <span>שמור שינויים</span>
          )}
        </button>
      </div>
    </div>
  ), [selectedApps, hasChanges, handleReset, onClose, handleSave, saving])

  const appsGrid = useMemo(() => {
    if (loadingGrid) {
      return <Loader center variant="purple" text="טוען..." />
    }

    if (availableApps.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו אפליקציות</h3>
          <p className="text-gray-500">נסה לשנות את החיפוש או הסינון</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {availableApps.map(app => (
          <AppCard
            key={app.app_id}
            app={app}
            isSelected={selectedApps.has(app.app_id)}
            onToggle={handleAppToggle}
          />
        ))}
      </div>
    )
  }, [availableApps, selectedApps, loadingGrid, handleAppToggle])

  if (loading && currentPage === 1) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        showCloseButton={false}
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <div className="p-8">
          <Loader center variant="purple" text="טוען אפליקציות..." />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={planUniqueId ? "בחירת אפליקציות - קהילה" : "בחירת אפליקציות - מסלול אישי"}
      footer={modalFooter}
      bodyClassName="p-6"
      footerClassName="px-6 py-4"
    >
      <div className="space-y-6">
        {/* Search & Filter */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש אפליקציות..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {availableApps.length > 0 && availableApps.every(app => selectedApps.has(app.app_id)) ? 'בטל בחירת הכל' : 'בחר הכל'}
              </button>
            </div>
            <div className="text-sm text-gray-600">נבחרו {selectedApps.size} אפליקציות</div>
          </div>
        </div>

        {/* Apps Grid */}
        {appsGrid}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2">
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
      </div>
    </Modal>
  )
}

export default CustomPlanApps
