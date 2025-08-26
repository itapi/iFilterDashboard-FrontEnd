import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-toastify'
import apiClient from '../utils/api'
import { useModal } from '../contexts/ModalContext'
import { FolderOpen, Clipboard, Link, X } from 'lucide-react'

const CategoryPlanManager = () => {
  const { openConfirmModal } = useModal()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryPlanAvailability, setCategoryPlanAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdate, setLastUpdate] = useState(Date.now())

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

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Only allow dragging FROM the bank (not between plans)
    if (source.droppableId !== 'category-bank') {
      return
    }

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // If dropped back in bank, do nothing
    if (destination.droppableId === 'category-bank') {
      return
    }

    // Extract category ID from draggableId (format: category-123-bank)
    const categoryId = parseInt(draggableId.split('-')[1])
    const newPlanId = parseInt(destination.droppableId.replace('plan-', ''))

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

  const CategoryCard = ({ category, index, sourceLocation, planName }) => {
    const isFromBank = sourceLocation === 'bank'
    const assignedPlansCount = categoryPlanAvailability.filter(
      item => item.category_id === parseInt(category.category_id)
    ).length
    
    // Check if this category assignment is optimistic (pending server response)
    const isOptimistic = !isFromBank && categoryPlanAvailability.some(
      item => item.category_id === parseInt(category.category_id) && 
               item.plan_id === parseInt(sourceLocation.replace('plan-', '')) &&
               item.isOptimistic
    )
    
    if (!isFromBank) {
      // Non-draggable category in plans - just display with remove option
      return (
        <div className="relative group">
          <div
            className={`w-12 h-12 rounded-full shadow-sm border-2 flex items-center justify-center cursor-default transition-all duration-200 ${
              isOptimistic 
                ? 'bg-yellow-50 border-yellow-300 animate-pulse' 
                : 'bg-gray-50 border-gray-300'
            }`}
            data-tooltip-id="category-tooltip"
            data-tooltip-content={`${category.category_name} - ${isOptimistic ? 'שומר...' : 'מוקצה לתכנית'}`}
            data-tooltip-place="top"
            role="button"
            tabIndex={0}
            aria-label={`קטגוריה: ${category.category_name} - ${isOptimistic ? 'שומר...' : 'מוקצה לתכנית זו'}`}
          >
            {category.category_icon ? (
              <img 
                src={category.category_icon} 
                alt={category.category_name}
                className={`w-6 h-6 rounded-full pointer-events-none transition-opacity ${
                  isOptimistic ? 'opacity-60' : 'opacity-80'
                }`}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : (
              <FolderOpen className={`w-6 h-6 text-gray-600 pointer-events-none transition-opacity ${
                isOptimistic ? 'opacity-60' : 'opacity-80'
              }`} />
            )}
            <FolderOpen className="w-6 h-6 text-gray-600 hidden pointer-events-none opacity-80" />
          </div>
          {/* Remove button */}
          {!isOptimistic && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClick(category.category_id, sourceLocation.replace('plan-', ''), category.category_name, planName)
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
              data-tooltip-id="category-tooltip"
              data-tooltip-content="הסר מהתכנית"
              aria-label="הסר קטגוריה מהתכנית"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )
    }
    
    // Draggable category from bank
    return (
      <div className="relative">
        <Draggable draggableId={`category-${category.category_id}-${sourceLocation}`} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`w-12 h-12 bg-white rounded-full shadow-sm border-2 border-gray-200 flex items-center justify-center ${
                snapshot.isDragging 
                  ? 'shadow-2xl border-purple-500 bg-purple-50 cursor-grabbing transform scale-105' 
                  : 'hover:shadow-md hover:border-purple-300 hover:scale-105 transition-all duration-200 cursor-grab'
              }`}
              data-tooltip-id="category-tooltip"
              data-tooltip-content={`${category.category_name} - גרור לתכנית${assignedPlansCount > 0 ? ` (מוקצה ל-${assignedPlansCount} תכניות)` : ''}`}
              data-tooltip-place="top"
              role="button"
              tabIndex={0}
              aria-label={`קטגוריה: ${category.category_name} - ניתן לגרירה`}
              style={provided.draggableProps.style}
            >
              {category.category_icon ? (
                <img 
                  src={category.category_icon} 
                  alt={category.category_name}
                  className="w-6 h-6 rounded-full pointer-events-none"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
              ) : (
                <FolderOpen className="w-6 h-6 text-blue-600 pointer-events-none" />
              )}
              <FolderOpen className="w-6 h-6 text-blue-600 hidden pointer-events-none" />
            </div>
          )}
        </Draggable>
   
      </div>
    )
  }

  const PlanColumn = ({ plan, isCategoryBank = false }) => {
    const planCategories = isCategoryBank ? getAllCategories() : getCategoriesForPlan(plan?.plan_id)
    
    return (
      <div className="flex flex-col items-center">
        {/* Plan Circle Container */}
        <div className={`relative w-80 h-80 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
          isCategoryBank ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-4 border-blue-400 shadow-2xl ring-4 ring-blue-200 ring-opacity-50' : 'bg-gradient-to-br from-white to-gray-50 border-4 border-gray-200 shadow-lg hover:shadow-xl'
        }`}>
          
          {/* Plan Header - Center Top */}
          <div className="absolute top-8 text-center">
            {isCategoryBank ? (
              <>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900">🏦 בנק הקטגוריות</h3>
                <p className="text-sm text-blue-700 font-medium">כל הקטגוריות הזמינות</p>
                <p className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full mt-2 shadow-sm">← גרור לתכניות (ניתן לכמה) ←</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  {plan.image_url ? (
                    <img 
                      src={plan.image_url} 
                      alt={plan.plan_name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                  ) : (
                    <Clipboard className="w-6 h-6 text-blue-600" />
                  )}
                  <Clipboard className="w-6 h-6 text-blue-600 hidden" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.plan_name}</h3>
                <p className="text-xs text-gray-600">{plan.price}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {planCategories.length}
                </span>
              </>
            )}
          </div>

          {/* Drop Zone - Center Circle Area */}
          <Droppable droppableId={isCategoryBank ? 'category-bank' : `plan-${plan.plan_id}`} type="CATEGORY">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`absolute inset-6 top-24 rounded-full flex items-center justify-center transition-all duration-300 min-h-[200px] ${
                  snapshot.isDraggingOver ? 'bg-purple-50 border-2 border-dashed border-purple-400 scale-105' : ''
                }`}
                style={{
                  minHeight: '200px'
                }}
              >
                {/* Categories Grid */}
                <div className="grid grid-cols-6 gap-2 p-4 w-full h-full items-center justify-items-center content-center relative">
                  {planCategories.map((category, index) => (
                    <div key={category.category_id} className="relative">
                      <CategoryCard 
                        category={category} 
                        index={index} 
                        sourceLocation={isCategoryBank ? 'bank' : `plan-${plan.plan_id}`}
                        planName={plan?.plan_name}
                      />
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
                
                {planCategories.length === 0 && !snapshot.isDraggingOver && (
                  <div className="text-center text-gray-400 absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H5a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">גרור קטגוריות לכאן</p>
                    <p className="text-xs text-gray-500 mt-1">✨ אזור ריק - מוכן לקבלת קטגוריות</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {/* Plan Features - Below Circle */}
        {!isCategoryBank && plan && (
          <div className="mt-4 text-center max-w-xs">
            {(plan.feature1 || plan.feature2 || plan.feature3) && (
              <div className="space-y-1">
                {plan.feature1 && (
                  <div className="flex items-center justify-center text-xs text-gray-600">
                    <svg className="w-3 h-3 text-green-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {plan.feature1}
                  </div>
                )}
                {plan.feature2 && (
                  <div className="flex items-center justify-center text-xs text-gray-600">
                    <svg className="w-3 h-3 text-green-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {plan.feature2}
                  </div>
                )}
                {plan.feature3 && (
                  <div className="flex items-center justify-center text-xs text-gray-600">
                    <svg className="w-3 h-3 text-green-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {plan.feature3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
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
    <div className="p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-reverse space-x-3">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ml-3">
                <Clipboard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">תכניות סינון</p>
                <p className="text-xl font-bold text-gray-900">{plans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center ml-3">
                <FolderOpen className="w-5 h-5 text-green-600" />
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
                <Link className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הקצאות</p>
                <p className="text-xl font-bold text-gray-900">{categoryPlanAvailability.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center ml-3">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">לא מוקצות</p>
                <p className="text-xl font-bold text-gray-900">{categories.length - categoryPlanAvailability.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Drag and Drop Plans - Schema Layout */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="relative">
          {/* Category Bank - Top Center */}
          <div className="flex justify-center mb-16">
            <PlanColumn 
              key={`bank-${categories.length}-${categoryPlanAvailability.length}-${lastUpdate}`} 
              isCategoryBank={true} 
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
              />
            ))}
          </div>
        </div>
      </DragDropContext>

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