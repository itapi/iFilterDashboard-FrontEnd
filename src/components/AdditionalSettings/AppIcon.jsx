import { useState } from 'react'
import { Package } from 'lucide-react'
import { getImageUrl } from '../../utils/api'

/**
 * AppIcon - Component to display app icon with fallback
 *
 * @param {string} iconUrl - URL to the app icon
 * @param {string} appName - Name of the app (for alt text)
 */
const AppIcon = ({ iconUrl, appName }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
      {iconUrl && !imageError ? (
        <img
          src={getImageUrl(iconUrl)}
          alt={appName}
          className="w-10 h-10 rounded-lg object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Package className="w-6 h-6 text-purple-600" />
      )}
    </div>
  )
}

export default AppIcon
