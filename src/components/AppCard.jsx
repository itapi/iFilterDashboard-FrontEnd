import { memo, useCallback, useState } from "react"
import { Smartphone, Check, Star, Download } from "lucide-react"

const AppCard = ({ app, isSelected, onToggle }) => {
  const [imageError, setImageError] = useState(false)

  const handleClick = useCallback(() => {
    onToggle(app.app_id)
  }, [onToggle, app.app_id])

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected ? "border-purple-300 bg-purple-50 shadow-md" : "border-gray-200 hover:border-purple-200"
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              {app.icon_url && !imageError ? (
                <img
                  src={app.icon_url}
                  alt={app.app_name}
                  className="w-12 h-12 rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Smartphone className="w-6 h-6 text-blue-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{app.app_name}</h3>
              <p className="text-xs text-gray-500 truncate">{app.package_name}</p>
              {app.category_name && (
                <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {app.category_name}
                </span>
              )}
            </div>
          </div>

          <div
            className={`w-6 h-6 ml-2 flex-shrink-0 rounded-full flex items-center justify-center ${
              isSelected ? "bg-purple-600" : "bg-gray-200"
            }`}
          >
            {isSelected ? <Check className="w-4 h-4 text-white" /> : null}
          </div>
        </div>

   
      </div>
    </div>
  )
}

export default memo(AppCard)