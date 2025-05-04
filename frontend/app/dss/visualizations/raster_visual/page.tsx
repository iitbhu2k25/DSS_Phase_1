'use client'
import { useState } from 'react';
import Sidebar from '@/app/dss/visualizations/raster_visual/components/sidebar';
import MapComponent from '@/app/dss/visualizations/raster_visual/components/openlayer';
import { MapProvider } from '@/app/contexts/rasterContext';

export default function HomePage() {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <MapProvider>
      <div className=" bg-white">
        {/* Simple header with toggle button */}
        <div className="flex items-center p-4 border-b">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="mr-4 md:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl  font-bold text-indigo-600">
            Raster Visualization
          </h1>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar - hidden on mobile when toggle is off */}
          <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-1/5 bg-white`}>
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4">
            <MapComponent />
          </div>
        </div>
      </div>
    </MapProvider>
  );
}