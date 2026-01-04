import { useState } from 'react'
import {
  Package,
  Search,
  Grid,
  List,
  Settings
} from 'lucide-react'
import Loader from './Loader'

const CommunityApps = ({
  communityApps,
  appsLoading,
  onAppClick,
  onEditApps
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const filteredApps = communityApps.filter(app =>
    app.app_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Apps Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">אפליקציות הקהילה</h2>
            <p className="text-gray-600">{communityApps.length} אפליקציות בקהילה</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Edit Apps Button */}
            <button
              onClick={onEditApps}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>עריכת אפליקציות</span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש אפליקציות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apps Content */}
      <div className="p-6">
        {appsLoading ? (
          <Loader center variant="purple" text="טוען אפליקציות..." />
        ) : filteredApps.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.app_id}
                  onClick={() => onAppClick(app)}
                  className="group p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      {app.icon_url ? (
                        <img
                          src={app.icon_url}
                          alt={app.app_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {app.app_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{app.category_name || 'אפליקציה'}</p>
                    </div>
                  </div>
                  {app.package_name && (
                    <p className="text-xs text-gray-400 font-mono truncate">{app.package_name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApps.map((app) => (
                <div
                  key={app.app_id}
                  onClick={() => onAppClick(app)}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt={app.app_name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{app.app_name}</h3>
                    <p className="text-sm text-gray-500">{app.category_name || 'אפליקציה'}</p>
                    {app.package_name && (
                      <p className="text-xs text-gray-400 font-mono">{app.package_name}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {app.selected_date && new Date(app.selected_date).toLocaleDateString('he-IL')}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'לא נמצאו אפליקציות התואמות לחיפוש' : 'אין אפליקציות בקהילה'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'הקהילה עדיין לא מכילה אפליקציות'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityApps
