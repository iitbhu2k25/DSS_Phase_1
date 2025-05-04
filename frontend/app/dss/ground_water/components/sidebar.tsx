'use client'
import { ChevronDown, ChevronUp, Layers, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { useMapContext } from '@/app/contexts/rasterContext';
import { useEffect } from 'react';

const Sidebar: React.FC = () => {
  const {
    selectedOrganisation,
    selectedRasterFile,
    pixelInfo,
    isOrganisationsLoading,
    isRasterFilesLoading,
    organisationsError,
    rasterFilesError,
    organisationDropdownOpen,
    rasterFileDropdownOpen,
    organisations,
    layerOpacity,
    rasterFiles,
    handleOrganisationSelect,
    handleRasterFileSelect,
    setOrganisationDropdownOpen,
    setRasterFileDropdownOpen,
    getOrganisationName,
    getRasterFileName,
    setlayerOpacity,
    // New state and functions for legend generation
    legendCount,
    setLegendCount,
    isProcessingLegends,
    processedRaster,
    legendGenerationError,
    generateRasterLegends,
    resetProcessedRaster
  } = useMapContext();
  
  // Debug logging
  useEffect(() => {
    //console.log("Selected organisation:", selectedOrganisation);
    //console.log("Available organisations:", organisations);
  }, [selectedOrganisation, organisations]);
  
  useEffect(() => {
    //console.log("Raster files:", rasterFiles);
  }, [rasterFiles]);

  return (
    <div className="w-100 bg-white shadow-md p-4 h-full w-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <Layers className="mr-2 h-5 w-5 text-blue-500" />
          Raster Viewer
        </h2>
        
        <div className="space-y-4">
          {/* Organisation Dropdown */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Select Organisation
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={() => setOrganisationDropdownOpen(!organisationDropdownOpen)}
                disabled={isOrganisationsLoading}
              >
                <span className="truncate">{selectedOrganisation ? getOrganisationName(selectedOrganisation) : 'Select an Organisation'}</span>
                {isOrganisationsLoading ? (
                  <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  organisationDropdownOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {organisationDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {organisations.length > 0 ? (
                    organisations.map((org) => (
                      <li
                        key={org.id}
                        className={`cursor-pointer select-none relative py-2 px-3 hover:bg-blue-50 ${selectedOrganisation === org.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                        onClick={() => handleOrganisationSelect(org.name)}
                      >
                        {org.name}
                      </li>
                    ))
                  ) : (
                    <li className="cursor-default select-none relative py-2 px-3 text-gray-500">
                      {organisationsError ? 'Error loading Organisations' : 'No Organisations available'}
                    </li>
                  )}
                </ul>
              )}
            </div>
            
            {organisationsError && (
              <div className="text-red-500 text-xs flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {organisationsError}
              </div>
            )}
          </div>
          
          {/* Raster File Dropdown - Only show if organization is selected */}
          {selectedOrganisation && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Select raster file
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={() => setRasterFileDropdownOpen(!rasterFileDropdownOpen)}
                  disabled={isRasterFilesLoading}
                >
                  <span className="truncate">
                    {selectedRasterFile ? getRasterFileName(selectedRasterFile) : 'Select a raster file'}
                  </span>
                  {isRasterFilesLoading ? (
                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                  ) : (
                    rasterFileDropdownOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                
                {rasterFileDropdownOpen && (
                  <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {rasterFiles.length > 0 ? (
                      rasterFiles.map((file) => (
                        <li
                          key={file.id}
                          className={`cursor-pointer select-none relative py-2 px-3 hover:bg-blue-50 ${selectedRasterFile === file.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                          onClick={() => handleRasterFileSelect(file.id)}
                        >
                          {file.name}
                        </li>
                      ))
                    ) : (
                      <li className="cursor-default select-none relative py-2 px-3 text-gray-500">
                        {rasterFilesError ? 'Error loading raster files' : 'No raster files available'}
                      </li>
                    )}
                  </ul>
                )}
              </div>
              
              {rasterFilesError && (
                <div className="text-red-500 text-xs flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {rasterFilesError}
                </div>
              )}
            </div>
          )}
          
          {/* Legend Generator - Only show when a raster file is selected and no processed raster yet */}
          {selectedRasterFile && !processedRaster && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Generate Legends</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">0</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacity}
                    onChange={(e) => setlayerOpacity(parseInt(e.target.value))}
                    className="w-full mx-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">100</span>
                </div>
                
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Legends
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">3</span>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      step="1"
                      value={legendCount}
                      onChange={(e) => setLegendCount(parseInt(e.target.value))}
                      className="w-full mx-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">10</span>
                  </div>
                  <div className="text-center mt-1 font-medium text-blue-600">
                    {legendCount}
                  </div>
                </div>
                
                {/* Execute Button */}
                <button
                  type="button"
                  onClick={generateRasterLegends}
                  disabled={isProcessingLegends}
                  className={`mt-3 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isProcessingLegends ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isProcessingLegends ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Legends
                    </>
                  )}
                </button>
                
                {legendGenerationError && (
                  <div className="mt-2 text-red-500 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {legendGenerationError}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Processed Raster Display - Show when backend has returned a processed raster */}
          {processedRaster && (
            <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-100">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Processed Raster</h3>
              <div className="text-sm">
                <p className="mb-2"><strong>Name:</strong> {processedRaster.name}</p>
                <p className="mb-2"><strong>Created:</strong> {new Date(processedRaster.createdAt).toLocaleString()}</p>
                <p className="mb-2"><strong>Legend Count:</strong> {processedRaster.legendCount}</p>
                
                {/* Display legends if available */}
                {processedRaster.legends && processedRaster.legends.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold mb-2">Legend Values</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {processedRaster.legends.map((legend, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 mr-2" 
                            style={{ backgroundColor: legend.color || '#ccc' }}
                          ></div>
                          <span>{legend.label || legend.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Option to create a new legend */}
                <button
                  onClick={resetProcessedRaster}
                  className="mt-3 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create New Legend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Pixel Information Display */}
      {Object.keys(pixelInfo).length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Pixel Information</h3>
          {Object.entries(pixelInfo).map(([rasterId, info]) => {
            return (
              <div key={rasterId} className="mb-3 p-2 bg-gray-50 rounded text-xs">
                <p className="font-medium">{`Raster ${rasterId}`}</p>
                {info.loading ? (
                  <div className="flex items-center mt-1">
                    <RefreshCw className="h-3 w-3 text-gray-400 animate-spin mr-1" />
                    <span>Loading data...</span>
                  </div>
                ) : (
                  <>
                    <p>
                      Lon: {info.coords[0].toFixed(6)}, Lat: {info.coords[1].toFixed(6)}
                    </p>
                    {info.value !== null ? (
                      <p>Value: {typeof info.value === 'number' ? info.value.toFixed(2) : info.value}</p>
                    ) : (
                      <p className="text-red-500">{info.error || 'No data available'}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Footer info */}
      <div className="mt-auto pt-4 border-t">
        <div className="text-xs text-gray-500 text-center">
          Powered by OpenLayers
        </div>
      </div>
    </div>
  );
};

export default Sidebar;