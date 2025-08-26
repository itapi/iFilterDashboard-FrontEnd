import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle, XCircle, Clock, User, AlertCircle } from "lucide-react";

export const Cell = ({ row, column, data = [], validations = null, onDataUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  const tableType = column.tableType;

  const isEditableType = column.type === "editable";

  let val = "";
  if (column.key === "fullName") {
    val = (row["first_name"] || "") + " " + (row["last_name"] || "");
  } else {
    // Handle nested keys with dot notation
    if (column?.key?.includes(".")) {
      const keys = column.key.split(".");
      let current = row;

      // Traverse the nested objects
      for (const key of keys) {
        if (current && current[key] !== undefined) {
          current = current[key];
        } else {
          current = "";
          break;
        }
      }

      val = current;
    } else {
      // Handle simple keys without dots
      val = row[column.key] !== undefined ? row[column.key] : "";
    }
  }

  const editorType = column.editorType || "text";

  useEffect(() => {
    if (isEditing) {
      setEditValue(val);
      if (inputRef.current && editorType !== "boolean") {
        inputRef.current.focus();
      }
    }
  }, [isEditing, val, editorType]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCellClick = () => {
    // Skip entering edit mode for boolean fields to allow checkbox interaction
    if (isEditableType && !column.render && editorType !== "boolean") {
      setIsEditing(true);
    }
  };

  const handleSave = async (valueToSave = editValue) => {
    try {
      const currentVal = editorType === "boolean"
        ? val === true || val === "true"
        : val;

      const newVal = editorType === "boolean"
        ? valueToSave === true || valueToSave === "true"
        : valueToSave;

      if (newVal !== currentVal) {
        // For now, just update locally - you can add API calls here later
        if (onDataUpdate) {
          onDataUpdate(true, row.id, column.key, newVal);
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating data:", error);
      if (onDataUpdate) {
        onDataUpdate(false, row.id, column.key, editValue);
      }
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const value = editorType === "boolean" ? e.target.checked : e.target.value;
    setEditValue(value);

    // For boolean fields, save immediately when changed
    if (editorType === "boolean") {
      handleSave(value);
    }
  };

  const handleBlur = () => {
    setEditValue(val);
    setIsEditing(false);
  };

  if (isEditing && editorType !== "boolean") {
    switch (editorType) {
      case "date":
        return (
          <input
            ref={inputRef}
            type="date"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
      case "datetime":
        return (
          <input
            ref={inputRef}
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
      case "number":
        return (
          <input
            ref={inputRef}
            type="number"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
      case "email":
        return (
          <input
            ref={inputRef}
            type="email"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
      case "select":
        return (
          <select
            ref={inputRef}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          >
            {column.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <textarea
            ref={inputRef}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            rows={2}
          />
        );
    }
  }

  const cellClass = isEditableType && !column.render ? "editable-cell cursor-pointer hover:bg-gray-50 p-1 rounded" : "";

  if (editorType === "boolean" && isEditableType) {
    return (
      <div className={cellClass}>
        <input
          type="checkbox"
          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          checked={val === true || val === "true"}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  switch (column.type) {
    case "text":
      return <div className={cellClass} onClick={handleCellClick}>{val}</div>;
    
    case "number":
      return <div className={cellClass} onClick={handleCellClick}>{val}</div>;
    
    case "boolean":
      return (
        <div className="flex items-center justify-center">
          {val === true || val === "true" || val === 'open' ? (
            <div className="flex items-center space-x-reverse space-x-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">פתוח</span>
            </div>
          ) : (
            <div className="flex items-center space-x-reverse space-x-1 text-gray-500">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">סגור</span>
            </div>
          )}
        </div>
      );
    
    case "status":
      return (
        <div className="flex items-center">
          {val === 'open' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <AlertCircle className="w-3 h-3 ml-1" />
              פתוח
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <CheckCircle className="w-3 h-3 ml-1" />
              סגור
            </span>
          )}
        </div>
      );
    
    case "email":
      return (
        <a
          className="text-purple-600 hover:text-purple-800 underline font-medium"
          href={`mailto:${val}`}
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </a>
      );
    
    case "phone":
      return (
        <a
          className="text-purple-600 hover:text-purple-800 font-medium"
          href={`tel:${val}`}
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </a>
      );
    
    case "date":
      return (
        <div className={`${cellClass} flex items-center`} onClick={handleCellClick}>
          <Clock className="w-4 h-4 text-gray-400 ml-2" />
          <span>{formatDate(val)}</span>
        </div>
      );
    
    case "user":
      return (
        <div className="flex items-center space-x-reverse space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{val || 'לא מוקצה'}</span>
        </div>
      );
    
    case "priority":
      const priorityColors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800'
      };
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[val] || 'bg-gray-100 text-gray-800'}`}>
          {val === 'high' ? 'גבוה' : val === 'medium' ? 'בינוני' : val === 'low' ? 'נמוך' : val}
        </span>
      );
    
    case "link":
      return (
        <a 
          href={val} 
          className="text-purple-600 hover:text-purple-800 underline"
          onClick={(e) => e.stopPropagation()}
          target="_blank" 
          rel="noopener noreferrer"
        >
          {val}
        </a>
      );
    
    case "editable":
      if (column.render) {
        return column.render(row) || val;
      }
      return (
        <div className="editable-cell cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={handleCellClick}>
          {val}
        </div>
      );
    
    case "image":
      return (
        <div className="flex items-center justify-center">
          <img
            src={val}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        </div>
      );
    
    case "button":
    case "custom":
      return column.render ? column.render(row) : val;
    
    default:
      return <div onClick={handleCellClick}>{val}</div>;
  }
};

Cell.propTypes = {
  row: PropTypes.object.isRequired,
  column: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    key: PropTypes.string,
    type: PropTypes.string,
    editorType: PropTypes.string,
    render: PropTypes.func,
    tableType: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    validations: PropTypes.object,
  }).isRequired,
  data: PropTypes.array,
  validations: PropTypes.object,
  onDataUpdate: PropTypes.func,
};