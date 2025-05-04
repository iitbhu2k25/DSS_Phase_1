'use client'
import React from 'react';
import { useLocation } from '@/app/contexts/STP/LocationContext';

const TierSelector = () => {
  const {
    states,
    selectedTier,
    selectedTierState,
    selectedTierDistricts,
    selectedTierSubDistricts,
    selectedTierTowns,
    tierDistricts,
    tierSubDistricts,
    towns,
    isLoading,
    handleTierChange,
    handleTierStateChange,
    handleTierDistrictToggle
  } = useLocation();

  // Handle tier selection
  const onTierChange = (e) => {
    const tierValue = e.target.value;
    handleTierChange(tierValue || null);
  };

  // Handle tier state selection
  const onTierStateChange = (e) => {
    const stateId = e.target.value;
    if (!stateId) {
      handleTierStateChange(null);
      return;
    }
    
    const selected = states.find(state => state.id === stateId);
    handleTierStateChange(selected);
  };

  // Check if a tier district is selected
  const isTierDistrictSelected = (district) => {
    return selectedTierDistricts.some(d => d.id === district.id);
  };

  // Check if a tier sub-district is selected
  const isTierSubDistrictSelected = (subDistrict) => {
    return selectedTierSubDistricts.some(sd => sd.id === subDistrict.id);
  };

  // Check if a town is selected
  const isTownSelected = (town) => {
    return selectedTierTowns.some(t => t.id === town.id);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-green-100 mb-6">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center text-gray-700">
          <i className="fas fa-layer-group mr-2"></i>
          Tier / State / District / Sub-District / Town Selection
        </h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Tier Dropdown */}
          <div>
            <label htmlFor="tier-dropdown" className="block text-sm font-medium text-gray-700 mb-1">
              Tier:
            </label>
            <select
              id="tier-dropdown"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
              value={selectedTier || ''}
              onChange={onTierChange}
              disabled={isLoading}
            >
              <option value="">--Choose a Tier--</option>
              <option value="tier1">Tier 1</option>
              <option value="tier2">Tier 2</option>
              <option value="tier3">Tier 3</option>
              <option value="tier4">Tier 4</option>
              <option value="tier5">Tier 5</option>
              <option value="tier6">Tier 6</option>
            </select>
          </div>
          
          {/* State Dropdown */}
          <div>
            <label htmlFor="tier-state-dropdown" className="block text-sm font-medium text-gray-700 mb-1">
              State:
            </label>
            <select
              id="tier-state-dropdown"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
              value={selectedTierState?.id || ''}
              onChange={onTierStateChange}
              disabled={!selectedTier || isLoading}
            >
              <option value="">--Choose a State--</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tier Districts Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District:
            </label>
            <div className="border border-gray-300 rounded-md p-2 h-48 overflow-y-auto">
              {tierDistricts.length > 0 ? (
                tierDistricts.map(district => (
                  <div key={district.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`tier-district-${district.id}`}
                      checked={isTierDistrictSelected(district)}
                      onChange={() => handleTierDistrictToggle(district)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`tier-district-${district.id}`} className="ml-2 block text-sm text-gray-700">
                      {district.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm p-2">
                  {selectedTier && selectedTierState 
                    ? 'No districts available' 
                    : 'Select tier and state first'}
                </div>
              )}
              {isLoading && tierDistricts.length === 0 && selectedTierState && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tier Sub-Districts Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-District:
            </label>
            <div className="border border-gray-300 rounded-md p-2 h-48 overflow-y-auto">
              {tierSubDistricts.length > 0 ? (
                tierSubDistricts.map(subDistrict => (
                  <div key={subDistrict.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`tier-subdistrict-${subDistrict.id}`}
                      checked={isTierSubDistrictSelected(subDistrict)}
                      onChange={() => handleTierSubDistrictToggle(subDistrict)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`tier-subdistrict-${subDistrict.id}`} className="ml-2 block text-sm text-gray-700">
                      {subDistrict.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm p-2">
                  {selectedTierDistricts.length > 0 
                    ? 'No sub-districts available' 
                    : 'Select at least one district first'}
                </div>
              )}
              {isLoading && tierSubDistricts.length === 0 && selectedTierDistricts.length > 0 && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Towns Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Town:
            </label>
            <div className="border border-gray-300 rounded-md p-2 h-48 overflow-y-auto">
              {towns.length > 0 ? (
                towns.map(town => (
                  <div key={town.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`town-${town.id}`}
                      checked={isTownSelected(town)}
                      onChange={() => handleTownToggle(town)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`town-${town.id}`} className="ml-2 block text-sm text-gray-700">
                      {town.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm p-2">
                  {selectedTierSubDistricts.length > 0 
                    ? 'No towns available' 
                    : 'Select at least one sub-district first'}
                </div>
              )}
              {isLoading && towns.length === 0 && selectedTierSubDistricts.length > 0 && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected locations summary */}
      {(selectedTier || selectedTierState || selectedTierDistricts.length > 0 || selectedTierSubDistricts.length > 0 || selectedTierTowns.length > 0) && (
        <div className="bg-gray-50 p-4 rounded-b-lg text-sm">
          <p className="font-medium mb-1">Selected:</p>
          <div className="space-y-1">
            {selectedTier && (
              <p><span className="font-medium">Tier:</span> {selectedTier.replace('tier', 'Tier ')}</p>
            )}
            {selectedTierState && (
              <p><span className="font-medium">State:</span> {selectedTierState.name}</p>
            )}
            {selectedTierDistricts.length > 0 && (
              <p><span className="font-medium">Districts:</span> {selectedTierDistricts.map(d => d.name).join(', ')}</p>
            )}
            {selectedTierSubDistricts.length > 0 && (
              <p><span className="font-medium">Sub-Districts:</span> {selectedTierSubDistricts.map(sd => sd.name).join(', ')}</p>
            )}
            {selectedTierTowns.length > 0 && (
              <p><span className="font-medium">Towns:</span> {selectedTierTowns.map(t => t.name).join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TierSelector;