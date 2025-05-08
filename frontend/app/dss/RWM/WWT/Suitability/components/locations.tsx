'use client'
import React from 'react';
import { MultiSelect } from './Multiselect';
import { useLocation, SubDistrict } from '../../../../../contexts/Suitability/locationContext';

interface LocationSelectorProps {
  onConfirm?: (selectedData: {
    subDistricts: SubDistrict[];
    totalPopulation: number;
  }) => void;
  onReset?: () => void;
}

const LocationSelection: React.FC<LocationSelectorProps> = ({ onConfirm, onReset }) => {
  // Use the location context instead of local state
  const { 
    states,
    districts,
    subDistricts,
    selectedState,
    selectedDistricts,
    selectedSubDistricts,
    totalPopulation,
    selectionsLocked,
    isLoading,
    handleStateChange,
    setSelectedDistricts,
    setSelectedSubDistricts,
    confirmSelections,
    resetSelections
  } = useLocation();
  
  // Handle state selection from select input
  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!selectionsLocked) {
      handleStateChange(parseInt(e.target.value));
    }
  };
  
  // Handle multi-select changes
  const handleDistrictsChange = (selectedIds: string[]): void => {
    if (!selectionsLocked) {
      setSelectedDistricts(selectedIds.map(id => parseInt(id)));
    }
  };
  
  const handleSubDistrictsChange = (selectedIds: string[]): void => {
    if (!selectionsLocked) {
      setSelectedSubDistricts(selectedIds.map(id => parseInt(id)));
    }
  };
  
  // Handle confirm button click
  const handleConfirm = (): void => {
    if (selectedSubDistricts.length > 0 && !selectionsLocked) {
      const selectedData = confirmSelections();
      
      // Call the onConfirm prop to notify parent component
      if (onConfirm && selectedData) {
        onConfirm(selectedData);
      }
    }
  };
  
  // Handle reset button click
  const handleReset = (): void => {
    resetSelections();
    
    // Call the onReset prop to notify parent component
    if (onReset) {
      onReset();
    }
  };
  
  // Format sub-district display to include population
  const formatSubDistrictDisplay = (subDistrict: SubDistrict): string => {
    return `${subDistrict.name} (Pop: ${subDistrict.population.toLocaleString()})`;
  };
  
  return (
    <div className="bg-white rounded-md shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-6 pb-2 border-b border-gray-200">
        Selection Criteria
      </h2>

      
      {isLoading && (
        <div className="text-center mb-4">
          <p className="text-blue-600">Loading...</p>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* State Dropdown */}
        <div className="flex flex-col gap-2">
          <label htmlFor="state" className="text-sm font-medium text-gray-700">State:</label>
          <select 
            id="state" 
            value={selectedState || ''}
            onChange={handleStateSelect}
            className="p-2 border border-blue-500 rounded-md text-sm"
            disabled={selectionsLocked || isLoading}
          >
            <option value="">--Choose a State--</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* District MultiSelect */}
        <MultiSelect
          items={districts}
          selectedItems={selectedDistricts}
          onSelectionChange={handleDistrictsChange}
          label="District"
          placeholder="--Choose Districts--"
          disabled={!selectedState || selectionsLocked || isLoading}
        />
        
        {/* Sub-District MultiSelect */}
        <MultiSelect
          items={subDistricts}
          selectedItems={selectedSubDistricts}
          onSelectionChange={handleSubDistrictsChange}
          label="Sub-District"
          placeholder="--Choose Sub-Districts--"
          disabled={selectedDistricts.length === 0 || selectionsLocked || isLoading}
          displayPattern={formatSubDistrictDisplay}
        />
      </div>
      
      <div className="bg-gray-50 rounded-md p-4 mb-6">
        <h3 className="text-base font-medium mb-3">Selected Locations</h3>
        <div className="flex mb-2 text-sm">
          <span className="font-medium text-gray-700 w-32">State:</span> 
          <span>{states.find(s => s.id === selectedState)?.name || 'None'}</span>
        </div>
        <div className="flex mb-2 text-sm">
          <span className="font-medium text-gray-700 w-32">Districts:</span> 
          <span>
            {selectedDistricts.length > 0 
              ? districts
                  .filter(d => selectedDistricts.includes(Number(d.id)))
                  .map(d => d.name)
                  .join(', ')
              : 'None'
            }
          </span>
        </div>
        <div className="flex mb-2 text-sm">
          <span className="font-medium text-gray-700 w-32">Sub-Districts:</span> 
          <span>
            {selectedSubDistricts.length > 0 
              ? subDistricts
                  .filter(sd => selectedSubDistricts.includes(Number(sd.id)))
                  .map(sd => sd.name)
                  .join(', ')
              : 'None'
            }
          </span>
        </div>
        <div className="flex text-sm">
          <span className="font-medium text-gray-700 w-32">Total Population:</span> 
          <span>{totalPopulation.toLocaleString()}</span>
        </div>
        
        {selectionsLocked && (
          <div className="mt-2 text-green-600 font-medium">
            Selections confirmed and locked
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <button 
          className={`${
            selectedSubDistricts.length > 0 && !selectionsLocked 
              ? 'bg-blue-500 hover:bg-blue-700' 
              : 'bg-gray-400 cursor-not-allowed'
          } text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          onClick={handleConfirm}
          disabled={selectedSubDistricts.length === 0 || selectionsLocked || isLoading}
        >
          Confirm
        </button>
        <button 
          className="bg-red-500 text-white px-6 py-2 rounded-md font-medium hover:bg-red-600 transition-colors"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default LocationSelection;