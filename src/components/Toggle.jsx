import React from "react";
import PropTypes from "prop-types";

export const Toggle = ({
  options = [],
  value,
  onChange,
  toggleStyle = "button",
  className = "",
}) => {
  const handleClick = (option) => {
    if (onChange && option.id !== value) {
      onChange(option.id);
    }
  };

  const styles = {
    container: {
      button: "flex overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200",
      tabs: "flex space-x-reverse space-x-1 bg-gray-50 p-1 rounded-xl",
      slider: "relative flex bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-1 shadow-sm",
    },
    options: {
      button: {
        base: "px-4 py-2.5 font-medium text-sm transition-all duration-200 cursor-pointer border-l first:border-l-0 border-gray-200 hover:bg-gray-50",
        active: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600",
        inactive: "text-gray-700 hover:text-gray-900",
      },
      tabs: {
        base: "px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 cursor-pointer relative z-10",
        active: "bg-white text-purple-600 shadow-sm",
        inactive: "text-gray-600 hover:text-gray-900 hover:bg-white/50",
      },
      slider: {
        base: "px-4 py-2 font-medium text-sm transition-all duration-300 cursor-pointer relative z-10 rounded-lg",
        active: "text-white",
        inactive: "text-white/80 hover:text-white",
      },
    },
  };

  const getContainerClass = () => {
    let baseClass = styles.container[toggleStyle];
    if (toggleStyle === "slider") {
      const gridCols = options.length === 2 ? "grid-cols-2" : `grid-cols-${options.length}`;
      baseClass += ` grid ${gridCols}`;
    }
    return baseClass;
  };

  const getOptionClass = (isActive) => {
    const styleConfig = styles.options[toggleStyle];
    return `${styleConfig.base} ${isActive ? styleConfig.active : styleConfig.inactive}`;
  };

  // Calculate slider position
  const getSliderStyles = () => {
    if (toggleStyle !== "slider") return {};
    
    const selectedIndex = options.findIndex(option => option.id === value);
    const leftPosition = selectedIndex >= 0 ? `${(selectedIndex * 100) / options.length}%` : '0%';
    const width = `${100 / options.length}%`;
    
    return { leftPosition, width };
  };

  const { leftPosition, width } = getSliderStyles();

  return (
    <div className={`${getContainerClass()} ${className}`}>
      {toggleStyle === "slider" && (
        <div
          className="absolute bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-300 ease-out z-0 m-1"
          style={{
            right: leftPosition,
            width: `calc(${width} - 8px)`,
            height: 'calc(100% - 8px)',
          }}
        />
      )}
      
      {options.map((option) => {
        const isActive = value === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => handleClick(option)}
            className={getOptionClass(isActive)}
            aria-pressed={isActive}
            role="tab"
          >
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive && toggleStyle === 'button' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

Toggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.element,
      count: PropTypes.number,
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  toggleStyle: PropTypes.oneOf(["button", "tabs", "slider"]),
  className: PropTypes.string,
};