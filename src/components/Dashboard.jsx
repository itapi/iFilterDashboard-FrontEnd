import { useState, useEffect } from 'react'
import { Ban, Shield, Users, CheckCircle, Bell } from 'lucide-react'
import { useUser } from '../contexts/GlobalStateContext'
import apiClient from '../utils/api'

function Dashboard() {
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUnreadCounts()
    // Refresh unread counts every 30 seconds
    const interval = setInterval(loadUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUnreadCounts = async () => {
    try {
      const response = await apiClient.getUnreadCounts()
      if (response.success) {
        setUnreadCount(response.data.global)
      }
    } catch (err) {
      console.error('Error loading unread counts:', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { title: 'אתרים חסומים', value: '1,234', change: '+12%', icon: 'Ban' },
    { title: 'בקשות שנחסמו היום', value: '567', change: '+5%', icon: 'Shield' },
    { title: 'משתמשים פעילים', value: '89', change: '+3%', icon: 'Users' },
    {
      title: 'פניות חדשות',
      value: loading ? '...' : (unreadCount?.tickets_with_unread || 0).toString(),
      change: unreadCount?.total_unread_messages ? `${unreadCount.total_unread_messages} הודעות` : 'אין חדשות',
      icon: 'Bell',
      isNew: !loading && unreadCount?.tickets_with_unread > 0
    }
  ]

  const recentActivities = [
    { time: '10:30', action: 'חסימת אתר', target: 'facebook.com', user: 'משתמש #123' },
    { time: '09:45', action: 'התקנת אפליקציה', target: 'WhatsApp', user: 'משתמש #456' },
    { time: '09:15', action: 'עדכון מדיניות', target: 'מדיניות תוכן', user: 'מנהל' },
    { time: '08:30', action: 'כניסה למערכת', target: 'פאנל ניהול', user: user?.first_name || 'מנהל' },
  ]

  return (
    <div className="p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-reverse space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ברוך הבא, {user?.first_name || 'מנהל'}!
            </h1>
            <p className="text-gray-600">לוח בקרה מערכת iFilter</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.isNew ? 'bg-red-50 animate-pulse' : 'bg-blue-50'
              }`}>
                {(() => {
                  const iconMap = { Ban, Shield, Users, CheckCircle, Bell }
                  const IconComponent = iconMap[stat.icon] || CheckCircle
                  return <IconComponent className={`w-6 h-6 ${stat.isNew ? 'text-red-600' : 'text-blue-600'}`} />
                })()}
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">פעילות אחרונה</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              צפה בהכל
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-reverse space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}: <span className="font-normal text-gray-600">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">סטטוס המערכת</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">שרת מסנן</span>
              </div>
              <span className="text-sm text-green-700">פעיל</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">מסד נתונים</span>
              </div>
              <span className="text-sm text-green-700">פעיל</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">עדכוני אפליקציות</span>
              </div>
              <span className="text-sm text-yellow-700">ממתין</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">API שרת</span>
              </div>
              <span className="text-sm text-green-700">פעיל</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-reverse space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">עדכון אחרון</p>
                <p className="text-xs text-blue-700">היום, 10:45</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard