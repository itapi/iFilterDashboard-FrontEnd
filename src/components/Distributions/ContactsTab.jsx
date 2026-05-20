import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Plus, Search, Phone, Mail, MessageSquare, Trash2, Edit2, Upload } from 'lucide-react'
import { Table } from '../Table/Table'
import { useGlobalState } from '../../contexts/GlobalStateContext'
import apiClient from '../../utils/api'

const CATEGORIES = [
  'מוסדות (בתי ספר/ישיבות)',
  'קהילות',
  'ארגוני קירוב ונוער',
  'קבוצות הורים',
  'אנשים פרטיים',
  'שיתופי פעולה (יבואנים/חנויות)',
  'שיתופי פעולה ארגוני אינטרנט',
  'אחר',
]

const ITEMS_PER_PAGE = 50

export default function ContactsTab() {
  const { openModal } = useGlobalState()

  const [contacts, setContacts]         = useState([])
  const [templates, setTemplates]       = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(false)
  const [currentPage, setCurrentPage]   = useState(1)

  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState('all')
  const [sortColumn, setSortColumn]     = useState('name')
  const [sortDir, setSortDir]           = useState('asc')

  const isInitialMount = useRef(true)

  // ── Filters → reload from page 1 ────────────────────────────────────────────
  useEffect(() => {
    const delay = search ? 300 : 0
    const t = setTimeout(loadData, delay)
    return () => clearTimeout(t)
  }, [search, category, sortColumn, sortDir])

  const buildFilters = () => ({
    search,
    category: category === 'all' ? '' : category,
    sort:  sortColumn,
    order: sortDir,
  })

  const loadData = async () => {
    try {
      if (isInitialMount.current) {
        setInitialLoading(true)
      } else {
        setTableLoading(true)
      }

      setCurrentPage(1)
      const [contactsRes, templatesRes] = await Promise.all([
        apiClient.getContacts({ ...buildFilters(), page: 1, limit: ITEMS_PER_PAGE }),
        isInitialMount.current ? apiClient.getTemplates() : Promise.resolve(null),
      ])

      if (contactsRes.success) {
        setContacts(contactsRes.data.data)
        setHasMore(contactsRes.data.pagination.has_more)
      }
      if (templatesRes?.success) setTemplates(templatesRes.data)

      isInitialMount.current = false
    } catch {
      toast.error('שגיאה בטעינת אנשי קשר')
    } finally {
      setInitialLoading(false)
      setTableLoading(false)
    }
  }

  const loadMoreContacts = async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      const res = await apiClient.getContacts({ ...buildFilters(), page: nextPage, limit: ITEMS_PER_PAGE })
      if (res.success) {
        setContacts((prev) => [...prev, ...res.data.data])
        setHasMore(res.data.pagination.has_more)
        setCurrentPage(nextPage)
      }
    } catch {
      toast.error('שגיאה בטעינת עוד אנשי קשר')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSortChange = (col, dir) => {
    setSortColumn(col)
    setSortDir(dir)
  }

  // ── Modals ───────────────────────────────────────────────────────────────────
  const openVcfImport = () => {
    openModal({
      layout: 'vcfImport',
      title: 'ייבוא אנשי קשר מ-VCF',
      size: 'md',
      confirmText: 'ייבא נבחרים',
      cancelText: 'ביטול',
      data: {
        onImport: (newContacts) => {
          if (newContacts.length > 0) setContacts((prev) => [...newContacts, ...prev])
        },
      },
    })
  }

  const openAdd = () => {
    openModal({
      layout: 'contactForm',
      title: 'הוספת איש קשר',
      size: 'md',
      confirmText: 'הוסף',
      cancelText: 'ביטול',
      data: { onSave: (c) => setContacts((prev) => [c, ...prev]) },
    })
  }

  const openEdit = (contact) => {
    openModal({
      layout: 'contactForm',
      title: 'עריכת איש קשר',
      size: 'md',
      confirmText: 'שמור',
      cancelText: 'ביטול',
      data: {
        contact,
        onSave: (updated) =>
          setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c))),
      },
    })
  }

  const confirmDelete = (contact) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'מחיקת איש קשר',
      size: 'sm',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      data: { message: `האם למחוק את "${contact.name}"?` },
      onConfirm: async () => {
        try {
          await apiClient.deleteContact(contact.id)
          setContacts((prev) => prev.filter((c) => c.id !== contact.id))
          toast.success('נמחק')
        } catch {
          toast.error('שגיאה במחיקה')
        }
      },
    })
  }

  // ── Optimistic status toggle ─────────────────────────────────────────────────
  const toggleStatus = async (contact, field) => {
    const newVal = !contact[field]
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, [field]: newVal } : c)))
    try {
      await apiClient.updateContactStatus(contact.id, field, newVal)
    } catch {
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, [field]: !newVal } : c)))
      toast.error('שגיאה בעדכון סטטוס')
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const phoneLink = (phone) => `tel:${phone.replace(/\D/g, '')}`

  const resolveMessage = (contact) => {
    const template =
      templates.find((t) => t.category === contact.category) ||
      templates.find((t) => !t.category)
    if (!template) return ''
    return template.body.replace(/\{full_name\}/gi, contact.name)
  }

  const waLink = (contact) => {
    let clean = contact.phone.replace(/\D/g, '')
    if (clean.startsWith('0')) clean = '972' + clean.slice(1)
    const msg = resolveMessage(contact)
    return `https://web.whatsapp.com/send/?phone=${clean}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`
  }

  const openMailModal = (contact) => {
    const template =
      templates.find((t) => t.category === contact.category) ||
      templates.find((t) => !t.category)
    openModal({
      layout: 'sendContactMail',
      title: `שליחת מייל — ${contact.name}`,
      size: 'lg',
      confirmText: 'שלח מייל',
      cancelText: 'ביטול',
      data: {
        contact,
        template: template || {},
        onSent: (id) =>
          setContacts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, email_sent: true } : c))
          ),
      },
    })
  }

  // ── Table columns ────────────────────────────────────────────────────────────
  const tableColumns = [
    { id: 'name',     key: 'name',     label: 'שם',      type: 'text', sortable: true },
    { id: 'phone',    key: 'phone',    label: 'טלפון',   type: 'text', sortable: false },
    { id: 'email',    key: 'email',    label: 'אימייל',  type: 'text', sortable: false },
    {
      id: 'category',
      key: 'category',
      label: 'קטגוריה',
      type: 'custom',
      sortable: true,
      render: (row) => (
        <select
          value={row.category || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={async (e) => {
            const newCat = e.target.value
            setContacts((prev) => prev.map((c) => (c.id === row.id ? { ...c, category: newCat } : c)))
            try {
              await apiClient.updateContact(row.id, { category: newCat })
            } catch {
              setContacts((prev) => prev.map((c) => (c.id === row.id ? { ...c, category: row.category } : c)))
              toast.error('שגיאה בעדכון קטגוריה')
            }
          }}
          className="text-sm border border-transparent hover:border-gray-300 focus:border-blue-400 rounded-lg px-2 py-1 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-full"
        >
          <option value="">ללא קטגוריה</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      ),
    },
    { id: 'notes',    key: 'notes',    label: 'הערות',   type: 'text', sortable: false },
    {
      id: 'status',
      key: 'id',
      label: 'סטטוס',
      type: 'custom',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusToggle active={row.called}        icon={<Phone className="w-3.5 h-3.5" />}        label="שיחה" color="blue"   onClick={() => toggleStatus(row, 'called')} />
          <StatusToggle active={row.email_sent}    icon={<Mail className="w-3.5 h-3.5" />}         label="מייל" color="purple" onClick={() => toggleStatus(row, 'email_sent')} />
          <StatusToggle active={row.whatsapp_sent} icon={<MessageSquare className="w-3.5 h-3.5" />} label="WA"   color="green"  onClick={() => toggleStatus(row, 'whatsapp_sent')} />
        </div>
      ),
    },
    {
      id: 'actions',
      key: 'id',
      label: '',
      type: 'custom',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.phone && (
            <a href={phoneLink(row.phone)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="התקשר" onClick={(e) => e.stopPropagation()}>
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="שלח מייל" onClick={(e) => { e.stopPropagation(); openMailModal(row) }}>
            <Mail className="w-4 h-4" />
          </button>
          {row.phone && (
            <a href={waLink(row)} target="_blank" rel="noreferrer" className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp" onClick={(e) => e.stopPropagation()}>
              <MessageSquare className="w-4 h-4" />
            </a>
          )}
          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="עריכה" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="מחיקה" onClick={(e) => { e.stopPropagation(); confirmDelete(row) }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  // ── Stats (computed from loaded rows) ────────────────────────────────────────
  const stats = {
    total:   contacts.length,
    called:  contacts.filter((c) => c.called).length,
    emailed: contacts.filter((c) => c.email_sent).length,
    wa:      contacts.filter((c) => c.whatsapp_sent).length,
    done:    contacts.filter((c) => c.called && (c.email_sent || c.whatsapp_sent)).length,
  }

  // ── Initial full-page spinner ────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">טוען אנשי קשר...</span>
        </div>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="סה״כ" value={stats.total} color="gray" />
        <StatCard label="שוחח" value={stats.called} color="blue" />
        <StatCard label="מייל נשלח" value={stats.emailed} color="purple" />
        <StatCard label="WA נשלח" value={stats.wa} color="green" />
        <StatCard label="הושלם" value={stats.done} color="emerald" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש..."
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">כל הקטגוריות</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={openVcfImport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            ייבוא VCF
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            הוסף איש קשר
          </button>
        </div>
      </div>

      {/* Table with filter-reload overlay + infinite scroll */}
      {tableLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center min-h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">מעדכן נתונים...</span>
          </div>
        </div>
      ) : (
        <Table
          tableConfig={{ columns: tableColumns, data: contacts, tableType: 'contacts' }}
          onLoadMore={loadMoreContacts}
          hasMore={hasMore}
          loading={loadingMore}
          stickyHeader
          sortColumn={sortColumn}
          sortDirection={sortDir}
          onSortChange={handleSortChange}
        />
      )}
    </div>
  )
}

function StatusToggle({ active, icon, label, color, onClick }) {
  const colors = {
    blue:   active ? 'bg-blue-100 text-blue-700 border-blue-200'     : 'bg-gray-50 text-gray-400 border-gray-200',
    purple: active ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-200',
    green:  active ? 'bg-green-100 text-green-700 border-green-200'   : 'bg-gray-50 text-gray-400 border-gray-200',
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={label}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-xs font-medium transition-all ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    gray:    'bg-gray-50   text-gray-700',
    blue:    'bg-blue-50   text-blue-700',
    purple:  'bg-purple-50 text-purple-700',
    green:   'bg-green-50  text-green-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`rounded-xl px-4 py-3 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}
