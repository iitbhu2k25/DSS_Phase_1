'use client'

import React, { useState, useEffect } from 'react';
import { LocationProvider } from '@/app/contexts/STP/LocationContext';
import { CategoryProvider } from '@/app/contexts/STP/CategoryContext';
import { MapProvider } from '@/app/contexts/STP/MapContext';
import LocationSelector from '@/app/dss/RWM/WWT/STP/components/locations';
import TierSelector from '@/app/dss/RWM/WWT/STP/components/TierSelection';
import CategorySelector from '@/app/dss/RWM/WWT/STP/components/Category';
import { useLocation } from '@/app/contexts/STP/LocationContext';
import { useCategory } from '@/app/contexts/STP/CategoryContext';
import MapView from '@/app/dss/RWM/WWT/STP/components/openlayer';
import { useMap } from '@/app/contexts/STP/MapContext';
import { CategorySlider } from './components/weight_slider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const MainContent = () => {

  const [showRankings, setShowRankings] = useState(false);
  const [showTier, setShowTier] = useState(false);
  const [showResults, setShowResults] = useState(false); 
  const { selectedCategories, selectAllCategories, submitting } = useCategory();
  
  const { 
    selectionsLocked, 
    confirmSelections, 
    resetSelections 
  } = useLocation();
  
  const { setstpOperation } = useMap();
  const [showCategories, setShowCategories] = useState(false);
  
  useEffect(() => {
    setShowCategories(selectionsLocked);
  }, [selectionsLocked]);
  
  const handleConfirm = () => {
    const result = confirmSelections();
  };
  
  const handleReset = () => {
    resetSelections();
  };
  
  const handleSubmit = () => {
    if (selectedCategories.length < 2) {
      toast.error("Please select at least two categories", {
        position: "top-center",
      });
    } else {
      setstpOperation(true);
    }
  };
  
  const handleShowRankings = () => {
    setShowRankings(!showRankings);
  };
  
  const toggleSelectorView = () => {
    setShowTier(!showTier);
  };
  
  useEffect(() => {
    if (submitting) {
      useCategory().selectAllCategories();
    }
  }, [submitting]);
  
  return (
    <div className="min-h-screen bg-gray-50">
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
      
      <main className="px-4 py-8">
        {/* Changed from grid-cols-2 to grid-cols-3 to create a 2:1 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
          {/* Main content area - Now spans 8/12 columns on large screens */}
          <div className="lg:col-span-4 space-y-4">
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
          </div>
          
          {/* Map and Slider area - Now spans 4/12 columns on large screens */}
          <div className="lg:col-span-4 space-y-4">
            {/* Map Section with Larger Height */}
            <section className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Larger Map Component */}
              <div className="w-full p-4  md:min-h-[500px]">
                <MapView />
              </div>
            </section>
            
            {/* Category Influence Sliders in a separate box below the map */}
            {showCategories && selectedCategories.length > 0 && (
              <section className="bg-white rounded-xl shadow-md overflow-hidden animate-fadeIn">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h2 className="text-lg font-semibold text-gray-800">Category Influences</h2>
                </div>
                <CategorySlider />
              </section>
            )}
          </div>
        </div>
      </main>
      <ToastContainer />
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