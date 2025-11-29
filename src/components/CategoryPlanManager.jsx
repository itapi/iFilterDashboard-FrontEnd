import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus ,Settings} from 'lucide-react'
import apiClient from '../utils/api'
import { useModal } from '../contexts/GlobalStateContext'
import Statistics from './Statistics'
import Loader from './Loader'

const CategoryPlanManager = () => {
  const { openModal, closeModal } = useModal()
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
    // Check if this is a custom personal plan
    if (plan.plan_type === 'custom_personal') {
      openModal({
        layout: 'confirmAction',
        title: 'תכנית אישית',
        data: {
          message: 'לתכנית אישית אין קטגוריות מוקצות מראש,והאפליקציות בתוכנית זו נקבעים לפי בחירת המשתמש',
          variant: 'info'
        },
        showConfirmButton: true,
        confirmText: 'הבנתי',
        showCancelButton: false,
        onConfirm: () => {
          closeModal()
        }
      })
      return
    }

    const assignedCategoryIds = categoryPlanAvailability
      .filter(item => item.plan_unique_id == plan.plan_unique_id)
      .map(item => item.category_id)

    openModal({
      layout: 'manageCategories',
      title: 'ניהול קטגוריות',
      size: 'lg',
      data: {
        plan,
        categories,
        assignedCategoryIds,
        onSave: async (selectedCategoryIds) => {
          await handleSaveCategoryAssignments(plan, selectedCategoryIds)
        }
      },
      confirmText: 'שמור שינויים',
      cancelText: 'ביטול'
    })
  }

  // Save category assignments for a plan
  const handleSaveCategoryAssignments = async (plan, selectedCategoryIds) => {
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
    } catch (err) {
      console.error('Error updating categories:', err)
      throw err
    }
  }


  const handleEditPlan = (plan) => {
    openModal({
      layout: 'editPlan',
      title: 'עריכת תכנית סינון',
      size: 'xl',
      data: {
        plan,
        onSave: async (planData) => {
          await handleSavePlan(plan, planData)
        }
      },
      confirmText: 'שמור שינויים',
      cancelText: 'ביטול'
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
    } catch (err) {
      console.error('Error updating plan:', err)
      throw err
    }
  }

  if (loading) {
    return <Loader fullScreen size="2xl" text="טוען תכניות סינון" />
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