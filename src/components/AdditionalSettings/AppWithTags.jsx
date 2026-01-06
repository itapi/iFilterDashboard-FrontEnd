import AppIcon from './AppIcon'
import TagMultiSelect from './TagMultiSelect'

/**
 * AppWithTags - Component to display an app with its tag multi-select
 *
 * @param {Object} app - App object with package_name, app_name, icon_url, available_tags
 * @param {Array} selectedTags - Object mapping package names to selected tag IDs
 * @param {Function} onTagSelectionChange - Callback when tag selection changes
 */
const AppWithTags = ({ app, selectedTags, onTagSelectionChange }) => {
  const currentSelectedTags = selectedTags[app.package_name] || []

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
      {/* App Icon and Name */}
      <AppIcon iconUrl={app.icon_url} appName={app.app_name} />

      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-gray-900 mb-1">
          {app.app_name}
        </h4>
        <p className="text-sm text-gray-600 truncate">
          {app.package_name}
        </p>
      </div>

      {/* Tag Multi-Select */}
      <div className="flex-shrink-0" style={{ minWidth: '320px' }}>
        <TagMultiSelect
          app={app}
          selectedTagIds={currentSelectedTags}
          onChange={onTagSelectionChange}
        />
      </div>
    </div>
  )
}

export default AppWithTags
