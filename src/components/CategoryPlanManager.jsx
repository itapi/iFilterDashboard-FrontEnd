import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import { FolderOpen } from 'lucide-react'
import apiClient from '../utils/api'
import { useModal } from '../contexts/ModalContext'
import CategoryCard from './CategoryCard'
import PlanColumn from './PlanColumn'
import Statistics from './Statistics'

const CategoryPlanManager = () => {
  const { openConfirmModal, openModal, closeModal } = useModal()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryPlanAvailability, setCategoryPlanAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [bankSearchTerm, setBankSearchTerm] = useState('')
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
          category_id: parseInt(item.category_id),
          plan_id: parseInt(item.plan_id),
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

  const handleRemoveClick = (categoryId, planId, categoryName, planName) => {
    const message = (
      <div>
        <p className="text-gray-600 mb-4">
          האם אתה בטוח שברצונך להסיר את הקטגוריה
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="font-bold text-gray-900">"{categoryName}"</p>
          <p className="text-sm text-gray-600 mt-1">
            מהתכנית: <span className="font-medium">{planName}</span>
          </p>
        </div>
        <p className="text-sm text-gray-500">
          ✨ הקטגוריה תישאר זמינה בבנק הקטגוריות
        </p>
      </div>
    )

    openConfirmModal({
      title: 'הסרת קטגוריה',
      message,
      confirmText: 'הסר קטגוריה',
      cancelText: 'ביטול',
      variant: 'danger',
      onConfirm: () => handleConfirmRemove(categoryId, planId),
      onCancel: () => {}
    })
  }

  const handleConfirmRemove = async (categoryId, planId) => {
    console.log('Removing category:', { categoryId, planId })
    console.log('Current availability before remove:', categoryPlanAvailability)

    const numericCategoryId = parseInt(categoryId)
    const numericPlanId = parseInt(planId)

    const itemToRemove = categoryPlanAvailability.find(item => 
      item.category_id === numericCategoryId && item.plan_id === numericPlanId
    )

    if (!itemToRemove) {
      toast.error('לא נמצאה הקטגוריה להסרה')
      return
    }

    const originalItem = { ...itemToRemove }

    setCategoryPlanAvailability(prevState => {
      const newState = prevState.filter(item => 
        !(item.category_id === numericCategoryId && item.plan_id === numericPlanId)
      )
      console.log('Optimistically removed, new state:', newState)
      return newState
    })

    setLastUpdate(Date.now())

    try {
      await apiClient.removeCategoryFromPlan(categoryId, planId)
      
      console.log('Category successfully removed from server')
      toast.success('קטגוריה הוסרה מהתכנית בהצלחה! ♻️')
    } catch (err) {
      console.error('Error removing category from plan:', err)
      
      setCategoryPlanAvailability(prevState => {
        const restoredState = [...prevState, originalItem]
        console.log('Reverted removal, restored state:', restoredState)
        return restoredState
      })
      
      toast.error('שגיאה בהסרת הקטגוריה מהתכנית')
      setLastUpdate(Date.now())
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const getActiveCategory = () => {
    if (!activeId) return null
    const categoryId = parseInt(activeId.split('-')[1])
    return categories.find(cat => cat.category_id === categoryId)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return

    if (!active.id.includes('-bank')) {
      return
    }

    if (over.id === 'category-bank') {
      return
    }

    const categoryId = parseInt(active.id.split('-')[1])
    const newPlanId = parseInt(over.id.replace('plan-', ''))

    const isAlreadyAssigned = categoryPlanAvailability.some(
      item => item.category_id === categoryId && item.plan_id === newPlanId
    )

    if (isAlreadyAssigned) {
      toast.error('הקטגוריה כבר מוקצית לתכנית זו')
      return
    }

    const newAssignment = {
      category_id: categoryId,
      plan_id: newPlanId,
      created_at: new Date().toISOString(),
      isOptimistic: true
    }

    setCategoryPlanAvailability(prevState => [
      ...prevState,
      newAssignment
    ])

    setLastUpdate(Date.now())

    try {
      await apiClient.assignCategoryToPlan(categoryId, newPlanId)

      setCategoryPlanAvailability(prevState => 
        prevState.map(item => 
          item.category_id === categoryId && 
          item.plan_id === newPlanId && 
          item.isOptimistic
            ? { ...item, isOptimistic: false }
            : item
        )
      )

      console.log('Category plan availability updated successfully')
      toast.success('קטגוריה הוקצתה לתכנית בהצלחה! 🎉')
    } catch (err) {
      console.error('Error updating category plan availability:', err)
      
      setCategoryPlanAvailability(prevState => 
        prevState.filter(item => 
          !(item.category_id === categoryId && 
            item.plan_id === newPlanId && 
            item.isOptimistic)
        )
      )
      
      toast.error('שגיאה בהקצאת הקטגוריה')
      setLastUpdate(Date.now())
    }
  }

  const getCategoriesForPlan = (planId) => {
    const assignedCategoryIds = categoryPlanAvailability
      .filter(item => item.plan_id === planId)
      .map(item => item.category_id)
    
    const planCategories = categories.filter(category => 
      assignedCategoryIds.includes(parseInt(category.category_id)) &&
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    console.log(`Plan ${planId} categories:`, planCategories.length, 'assigned IDs:', assignedCategoryIds, 'availability length:', categoryPlanAvailability.length)
    return planCategories
  }

  const getAllCategories = () => {
    return categories.filter(category => 
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getBankCategories = () => {
    return categories.filter(category => 
      category.category_name.toLowerCase().includes(bankSearchTerm.toLowerCase())
    )
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
      await apiClient.updatePlan(plan.plan_id, planData)
      
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.plan_id === plan.plan_id 
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
      <style dangerouslySetInnerHTML={{__html: `
        /* Fix z-index for dragged items */
        [data-rbd-draggable-id][style*="position: fixed"] {
          z-index: 9999 !important;
        }
        /* Ensure drag portal renders above everything */
        [data-rbd-drag-handle-context-id] {
          z-index: 10000 !important;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}} />
      
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
              גרור קטגוריות מהבנק אל התכניות • ערוך מחירים ופיצ׳רים • נהל הקצאות בקלות
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

      {/* Main Content - Gentle Flow Layout */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Category Bank - Elegant Treasury */}
            <div className="mb-12">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Bank Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">🏛️ בנק הקטגוריות</h2>
                        <p className="text-blue-100 mt-1">גרור קטגוריות מכאן אל התכניות למטה</p>
                      </div>
                    </div>
                    {/* Search in Bank */}
                    <div className="max-w-xs">
                      <div className="relative">
                        <input
                          type="text"
                          value={bankSearchTerm}
                          onChange={(e) => setBankSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                          placeholder="חפש בבנק..."
                        />
                        <svg className="absolute left-3 top-2.5 w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Content */}
                <div className="p-8">
                  <PlanColumn 
                    key={`bank-${categories.length}-${categoryPlanAvailability.length}-${lastUpdate}`} 
                    isCategoryBank={true} 
                    categories={getBankCategories()}
                    categoryPlanAvailability={categoryPlanAvailability}
                    searchTerm={bankSearchTerm}
                    onRemoveClick={handleRemoveClick}
                  />
                </div>
              </div>
            </div>

            {/* Gentle Flow Indicator */}
            {plans.length > 0 && (
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-sm animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">גרור למטה כדי להקצות</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-sm animate-pulse animation-delay-500"></div>
                </div>
              </div>
            )}

            {/* Plan Cards - Elegant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plans.map(plan => (
                <div key={plan.plan_id} className="group">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Plan Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{plan.plan_name}</h3>
                          <p className="text-sm text-gray-600">{plan.plan_price ? `₪${plan.plan_price}` : 'מחיר לא הוגדר'}</p>
                        </div>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="ערוך תכנית"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Plan Content */}
                    <div className="p-4">
                      <PlanColumn 
                        key={`${plan.plan_id}-${categoryPlanAvailability.length}-${categoryPlanAvailability.filter(item => item.plan_id === plan.plan_id).length}-${lastUpdate}`} 
                        plan={plan} 
                        categories={categories}
                        categoryPlanAvailability={categoryPlanAvailability}
                        searchTerm={searchTerm}
                        onRemoveClick={handleRemoveClick}
                        onEditPlan={() => handleEditPlan(plan)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <DragOverlay>
              {activeId ? (
                <div className="px-4 py-2 bg-white rounded-xl shadow-xl border-2 border-blue-500 flex items-center gap-2 opacity-95 transform rotate-1">
                  {(() => {
                    const activeCategory = getActiveCategory()
                    return (
                      <>
                        {activeCategory?.category_icon ? (
                          <img 
                            src={activeCategory.category_icon} 
                            alt={activeCategory.category_name}
                            className="w-6 h-6 rounded-lg"
                          />
                        ) : (
                          <FolderOpen className="w-6 h-6 text-blue-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {activeCategory?.category_name}
                        </span>
                      </>
                    )
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
                צור תכניות סינון כדי להתחיל בהקצאת קטגוריות מהבנק
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


      {/* Tooltip */}
      <Tooltip
        id="category-tooltip"
        style={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          zIndex: 10000
        }}
      />
    </div>
  )
}

export default CategoryPlanManager