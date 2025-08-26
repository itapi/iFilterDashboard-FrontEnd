import React, { useRef, useEffect, useCallback, useState } from "react";
import "./Table.css";
import PropTypes from "prop-types";
import { Cell } from "./Cell/Cell";
import { useTrans } from "../../../../../hooks/useTrans";

export const Table = ({ 
  tableConfig, 
  onLoadMore, 
  hasMore = false, 
  onUpdateData,
  onSelectionChange, // New prop to handle selection changes
  selectable = false, // Control whether rows can be selected
  stickyHeader = false, // Control whether header should be sticky
}) => {
  const { columns, data, onRowClick } = tableConfig;
  const { t } = useTrans();
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Add a local state to manage data updates
  const [localData, setLocalData] = useState(data || []);
  
  // State to track selected rows
  const [selectedRows, setSelectedRows] = useState({});
  // Track if all rows are selected
  const [selectAll, setSelectAll] = useState(false);

  // Update local data when props change
  useEffect(() => {
    setLocalData(data || []);
  }, [data]);

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Function to handle data updates from Cell components
  const handleDataUpdate = (success, rowId, field, value) => {
    if (!success) {
      // Call onUpdateData even if update is not successful (if needed)
      if (onUpdateData) {
        onUpdateData(success, rowId, field, value, null);
      }
      return;
    }

    // Update local data
    const updatedData = localData.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    );

    setLocalData(updatedData);

    // Propagate changes upward
    if (onUpdateData) {
      onUpdateData(success, rowId, field, value, updatedData);
    }
  };

  // Function to handle row click (if provided)
  const handleRowClick = (row, event) => {
    // Don't trigger row click when clicking on checkboxes or editable cells
    if (
      event.target.type === 'checkbox' || 
      event.target.closest('.editable-cell') ||
      !onRowClick
    ) {
      return;
    }
    
    onRowClick(row);
  };

  // Handle checkbox selection for a single row
  const handleRowSelection = (rowId) => {
    const newSelectedRows = { ...selectedRows };
    
    if (newSelectedRows[rowId]) {
      delete newSelectedRows[rowId];
    } else {
      newSelectedRows[rowId] = true;
    }
    
    setSelectedRows(newSelectedRows);
    
    // Update selectAll state based on whether all rows are selected
    setSelectAll(Object.keys(newSelectedRows).length === localData.length);
    
    // Notify parent component about selection change
    if (onSelectionChange) {
      onSelectionChange(Object.keys(newSelectedRows).map(id => id));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    let newSelectedRows = {};
    
    if (newSelectAll) {
      // Select all rows
      localData.forEach(row => {
        newSelectedRows[row.id] = true;
      });
    }
    
    setSelectAll(newSelectAll);
    setSelectedRows(newSelectedRows);
    
    // Notify parent component about selection change
    if (onSelectionChange) {
      onSelectionChange(Object.keys(newSelectedRows).map(id => id));
    }
  };

  return (
    <>
      <table className="table w-full">
        <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
          <tr className="bg-gray-100">
            {/* Checkbox column for select all */}
            {selectable && (
              <th className="w-10 p-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.id} className="text-start p-2">
                {t(column.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-start">
          {localData?.length > 0 &&
            localData.map((row) => (
              <tr
                key={row.id}
                className={`even:bg-gray-100 odd:bg-white h-10 text-sm cursor-pointer hover:bg-gray-200 ${
                  selectedRows[row.id] ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
                onClick={(e) => handleRowClick(row, e)}
              >
                {/* Checkbox for row selection */}
                {selectable && (
                  <td className="w-10 p-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={!!selectedRows[row.id]}
                      onChange={() => handleRowSelection(row.id)}
                      onClick={(e) => e.stopPropagation()} // Prevent row click event
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.id} className="p-2">
                    <Cell
                      row={row}
                      column={{ ...column, tableType: tableConfig.tableType }}
                      data={localData}
                      validations={column.validations}
                      onDataUpdate={handleDataUpdate}
                    />
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {/* This div acts as a sentinel for the intersection observer */}
      <div ref={loadMoreRef} className="h-4" />
    </>
  );
};


Table.propTypes = {
  tableConfig: PropTypes.shape({
    columns: PropTypes.array,
    data: PropTypes.array,
    onRowClick: PropTypes.func,
    tableType: PropTypes.string,
  }),
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  onUpdateData: PropTypes.func,
  onSelectionChange: PropTypes.func, 
  selectable: PropTypes.bool, 
  stickyHeader: PropTypes.bool, 
};