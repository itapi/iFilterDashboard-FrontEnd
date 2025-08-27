import { useDroppable } from '@dnd-kit/core'
import { Clipboard } from 'lucide-react'
import CategoryCard from './CategoryCard'

const DroppableArea = ({ id, isCategoryBank, planCategories, onRemoveClick, categoryPlanAvailability, plan }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-6 top-24 rounded-full flex items-center justify-center transition-all duration-300 min-h-[200px] ${
        isOver ? 'bg-purple-50 border-2 border-dashed border-purple-400 scale-105' : ''
      }`}
      style={{
        minHeight: '200px',
      }}
    >
      <div className={`${
        isCategoryBank 
          ? 'flex flex-wrap gap-2 p-4 items-center justify-center max-w-xs' 
          : 'grid grid-cols-6 gap-2 p-4 w-full h-full items-center justify-items-center content-center relative'
      }`}>
        {planCategories.map((category, index) => (
          <div key={category.category_id} className="relative">
            <CategoryCard 
              category={category} 
              index={index} 
              sourceLocation={isCategoryBank ? 'bank' : `plan-${plan.plan_id}`}
              planName={plan?.plan_name}
              categoryPlanAvailability={categoryPlanAvailability}
              onRemoveClick={onRemoveClick}
            />
          </div>
        ))}
      </div>
      
      {planCategories.length === 0 && !isOver && (
        <div className="text-center text-gray-400 absolute inset-0 flex flex-col items-center justify-center">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H5a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">גרור קטגוריות לכאן</p>
          <p className="text-xs text-gray-500 mt-1">✨ אזור ריק - מוכן לקבלת קטגוריות</p>
        </div>
      )}
    </div>
  )
}

const PlanColumn = ({ 
  plan, 
  isCategoryBank = false, 
  categories = [], 
  categoryPlanAvailability = [],
  searchTerm = '',
  onRemoveClick 
}) => {
  const getCategoriesForPlan = (planId) => {
    const assignedCategoryIds = categoryPlanAvailability
      .filter(item => item.plan_id === planId)
      .map(item => item.category_id)
    
    return categories.filter(category => 
      assignedCategoryIds.includes(parseInt(category.category_id)) &&
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getAllCategories = () => {
    return categories.filter(category => 
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const planCategories = isCategoryBank ? getAllCategories() : getCategoriesForPlan(plan?.plan_id)
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-80 h-80 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
        isCategoryBank ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-4 border-blue-400 shadow-2xl ring-4 ring-blue-200 ring-opacity-50' : 'bg-gradient-to-br from-white to-gray-50 border-4 border-gray-200 shadow-lg hover:shadow-xl'
      }`}>
        
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

        <DroppableArea 
          id={isCategoryBank ? 'category-bank' : `plan-${plan.plan_id}`}
          isCategoryBank={isCategoryBank}
          planCategories={planCategories}
          onRemoveClick={onRemoveClick}
          categoryPlanAvailability={categoryPlanAvailability}
          plan={plan}
        />
      </div>

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

export default PlanColumn