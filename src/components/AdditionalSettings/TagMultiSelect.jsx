import { useMemo } from 'react'
import Select from 'react-select'

/**
 * Custom styles for react-select to match design
 */
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minWidth: '300px',
    width: '100%',
    borderColor: state.isFocused ? '#a855f7' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #a855f7' : 'none',
    '&:hover': {
      borderColor: '#a855f7'
    },
    borderRadius: '0.5rem',
    padding: '2px',
    minHeight: '42px'
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 8px',
    flexWrap: 'wrap',
    gap: '4px'
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#f3e8ff',
    borderRadius: '9999px',
    margin: '2px',
    maxWidth: 'none'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#6b21a8',
    fontWeight: '500',
    fontSize: '0.875rem',
    padding: '4px 8px',
    paddingLeft: '10px'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#6b21a8',
    borderRadius: '9999px',
    '&:hover': {
      backgroundColor: '#e9d5ff',
      color: '#581c87'
    }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    border: '1px solid #e5e7eb'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#f3e8ff'
      : state.isFocused
      ? '#f9fafb'
      : 'white',
    color: state.isSelected ? '#6b21a8' : '#111827',
    '&:active': {
      backgroundColor: '#f3e8ff'
    }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '0.875rem'
  })
}

/**
 * TagMultiSelect - Component for multi-select tag dropdown using react-select
 *
 * @param {Object} app - App object with available_tags
 * @param {Array} selectedTagIds - Array of selected tag IDs
 * @param {Function} onChange - Callback when selection changes (packageName, newSelectedTagIds)
 */
const TagMultiSelect = ({ app, selectedTagIds = [], onChange }) => {
  // Transform app tags to react-select format - memoized to prevent recreation on each render
  const options = useMemo(() => {
    return (app.available_tags || []).map(tag => ({
      value: Number(tag.id), // Ensure value is a number
      label: `${tag.display_name || tag.tag_name}${tag.is_default === 1 ? ' ⭐' : ''}`,
      tag: tag
    }))
  }, [app.available_tags])

  // Get selected options - ensure both are numbers for comparison
  const selectedOptions = useMemo(() => {
    const normalizedSelectedIds = (selectedTagIds || []).map(id => Number(id))
    return options.filter(opt => normalizedSelectedIds.includes(opt.value))
  }, [selectedTagIds, options])

  // Debug log
  console.log('TagMultiSelect for', app.app_name, {
    selectedTagIds,
    options,
    selectedOptions
  })

  const handleChange = (selected) => {
    const newSelectedIds = selected ? selected.map(opt => opt.value) : []
    onChange(app.package_name, newSelectedIds)
  }

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      styles={customSelectStyles}
      placeholder="בחר תגיות..."
      noOptionsMessage={() => 'אין תגיות זמינות'}
      closeMenuOnSelect={false}
      isSearchable={false}
      className="react-select-container"
      classNamePrefix="react-select"
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => option.label}
    />
  )
}

export default TagMultiSelect
