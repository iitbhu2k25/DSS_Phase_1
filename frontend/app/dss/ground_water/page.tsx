'use client'
import Sidebar from '@/app/dss/ground_water/components/sidebar';
import MapComponent from '@/app/dss/ground_water/components/test_open';
import { MapProvider } from '@/app/contexts/rasterContext';


export default function ground_water_zone() {
  return (
    <MapProvider>
      <div className="flex  ">
        <div className='w-1/5'>
        <Sidebar />
        </div>
        <div className="flex-1 p-4 flex flex-col px-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
        <span className="block text-indigo-600 dark:text-indigo-400 pb-2 px-8 center"> Ground water zone</span>
        </h1>
        <MapComponent />
        </div>
      </div>
    </MapProvider>
  );
}