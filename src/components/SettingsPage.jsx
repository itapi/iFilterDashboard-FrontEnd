import { Settings, Bell, BellOff, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useWebNotifications } from '../hooks/useWebNotifications'

const NotificationCard = () => {
  const { permission, enabled, setEnabled, requestPermission } = useWebNotifications()

  const isUnsupported = permission === 'unsupported'
  const isGranted     = permission === 'granted'
  const isDenied      = permission === 'denied'
  const isDefault     = permission === 'default'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">התראות דפדפן</h2>
          <p className="text-sm text-gray-500">קבל התראות גם כאשר הטאב אינו פעיל</p>
        </div>
      </div>

      {/* Status banner */}
      {isUnsupported && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-5">
          <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">הדפדפן שלך אינו תומך בהתראות.</p>
        </div>
      )}

      {isDenied && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">ההרשאה נחסמה על ידי הדפדפן</p>
            <p className="text-amber-700 leading-relaxed">
              לאחר חסימה, הדפדפן לא מאפשר לבקש הרשאה מחדש דרך הקוד.
              כדי לאפשר מחדש:
            </p>
            <ol className="mt-2 space-y-1 text-amber-700 list-decimal list-inside">
              <li>לחץ על סמל המנעול/מידע בשורת הכתובת</li>
              <li>בחר <strong>הרשאות אתר</strong> ← <strong>התראות</strong></li>
              <li>שנה את הערך ל-<strong>אפשר</strong></li>
              <li>רענן את הדף</li>
            </ol>
          </div>
        </div>
      )}

      {isDefault && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5">
          <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="mb-2">טרם אישרת התראות לאתר זה.</p>
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              בקש הרשאה
            </button>
          </div>
        </div>
      )}

      {isGranted && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-5">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-gray-700">הרשאת דפדפן</span>
            <span className="text-green-600 font-medium">מאושרת</span>
          </div>
          <span className="text-xs text-gray-400">לביטול — ראה הגדרות דפדפן</span>
        </div>
      )}

      {/* Enable / disable toggle — only relevant when permission is granted */}
      {isGranted && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">הפעל התראות</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {enabled
                ? 'תקבל התראה על לקוח מחובר, שיחה חיה, פנייה חדשה ועוד'
                : 'ההתראות מושהות — לא תישלחנה התראות'}
            </p>
          </div>

          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              enabled ? 'bg-purple-600' : 'bg-gray-300'
            }`}
            aria-checked={enabled}
            role="switch"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* Preview what fires */}
      {isGranted && enabled && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">אירועים שמפעילים התראה</p>
          <ul className="space-y-1.5 text-xs text-gray-600">
            {[
              'לקוח התחבר לשיחה חיה',
              'לקוח התנתק מהשיחה',
              'פנייה חדשה התקבלה',
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <Bell className="w-3 h-3 text-purple-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const SettingsPage = () => (
  <div className="p-6" dir="rtl">
    <div className="mb-6 flex items-center gap-3">
      <div className="p-3 bg-gray-100 rounded-xl">
        <Settings className="w-6 h-6 text-gray-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות מערכת</h1>
        <p className="text-sm text-gray-500">ניהול הגדרות והעדפות</p>
      </div>
    </div>

    <div className="max-w-lg">
      <NotificationCard />
    </div>
  </div>
)

export default SettingsPage
