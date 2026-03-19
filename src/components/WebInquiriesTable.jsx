import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Inbox, Mail, Search, X } from 'lucide-react'
import apiClient from '../utils/api'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { useUser } from '../contexts/GlobalStateContext'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:       { label: 'חדשה',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  read:      { label: 'נקראה',   bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  responded: { label: 'נענתה',   bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  closed:    { label: 'סגורה',   bg: 'bg-gray-100',  text: 'text-gray-600',   dot: 'bg-gray-400' },
}

const FILTER_TABS = [
  { value: 'all',       label: 'הכל' },
  { value: 'new',       label: 'חדשות' },
  { value: 'read',      label: 'נקראו' },
  { value: 'responded', label: 'נענו' },
  { value: 'closed',    label: 'סגורות' },
]

const ITEMS_PER_PAGE = 25

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value ?? 0}</p>
  </div>
)

// ─── Inquiry row card ─────────────────────────────────────────────────────────
const InquiryCard = ({ inquiry, onClick }) => {
  const cfg = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.new

  return (
    <div
      onClick={() => onClick(inquiry)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-blue-700 font-bold text-base">
            {inquiry.full_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{inquiry.full_name}</p>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-0.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{inquiry.email}</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Message preview */}
          <p className="text-gray-600 text-sm line-clamp-2 mt-2 leading-relaxed">
            {inquiry.content}
          </p>

          {/* Date */}
          <p className="text-xs text-gray-400 mt-2">{formatDate(inquiry.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const WebInquiriesTable = () => {
  const { openModal } = useGlobalState()
  const { user } = useUser()

  const [inquiries, setInquiries]       = useState([])
  const [stats, setStats]               = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [loadingMore, setLoadingMore]   = useState(false)

  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm]     = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const [hasMore, setHasMore]           = useState(false)

  const isInitialMount = useRef(true)
  const searchTimeout  = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [searchTerm])

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.getWebInquiryStatistics()
      if (res.success) setStats(res.data)
    } catch {
      // silent
    }
  }, [])

  // Load inquiries
  const loadInquiries = useCallback(async () => {
    const isFirst = isInitialMount.current
    isFirst ? setInitialLoading(true) : setTableLoading(true)

    const params = {
      status: statusFilter,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      sort: 'created_at',
      order: 'DESC',
    }

    const request = apiClient.getWebInquiries(1, ITEMS_PER_PAGE, params).then(res => {
      if (!res.success) throw new Error('שגיאה בטעינת הפניות')
      setInquiries(res.data?.data || [])
      setCurrentPage(1)
      setHasMore(res.data?.pagination?.has_more || false)
      isInitialMount.current = false
      return res
    })

    try {
      if (isFirst) {
        // Full-screen loader already shown — just await silently
        await request
      } else {
        await toast.promise(request, {
          pending: 'טוען פניות...',
          success: { render: 'הפניות עודכנו', autoClose: 1500 },
          error: { render: ({ data }) => data?.message || 'שגיאה בטעינת הפניות' },
        })
      }
    } catch {
      // handled by toast.promise or silent on first load
    } finally {
      setInitialLoading(false)
      setTableLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadInquiries()
  }, [loadInquiries])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    const params = {
      status: statusFilter,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      sort: 'created_at',
      order: 'DESC',
    }
    try {
      await toast.promise(
        apiClient.getWebInquiries(nextPage, ITEMS_PER_PAGE, params).then(res => {
          if (!res.success) throw new Error('שגיאה בטעינת פניות נוספות')
          setInquiries(prev => [...prev, ...(res.data?.data || [])])
          setCurrentPage(nextPage)
          setHasMore(res.data?.pagination?.has_more || false)
          return res
        }),
        {
          pending: 'טוען פניות נוספות...',
          success: { render: 'הפניות נטענו', autoClose: 1500 },
          error: { render: ({ data }) => data?.message || 'שגיאה בטעינת פניות נוספות' },
        }
      )
    } catch {
      // handled by toast.promise
    } finally {
      setLoadingMore(false)
    }
  }

  const handleInquiryClick = (inquiry) => {
    openModal({
      layout: 'webInquiryResponse',
      title: `השב ל${inquiry.full_name}`,
      size: 'md',
      confirmText: 'שלח מייל',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      closeOnBackdropClick: false,
      closeOnEscape: true,
      data: {
        inquiry,
        adminName: user ? `${user.first_name} ${user.last_name}`.trim() : 'צוות iFilter',
        onSent: (id, newStatus) => {
          setInquiries(prev =>
            prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
          )
          loadStats()
        },
      },
    })
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">טוען פניות...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Inbox className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">פניות אתר</h1>
            <p className="text-sm text-gray-500">הודעות שנשלחו דרך טופס האתר</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="סה״כ"    value={stats.total}     accent="text-gray-800" />
          <StatCard label="חדשות"   value={stats.new}       accent="text-blue-600" />
          <StatCard label="נקראו"   value={stats.read}      accent="text-yellow-600" />
          <StatCard label="נענו"    value={stats.responded} accent="text-green-600" />
          <StatCard label="סגורות"  value={stats.closed}    accent="text-gray-500" />
        </div>
      )}

      {/* Filters row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${statusFilter === tab.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab.label}
                {stats && tab.value !== 'all' && (
                  <span className={`mr-1.5 text-xs ${statusFilter === tab.value ? 'opacity-80' : 'text-gray-400'}`}>
                    ({stats[tab.value] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs mr-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל, תוכן..."
              className="w-full pr-9 pl-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {tableLoading ? (
        <div className="flex items-center justify-center py-16">
          <Inbox className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Inbox className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {debouncedSearch || statusFilter !== 'all' ? 'לא נמצאו פניות' : 'אין פניות עדיין'}
          </h3>
          <p className="text-gray-400 text-sm">
            {debouncedSearch || statusFilter !== 'all' ? 'נסה לשנות את מסנני החיפוש' : 'פניות שישלחו דרך האתר יופיעו כאן'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inquiry => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              onClick={handleInquiryClick}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'טוען...' : 'טען עוד פניות'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WebInquiriesTable
