import { useState } from 'react'
import { Users, FileText, ClipboardList } from 'lucide-react'
import ContactsTab from './Distributions/ContactsTab'
import TemplatesTab from './Distributions/TemplatesTab'
import TasksTab from './Distributions/TasksTab'

const TABS = [
  { id: 'contacts',  label: 'אנשי קשר',     icon: Users },
  { id: 'templates', label: 'תבניות הודעה',  icon: FileText },
  { id: 'tasks',     label: 'משימות הפצה',   icon: ClipboardList },
]

export default function Distributions() {
  const [activeTab, setActiveTab] = useState('contacts')

  return (
    <div className="p-6 min-h-screen bg-gray-50" dir="rtl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">הפצות</h1>
        <p className="text-sm text-gray-500 mt-1">ניהול אנשי קשר, תבניות הודעה ומשימות הפצה</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'contacts'  && <ContactsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'tasks'     && <TasksTab />}
    </div>
  )
}
