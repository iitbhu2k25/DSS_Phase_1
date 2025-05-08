'use client'
import React from 'react';
import LocationSelection from './components/locations';
import MapComponent from './components/openlayer';
import ConditioningFactors from './components/conditioningFactors';
import ConstraintFactors from './components/constraintFactors';
import WeightAdjustment from './components/WeightAdjustment';
import { LocationProvider } from '../../../../contexts/Suitability/locationContext';
import { ConditioningFactorsProvider } from '../../../../contexts/Suitability/conditioningContext';
import { ConstraintFactorsProvider } from '../../../../contexts/Suitability/constraintContext';

const SiteSuitabilityApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-4 px-8">
        <h1 className="text-xl font-semibold mb-1">STP Site Suitability </h1>
        
      </header>
      
      <div className="flex p-4 gap-4">
        <div className="w-1/2 space-y-4">
          <LocationProvider onLocationsChange={(locations) => {
            console.log('Locations changed:', locations);
          }}>
            <LocationSelection />
          </LocationProvider>
          
          <ConditioningFactorsProvider>
            <ConditioningFactors />
          </ConditioningFactorsProvider>
          
          <ConstraintFactorsProvider>
            <ConstraintFactors />
          </ConstraintFactorsProvider>
        </div>
        
        <div className="w-1/2">
          <MapComponent selectedLocations={{state: '', districts: [], subDistricts: []}} />
        </div>
      </div>
    </div>
  );
};

export default SiteSuitabilityApp;