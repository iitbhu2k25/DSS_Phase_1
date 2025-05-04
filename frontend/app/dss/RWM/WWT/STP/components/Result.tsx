'use client'
import React, { useState } from 'react';

// Mock data for demonstration
// const mockTableData = [
//   {
//     name: 'Region A',
//     mean: 15.45,
//     population: 1200000,
//     area: 5000,
//     sewage_gap: 450,
//     mean_temperature: 28.5,
//     mean_rainfall: 1200,
//     number_of_tourists: 500000
//   },
//   {
//     name: 'Region B',
//     mean: 35.72,
//     population: 2500000,
//     area: 8200,
//     sewage_gap: 380,
//     mean_temperature: 26.8,
//     mean_rainfall: 950,
//     number_of_tourists: 780000
//   },
//   {
//     name: 'Region C',
//     mean: 55.18,
//     population: 800000,
//     area: 3500,
//     sewage_gap: 290,
//     mean_temperature: 30.2,
//     mean_rainfall: 850,
//     number_of_tourists: 320000
//   },
//   {
//     name: 'Region D',
//     mean: 75.63,
//     population: 1800000,
//     area: 6300,
//     sewage_gap: 520,
//     mean_temperature: 24.9,
//     mean_rainfall: 1450,
//     number_of_tourists: 620000
//   },
//   {
//     name: 'Region E',
//     mean: 92.10,
//     population: 3100000,
//     area: 9800,
//     sewage_gap: 680,
//     mean_temperature: 27.3,
//     mean_rainfall: 1050,
//     number_of_tourists: 950000
//   }
// ];

const ResultsTable = () => {
  const [tableData, setTableData] = useState([]);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Format cell value based on field type
  const formatCellValue = (value, field) => {
    if (typeof value !== 'number') return String(value);
    
    if (field.includes('temperature') || field.includes('rainfall') || field === 'mean') {
      return value.toFixed(2);
    } else if (field.includes('percentage')) {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toLocaleString();
    }
  };
  
  // Start editing a cell
  const handleCellClick = (rowIndex, field, value) => {
    setEditCell({ rowIndex, field });
    setEditValue(String(value));
  };
  
  // Validate and process value based on field type
  const validateAndProcessValue = (value, field) => {
    if (field.includes('temperature') || field.includes('rainfall') || field === 'mean') {
      const number = parseFloat(value);
      if (isNaN(number)) {
        throw new Error(`Please enter a valid number for ${field.replace(/_/g, ' ')}`);
      }
      return number;
    }
    
    if (
      field.includes('tourists') ||
      field.includes('sites') ||
      field.includes('gap') ||
      field === 'population' ||
      field === 'area'
    ) {
      const number = parseInt(value);
      if (isNaN(number) || !Number.isInteger(number)) {
        throw new Error(`Please enter a valid whole number for ${field.replace(/_/g, ' ')}`);
      }
      if (number < 0) {
        throw new Error(`${field.replace(/_/g, ' ')} cannot be negative`);
      }
      return number;
    }
    
    if (field.includes('gdp')) {
      const number = parseFloat(value);
      if (isNaN(number)) {
        throw new Error('Please enter a valid number for GDP');
      }
      if (number < 0) {
        throw new Error('GDP cannot be negative');
      }
      return number;
    }
    
    return value;
  };
  
  // Save edited cell value
  const saveEdit = () => {
    if (!editCell) return;
    
    try {
      const { rowIndex, field } = editCell;
      const processedValue = validateAndProcessValue(editValue, field);
      
      // Create updated data
      const updatedData = [...tableData];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        [field]: processedValue,
      };
      
      // Update data
      setTableData(updatedData);
      
      // Clear edit state
      setEditCell(null);
      setEditValue('');
    } catch (error) {
      alert(error.message);
    }
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditCell(null);
    setEditValue('');
  };
  
  // Handle key press in edit input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  // Get field headers from the first data item
  const getHeaders = () => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  };
  
  // Simulate loading data
  const simulateDataLoad = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center text-gray-700">
          <i className="fas fa-table mr-2"></i>
          Results
        </h3>
        
        <button 
          onClick={simulateDataLoad}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
        >
          Refresh
        </button>
      </div>
      
      <div className="relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600 font-medium">Loading data...</p>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {getHeaders().map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.entries(row).map(([field, value]) => (
                      <td
                        key={`${rowIndex}-${field}`}
                        className="px-6 py-4 whitespace-nowrap relative cursor-pointer hover:bg-gray-100"
                        onDoubleClick={() => handleCellClick(rowIndex, field, value)}
                      >
                        {editCell?.rowIndex === rowIndex && editCell?.field === field ? (
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyPress}
                            autoFocus
                          />
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-900">
                              {formatCellValue(value, field)}
                            </span>
                            <span className="text-gray-400 opacity-0 group-hover:opacity-100 ml-2">
                              <i className="fas fa-edit text-xs"></i>
                            </span>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <i className="fas fa-database text-4xl text-gray-300 mb-3"></i>
              <p className="text-lg">No data available</p>
              <p className="text-sm">Submit a query to view results here</p>
            </div>
          )}
        </div>
      </div>
      
      {tableData.length > 0 && (
        <div className="bg-gray-50 p-3 text-sm text-gray-600 rounded-b-lg flex justify-between items-center">
          <span>{tableData.length} records</span>
          <span className="text-xs italic">Double-click on a cell to edit its value</span>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;