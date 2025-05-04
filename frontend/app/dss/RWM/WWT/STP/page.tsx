'use client'

import React, { useState, useEffect, use } from 'react';

import { LocationProvider } from '@/app/contexts/STP/LocationContext';
import { CategoryProvider } from '@/app/contexts/STP/CategoryContext';
import { MapProvider } from '@/app/contexts/STP/MapContext';

import LocationSelector from '@/app/dss/RWM/WWT/STP/components/locations';
import TierSelector from '@/app/dss/RWM/WWT/STP/components/TierSelection';
import CategorySelector from '@/app/dss/RWM/WWT/STP/components/Category';
import { useLocation } from '@/app/contexts/STP/LocationContext';
import {useCategory} from '@/app/contexts/STP/CategoryContext';
import MapView from '@/app/dss/RWM/WWT/STP/components/openlayer';
import { useMap } from '@/app/contexts/STP/MapContext';
import { set } from 'ol/transform';


const MainContent = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [showTier, setShowTier] = useState(false);
  const [showResults, setShowResults] = useState(false); 
  const {selectedCategories} =useCategory();
  // Get these directly from the location context
  const { 
    selectionsLocked, 
    confirmSelections, 
    resetSelections 
  } = useLocation();
  
  const {setstpOperation} = useMap();
  // Derive showCategories directly from selectionsLocked
  const [showCategories, setShowCategories] = useState(false);
  
  // Watch for changes in the selectionsLocked state
  useEffect(() => {
    //console.log("selectionsLocked changed to:", selectionsLocked);
    setShowCategories(selectionsLocked);
  }, [selectionsLocked]);
  
  // Handle location/tier confirmation
  const handleConfirm = () => {
    const result = confirmSelections();
    if (result) {
      //console.log("Selection confirmed successfully");
    } else {
      //console.log("Selection confirmation failed - no villages selected");
    }
  };
  
  // Handle reset
  const handleReset = () => {
    //console.log("Handling reset");
    resetSelections();
  };
  
  // Handle form submission
  const handleSubmit = () => {

    setstpOperation(true);
    console.log("clikck the submit button");  
  };
  
  // Show rankings chart
  const handleShowRankings = () => {
    setShowRankings(!showRankings); // Toggle rankings visibility
  };
  
  // Toggle between LocationSelector and TierSelector
  const toggleSelectorView = () => {
    setShowTier(!showTier);
  };
  useEffect(() => {
    if (submitting) {
      useCategory().setSelectedCategories([]);
    }
  }, [submitting]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add animation keyframes for fade-in effect */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">
            Site Priority and Suitability Selection
          </h1>
          <p className="text-blue-100 mt-2">
            Analyze and prioritize locations based on multiple criteria
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
       
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-8">
            {/* Selection Components Section */}
            <section className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Selection Criteria</h2>
              </div>
              
              <div className="p-6">
                {/* Toggle Button */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={toggleSelectorView}
                    className="px-6 py-2.5 rounded-full font-medium shadow-md bg-blue-500 hover:bg-blue-600 text-white flex items-center transition duration-200 transform hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Switch to {showTier ? "Location" : "Tier"} Selection
                  </button>
                </div>
                
                {/* Selection Components with improved styling */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {showTier ? <TierSelector /> : <LocationSelector />}
                </div>
                
      
                
                {/* Categories Section - Only shown after confirmation */}
                {showCategories && (
                  <div className="animate-fadeIn">
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <CategorySelector />
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-start mt-8">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-8 py-3 rounded-full font-medium shadow-md ${
                          submitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105'
                        } flex items-center transition duration-200`}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Submit Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
            
            {/* Results Section - Only shown after submission */}
            {/* {showResults && (
              <section className="bg-white rounded-xl shadow-md overflow-hidden animate-fadeIn">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800">Analysis Results</h2>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <ResultsTable />
                  </div>
                </div>
              </section>
            )} */}
          </div>
          
          {/* Map area - 1/3 width on large screens */}
          <div className="lg:col-span-1 space-y-8">
            {/* Map Section */}
            <section className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Geographic View</h2>
              </div>
              <div className="p-4 h-[calc(100vh-32rem)] md:min-h-[400px]">
                <MapView />
              </div>
            </section>
            
            {/* Rankings Section - Only shown after results are shown
            {showResults && (
              <section className="bg-white rounded-xl shadow-md overflow-hidden animate-fadeIn">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Rankings</h2>
                  <button
                    type="button"
                    onClick={handleShowRankings}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-md flex items-center transition duration-200 transform hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {showRankings ? "Hide" : "Show"} Rankings
                  </button>
                </div>
                {/* <div className={`p-6 transition-all duration-500 ease-in-out ${showRankings ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <RankingChart />
                </div>}
              </section>
            )}
             */}
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App component that provides the context
const Home = () => {
  return (
    <LocationProvider>
      <CategoryProvider>
        <MapProvider>
        <MainContent />
        </MapProvider>
      </CategoryProvider>
    </LocationProvider>
  );
};

export default Home;