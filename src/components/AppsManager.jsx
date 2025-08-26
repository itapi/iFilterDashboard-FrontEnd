import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { Smartphone, Folder, Search, Star } from 'lucide-react'

const AppsManager = () => {
  const [categories, setCategories] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateCategory, setShowCreateCategory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, appsResponse] = await Promise.all([
        apiClient.getCategoriesWithCounts(),
        apiClient.getAppsWithCategories()
      ])

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data)
      }

      if (appsResponse.success) {
        setApps(appsResponse.data)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const appId = parseInt(draggableId.replace('app-', ''))
    const newCategoryId = parseInt(destination.droppableId.replace('category-', ''))

    try {
      // Update in the backend
      const response = await apiClient.updateAppCategory(appId, newCategoryId)
      
      if (response.success) {
        // Update local state
        setApps(prevApps => 
          prevApps.map(app => 
            app.app_id === appId 
              ? { 
                  ...app, 
                  category_id: newCategoryId,
                  category_name: categories.find(cat => cat.category_id === newCategoryId)?.category_name || '',
                  category_icon: categories.find(cat => cat.category_id === newCategoryId)?.category_icon || ''
                }
              : app
          )
        )
        
        // Show success message
        console.log('App moved successfully')
      } else {
        throw new Error(response.error || 'Failed to update app category')
      }
    } catch (err) {
      console.error('Error moving app:', err)
      toast.error('שגיאה בהעברת האפליקציה')
      // Optionally reload data to revert changes
      // loadData()
    }
  }

  const filteredApps = apps.filter(app => {
    const matchesCategory = selectedCategory === 'all' || app.category_id === parseInt(selectedCategory)
    const matchesSearch = app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.package_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getAppsByCategory = (categoryId) => {
    return filteredApps.filter(app => app.category_id === categoryId)
  }

  const AppCard = ({ app, index }) => (
    <Draggable draggableId={`app-${app.app_id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 cursor-grab transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-md'
          }`}
        >
          <div className="flex items-center  space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              {app.icon_url ? (
                <img 
                  src={app.icon_url} 
                  alt={app.app_name}
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
              ) : (
                <Smartphone className="w-5 h-5 text-blue-600" />
              )}
              <Smartphone className="w-5 h-5 text-blue-600 hidden" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{app.app_name}</h3>
              <p className="text-sm text-gray-500 truncate">{app.package_name}</p>
              <div className="flex items-center space-x-reverse space-x-2 mt-1">
                {app.score && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-600">{parseFloat(app.score).toFixed(1)}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
                {app.size && (
                  <span className="text-xs text-gray-500">• {parseFloat(app.size).toFixed(1)}MB</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )

  const CategoryColumn = ({ category }) => {
    const categoryApps = getAppsByCategory(category.category_id)
    
    return (
      <div className="bg-gray-50 rounded-xl p-4 min-h-96">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {category.category_icon ? (
              <img 
                src={category.category_icon} 
                alt={category.category_name}
                className="w-6 h-6"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : (
              <Folder className="w-5 h-5" />
            )}
            <Folder className="w-5 h-5 hidden" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{category.category_name}</h3>
            <p className="text-sm text-gray-500">{categoryApps.length} אפליקציות</p>
          </div>
        </div>

        <Droppable droppableId={`category-${category.category_id}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-80 rounded-lg transition-colors duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
            >
              {categoryApps.map((app, index) => (
                <AppCard key={app.app_id} app={app} index={index} />
              ))}
              {provided.placeholder}
              
              {categoryApps.length === 0 && !snapshot.isDraggingOver && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">אין אפליקציות בקטגוריה</p>
                  <p className="text-xs text-gray-300 mt-1">גרור אפליקציות לכאן</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center  space-x-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">טוען נתונים...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center  space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול אפליקציות</h1>
              <p className="text-gray-600">גרור ושחרר אפליקציות בין קטגוריות</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateCategory(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-reverse space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>קטגוריה חדשה</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="חפש אפליקציה..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סנן לפי קטגוריה</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ml-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סך האפליקציות</p>
                <p className="text-xl font-bold text-gray-900">{apps.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center ml-3">
                <Folder className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">קטגוריות</p>
                <p className="text-xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center ml-3">
                <Search className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">תוצאות חיפוש</p>
                <p className="text-xl font-bold text-gray-900">{filteredApps.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center ml-3">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ציון ממוצע</p>
                <p className="text-xl font-bold text-gray-900">
                  {apps.length > 0 
                    ? (apps.filter(app => app.score).reduce((sum, app) => sum + parseFloat(app.score || 0), 0) / apps.filter(app => app.score).length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Drag and Drop Categories */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <CategoryColumn key={category.category_id} category={category} />
          ))}
        </div>
      </DragDropContext>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">אין קטגוריות</h3>
          <p className="text-gray-600 mb-4">צור קטגוריה ראשונה כדי להתחיל</p>
          <button
            onClick={() => setShowCreateCategory(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            צור קטגוריה
          </button>
        </div>
      )}
    </div>
  )
}

export default AppsManager