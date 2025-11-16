import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { Smartphone, Folder, Package, Star } from 'lucide-react'

const AppsManager = () => {
  const { openModal } = useGlobalState()
  const [categories, setCategories] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

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

  const handleCategoryClick = (category) => {
    openModal({
      layout: 'categoryApps',
      title: (
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            {category.category_icon ? (
              <img
                src={category.category_icon}
                alt={category.category_name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <Package className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <span>בחירת אפליקציות - {category.category_name}</span>
        </div>
      ),
      size: 'xl',
      data: {
        category,
        onAppsUpdated: loadData
      },
      closeOnBackdropClick: true,
      closeOnEscape: true
    })
  }

  const getCategoryAppCount = (categoryId) => {
    return apps.filter(app => app.category_id === categoryId).length
  }

  const CategoryCard = ({ category }) => {
    const appCount = getCategoryAppCount(category.category_id)

    return (
      <div
        onClick={() => handleCategoryClick(category)}
        className="bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              {category.category_icon ? (
                <img
                  src={category.category_icon}
                  alt={category.category_name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : (
                <Folder className="w-8 h-8 text-purple-600" />
              )}
              <Folder className="w-8 h-8 text-purple-600 hidden" />
            </div>

            <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-xl">
              <span className="text-xl font-bold text-purple-600">{appCount}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {category.category_name}
          </h3>
          <p className="text-sm text-gray-500">
            {appCount === 0 ? 'אין אפליקציות' : `${appCount} אפליקציות`}
          </p>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl group-hover:bg-purple-50 transition-colors">
          <span className="text-sm text-gray-600 group-hover:text-purple-600 font-medium">
            לחץ לצפייה באפליקציות ←
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול אפליקציות</h1>
              <p className="text-gray-600">לחץ על קטגוריה לצפייה באפליקציות</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">סך האפליקציות</p>
                <p className="text-3xl font-bold text-blue-900">{apps.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">קטגוריות</p>
                <p className="text-3xl font-bold text-purple-900">{categories.length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center">
                <Folder className="w-7 h-7 text-purple-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl shadow-sm border border-pink-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600 mb-1">ציון ממוצע</p>
                <p className="text-3xl font-bold text-pink-900">
                  {apps.length > 0 && apps.filter(app => app.score).length > 0
                    ? (apps.filter(app => app.score).reduce((sum, app) => sum + parseFloat(app.score || 0), 0) / apps.filter(app => app.score).length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
              <div className="w-14 h-14 bg-pink-200 rounded-xl flex items-center justify-center">
                <Star className="w-7 h-7 text-pink-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <CategoryCard key={category.category_id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Folder className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">אין קטגוריות</h3>
          <p className="text-gray-600 mb-6">צור קטגוריה ראשונה כדי להתחיל</p>
        </div>
      )}
    </div>
  )
}

export default AppsManager
