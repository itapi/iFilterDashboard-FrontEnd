import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Smartphone, Printer, Download, Copy, Check,
  MessageCircle, FileText, Palette, Layers, ShoppingBag,
  Award, Star, Zap, Plus, Pencil, Trash2, Image, Link,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { usePermissions } from '../hooks/usePermissions'
import apiClient from '../utils/api'

// ─── Icon map (string → component) ───────────────────────────────────────────
const ICON_MAP = {
  FileText, MessageCircle, Palette, Layers, ShoppingBag,
  Award, Smartphone, Printer, Image, Download, Link, Star, Shield,
}

// ─── Color scheme map ─────────────────────────────────────────────────────────
const COLORS = {
  blue:   { iconBg: 'rgba(73,127,197,0.1)',   badgeBg: '#eef3fb', badgeColor: '#3a6ab8', btn: 'linear-gradient(135deg,#31353a 0%,#497fc5 100%)' },
  green:  { iconBg: 'rgba(46,204,113,0.12)',  badgeBg: '#edfbf4', badgeColor: '#1aa061', btn: 'linear-gradient(135deg,#31353a 0%,#1aa061 100%)' },
  purple: { iconBg: 'rgba(155,89,182,0.1)',   badgeBg: '#f3eeff', badgeColor: '#7c3aed', btn: 'linear-gradient(135deg,#31353a 0%,#7c3aed 100%)' },
  orange: { iconBg: 'rgba(243,156,18,0.12)',  badgeBg: '#fdf7e3', badgeColor: '#c07d0a', btn: 'linear-gradient(135deg,#31353a 0%,#c07d0a 100%)' },
  yellow: { iconBg: 'rgba(241,196,15,0.12)',  badgeBg: '#fffbe6', badgeColor: '#9a6e00', btn: 'linear-gradient(135deg,#31353a 0%,#9a6e00 100%)' },
}

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handle}
      style={{
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '0.75rem', fontWeight: 600,
        padding: '6px 12px', borderRadius: '8px',
        border: copied ? 'none' : '1px solid #c3f0d9',
        background: copied ? 'linear-gradient(135deg,#2ecc71,#1aa061)' : '#ffffff',
        color: copied ? 'white' : '#1aa061',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'Assistant, sans-serif',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'הועתק! ✓' : 'העתק טקסט'}
    </button>
  )
}

// ─── Admin action buttons ─────────────────────────────────────────────────────
const AdminActions = ({ onEdit, onDelete }) => (
  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
    <button
      onClick={onEdit}
      title="עריכה"
      style={{
        width: '28px', height: '28px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#eef3fb', border: '1px solid #dce8f7',
        color: '#497fc5', cursor: 'pointer',
      }}
    >
      <Pencil size={13} />
    </button>
    <button
      onClick={onDelete}
      title="מחיקה"
      style={{
        width: '28px', height: '28px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff0f0', border: '1px solid #fdd5d5',
        color: '#dc2626', cursor: 'pointer',
      }}
    >
      <Trash2 size={13} />
    </button>
  </div>
)

// ─── Download card ────────────────────────────────────────────────────────────
const DownloadCard = ({ item, isAdmin, onEdit, onDelete }) => {
  const c     = COLORS[item.color_scheme] || COLORS.blue
  const Icon  = ICON_MAP[item.icon_name]  || FileText

  return (
    <div style={{
      background: '#ffffff', borderRadius: '16px',
      border: '1px solid #edf0f2',
      boxShadow: '0 2px 8px rgba(30,33,36,0.06)',
      padding: '20px', display: 'flex', flexDirection: 'column',
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,33,36,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,33,36,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.iconBg, flexShrink: 0,
        }}>
          <Icon size={22} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.badge && (
            <span style={{
              background: c.badgeBg, color: c.badgeColor,
              fontSize: '0.72rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: '20px',
              fontFamily: 'Assistant, sans-serif',
            }}>{item.badge}</span>
          )}
          {isAdmin && <AdminActions onEdit={onEdit} onDelete={onDelete} />}
        </div>
      </div>

      <h3 style={{ fontWeight: 700, color: '#1e2124', marginBottom: '8px', fontSize: '0.95rem', fontFamily: 'Assistant, sans-serif' }}>
        {item.title}
      </h3>
      {item.description && (
        <p style={{ color: '#5e656e', fontSize: '0.84rem', lineHeight: 1.6, flex: 1, marginBottom: '16px', fontFamily: 'Assistant, sans-serif' }}>
          {item.description}
        </p>
      )}
      <a
        href={item.download_url || '#'}
        target={item.download_url ? '_blank' : undefined}
        rel="noopener noreferrer"
        style={{
          background: c.btn, color: 'white',
          fontSize: '0.85rem', fontWeight: 700,
          padding: '10px 16px', borderRadius: '50px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(73,127,197,0.25)',
          transition: 'opacity 0.15s, transform 0.15s',
          fontFamily: 'Assistant, sans-serif',
          marginTop: 'auto',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.02)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Download size={15} />
        הורד
      </a>
    </div>
  )
}

