import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Users, Search, Filter, Eye, Settings, Star, Package, Plus } from 'lucide-react'
import { Table } from './Table/Table'
import DebouncedSearch from './DebouncedSearch'
import apiClient from '../utils/api'
import Loader from './Loader'
import { useModal } from '../contexts/ModalContext'

const CommunitiesTable = () => {
  const navigate = useNavigate()
  const { openModal, closeModal, openConfirmModal } = useModal()
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCommunities, setTotalCommunities] = useState(0)

  const loadData = useCallback(async (page = 1, search = '', append = false) => {
    try {
      if (page === 1 && !append) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      if (search !== searchTerm) {
        setSearchLoading(true)
      }

      const response = await apiClient.getCommunityPlans({
        page,
        limit: 20,
        search
      })

      if (response.success) {
        const newCommunities = (response.data.data || response.data || []).map(community => ({
          ...community,
          id: community.plan_unique_id // Ensure each row has an id field for the Table component
        }))
        setCommunities(prev => append ? [...prev, ...newCommunities] : newCommunities)

        // Handle pagination if it exists
        if (response.data.pagination) {
          setHasMore(response.data.pagination.current_page < response.data.pagination.total_pages)
          setCurrentPage(response.data.pagination.current_page)
          setTotalCommunities(response.data.pagination.total)
        } else {
          setHasMore(false)
          setCurrentPage(1)
          setTotalCommunities(newCommunities.length)
        }
      }
    } catch (err) {
      console.error('Error loading communities:', err)
      toast.error('שגיאה בטעינת הקהילות')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setSearchLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = useCallback((term) => {
    setSearchTerm(term)
    setCurrentPage(1)
    loadData(1, term)
  }, [loadData])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadData(currentPage + 1, searchTerm, true)
    }
  }, [loadData, currentPage, searchTerm, loadingMore, hasMore])

  const handleViewCommunity = useCallback((community) => {
    const formContent = (
      <div className="p-6" dir="rtl">
        <div className="space-y-6">
          {/* Community Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              {community.image_url ? (
                <img
                  src={community.image_url}
                  alt={community.plan_name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <Users className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{community.plan_name}</h3>
              <p className="text-sm text-purple-600 font-medium">קהילת סינון</p>
            </div>
          </div>

          {/* Community Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">מחירים</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">חודשי</span>
                    <span className="font-bold text-gray-900">₪{community.price_monthly}</span>
                  </div>
                  {community.price_yearly && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">שנתי</span>
                      <span className="font-bold text-gray-900">₪{community.price_yearly}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">תכונות</h4>
                <div className="space-y-2">
                  {[community.feature1, community.feature2, community.feature3].filter(Boolean).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{community.selected_apps_count || 0}</div>
                <div className="text-sm text-gray-600">אפליקציות</div>
              </div>
        
              <div>
                <div className="text-2xl font-bold text-blue-600">קהילה</div>
                <div className="text-sm text-gray-600">סוג תכנית</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{community.plan_unique_id.slice(0, 8)}</div>
                <div className="text-sm text-gray-600">מזהה</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    openModal({
      type: 'custom',
      title: 'פרטי קהילה',
      content: formContent,
      size: 'xl'
    })
  }, [openModal])

  const tableConfig = {
    columns: [
      {
        key: 'plan_name',
        label: 'שם הקהילה',
        width: '25%',
        render: (value, row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              {row.image_url ? (
                <img
                  src={row.image_url}
                  alt={value}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{value}</div>
              <div className="text-sm text-purple-600">קהילת סינון</div>
            </div>
          </div>
        )
      },
      {
        key: 'price_monthly',
        label: 'מחיר חודשי',
        width: '15%',
        render: (value) => (
          <div className="text-center">
            <span className="font-semibold text-gray-900">₪{value}</span>
            <span className="text-xs text-gray-500 block">/חודש</span>
          </div>
        )
      },
      {
        key: 'price_yearly',
        label: 'מחיר שנתי',
        width: '15%',
        render: (value) => value ? (
          <div className="text-center">
            <span className="font-semibold text-gray-900">₪{value}</span>
            <span className="text-xs text-gray-500 block">/שנה</span>
          </div>
        ) : (
          <span className="text-gray-400">לא הוגדר</span>
        )
      },
      {
        key: 'selected_apps_count',
        label: 'אפליקציות',
        width: '12%',
        render: (value) => (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              <Package className="w-3 h-3" />
              {value || 0}
            </span>
          </div>
        )
      },

      {
        key: 'plan_unique_id',
        label: 'מזהה',
        width: '15%',
        render: (value) => (
          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {value.slice(0, 8)}...
          </span>
        )
      },
      {
        key: 'actions',
        label: 'פעולות',
        width: '8%',
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewCommunity(row)
              }}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="צפה בפרטים"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )
      }
    ],
    data: communities,
    onRowClick: (community) => {
      navigate(`/communities/${community.plan_unique_id}`)
    }
  }

  if (loading) {
    return <Loader fullScreen size="2xl" text="טוען קהילות" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">קהילות סינון</h1>
                <p className="text-gray-600">ניהול קהילות וחבילות סינון קהילתיות</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {totalCommunities || 0} קהילות בסך הכל
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="max-w-md">
              <DebouncedSearch
                placeholder="חיפוש קהילות..."
                onChange={handleSearch}
                icon={Search}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Table
              tableConfig={tableConfig}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loading={loadingMore}
              stickyHeader={true}
            />
          </div>

          {(!communities || communities.length === 0) && !loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">אין קהילות</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'לא נמצאו קהילות התואמות לחיפוש' : 'עדיין לא נוצרו קהילות סינון'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunitiesTable