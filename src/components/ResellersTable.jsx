import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Users, Search, X, Check, Phone, Mail, MapPin, Briefcase } from 'lucide-react'
import apiClient from '../utils/api'

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:       { label: 'חדש',       bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  contacted: { label: 'נוצר קשר', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  approved:  { label: 'מאושר',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  rejected:  { label: 'נדחה',     bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400' },
}

const PROFESSION_LABELS = {
  device_seller:  'מוכר מכשירים',
  service_center: 'מרכז שירות / טכנאי',
  community:      'רכז קהילה / מוסד',
  it:             'איש IT / מחשבים',
  other:          'אחר',
}

const STATUS_TABS = [
  { value: 'all',       label: 'הכל' },
  { value: 'new',       label: 'חדשים' },
  { value: 'contacted', label: 'נוצר קשר' },
  { value: 'approved',  label: 'מאושרים' },
  { value: 'rejected',  label: 'נדחים' },
]

const ITEMS_PER_PAGE = 25

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value ?? 0}</p>
  </div>
)

// ─── Reseller row card ────────────────────────────────────────────────────────
const ResellerCard = ({ reseller, onStatusChange, onAcceptToggle }) => {
  const cfg = STATUS_CONFIG[reseller.status] || STATUS_CONFIG.new
  const [statusLoading, setStatusLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setStatusLoading(true)
    try {
      const res = await apiClient.updateResellerStatus(reseller.id, newStatus)
      if (res.success) {
        onStatusChange(reseller.id, newStatus)
        toast.success('הסטטוס עודכן')
      } else {
        throw new Error(res.message)
      }
    } catch (err) {
      toast.error('שגיאה בעדכון הסטטוס')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAcceptToggle = async () => {
    setAcceptLoading(true)
    try {
      const newVal = !reseller.is_accepted
      const res = await apiClient.acceptReseller(reseller.id, newVal)
      if (res.success) {
        onAcceptToggle(reseller.id, newVal)
        toast.success(newVal ? 'המשווק אושר' : 'האישור בוטל')
      } else {
        throw new Error(res.message)
      }
    } catch (err) {
      toast.error('שגיאה בעדכון האישור')
    } finally {
      setAcceptLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all p-5 ${reseller.is_accepted ? 'border-green-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-lg ${reseller.is_accepted ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
          {reseller.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <p className="font-semibold text-gray-900">{reseller.full_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(reseller.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Accepted badge */}
              {reseller.is_accepted ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Check className="w-3 h-3" />
                  משווק פעיל
                </span>
              ) : null}

              {/* Status badge */}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <a href={`tel:${reseller.phone}`} className="hover:text-gray-800 transition-colors">{reseller.phone}</a>
              {reseller.whatsapp && reseller.whatsapp !== reseller.phone && (
                <span className="text-gray-400 text-xs">(WA: {reseller.whatsapp})</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <a href={`mailto:${reseller.email}`} className="hover:text-gray-800 transition-colors">{reseller.email}</a>
            </span>
            {reseller.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {reseller.city}
              </span>
            )}
            {reseller.profession && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {PROFESSION_LABELS[reseller.profession] || reseller.profession}
              </span>
            )}
          </div>

          {/* Notes */}
          {reseller.notes && (
            <p className="text-gray-500 text-sm bg-gray-50 rounded-xl px-3 py-2 mb-3 line-clamp-2">
              {reseller.notes}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status select */}
            <select
              value={reseller.status}
              onChange={handleStatusChange}
              disabled={statusLoading}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-50 cursor-pointer"
              dir="rtl"
            >
              <option value="new">חדש</option>
              <option value="contacted">נוצר קשר</option>
              <option value="approved">מאושר</option>
              <option value="rejected">נדחה</option>
            </select>

            {/* Accept / Revoke button */}
            <button
              onClick={handleAcceptToggle}
              disabled={acceptLoading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                ${reseller.is_accepted
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
            >
              <Check className="w-3.5 h-3.5" />
              {reseller.is_accepted ? 'בטל אישור' : 'אשר כמשווק'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const ResellersTable = () => {
  const [resellers, setResellers]           = useState([])
  const [stats, setStats]                   = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading]     = useState(false)
  const [loadingMore, setLoadingMore]       = useState(false)

  const [statusFilter, setStatusFilter]     = useState('all')
  const [searchTerm, setSearchTerm]         = useState('')
  const [currentPage, setCurrentPage]       = useState(1)
  const [hasMore, setHasMore]               = useState(false)

  const isInitialMount = useRef(true)
  const searchTimeout  = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(searchTimeout.current)
  }, [searchTerm])

  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.getResellerStatistics()
      if (res.success) setStats(res.data)
    } catch { /* silent */ }
  }, [])

  const loadResellers = useCallback(async () => {
    const isFirst = isInitialMount.current
    isFirst ? setInitialLoading(true) : setTableLoading(true)

    const params = {
      status: statusFilter,
      sort: 'created_at',
      order: 'DESC',
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }

    const request = apiClient.getResellers(1, ITEMS_PER_PAGE, params).then(res => {
      if (!res.success) throw new Error('שגיאה בטעינת הבקשות')
      setResellers(res.data?.data || [])
      setCurrentPage(1)
      setHasMore(res.data?.pagination?.has_more || false)
      isInitialMount.current = false
      return res
    })

    try {
      if (isFirst) {
        await request
      } else {
        await toast.promise(request, {
          pending: 'טוען בקשות...',
          success: { render: 'הבקשות עודכנו', autoClose: 1500 },
          error: { render: ({ data }) => data?.message || 'שגיאה בטעינת הבקשות' },
        })
      }
    } catch { /* handled */ } finally {
      setInitialLoading(false)
      setTableLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadResellers() }, [loadResellers])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    const params = {
      status: statusFilter,
      sort: 'created_at',
      order: 'DESC',
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }
    try {
      await toast.promise(
        apiClient.getResellers(nextPage, ITEMS_PER_PAGE, params).then(res => {
          if (!res.success) throw new Error('שגיאה בטעינת בקשות נוספות')
          setResellers(prev => [...prev, ...(res.data?.data || [])])
          setCurrentPage(nextPage)
          setHasMore(res.data?.pagination?.has_more || false)
          return res
        }),
        {
          pending: 'טוען...',
          success: { render: 'נטענו', autoClose: 1200 },
          error: { render: ({ data }) => data?.message || 'שגיאה' },
        }
      )
    } catch { /* handled */ } finally {
      setLoadingMore(false)
    }
  }

  const handleStatusChange = (id, newStatus) => {
    setResellers(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    loadStats()
  }

  const handleAcceptToggle = (id, newVal) => {
    setResellers(prev => prev.map(r => r.id === id ? { ...r, is_accepted: newVal } : r))
    loadStats()
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">טוען בקשות משווקים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">בקשות משווקים</h1>
            <p className="text-sm text-gray-500">ניהול הרשמות סוכנים ומשווקים</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="סה״כ"       value={stats.total}     accent="text-gray-800" />
          <StatCard label="חדשים"      value={stats.new}       accent="text-blue-600" />
          <StatCard label="נוצר קשר"  value={stats.contacted} accent="text-yellow-600" />
          <StatCard label="מאושרים"   value={stats.approved}  accent="text-green-600" />
          <StatCard label="נדחים"     value={stats.rejected}  accent="text-red-500" />
          <StatCard label="משווקים פעילים" value={stats.accepted} accent="text-emerald-600" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${statusFilter === tab.value
                    ? 'bg-purple-600 text-white shadow-sm'
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
              placeholder="חיפוש לפי שם, אימייל, טלפון, עיר..."
              className="w-full pr-9 pl-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
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

      {/* List */}
      {tableLoading ? (
        <div className="flex items-center justify-center py-16">
          <Users className="w-8 h-8 text-purple-400 animate-pulse" />
        </div>
      ) : resellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {debouncedSearch || statusFilter !== 'all' ? 'לא נמצאו בקשות' : 'אין בקשות משווקים עדיין'}
          </h3>
          <p className="text-gray-400 text-sm">
            {debouncedSearch || statusFilter !== 'all' ? 'נסה לשנות את מסנני החיפוש' : 'הרשמות חדשות יופיעו כאן'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resellers.map(reseller => (
            <ResellerCard
              key={reseller.id}
              reseller={reseller}
              onStatusChange={handleStatusChange}
              onAcceptToggle={handleAcceptToggle}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'טוען...' : 'טען עוד בקשות'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResellersTable
