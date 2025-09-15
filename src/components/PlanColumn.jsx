import { useDroppable } from '@dnd-kit/core'
import { Package, Sparkles } from 'lucide-react'
import CategoryCard from './CategoryCard'

const DroppableArea = ({ id, isCategoryBank, planCategories, onRemoveClick, categoryPlanAvailability, plan }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  const dropZoneClass = isCategoryBank 
    ? `min-h-[200px] p-6 rounded-2xl transition-all duration-300 ${
        isOver 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 scale-[1.02]' 
          : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100'
      }`
    : `min-h-[160px] p-4 rounded-xl transition-all duration-300 ${
        isOver 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300' 
          : 'bg-gray-50/50'
      }`

  return (
    <div ref={setNodeRef} className={dropZoneClass}>
      <div className={`${
        isCategoryBank 
          ? 'flex flex-wrap gap-3 justify-start items-start' 
          : 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2'
      }`}>
        {planCategories.map((category, index) => (
          <CategoryCard 
            key={category.category_id}
            category={category} 
            index={index} 
            sourceLocation={isCategoryBank ? 'bank' : `plan-${plan?.plan_unique_id}`}
            planName={plan?.plan_name}
            categoryPlanAvailability={categoryPlanAvailability}
            onRemoveClick={onRemoveClick}
          />
        ))}
      </div>
      
      {planCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            isOver 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {isCategoryBank ? (
              <Package className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <p className={`text-sm font-medium mb-1 ${
            isOver ? 'text-blue-700' : 'text-gray-500'
          }`}>
            {isCategoryBank 
              ? 'כל הקטגוריות הזמינות'
              : isOver 
                ? 'שחרר כדי להוסיף קטגוriה'
                : 'גרור קטגוריות לכאן'
            }
          </p>
          {!isCategoryBank && (
            <p className="text-xs text-gray-400">
              ✨ התכנית ריקה - מוכנה לקטגוriות
            </p>
          )}
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
      .filter(item => item.plan_unique_id == planId)
      .map(item => item.category_id)

    return categories.filter(category =>
      assignedCategoryIds.includes(category.category_id) &&
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getAllCategories = () => {
    return categories.filter(category => 
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const planCategories = isCategoryBank ? getAllCategories() : getCategoriesForPlan(plan?.plan_unique_id)
  
  if (isCategoryBank) {
    return (
      <DroppableArea 
        id="category-bank"
        isCategoryBank={true}
        planCategories={planCategories}
        onRemoveClick={onRemoveClick}
        categoryPlanAvailability={categoryPlanAvailability}
        plan={null}
      />
    )
  }
  
  return (
    <div className="w-full">
      {/* Plan Categories */}
      <DroppableArea 
        id={`plan-${plan.plan_unique_id}`}
        isCategoryBank={false}
        planCategories={planCategories}
        onRemoveClick={onRemoveClick}
        categoryPlanAvailability={categoryPlanAvailability}
        plan={plan}
      />

      {/* Plan Features - Below categories */}
      {(plan.feature1 || plan.feature2 || plan.feature3) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            תכונות התכנית
          </h4>
          <div className="space-y-2">
            {plan.feature1 && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="leading-relaxed">{plan.feature1}</span>
              </div>
            )}
            {plan.feature2 && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="leading-relaxed">{plan.feature2}</span>
              </div>
            )}
            {plan.feature3 && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="leading-relaxed">{plan.feature3}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanColumn