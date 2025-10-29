import { Smartphone, Crown, Settings } from 'lucide-react'

/**
 * ClientAppsTab - Custom plan apps management tab
 *
 * @param {Function} onManageApps - Callback when manage apps button is clicked
 */
const ClientAppsTab = ({ onManageApps }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Smartphone className="w-5 h-5 ml-2" />
            אפליקציות מותרות - מסלול אישי
          </h3>
          <p className="text-gray-600 mt-1">
            נהל את רשימת האפליקציות המותרות עבור הלקוח במסלול האישי
          </p>
        </div>

        <button
          onClick={onManageApps}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>נהל אפליקציות</span>
        </button>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-1">מסלול אישי פעיל</h4>
            <p className="text-sm text-purple-700">
              הלקוח נמצא במסלול האישי. ניתן לבחור באופן ידני אילו אפליקציות יהיו מותרות עבורו.
              הגדרה זו עוקפת את הקטגוריות הסטנדרטיות ומאפשרת שליטה מלאה.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 mb-2">לחץ על "נהל אפליקציות" כדי לבחור אפליקציות</p>
        <p className="text-sm text-gray-500">תוכל לחפש, לסנן ולבחור אפליקציות ספציפיות עבור הלקוח</p>
      </div>
    </div>
  )
}

export default ClientAppsTab
