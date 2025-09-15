import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Settings, Plus, Check } from 'lucide-react'
import apiClient from '../utils/api'
import { useModal } from '../contexts/ModalContext'
import Statistics from './Statistics'

const CategoryPlanManager = () => {
  const { openConfirmModal, openModal, closeModal } = useModal()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryPlanAvailability, setCategoryPlanAvailability] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [plansResponse, categoriesResponse, availabilityResponse] = await Promise.all([
        apiClient.apiRequest('filtering-plans'),
        apiClient.getCategoriesWithCounts(),
        apiClient.getCategoryPlanAvailabilityWithDetails()
      ])

      if (plansResponse.success) {
        setPlans(plansResponse.data)
      }

      if (categoriesResponse.success) {
        console.log('Loaded categories:', categoriesResponse.data.map(c => ({ id: c.category_id, name: c.category_name, type: typeof c.category_id })))
        setCategories(categoriesResponse.data)
      }

      if (availabilityResponse.success) {
        const simpleAvailability = availabilityResponse.data.map(item => ({
          category_id: item.category_id,
          plan_unique_id: item.plan_unique_id,
          created_at: item.created_at
        }))
        console.log('Loaded availability data:', simpleAvailability)
        setCategoryPlanAvailability(simpleAvailability)
      }
    } catch (err) {
      toast.error('שגיאה בטעינת הנתונים')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get categories assigned to a specific plan
  const getCategoriesForPlan = (planId) => {
    const assignedCategoryIds = categoryPlanAvailability
      .filter(item => item.plan_unique_id == planId)
      .map(item => item.category_id)

    return categories.filter(category =>
      assignedCategoryIds.includes(category.category_id)
    )
  }

  // Handle opening category management modal for a plan
  const handleManageCategories = (plan) => {
    const assignedCategoryIds = categoryPlanAvailability
      .filter(item => item.plan_unique_id == plan.plan_unique_id)
      .map(item => item.category_id)

    const formContent = (
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{plan.plan_name}</h3>
              <p className="text-sm text-gray-600">בחר קטגוריות להקצאה לתכנית</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {categories.map(category => {
            const isAssigned = assignedCategoryIds.includes(category.category_id)
            return (
              <label
                key={category.category_id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    defaultChecked={isAssigned}
                    onChange={(e) => {
                      const checkbox = e.target
                      if (checkbox.checked) {
                        checkbox.closest('label').classList.add('selected')
                      } else {
                        checkbox.closest('label').classList.remove('selected')
                      }
                    }}
                    className="w-5 h-5 text-blue-600 bg-gray-50 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 opacity-0 pointer-events-none" />
                </div>

                <div className="flex items-center gap-3 flex-1">
                  {category.category_icon ? (
                    <img
                      src={category.category_icon}
                      alt={category.category_name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">📁</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.category_name}</p>
                    <p className="text-sm text-gray-500">{category.app_count || 0} אפליקציות</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    )

    const footer = (
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => closeModal()}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={() => handleSaveCategoryAssignments(plan)}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          💾 שמור שינויים
        </button>
      </div>
    )

    openModal({
      type: 'custom',
      title: 'ניהול קטגוריות',
      content: formContent,
      size: 'lg',
      footer
    })
  }

  // Save category assignments for a plan
  const handleSaveCategoryAssignments = async (plan) => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    const selectedCategoryIds = []

    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        selectedCategoryIds.push(categories[index].category_id)
      }
    })

    const currentAssignments = categoryPlanAvailability
      .filter(item => item.plan_unique_id == plan.plan_unique_id)
      .map(item => item.category_id)

    // Find categories to add and remove
    const toAdd = selectedCategoryIds.filter(id => !currentAssignments.includes(id))
    const toRemove = currentAssignments.filter(id => !selectedCategoryIds.includes(id))

    try {
      // Add new assignments
      for (const categoryId of toAdd) {
        await apiClient.assignCategoryToPlan(categoryId, plan.plan_unique_id)
        setCategoryPlanAvailability(prev => [...prev, {
          category_id: categoryId,
          plan_unique_id: plan.plan_unique_id,
          created_at: new Date().toISOString()
        }])
      }

      // Remove assignments
      for (const categoryId of toRemove) {
        await apiClient.removeCategoryFromPlan(categoryId, plan.plan_unique_id)
        setCategoryPlanAvailability(prev =>
          prev.filter(item =>
            !(item.category_id == categoryId && item.plan_unique_id == plan.plan_unique_id)
          )
        )
      }

      toast.success(`קטגוריות עודכנו בהצלחה! 🎉`)
      closeModal()
    } catch (err) {
      console.error('Error updating categories:', err)
      toast.error('שגיאה בעדכון הקטגוריות')
    }
  }


  const handleEditPlan = (plan) => {
    console.log('Plan object structure:', plan)
    const formContent = (
      <div className="p-6" dir="rtl">
        <form id="plan-edit-form" className="space-y-6">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              שם התכנית *
            </label>
            <input
              name="plan_name"
              type="text"
              defaultValue={plan.plan_name || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="לדוגמה: תכנית בסיסית"
              required
            />
          </div>

          {/* Plan Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              מחיר (₪)
            </label>
            <div className="relative">
              <input
                name="plan_price"
                type="number"
                defaultValue={plan.plan_price || ''}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <div className="absolute right-3 top-3 text-gray-400 font-medium">₪</div>
            </div>
          </div>

          {/* Plan Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              תיאור קצר
            </label>
            <textarea
              name="plan_description"
              defaultValue={plan.plan_description || plan.description || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="תיאור קצר על התכנית..."
              rows="3"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              תכונות התכנית
            </h3>
            
            {[1, 2, 3].map((num) => (
              <div key={num}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תכונה {num}
                </label>
                <input
                  name={`plan_feature${num}`}
                  type="text"
                  defaultValue={plan[`plan_feature${num}`] || plan[`feature${num}`] || ''}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={`תכונה מספר ${num}...`}
                />
              </div>
            ))}
          </div>
        </form>
      </div>
    )

    const footer = (
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => closeModal()}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ביטול
        </button>
        <button
          type="submit"
          form="plan-edit-form"
          onClick={(e) => {
            e.preventDefault()
            const form = document.getElementById('plan-edit-form')
            const formData = new FormData(form)
            const planData = {
              plan_name: formData.get('plan_name'),
              plan_price: formData.get('plan_price'),
              plan_description: formData.get('plan_description'),
              plan_feature1: formData.get('plan_feature1'),
              plan_feature2: formData.get('plan_feature2'),
              plan_feature3: formData.get('plan_feature3')
            }
            handleSavePlan(plan, planData)
          }}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          💾 שמור שינויים
        </button>
      </div>
    )

    openModal({
      type: 'custom',
      title: 'עריכת תכנית סינון',
      content: formContent,
      size: 'xl',
      footer
    })
  }

  const handleSavePlan = async (plan, planData) => {
    try {
      await apiClient.updatePlan(plan.plan_unique_id, planData)
      
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.plan_unique_id === plan.plan_unique_id 
            ? { ...p, ...planData }
            : p
        )
      )
      
      toast.success('תכנית עודכנה בהצלחה! ✨')
      closeModal()
    } catch (err) {
      console.error('Error updating plan:', err)
      toast.error('שגיאה בעדכון התכנית')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-2xl animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">טוען תכניות סינון</h3>
          <p className="text-gray-600">מארגן קטגוריות ותכניות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ניהול תכניות סינון</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              נהל קטגוריות לכל תכנית • ערוך מחירים ופיצ׳רים • הקצה קטגוריות בקלות
            </p>
          </div>

          {/* Statistics */}
          <div className="mb-8">
            <Statistics
              plans={plans}
              categories={categories}
              categoryPlanAvailability={categoryPlanAvailability}
            />
          </div>
        </div>
      </div>

      {/* Plan Cards - Clean Grid Layout */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {plans.map(plan => {
              const planCategories = getCategoriesForPlan(plan.plan_unique_id)
              const monthlyPrice = plan.price_monthly || plan.plan_price || 0
              const yearlyPrice = plan.price_yearly || (monthlyPrice * 12) || 0

              return (
                <div key={plan.plan_unique_id} className="group">
                  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    {/* Plan Header */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            {plan.image_url ? (
                              <img
                                src={plan.image_url}
                                alt={plan.plan_name}
                                className="w-8 h-8 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <svg
                              className={`w-6 h-6 text-white ${plan.image_url ? 'hidden' : 'flex'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-xl leading-tight">{plan.plan_name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{planCategories.length} קטגוריות</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white text-gray-600 hover:text-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          title="ערוך תכנית"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-4">
                        {monthlyPrice > 0 && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-sm font-semibold text-gray-700">₪{monthlyPrice}</span>
                            <span className="text-xs text-gray-500 mr-1">/חודש</span>
                          </div>
                        )}
                        {yearlyPrice > 0 && monthlyPrice !== yearlyPrice && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-sm font-semibold text-gray-700">₪{yearlyPrice}</span>
                            <span className="text-xs text-gray-500 mr-1">/שנה</span>
                          </div>
                        )}
                        {!monthlyPrice && !yearlyPrice && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-sm text-gray-500">מחיר לא הוגדר</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Content & Category Management */}
                    <div className="p-6">
                      {/* Assigned Categories Preview */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">קטגוריות מוקצות</h4>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {planCategories.length}
                          </span>
                        </div>

                        {planCategories.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            {planCategories.slice(0, 3).map(category => (
                              <div key={category.category_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                {category.category_icon ? (
                                  <img
                                    src={category.category_icon}
                                    alt={category.category_name}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                                    <span className="text-xs">📁</span>
                                  </div>
                                )}
                                <span className="text-sm text-gray-700 truncate">{category.category_name}</span>
                              </div>
                            ))}
                            {planCategories.length > 3 && (
                              <div className="text-center text-sm text-gray-500 py-1">
                                +{planCategories.length - 3} עוד
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm">אין קטגוריות מוקצות</p>
                          </div>
                        )}
                      </div>

                      {/* Manage Categories Button */}
                      <button
                        onClick={() => handleManageCategories(plan)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Settings className="w-4 h-4" />
                        ניהול קטגוריות
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {plans.length === 0 && !loading && (
        <div className="px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">אין תכניות סינון עדיין</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                צור תכניות סינון כדי להתחיל בהקצאת קטגוריות
              </p>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                רענן נתונים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryPlanManager