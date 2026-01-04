import {
  Users,
  Star,
  Package,
  Globe,
  Lock,
  Edit2
} from 'lucide-react'
import { useModal } from '../contexts/GlobalStateContext'
import { getImageUrl } from '../utils/api'

const CommunityInfo = ({ community, communityAppsCount, onWatermarkUpdate }) => {
  const { openModal } = useModal()

  const handleEditWatermark = () => {
    openModal({
      layout: 'watermarkEditor',
      title: 'עריכת לוגו קהילה',
      size: 'lg',
      data: {
        communityId: community.community_unique_id,
        onSave: (newWatermarkUrl) => {
          // Call parent callback to update the watermark
          if (onWatermarkUpdate) {
            onWatermarkUpdate(newWatermarkUrl)
          }
        }
      }
    })
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group">
          {community.watermark_logo || community.image_url ? (
            <img
              src={getImageUrl(community.watermark_logo || community.image_url)}
              alt={community.community_name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <Users className="w-10 h-10 text-white" />
          )}
          {/* Edit Button Overlay */}
          <button
            onClick={handleEditWatermark}
            className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="עריכת לוגו"
          >
            <Edit2 className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{community.community_name}</h1>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              <Users className="w-4 h-4" />
              קהילת סינון
            </span>
            {community.plan_name && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                <Package className="w-4 h-4" />
                {community.plan_name}
              </span>
            )}
            {community.is_public !== null && (
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                community.is_public
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {community.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {community.is_public ? 'ציבורית' : 'פרטית'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Community Description */}
      {community.description && (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">תיאור הקהילה</h3>
          <p className="text-gray-700">{community.description}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="text-3xl font-bold text-blue-600 mb-1">{communityAppsCount}</div>
          <div className="text-sm text-gray-600">אפליקציות</div>
        </div>
        {community.price_monthly && (
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600 mb-1">₪{community.price_monthly}</div>
            <div className="text-sm text-gray-600">מחיר חודשי</div>
          </div>
        )}
        {community.price_yearly && (
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
            <div className="text-3xl font-bold text-purple-600 mb-1">₪{community.price_yearly}</div>
            <div className="text-sm text-gray-600">מחיר שנתי</div>
          </div>
        )}
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
          <div className="text-3xl font-bold text-orange-600 mb-1">{community.community_unique_id?.slice(0, 8)}</div>
          <div className="text-sm text-gray-600">מזהה קהילה</div>
        </div>
        {community.clients_count !== undefined && (
          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
            <div className="text-3xl font-bold text-pink-600 mb-1">{community.clients_count}</div>
            <div className="text-sm text-gray-600">לקוחות</div>
          </div>
        )}
      </div>

      {/* Features */}
      {(community.feature1 || community.feature2 || community.feature3) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">תכונות הקהילה</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[community.feature1, community.feature2, community.feature3].filter(Boolean).map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunityInfo
