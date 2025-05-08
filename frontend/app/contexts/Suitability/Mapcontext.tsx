'use client'
import React from 'react';
import LocationSelection from './components/locations';
import MapComponent from './components/openlayer';
import ConditioningFactors from './components/conditioningFactors';
import ConstraintFactors from './components/constraintFactors';
import WeightAdjustment from './components/WeightAdjustment';
import { LocationProvider } from '../../../../contexts/Suitability/locationContext';
// Import other contexts as needed

const SiteSuitabilityApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-4 px-8">
        <h1 className="text-xl font-semibold mb-1">Site Priority and Suitability Selection</h1>
        <p className="text-sm opacity-90">Analyze and prioritize locations based on multiple criteria</p>
      </header>
      
      <div className="flex p-4 gap-4">
        <div className="w-1/2 space-y-4">
          {/* Wrap LocationSelection with LocationProvider */}
          <LocationProvider onLocationsChange={(locations) => {
            // Handle location changes if needed
            console.log('Locations changed:', locations);
          }}>
            <LocationSelection />
          </LocationProvider>
          
          {/* Other components */}
          {/* Wrap with their respective providers as well */}
        </div>
        
        <div className="w-1/2">
          <MapComponent selectedLocations={{state: '', districts: [], subDistricts: []}} />
        </div>
      </div>
    </div>
  );
};

export default SiteSuitabilityApp;