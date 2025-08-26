import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTrans } from "../../../../../../hooks/useTrans";
import "./Cell.css";
import PropTypes from "prop-types";
import { TabLink } from "../../../../TabLink/TabLink";
import { svgIcons } from "../../../../../../assets/svgs";
import { updateData } from "../../../../../../server/services/dataService";

export const Cell = ({ row, column, data = [], validations = null, onDataUpdate }) => {
  const { t, df } = useTrans();
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

  const isValidDate = (_date) => {
    return dayjs(_date).isValid() || true;
  };

  const isPastDate = (_date) => {
    return dayjs(_date).isBefore(dayjs());
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
        // Handle nested keys for update payload
        let updatePayload;
        if (column.key.includes('.')) {
          const keys = column.key.split('.');
          updatePayload = {};
          let current = updatePayload;
          
          // Build nested object structure
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = newVal;
        } else {
          updatePayload = {
            [column.key]: newVal,
          };
        }

        // Skip API call for payer_number field - just save locally
        if (column.key === "resident_subscription.payer_number") {
          console.log(`Saving locally: ${column.key} = ${newVal}`);
          if (onDataUpdate) {
            onDataUpdate(true, row.id, column.key, newVal);
          }
        } else {
          // Make API call for other fields
          await updateData(tableType, row.id, updatePayload);
          if (onDataUpdate) {
            onDataUpdate(true, row.id, column.key, newVal);
          }
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
    // For local-only fields, save the value instead of reverting
    if (column.key === "resident_subscription.payer_number") {
      handleSave();
    } else {
      setEditValue(val);
      setIsEditing(false);
    }
  };

  if (isEditing && editorType !== "boolean") {
    switch (editorType) {
      case "date":
        return (
          <input
            ref={inputRef}
            type="date"
            className="w-full p-1 border rounded"
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
            className="w-full p-1 border rounded"
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
            className="w-full p-1 border rounded"
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
            className="w-full p-1 border rounded"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
      case "phoneNumber":
        return (
          <input
            ref={inputRef}
            type="tel"
            className="w-full p-1 border rounded"
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
            className="w-full p-1 border rounded"
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
            className="w-full p-1 border rounded h-[40px]"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        );
    }
  }

  const cellClass = isEditableType && !column.render ? "editable-cell" : "";

  if (editorType === "boolean" && isEditableType) {
    return (
      <div className={cellClass}>
        <input
          type="checkbox"
          className="w-5 h-5"
          checked={val === true || val === "true"}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()} // Prevent cell click from interfering
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
        <div className={`${cellClass} flex items-center `}>
          {val === true || val === "true" ? (
            <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      );
    case "email":
      return (
        <a
          className="text-blue-500 underline"
          href={`mailto:${val}`}
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </a>
      );
    case "phoneNumber":
      return (
        <a
          className="text-primary font-semibold"
          href={`tel:${val}`}
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </a>
      );
    case "date":
      return (
        <div className={cellClass} onClick={handleCellClick}>
          {isValidDate(val) ? df.date(val) : "-"}
        </div>
      );
    case "datetime":
      return (
        <div className={cellClass} onClick={handleCellClick}>
          {isValidDate(val) ? df.datetime(val) : "-"}
        </div>
      );
    case "date-deadline":
      return (
        <div className={cellClass} onClick={handleCellClick}>
          {isValidDate(val) ? (
            <span>
              {df.date(val)}{" "}
              {isPastDate(val) ? (
                <span
                  data-tooltip-id="dash-tooltip"
                  data-tooltip-content={
                    t("פניה לא טופלה מעל ל") +
                    "-" +
                    df.relative(val).replace(t("לפני"), "")
                  }
                >
                  🕛
                </span>
              ) : (
                ""
              )}
            </span>
          ) : (
            "-"
          )}
        </div>
      );
    case "link":
      return <a href={val}>{val}</a>;
    case "TabLink":
      return (
        <TabLink type={column?.tabType} data={{ resident: row }}>
          {val}
        </TabLink>
      );
    case "view/download":
      return (
        <div className="flex items-center gap-x-0">
          <a
            href={"#viewDoc/" + row.id}
            className=" rounded-full hover:bg-gray-100 hover:text-blue-600 transform hover:scale-110 transition-all duration-300 ease-in-out"
            title="View Document"
          >
            {svgIcons.view()}
          </a>
          <a
            href={"#downloadDoc/" + row.id}
            className=" rounded-full hover:bg-gray-100 hover:text-green-600 transform hover:scale-110 transition-all duration-300 ease-in-out"
            title="Download Document"
          >
            {svgIcons.download()}
          </a>
        </div>
      );

    case "download":
      return (
        <div className="flex items-center gap-x--4">
          <a
            href={"#downloadDoc/" + row.id}
            className="hover:text-green-600 transition duration-300"
          >
            {svgIcons.download()}
          </a>
        </div>
      );
    case "editable":
      if (column.render) {
        return column.render(row) || val;
      }
      return (
        <div className="editable-cell" onClick={handleCellClick}>
          {val}
        </div>
      );
    case "image":
      return (
        <img
          src={val}
          alt=""
          className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-gray-100 transition-all duration-300 hover:shadow-md"
        />

      );
    case "button":
    case "custom":
    case "status":
      return column.render(row) || val;
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
    tabType: PropTypes.string,
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