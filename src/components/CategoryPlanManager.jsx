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
  const { openConfirmModal } = useModal()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryPlanAvailability, setCategoryPlanAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // Start drag immediately
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
        // Convert detailed response to simple format for state management
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

    // Convert to numbers to ensure consistent type matching
    const numericCategoryId = parseInt(categoryId)
    const numericPlanId = parseInt(planId)

    // OPTIMISTIC UPDATE: Remove immediately from UI
    const itemToRemove = categoryPlanAvailability.find(item => 
      item.category_id === numericCategoryId && item.plan_id === numericPlanId
    )

    if (!itemToRemove) {
      toast.error('לא נמצאה הקטגוריה להסרה')
      return
    }

    // Store original item for potential restoration
    const originalItem = { ...itemToRemove }

    // Remove from UI immediately
    setCategoryPlanAvailability(prevState => {
      const newState = prevState.filter(item => 
        !(item.category_id === numericCategoryId && item.plan_id === numericPlanId)
      )
      console.log('Optimistically removed, new state:', newState)
      return newState
    })

    // Force re-render immediately
    setLastUpdate(Date.now())

    try {
      await apiClient.removeCategoryFromPlan(categoryId, planId)
      
      console.log('Category successfully removed from server')
      toast.success('קטגוריה הוסרה מהתכנית בהצלחה! ♻️')
    } catch (err) {
      console.error('Error removing category from plan:', err)
      
      // REVERT OPTIMISTIC UPDATE: Restore the item
      setCategoryPlanAvailability(prevState => {
        const restoredState = [...prevState, originalItem]
        console.log('Reverted removal, restored state:', restoredState)
        return restoredState
      })
      
      toast.error('שגיאה בהסרת הקטגוריה מהתכנית')
      
      // Force re-render to show reverted state
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

    // Only allow dragging FROM the bank (not between plans)
    if (!active.id.includes('-bank')) {
      return
    }

    // If dropped back in bank, do nothing
    if (over.id === 'category-bank') {
      return
    }

    // Extract category ID from active.id (format: category-123-bank)
    const categoryId = parseInt(active.id.split('-')[1])
    const newPlanId = parseInt(over.id.replace('plan-', ''))

    // Check if already assigned to this plan
    const isAlreadyAssigned = categoryPlanAvailability.some(
      item => item.category_id === categoryId && item.plan_id === newPlanId
    )

    if (isAlreadyAssigned) {
      toast.error('הקטגוריה כבר מוקצית לתכנית זו')
      return
    }

    // OPTIMISTIC UPDATE: Add to local state immediately
    const newAssignment = {
      category_id: categoryId,
      plan_id: newPlanId,
      created_at: new Date().toISOString(),
      isOptimistic: true // Flag to identify optimistic updates
    }

    setCategoryPlanAvailability(prevState => [
      ...prevState,
      newAssignment
    ])

    // Force re-render immediately
    setLastUpdate(Date.now())

    try {
      // Make API call
      await apiClient.assignCategoryToPlan(categoryId, newPlanId)

      // Remove optimistic flag after successful API call
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
      toast.success('קטגוריה הוקצתה לתכנית בהצלחה! 🎉 (ניתן להקצות לתכניות נוספות)')
    } catch (err) {
      console.error('Error updating category plan availability:', err)
      
      // REVERT OPTIMISTIC UPDATE: Remove the failed assignment
      setCategoryPlanAvailability(prevState => 
        prevState.filter(item => 
          !(item.category_id === categoryId && 
            item.plan_id === newPlanId && 
            item.isOptimistic)
        )
      )
      
      toast.error('שגיאה בהקצאת הקטגוריה')
      
      // Force re-render to show reverted state
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



  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">טוען תכניות סינון</h3>
            <p className="text-gray-600">מארגן קטגוריות ותכניות...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 drag-container" >
      <style dangerouslySetInnerHTML={{__html: `
        /* Fix z-index for dragged items */
        [data-rbd-draggable-id][style*="position: fixed"] {
          z-index: 9999 !important;
        }
        /* Ensure drag portal renders above everything */
        [data-rbd-drag-handle-context-id] {
          z-index: 10000 !important;
        }
      `}} />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול תכניות סינון</h1>
              <p className="text-gray-600">הקצה קטגוריות לתכניות סינון עם גרירה ושחרור</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <span>🏦</span>
                  <span>בנק קטגוריות</span>
                  <span className="text-gray-400">→</span>
                  <span>📋 תכניות סינון</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">קטגוריה → כמה תכניות</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש קטגוריה</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              placeholder="חפש קטגוריה לפי שם..."
              aria-label="חיפוש קטגוריה"
            />
          </div>
        </div>

        {/* Statistics */}
        <Statistics 
          plans={plans}
          categories={categories}
          categoryPlanAvailability={categoryPlanAvailability}
        />
      </div>



      {/* Drag and Drop Plans - Schema Layout */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          {/* Category Bank - Top Center */}
          <div className="flex justify-center mb-16">
            <PlanColumn 
              key={`bank-${categories.length}-${categoryPlanAvailability.length}-${lastUpdate}`} 
              isCategoryBank={true} 
              categories={categories}
              categoryPlanAvailability={categoryPlanAvailability}
              searchTerm={searchTerm}
              onRemoveClick={handleRemoveClick}
            />
          </div>
          
          {/* Connection Lines Container */}
          {plans.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <svg className="w-full h-full">
                {plans.map((plan, index) => {
                  const bankCenterX = 50; // Center of category bank (percentage)
                  const planCenterX = (100 / (plans.length + 1)) * (index + 1); // Distribute plans evenly
                  const bankY = 200; // Approximate Y position of bank bottom
                  const planY =450; // Approximate Y position of plan top
                  
                  return (
                    <g key={plan.plan_id}>
                      {/* Dotted line from bank to plan */}
                      <line
                        x1={`${bankCenterX}%`}
                        y1={bankY}
                        x2={`${planCenterX}%`}
                        y2={planY}
                        stroke="#e5e7eb"
                        strokeWidth="2"
                        strokeDasharray="8,4"
                        className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                      />
                      {/* Small circle at plan connection point */}
                      <circle
                        cx={`${planCenterX}%`}
                        cy={planY}
                        r="4"
                        fill="#8b5cf6"
                        className="opacity-40"
                      />
                    </g>
                  );
                })}
                
                {/* Main distribution hub from bank */}
                <circle
                  cx={`${50}%`}
                  cy={200}
                  r="6"
                  fill="#6366f1"
                  className="opacity-60"
                />
              </svg>
            </div>
          )}
          
          {/* Plan Columns - Bottom Row */}
          <div className="flex flex-wrap justify-center gap-8 pt-8">
            {plans.map(plan => (
              <PlanColumn 
                key={`${plan.plan_id}-${categoryPlanAvailability.length}-${categoryPlanAvailability.filter(item => item.plan_id === plan.plan_id).length}-${lastUpdate}`} 
                plan={plan} 
                categories={categories}
                categoryPlanAvailability={categoryPlanAvailability}
                searchTerm={searchTerm}
                onRemoveClick={handleRemoveClick}
              />
            ))}
          </div>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="w-12 h-12 bg-white rounded-full shadow-lg border-2 border-purple-500 flex items-center justify-center opacity-90">
              {(() => {
                const activeCategory = getActiveCategory()
                return activeCategory?.category_icon ? (
                  <img 
                    src={activeCategory.category_icon} 
                    alt={activeCategory.category_name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <FolderOpen className="w-6 h-6 text-purple-600" />
                )
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {plans.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">אין תכניות סינון</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">צור תכניות סינון כדי להתחיל בהקצאת קטגוריות</p>
          <button 
            onClick={loadData}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
            🔄 רענן נתונים
          </button>
        </div>
      )}


      {/* Tooltip */}
      <Tooltip
        id="category-tooltip"
        style={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10000
        }}
      />
    </div>
  )
}

export default CategoryPlanManager