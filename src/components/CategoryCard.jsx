import { useDraggable } from '@dnd-kit/core'
import { FolderOpen, X } from 'lucide-react'

const CategoryCard = ({ 
  category, 
  index, 
  sourceLocation, 
  planName, 
  categoryPlanAvailability,
  onRemoveClick 
}) => {
  const isFromBank = sourceLocation === 'bank'
  const assignedPlansCount = categoryPlanAvailability.filter(
    item => item.category_id === parseInt(category.category_id)
  ).length
  
  const isOptimistic = !isFromBank && categoryPlanAvailability.some(
    item => item.category_id === parseInt(category.category_id) && 
             item.plan_id === parseInt(sourceLocation.replace('plan-', '')) &&
             item.isOptimistic
  )
  
  if (!isFromBank) {
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
        {!isOptimistic && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemoveClick(category.category_id, sourceLocation.replace('plan-', ''), category.category_name, planName)
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
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `category-${category.category_id}-${sourceLocation}`,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`w-12 h-12 bg-white rounded-full shadow-sm border-2 border-gray-200 flex items-center justify-center ${
          isDragging 
            ? 'opacity-0' 
            : 'hover:shadow-md hover:border-purple-300 hover:scale-105 transition-all duration-200 cursor-grab'
        }`}
        data-tooltip-id="category-tooltip"
        data-tooltip-content={`${category.category_name} - גרור לתכנית${assignedPlansCount > 0 ? ` (מוקצה ל-${assignedPlansCount} תכניות)` : ''}`}
        data-tooltip-place="top"
        role="button"
        tabIndex={0}
        aria-label={`קטגוריה: ${category.category_name} - ניתן לגרירה`}
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
    </div>
  )
}

export default CategoryCard