// ─── WhatsApp template card ───────────────────────────────────────────────────
const WATemplate = ({ item, isAdmin, onEdit, onDelete }) => (
  <div style={{
    background: 'linear-gradient(135deg, #f0fbf5, #edfbf4)',
    borderRight: '4px solid #2ecc71',
    borderRadius: '12px',
    padding: '16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
      <span style={{
        fontSize: '0.72rem', fontWeight: 700,
        background: 'rgba(46,204,113,0.15)', color: '#1aa061',
        padding: '3px 10px', borderRadius: '20px',
      }}>{item.title}</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <CopyButton text={item.template_text || ''} />
        {isAdmin && <AdminActions onEdit={onEdit} onDelete={onDelete} />}
      </div>
    </div>
    <p style={{ color: '#31353a', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
      {item.template_text}
    </p>
  </div>
)

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, iconBg, iconColor, title, subtitle, isAdmin, onAdd }) => {
  const Icon = icon
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0 28px', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', background: iconBg, borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(73,127,197,0.15)', flexShrink: 0,
      }}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e2124', margin: 0 }}>{title}</h2>
        <p style={{ color: '#5e656e', fontSize: '0.85rem', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
    </div>
    {isAdmin && (
      <button
        onClick={onAdd}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '0.82rem', fontWeight: 700,
          padding: '8px 16px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #497fc5, #3a6ab8)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(73,127,197,0.3)',
          transition: 'opacity 0.15s',
          fontFamily: 'Assistant, sans-serif',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <Plus size={14} />
        הוסף פריט
      </button>
    )}
  </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptySection = ({ isAdmin }) => (
  <div style={{
    textAlign: 'center', padding: '40px 20px',
    background: '#f9fafb', borderRadius: '16px',
    border: '2px dashed #e5e7eb',
    color: '#9ca3af',
  }}>
    <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'Assistant, sans-serif' }}>
      {isAdmin ? 'אין פריטים עדיין. לחץ "הוסף פריט" להתחיל.' : 'אין חומרים זמינים כרגע.'}
    </p>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────
const ResellerHub = () => {
  const { openModal } = useGlobalState()
  const { isSuperAdmin } = usePermissions()
  const isAdmin = isSuperAdmin()

  const [items, setItems] = useState({ digital: [], print: [], whatsapp: [] })
  const [loading, setLoading] = useState(true)

  const loadItems = useCallback(async () => {
    try {
      const res = await apiClient.getResellerHubItems()
      const grouped = { digital: [], print: [], whatsapp: [] }
      const list = Array.isArray(res?.data) ? res.data : []
      list.forEach(item => {
          if (grouped[item.section]) grouped[item.section].push(item)
      })
      setItems(grouped)
    } catch {
      toast.error('שגיאה בטעינת חומרי השיווק')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const openItemModal = (section, item = null) => {
    openModal({
      layout: 'resellerHubItem',
      title: item ? 'עריכת פריט' : 'הוספת פריט',
      data: { section, item, onSave: loadItems },
      confirmText: item ? 'שמור שינויים' : 'הוסף',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      size: 'md',
      closeOnEscape: true,
      closeOnBackdropClick: true,
    })
  }

  const confirmDelete = (item) => {
    openModal({
      layout: 'deleteConfirm',
      title: 'אישור מחיקה',
      data: { itemName: item.title, itemType: 'פריט' },
      confirmText: 'מחק',
      cancelText: 'ביטול',
      showConfirmButton: true,
      showCancelButton: true,
      size: 'sm',
      onConfirm: async () => {
        try {
          await apiClient.deleteResellerHubItem(item.id)
          toast.success('הפריט נמחק')
          loadItems()
        } catch {
          toast.error('שגיאה במחיקת הפריט')
        }
      },
    })
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', fontFamily: 'Assistant, sans-serif' }} dir="rtl">

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e2124 0%, #24344f 45%, #2d5080 75%, #497fc5 100%)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(73,127,197,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 48px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px',
                background: 'linear-gradient(135deg, #1e2124, #2d4a6e)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              }}>
                <Shield size={20} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>iFilter</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.12)', borderRadius: '20px',
              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 6px #2ecc71', flexShrink: 0 }} />
              אזור משווקים מורשים
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(243,156,18,0.2)', border: '1px solid rgba(243,156,18,0.35)',
              borderRadius: '20px', padding: '6px 16px',
              fontSize: '0.82rem', fontWeight: 600, marginBottom: '20px', color: '#f9d87e',
            }}>
              <Star size={13} fill="#f39c12" color="#f39c12" />
              נבחרת המשווקים של iFilter
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: '16px', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              ברוך הבא לנבחרת<br />המשווקים של iFilter!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
              כאן תמצא את כל הכלים והחומרים שיעזרו לך להציע את iFilter ללקוחות שלך בקלות ולהגדיל את ההכנסות.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
              {[['📱', 'חומרי דיגיטל'], ['🛒', 'חומרי פרינט'], ['24/7', 'זמין תמיד']].map(([val, lbl]) => (
                <div key={lbl} style={{
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
                  borderRadius: '14px', padding: '14px 8px', textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1200 50" preserveAspectRatio="none" style={{ width: '100%', height: '40px', display: 'block', fill: '#f6f8f9' }}>
          <path d="M0,50 C300,0 900,50 1200,0 L1200,50 Z" />
        </svg>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 64px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #eef3fb', borderTop: '3px solid #497fc5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'Assistant, sans-serif' }}>טוען חומרים...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ── Section A — Digital ── */}
            <section style={{ marginBottom: '56px' }}>
              <SectionHeader
                icon={Smartphone}
                iconBg="linear-gradient(135deg, #eef3fb, #dce8f7)"
                iconColor="#497fc5"
                title="📱 חומרי שיווק לדיגיטל"
                subtitle="פוסטים, PDF וערכת מיתוג — הורדה ישירה"
                isAdmin={isAdmin}
                onAdd={() => openItemModal('digital')}
              />

              {items.digital.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {items.digital.map(item => (
                    <DownloadCard
                      key={item.id}
                      item={item}
                      isAdmin={isAdmin}
                      onEdit={() => openItemModal('digital', item)}
                      onDelete={() => confirmDelete(item)}
                    />
                  ))}
                </div>
              ) : (
                <EmptySection isAdmin={isAdmin} />
              )}

              {/* WhatsApp Templates */}
              {(items.whatsapp.length > 0 || isAdmin) && (
                <div style={{
                  background: '#ffffff', borderRadius: '16px',
                  border: '1px solid #d4f2e2',
                  boxShadow: '0 2px 10px rgba(46,204,113,0.08)',
                  overflow: 'hidden',
                  marginTop: '24px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f0fbf5, #ffffff)',
                    padding: '16px 20px', borderBottom: '1px solid #e0f5ec',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px',
                        background: 'rgba(46,204,113,0.15)', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MessageCircle size={16} color="#1aa061" />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, color: '#1e2124', fontSize: '0.95rem', margin: 0 }}>תבניות הודעה מוכנות לווטסאפ</h3>
                        <p style={{ color: '#5e656e', fontSize: '0.78rem', margin: '2px 0 0' }}>העתק, שלח, סגור עסקה — פחות מ-30 שניות</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => openItemModal('whatsapp')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          fontSize: '0.78rem', fontWeight: 700,
                          padding: '7px 14px', borderRadius: '50px',
                          background: 'linear-gradient(135deg, #1aa061, #2ecc71)',
                          color: 'white', border: 'none', cursor: 'pointer',
                          fontFamily: 'Assistant, sans-serif',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={13} />
                        הוסף תבנית
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.whatsapp.length > 0
                      ? items.whatsapp.map(item => (
                          <WATemplate
                            key={item.id}
                            item={item}
                            isAdmin={isAdmin}
                            onEdit={() => openItemModal('whatsapp', item)}
                            onDelete={() => confirmDelete(item)}
                          />
                        ))
                      : <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', margin: '8px 0', fontFamily: 'Assistant, sans-serif' }}>
                          {isAdmin ? 'אין תבניות עדיין — לחץ "הוסף תבנית".' : 'אין תבניות זמינות כרגע.'}
                        </p>
                    }
                  </div>
                </div>
              )}
            </section>

            {/* ── Section B — Print ── */}
            <section style={{ marginBottom: '56px' }}>
              <SectionHeader
                icon={Printer}
                iconBg="linear-gradient(135deg, #fdf7e3, #fdeec9)"
                iconColor="#c07d0a"
                title="🛒 חומרי שיווק לחנות / פרינט"
                subtitle="מדפיסים, שמים בחנות — ומכירות מגיעות לבד"
                isAdmin={isAdmin}
                onAdd={() => openItemModal('print')}
              />

              {items.print.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {items.print.map(item => (
                      <DownloadCard
                        key={item.id}
                        item={item}
                        isAdmin={isAdmin}
                        onEdit={() => openItemModal('print', item)}
                        onDelete={() => confirmDelete(item)}
                      />
                    ))}
                  </div>

                  <div style={{
                    background: '#fffbe6', border: '1px solid #fde68a',
                    borderRadius: '14px', padding: '16px',
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                  }}>
                    <div style={{
                      width: '34px', height: '34px', background: '#fef3c7',
                      borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Zap size={16} color="#c07d0a" />
                    </div>
                    <div>
                      <p style={{ color: '#92400e', fontWeight: 700, fontSize: '0.88rem', margin: '0 0 4px' }}>טיפ להדפסה</p>
                      <p style={{ color: '#a16207', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                        כל קבצי ה-PDF מוכנים לדפוס ב-CMYK ברזולוציה 300 DPI. מומלץ להדפיס על נייר מצופה לתוצאה מושלמת.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <EmptySection isAdmin={isAdmin} onAdd={() => openItemModal('print')} />
              )}
            </section>
          </>
        )}

        {/* ── Footer / Support ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2124 0%, #24344f 60%, #2d5080 100%)',
          borderRadius: '20px', padding: '40px 32px',
          color: 'white', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(73,127,197,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(46,204,113,0.08)', pointerEvents: 'none' }} />

          <div style={{
            width: '56px', height: '56px', background: 'rgba(46,204,113,0.2)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <MessageCircle size={26} color="#2ecc71" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>צריך עזרה?</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            חסר לך חומר שיווקי ספציפי? יש שאלה על מוצר? רוצה תמיכה בסגירת עסקה?{' '}
            <strong style={{ color: 'white' }}>אנחנו כאן!</strong>
          </p>
          <a
            href="https://wa.me/972XXXXXXXXX?text=שלום%2C%20אני%20משווק%20iFilter%20ואני%20צריך%20עזרה"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'linear-gradient(135deg, #1aa061, #2ecc71)',
              color: 'white', fontWeight: 700,
              padding: '13px 28px', borderRadius: '50px',
              textDecoration: 'none', fontSize: '0.95rem',
              boxShadow: '0 8px 20px rgba(46,204,113,0.35)',
              transition: 'opacity 0.15s, transform 0.15s',
              fontFamily: 'Assistant, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <MessageCircle size={18} />
            דבר איתנו בווטסאפ הצוות
          </a>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '12px' }}>בד"כ עונים תוך שעה בשעות העבודה</p>
        </div>

      </div>
    </div>
  )
}

export default ResellerHub
