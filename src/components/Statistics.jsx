import { Clipboard, FolderOpen, Link, X } from 'lucide-react'

const Statistics = ({ plans, categories, categoryPlanAvailability }) => {
  return (
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
  )
}

export default Statistics