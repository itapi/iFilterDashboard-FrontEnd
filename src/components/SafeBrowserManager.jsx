import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Plus, Search, Globe, Shield, ShieldOff, Eye, Zap, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useGlobalState } from '../contexts/GlobalStateContext'
import apiClient from '../utils/api'
import { Table } from './Table/Table'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const MODE_CONFIG = {
  AI_FILTERED: { label: 'סינון AI',   bg: 'bg-blue-100',  text: 'text-blue-700',  icon: Zap },
  TEXT_ONLY:   { label: 'טקסט בלבד', bg: 'bg-green-100', text: 'text-green-700', icon: Eye },
  FULL_OPEN:   { label: 'פתוח',       bg: 'bg-gray-100',  text: 'text-gray-700',  icon: Globe },
  BLOCKED:     { label: 'חסום',       bg: 'bg-red-100',   text: 'text-red-700',   icon: ShieldOff },
}

const STATUS_CONFIG = {
  pending:  { label: 'ממתין',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  approved: { label: 'אושר',   bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
  rejected: { label: 'נדחה',   bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
}

const ModeTag = ({ mode }) => {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.AI_FILTERED
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

const StatusTag = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

// ─── Domain Policies Tab ──────────────────────────────────────────────────────

function DomainPoliciesTab({ openModal }) {
  const [policies, setPolicies]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [modeFilter, setModeFilter]     = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const [pagination, setPagination]     = useState(null)

  const fetchPolicies = useCallback(async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page
    if (resetPage) setPage(1)
    setLoading(true)
    try {
      const params = { page: targetPage, limit: 25 }
      if (search)            params.search    = search
      if (modeFilter)        params.mode      = modeFilter
      if (activeFilter !== '') params.is_active = activeFilter
      const res = await apiClient.getDomainPolicies(params)
      if (res?.success) {
        setPolicies(res.data || [])
        const pag = res.pagination || null
        setPagination(pag ? { ...pag, has_more: pag.current_page < pag.total_pages } : null)
      } else {
        toast.error('שגיאה בטעינת הנתונים')
      }
    } catch { toast.error('שגיאה בטעינת הנתונים') }
    finally { setLoading(false) }
  }, [search, modeFilter, activeFilter, page])

  useEffect(() => { fetchPolicies() }, [fetchPolicies])

  const openForm = (policy = null) => {
    openModal({
      layout: 'domainPolicyForm',
      title: policy ? 'עריכת דומיין' : 'הוספת דומיין חדש',
      size: 'md',
      data: {
        policy,
        onSave: async (formData) => {
          const res = policy
            ? await apiClient.updateDomainPolicy(policy.id, formData)
            : await apiClient.createDomainPolicy(formData)
          if (!res?.success) throw new Error(res?.error || 'Failed')
          fetchPolicies(true)
        }
      },
      showConfirmButton: true, showCancelButton: true,
      confirmText: 'שמור', cancelText: 'ביטול',
    })
  }

  const handleToggleActive = async (policy) => {
    try {
      const res = await apiClient.updateDomainPolicy(policy.id, { is_active: policy.is_active ? 0 : 1 })
      if (res?.success) {
        setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, is_active: policy.is_active ? 0 : 1 } : p))
      } else { toast.error('שגיאה בעדכון הסטטוס') }
    } catch { toast.error('שגיאה בעדכון הסטטוס') }
  }

  const handleDelete = (policy) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת דומיין',
      size: 'sm',
      data: { message: `האם למחוק את הכלל עבור "${policy.domain}"?` },
      showConfirmButton: true, showCancelButton: true,
      confirmText: 'מחק', cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          const res = await apiClient.deleteDomainPolicy(policy.id)
          if (res?.success) {
            setPolicies(prev => prev.filter(p => p.id !== policy.id))
            toast.success('הדומיין נמחק בהצלחה')
          } else { toast.error('שגיאה במחיקת הדומיין') }
        } catch { toast.error('שגיאה במחיקת הדומיין') }
      }
    })
  }

  const columns = [
    {
      id: 'domain',
      key: 'domain',
      label: 'דומיין',
      type: 'custom',
      render: (policy) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <a
              href={`https://${policy.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >{policy.domain}</a>
            {!!policy.include_subdomains && <span className="mr-1.5 text-xs text-gray-400">+ תת-דומיינים</span>}
            {policy.description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{policy.description}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'mode',
      key: 'mode',
      label: 'מצב',
      type: 'custom',
      render: (policy) => <ModeTag mode={policy.mode} />,
    },
    {
      id: 'is_active',
      key: 'is_active',
      label: 'פעיל',
      type: 'custom',
      render: (policy) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleActive(policy) }}
          className={`relative w-10 h-5 rounded-full transition-colors ${policy.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${policy.is_active ? 'right-0.5' : 'left-0.5'}`} />
        </button>
      ),
    },
    {
      id: 'actions',
      key: 'id',
      label: '',
      type: 'custom',
      render: (policy) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openForm(policy) }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="עריכה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(policy) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="מחיקה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); fetchPolicies(true) }}
            placeholder="חיפוש לפי דומיין או תיאור..."
            className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <select value={modeFilter} onChange={e => { setModeFilter(e.target.value); fetchPolicies(true) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">כל המצבים</option>
          <option value="AI_FILTERED">סינון AI</option>
          <option value="TEXT_ONLY">טקסט בלבד</option>
          <option value="FULL_OPEN">פתוח</option>
          <option value="BLOCKED">חסום</option>
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); fetchPolicies(true) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">כל הסטטוסים</option>
          <option value="1">פעיל</option>
          <option value="0">לא פעיל</option>
        </select>
        <button onClick={() => fetchPolicies()} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="רענן">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {pagination && <span className="text-xs text-gray-400 mr-auto">{pagination.total} כללים סה"כ</span>}
        <button onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />הוספת דומיין
        </button>
      </div>

      <Table
        tableConfig={{ columns, data: policies }}
        loading={loading}
        hasMore={false}
      />
      {pagination?.total_pages > 1 && (
        <div className="px-5 py-4 flex items-center justify-between mt-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">הקודם</button>
          <span className="text-sm text-gray-500">עמוד {pagination.current_page} מתוך {pagination.total_pages}</span>
          <button disabled={!pagination.has_more} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">הבא</button>
        </div>
      )}
    </>
  )
}

// ─── Review Requests Tab ──────────────────────────────────────────────────────

function ReviewRequestsTab({ openModal }) {
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage]                 = useState(1)
  const [pagination, setPagination]     = useState(null)

  const fetchRequests = useCallback(async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page
    if (resetPage) setPage(1)
    setLoading(true)
    try {
      const params = { page: targetPage, limit: 25 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await apiClient.getReviewRequests(params)
      if (res?.success) {
        setRequests(res.data || [])
        const pag = res.pagination || null
        setPagination(pag ? { ...pag, has_more: pag.current_page < pag.total_pages } : null)
      } else { toast.error('שגיאה בטעינת הנתונים') }
    } catch { toast.error('שגיאה בטעינת הנתונים') }
    finally { setLoading(false) }
  }, [search, statusFilter, page])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleApprove = (req) => {
    openModal({
      layout: 'domainPolicyForm',
      title: `אישור בקשה — ${req.domain}`,
      size: 'md',
      data: {
        policy: { domain: req.domain, _isNew: true },
        onSave: async (formData) => {
          const policyRes = await apiClient.createDomainPolicy(formData)
          if (!policyRes?.success) throw new Error(policyRes?.error || 'Failed to create policy')
          const reviewRes = await apiClient.updateReviewRequest(req.id, { status: 'approved' })
          if (!reviewRes?.success) throw new Error(reviewRes?.error || 'Failed to update request')
          setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
        }
      },
      showConfirmButton: true, showCancelButton: true,
      confirmText: 'אשר והוסף כלל', cancelText: 'ביטול',
    })
  }

  const handleReject = (req) => {
    openModal({
      layout: 'reviewReject',
      title: 'דחיית בקשה',
      size: 'sm',
      data: {
        domain: req.domain,
        onConfirm: async (notes) => {
          const res = await apiClient.updateReviewRequest(req.id, { status: 'rejected', admin_notes: notes })
          if (!res?.success) throw new Error(res?.error || 'Failed')
          setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', admin_notes: notes } : r))
          toast.success(`הבקשה עבור ${req.domain} נדחתה`)
        }
      },
      showConfirmButton: true, showCancelButton: true,
      confirmText: 'דחה בקשה', cancelText: 'ביטול',
    })
  }

  const handleDelete = (req) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת בקשה',
      size: 'sm',
      data: { message: `האם למחוק את הבקשה עבור "${req.domain}"?` },
      showConfirmButton: true, showCancelButton: true,
      confirmText: 'מחק', cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          const res = await apiClient.deleteReviewRequest(req.id)
          if (res?.success) {
            setRequests(prev => prev.filter(r => r.id !== req.id))
            toast.success('הבקשה נמחקה')
          } else { toast.error('שגיאה במחיקת הבקשה') }
        } catch { toast.error('שגיאה במחיקת הבקשה') }
      }
    })
  }

  const columns = [
    {
      id: 'domain',
      key: 'domain',
      label: 'דומיין',
      type: 'custom',
      render: (req) => (
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a
              href={`https://${req.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-900 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >{req.domain}</a>
          </div>
          {req.admin_notes && (
            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate pr-6">{req.admin_notes}</p>
          )}
        </div>
      ),
    },
    {
      id: 'client_unique_id',
      key: 'client_unique_id',
      label: 'לקוח',
      type: 'custom',
      render: (req) => (
        <span className="text-gray-500 text-xs font-mono">
          {req.client_unique_id || <span className="text-gray-300">—</span>}
        </span>
      ),
    },
    {
      id: 'status',
      key: 'status',
      label: 'סטטוס',
      type: 'custom',
      render: (req) => <StatusTag status={req.status} />,
    },
    {
      id: 'created_at',
      key: 'created_at',
      label: 'תאריך',
      type: 'custom',
      render: (req) => <span className="text-gray-400 text-xs">{formatDate(req.created_at)}</span>,
    },
    {
      id: 'actions',
      key: 'id',
      label: '',
      type: 'custom',
      render: (req) => (
        <div className="flex items-center justify-end gap-1.5">
          {req.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(req) }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />אשר
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(req) }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />דחה
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(req) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="מחיקה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); fetchRequests(true) }}
            placeholder="חיפוש לפי דומיין או לקוח..."
            className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetchRequests(true) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">כל הסטטוסים</option>
          <option value="pending">ממתין</option>
          <option value="approved">אושר</option>
          <option value="rejected">נדחה</option>
        </select>
        <button onClick={() => fetchRequests()} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="רענן">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {pagination && <span className="text-xs text-gray-400 mr-auto">{pagination.total} בקשות סה"כ</span>}
      </div>

      <Table
        tableConfig={{ columns, data: requests }}
        loading={loading}
        hasMore={false}
      />
      {pagination?.total_pages > 1 && (
        <div className="px-5 py-4 flex items-center justify-between mt-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">הקודם</button>
          <span className="text-sm text-gray-500">עמוד {pagination.current_page} מתוך {pagination.total_pages}</span>
          <button disabled={!pagination.has_more} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">הבא</button>
        </div>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'policies',  label: 'כללי סינון' },
  { id: 'reviews',   label: 'בקשות סקירה' },
]

export default function SafeBrowserManager() {
  const { openModal } = useGlobalState()
  const [activeTab, setActiveTab] = useState('policies')

  return (
    <div className="p-8" dir="rtl">

      {/* Header */}
      <div className="mb-7 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SafeBrowser</h1>
          <p className="text-sm text-gray-500">ניהול סינון דומיינים ובקשות סקירה</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-7">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'policies'
        ? <DomainPoliciesTab openModal={openModal} />
        : <ReviewRequestsTab openModal={openModal} />
      }
    </div>
  )
}
