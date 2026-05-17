import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../../../utils/api'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import { Search, Package, ChevronLeft, ChevronRight, X, Smartphone } from 'lucide-react'
import AppCard from '../../AppCard'
import Loader from '../../Loader'

// Compact tile shown in the right "selected" panel
const SelectedTile = ({ app, onRemove }) => {
  const [imageError, setImageError] = useState(false)
  return (
    <div className="relative bg-white border border-purple-200 rounded-xl p-2 group">
      <button
        onClick={() => onRemove(app.app_id)}
        className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {app.icon_url && !imageError ? (
            <img
              src={app.icon_url}
              alt={app.app_name}
              className="w-10 h-10 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Smartphone className="w-6 h-6 text-purple-400" />
          )}
        </div>
        <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2 w-full">
          {app.app_name}
        </p>
      </div>
    </div>
  )
}

export const CustomPlanAppsLayout = forwardRef(({ data }, ref) => {
  const { clientUniqueId, planUniqueId, onSave } = data
  const { closeModal } = useGlobalState()

  // Left panel
  const [availableApps, setAvailableApps] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingApps, setLoadingApps] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  // Right panel
  const [selectedAppIds, setSelectedAppIds] = useState(new Set())
  const [selectedAppsDetails, setSelectedAppsDetails] = useState([])
  const [initialSelectedAppIds, setInitialSelectedAppIds] = useState(new Set())
  const [initialSelectedAppsDetails, setInitialSelectedAppsDetails] = useState([])

  const [saving, setSaving] = useState(false)
  const searchTimeoutRef = useRef(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    loadInitial()
  }, [clientUniqueId, planUniqueId])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    loadAvailableApps()
  }, [searchTerm, categoryFilter, currentPage])

  const loadInitial = async () => {
    try {
      setLoading(true)
      const [catsRes, appsRes, selectedRes] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getPlanAvailableApps({
          planId: planUniqueId,
          clientId: clientUniqueId,
          page: 1,
          limit: 20
        }),
        apiClient.getPlanSelectedApps(planUniqueId, clientUniqueId)
      ])
      if (catsRes.success) setCategories(catsRes.data)
      if (appsRes.success) {
        setAvailableApps(appsRes.data?.data || [])
        setPagination(appsRes.data?.pagination || null)
      }
      if (selectedRes.success) {
        const apps = selectedRes.data || []
        const ids = new Set(apps.map(a => a.app_id))
        setSelectedAppIds(ids)
        setInitialSelectedAppIds(new Set(ids))
        setSelectedAppsDetails(apps)
        setInitialSelectedAppsDetails(apps)
      }
    } catch {
      toast.error('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableApps = async () => {
    try {
      setLoadingApps(true)
      const filters = {
        planId: planUniqueId,
        clientId: clientUniqueId,
        page: currentPage,
        limit: 20
      }
      if (searchTerm) filters.search = searchTerm
      if (categoryFilter !== 'all') filters.categoryId = categoryFilter
      const res = await apiClient.getPlanAvailableApps(filters)
      if (res.success) {
        setAvailableApps(res.data?.data || [])
        setPagination(res.data?.pagination || null)
      }
    } catch {
      toast.error('שגיאה בטעינת האפליקציות')
    } finally {
      setLoadingApps(false)
    }
  }

  const handleSearchInput = (e) => {
    const val = e.target.value
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(val)
      setCurrentPage(1)
    }, 400)
  }

  // Called by AppCard — receives app_id, but we need the full object
  const handleToggle = useCallback((appId) => {
    const app = availableApps.find(a => a.app_id === appId)
    if (!app) return
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      if (next.has(appId)) next.delete(appId)
      else next.add(appId)
      return next
    })
    setSelectedAppsDetails(prev => {
      if (prev.some(a => a.app_id === appId)) return prev.filter(a => a.app_id !== appId)
      return [...prev, app]
    })
  }, [availableApps])

  const removeApp = useCallback((appId) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      next.delete(appId)
      return next
    })
    setSelectedAppsDetails(prev => prev.filter(a => a.app_id !== appId))
  }, [])

  const handleReset = useCallback(() => {
    setSelectedAppIds(new Set(initialSelectedAppIds))
    setSelectedAppsDetails([...initialSelectedAppsDetails])
  }, [initialSelectedAppIds, initialSelectedAppsDetails])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      const selectedArray = Array.from(selectedAppIds)
      const response = await apiClient.updatePlanSelectedApps(planUniqueId, clientUniqueId, selectedArray)
      if (response.success) {
        const entityType = planUniqueId ? 'הקהילה' : 'הלקוח'
        toast.success(`נשמרו ${selectedArray.length} אפליקציות עבור ${entityType}`)
        setInitialSelectedAppIds(new Set(selectedAppIds))
        setInitialSelectedAppsDetails([...selectedAppsDetails])
        onSave && onSave(selectedArray)
        closeModal()
      } else {
        throw new Error(response.message || 'שגיאה בשמירת האפליקציות')
      }
    } catch {
      toast.error('שגיאה בשמירת האפליקציות')
    } finally {
      setSaving(false)
    }
  }, [clientUniqueId, planUniqueId, selectedAppIds, selectedAppsDetails, onSave, closeModal])

  const hasChanges =
    selectedAppIds.size !== initialSelectedAppIds.size ||
    [...selectedAppIds].some(id => !initialSelectedAppIds.has(id))

  useImperativeHandle(ref, () => ({ submitForm: handleSave }))

  if (loading) {
    return (
      <div className="p-8">
        <Loader center variant="purple" text="טוען אפליקציות..." />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(90vh-160px)]" dir="rtl">
      {/* ── Left: Available apps ── */}
      <div className="flex flex-col flex-1 min-w-0 p-4">
        {/* Search & filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש לפי שם או package..."
              onChange={handleSearchInput}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        {/* Apps grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loadingApps ? (
            <div className="flex items-center justify-center h-48">
              <Loader center variant="purple" text="טוען..." />
            </div>
          ) : availableApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">לא נמצאו אפליקציות</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {availableApps.map(app => (
                <AppCard
                  key={app.app_id}
                  app={app}
                  isSelected={selectedAppIds.has(app.app_id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-gray-500">
              עמוד {currentPage} מתוך {pagination.total_pages}
              {pagination.total && <span className="text-gray-400"> · {pagination.total} אפליקציות</span>}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={currentPage === pagination.total_pages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-gray-200 my-4 flex-shrink-0" />

      {/* ── Right: Selected apps ── */}
      <div className="flex flex-col w-[420px] flex-shrink-0 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">נבחרו</p>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            hasChanges ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {selectedAppIds.size} אפליקציות
          </span>
        </div>

        {/* Selected tiles grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {selectedAppsDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300 text-center px-4">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-xs">לחץ על אפליקציות משמאל להוספה</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {selectedAppsDetails.map(app => (
                <SelectedTile key={app.app_id} app={app} onRemove={removeApp} />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3 space-y-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="w-full py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              בטל שינויים
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={closeModal}
              className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              סגור
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

CustomPlanAppsLayout.displayName = 'CustomPlanAppsLayout'
