import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/GlobalStateContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS, ROLES } from '../utils/permissions'

const Sidebar = () => {
  const { user, logout, userName, userInitials } = useUser()
  const { hasAnyRole, hasPermission, isSuperAdmin, getRoleDisplayName, getRoleBadgeColor, userRole } = usePermissions()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const location = useLocation()

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }))
  }

  const allMenuItems = [
    {
      id: 'representatives',
      name: 'נציגים',
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.COMMUNITY_MANAGER],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      submenu: [
        { id: 'clients',       path: '/clients',       name: 'לקוחות',        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.COMMUNITY_MANAGER] },
        { id: 'tickets',       path: '/tickets',       name: 'פניות לקוחות',  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.COMMUNITY_MANAGER] },
        { id: 'web-inquiries', path: '/web-inquiries', name: 'פניות אתר',     allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
        { id: 'communities',   path: '/communities',   name: 'קהילות',        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      ]
    },
    {
      id: 'reseller-portal',
      name: 'פאנל משווק',
      allowedRoles: [ROLES.RESELLER],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      submenu: [
        { id: 'reseller-hub', path: '/reseller-hub', name: 'מרכז משאבים', allowedRoles: [ROLES.RESELLER] },
      ]
    },
    {
      id: 'resellers-group',
      name: 'משווקים',
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      submenu: [
        { id: 'resellers',    path: '/resellers',    name: 'משווקים / סוכנים' },
        { id: 'reseller-hub', path: '/reseller-hub', name: 'מרכז משאבים למשווקים' },
      ]
    },
    {
      id: 'system',
      name: 'מערכת',
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MANAGER],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      ),
      submenu: [
        { id: 'apps',            path: '/apps',                   name: 'אפליקציות' },
        { id: 'category-plans',  path: '/category-plans',         name: 'תכניות סינון' },
        { id: 'safe-browser',    path: '/safe-browser',           name: 'SafeBrowser' },
        { id: 'remote-commands', path: '/remote-commands',        name: 'פקודות מרחוק' },
        { id: 'magisk-modules',  path: '/uploads/magisk-modules', name: 'מודולי Magisk' },
        { id: 'xposed-modules',  path: '/uploads/xposed-modules', name: 'מודולי Xposed' },
        { id: 'required-apps',   path: '/uploads/required-apps',  name: 'אפליקציות נדרשות' },
        { id: 'other-uploads',   path: '/uploads/other',          name: 'קבצים אחרים' },
      ]
    },
    {
      id: 'super-admin',
      name: 'ניהול עליון',
      allowedRoles: [ROLES.SUPER_ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      submenu: [
        { id: 'admins',              path: '/admins',              name: 'משתמשי מערכת' },
        { id: 'settings',            path: '/settings',            name: 'הגדרות' },
        { id: 'firmwares',           path: '/firmwares',           name: 'ניהול קושחות' },
        { id: 'distributions',       path: '/distributions',       name: 'הפצות' },
        { id: 'broadcast-messages',  path: '/broadcast-messages',  name: 'הודעות משודרות' },
      ]
    },
  ]

  const menuItems = useMemo(() => {
    return allMenuItems
      .filter(item => !item.allowedRoles || hasAnyRole(item.allowedRoles))
      .map(item => ({
        ...item,
        submenu: item.submenu?.filter(sub => !sub.allowedRoles || hasAnyRole(sub.allowedRoles))
      }))
      .filter(item => !item.submenu || item.submenu.length > 0)
  }, [allMenuItems, hasAnyRole])

  const sidebarW = isCollapsed ? '72px' : '272px'

  return (
    <aside
      style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: '#ffffff',
        borderLeft: '1px solid #edf0f2',
        boxShadow: '2px 0 16px rgba(30,33,36,0.06)',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div style={{
        padding: isCollapsed ? '20px 12px' : '22px 20px',
        borderBottom: '1px solid #f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: '10px',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'linear-gradient(135deg, #1e2124 0%, #2d4a6e 100%)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(30,33,36,0.3)',
            }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e2124', lineHeight: 1.2 }}>iFilter</div>
              <div style={{ fontSize: '0.75rem', color: '#5e656e', fontWeight: 400 }}>פאנל ניהול</div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #1e2124 0%, #2d4a6e 100%)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30,33,36,0.3)',
          }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#5e656e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <svg
            width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: isCollapsed ? '12px 8px' : '12px 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const isSubmenuActive = item.submenu?.some(s => location.pathname === s.path)
            const hasActive = isActive || isSubmenuActive

            return (
              <li key={item.id}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      title={isCollapsed ? item.name : ''}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: isCollapsed ? '10px' : '10px 14px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        fontFamily: 'Assistant, sans-serif',
                        transition: 'all 0.2s',
                        background: hasActive ? 'linear-gradient(135deg, #497fc5 0%, #3a6ab8 100%)' : 'transparent',
                        color: hasActive ? 'white' : '#31353a',
                        boxShadow: hasActive ? '0 4px 14px rgba(73,127,197,0.3)' : 'none',
                      }}
                      onMouseEnter={e => { if (!hasActive) e.currentTarget.style.background = '#eef3fb' }}
                      onMouseLeave={e => { if (!hasActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ flexShrink: 0, opacity: hasActive ? 1 : 0.6 }}>{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span style={{ flex: 1, textAlign: 'right' }}>{item.name}</span>
                          <svg
                            width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            style={{ transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>

                    {!isCollapsed && expandedMenus[item.id] && (
                      <ul style={{ listStyle: 'none', margin: '4px 0 4px 0', padding: '0 0 0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {item.submenu.map((sub) => {
                          const isSubActive = location.pathname === sub.path
                          return (
                            <li key={sub.id}>
                              <Link
                                to={sub.path}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 14px',
                                  borderRadius: '10px',
                                  fontSize: '0.84rem',
                                  fontWeight: isSubActive ? 700 : 500,
                                  fontFamily: 'Assistant, sans-serif',
                                  textDecoration: 'none',
                                  background: isSubActive ? 'linear-gradient(135deg, #497fc5 0%, #3a6ab8 100%)' : 'transparent',
                                  color: isSubActive ? 'white' : '#5e656e',
                                  transition: 'all 0.2s',
                                  boxShadow: isSubActive ? '0 3px 10px rgba(73,127,197,0.25)' : 'none',
                                }}
                                onMouseEnter={e => { if (!isSubActive) e.currentTarget.style.background = '#eef3fb' }}
                                onMouseLeave={e => { if (!isSubActive) e.currentTarget.style.background = 'transparent' }}
                              >
                                <span style={{
                                  width: '6px', height: '6px',
                                  borderRadius: '50%',
                                  background: isSubActive ? 'white' : '#9ca3af',
                                  flexShrink: 0,
                                }} />
                                {sub.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    title={isCollapsed ? item.name : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: isCollapsed ? '10px' : '10px 14px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      fontFamily: 'Assistant, sans-serif',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      background: isActive ? 'linear-gradient(135deg, #497fc5 0%, #3a6ab8 100%)' : 'transparent',
                      color: isActive ? 'white' : '#31353a',
                      boxShadow: isActive ? '0 4px 14px rgba(73,127,197,0.3)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#eef3fb' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'linear-gradient(135deg, #497fc5 0%, #3a6ab8 100%)' : 'transparent' }}
                  >
                    <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                    {!isCollapsed && (
                      <span style={{ flex: 1, textAlign: 'right' }}>{item.name}</span>
                    )}
                    {!isCollapsed && isActive && (
                      <span style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.6)',
                        flexShrink: 0,
                      }} />
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div style={{
        padding: isCollapsed ? '12px 8px' : '12px 12px',
        borderTop: '1px solid #f0f2f5',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
      }}>
        {/* User card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: isCollapsed ? '8px' : '10px 12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          borderRadius: '12px',
          background: '#f6f8f9',
        }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #497fc5 0%, #3a6ab8 100%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(73,127,197,0.35)',
          }}>
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>
              {userInitials || user?.first_name?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e2124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || user?.username || 'משתמש'}
              </div>
              {userRole && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: '3px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#edf0f2',
                  color: '#5e656e',
                  border: '1px solid #e0e3e6',
                }}>
                  {getRoleDisplayName()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title={isCollapsed ? 'התנתק' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isCollapsed ? '8px' : '8px 12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'Assistant, sans-serif',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>התנתק</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
