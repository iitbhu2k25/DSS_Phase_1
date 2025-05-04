'use client'
import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { Style, Fill, Stroke } from 'ol/style';
import { useMap } from '@/app/contexts//STP/MapContext';
import { useCategory } from '@/app/contexts/STP/CategoryContext';
import 'ol/ol.css';

const Maping: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const primaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const secondaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const layersRef = useRef<{[key: string]: any}>({}); 
  
  const [loading, setLoading] = useState<boolean>(true);
  const [primaryLayerLoading, setPrimaryLayerLoading] = useState<boolean>(true);
  const [secondaryLayerLoading, setSecondaryLayerLoading] = useState<boolean>(false);
  const [rasterLoading, setRasterLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryFeatureCount, setPrimaryFeatureCount] = useState<number>(0);
  const [secondaryFeatureCount, setSecondaryFeatureCount] = useState<number>(0);
  const [layerOpacity, setLayerOpacity] = useState<number>(100);
  const [rasterLayerInfo, setRasterLayerInfo] = useState<any>(null);
  const [wmsDebugInfo, setWmsDebugInfo] = useState<string | null>(null);
  
  // Use the map context
  const {
    primaryLayer,
    secondaryLayer,
    LayerFilter,
    LayerFilterValue,
    geoServerUrl,
    defaultWorkspace,
    isMapLoading,
    setstpOperation,
    stpOperation,
    // Removed currentRasterLayer since it doesn't exist
  } = useMap();

  const{
    selectedCategoryName
  } = useCategory()
  
  const INDIA_CENTER_LON = 78.9629;
  const INDIA_CENTER_LAT = 20.5937;
  const INITIAL_ZOOM = 6;

  // Initialize the map once
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create base OSM layer
    const baseLayer = new TileLayer({
      source: new OSM()
    });
    
    // Create the map with just the base layer initially
    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      controls: defaultControls(),
      view: new View({
        center: fromLonLat([INDIA_CENTER_LON, INDIA_CENTER_LAT]),
        zoom: INITIAL_ZOOM
      })
    });
    
    // Store the map instance in a ref for other effects to use
    mapInstanceRef.current = map;
    
    // Clean up on unmount
    return () => {
      if (map) {
        map.setTarget('');
      }
    };
  }, []);

  // Load and manage the primary layer
  useEffect(() => {
    if (!mapInstanceRef.current || !primaryLayer) return;
    
    setPrimaryLayerLoading(true);
    setError(null);
    
    // Construct WFS URL for primary layer with filters_value
    let primaryWfsUrl = `${geoServerUrl}/wfs?` + 
      'service=WFS&' + 
      'version=1.1.0&' + 
      'request=GetFeature&' + 
      `typeName=${defaultWorkspace}:${primaryLayer}&` + 
      'outputFormat=application/json&' + 
      'srsname=EPSG:3857';
    
    // Define primary vector style (blue)
    const primaryVectorStyle = new Style({
      fill: new Fill({
        color: 'rgba(255, 246, 181, 0.3)'
      }),
      stroke: new Stroke({
        color: '#3b82f6',
        width: 1
      })
    });
    
    // Create primary vector source and layer
    const primaryVectorSource = new VectorSource({
      format: new GeoJSON(),
      url: primaryWfsUrl
    });
    
    const primaryVectorLayer = new VectorLayer({
      source: primaryVectorSource,
      style: primaryVectorStyle,
      zIndex: 1
    });
    
    // Handle primary layer loading
    const handleFeaturesError = (err: any) => {
      console.error("Error loading primary features:", err);
      setPrimaryLayerLoading(false);
      setError("Failed to load primary features");
      updateLoadingState();
    };
    
    const handleFeaturesLoaded = (event: any) => {
      const numFeatures = event.features ? event.features.length : 0;
      setPrimaryFeatureCount(numFeatures);
      setPrimaryLayerLoading(false);
      updateLoadingState();
      
      // Zoom to the extent of the primary layer
      const primaryExtent = primaryVectorSource.getExtent();
      if (primaryExtent && primaryExtent.some(val => isFinite(val))) {
        mapInstanceRef.current?.getView().fit(primaryExtent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      }
    };
    
    primaryVectorSource.on('featuresloaderror', handleFeaturesError);
    primaryVectorSource.on('featuresloadend', handleFeaturesLoaded);
    
    // Remove previous primary layer if it exists
    if (primaryLayerRef.current) {
      mapInstanceRef.current.removeLayer(primaryLayerRef.current);
    }
    
    // Add the new primary layer to the map
    mapInstanceRef.current.addLayer(primaryVectorLayer);
    primaryLayerRef.current = primaryVectorLayer;
    
    // Helper function to update overall loading state
    function updateLoadingState() {
      setLoading(primaryLayerLoading || secondaryLayerLoading || rasterLoading);
    }
    
    return () => {
      // Cleanup listeners
      primaryVectorSource.un('featuresloaderror', handleFeaturesError);
      primaryVectorSource.un('featuresloadend', handleFeaturesLoaded);
    };
  }, [geoServerUrl, defaultWorkspace, primaryLayer]);

  // Handle the secondary layer
  useEffect(() => {
    if (!mapInstanceRef.current || !secondaryLayer) {
      // Reset secondary layer states
      setSecondaryFeatureCount(0);
      setSecondaryLayerLoading(false);
      // Remove any existing secondary layer
      if (secondaryLayerRef.current) {
        mapInstanceRef.current?.removeLayer(secondaryLayerRef.current);
        secondaryLayerRef.current = null;
      }
      
      // Update overall loading state
      setLoading(primaryLayerLoading || rasterLoading);
      return;
    }
    
    setSecondaryLayerLoading(true);
    
    // Construct WFS URL for secondary layer
    const secondaryWfsUrl = `${geoServerUrl}/wfs?` + 
      'service=WFS&' + 
      'version=1.1.0&' + 
      'request=GetFeature&' + 
      `typeName=${defaultWorkspace}:${secondaryLayer}&` + 
      'outputFormat=application/json&' + 
      'srsname=EPSG:3857&'+
      `CQL_FILTER=${LayerFilter} IN (${Array.isArray(LayerFilterValue) ? LayerFilterValue.map(v => `'${v}'`).join(',') : `'${LayerFilterValue}'`})`;
    
    const secondaryVectorStyle = new Style({
      fill: new Fill({
        color: 'rgba(251, 0, 255, 0.3)'
      }),
      stroke: new Stroke({
        color: '#10b981',
        width: 1.5
      })
    });
    
    // Create secondary vector source and layer
    const secondaryVectorSource = new VectorSource({
      format: new GeoJSON(),
      url: secondaryWfsUrl
    });
    
    const secondaryVectorLayer = new VectorLayer({
      source: secondaryVectorSource,
      style: secondaryVectorStyle,
      zIndex: 2
    });
    
    // Handle secondary layer loading
    const handleSecondaryFeaturesError = (err: any) => {
      console.error("Error loading secondary layer features:", err);
      setSecondaryLayerLoading(false);
      updateLoadingState();
    };
    
   
    const handleSecondaryFeaturesLoaded = (event: any) => {
      const numFeatures = event.features ? event.features.length : 0;
      mapInstanceRef.current?.getView().fit(secondaryVectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000
      });
      setSecondaryFeatureCount(numFeatures);
      setSecondaryLayerLoading(false);
      updateLoadingState();
    };
    
    secondaryVectorSource.on('featuresloaderror', handleSecondaryFeaturesError);
    secondaryVectorSource.on('featuresloadend', handleSecondaryFeaturesLoaded);
    
    // Remove any existing secondary layer
    if (secondaryLayerRef.current) {
      mapInstanceRef.current.removeLayer(secondaryLayerRef.current);
    }
    
    // Add the new secondary layer to the map
    mapInstanceRef.current.addLayer(secondaryVectorLayer);
    secondaryLayerRef.current = secondaryVectorLayer;
    
    // Helper function to update overall loading state
    function updateLoadingState() {
      setLoading(primaryLayerLoading || secondaryLayerLoading || rasterLoading);
    }
    
    return () => {
      // Cleanup listeners
      secondaryVectorSource.un('featuresloaderror', handleSecondaryFeaturesError);
      secondaryVectorSource.un('featuresloadend', handleSecondaryFeaturesLoaded);
    };
  }, [secondaryLayer, LayerFilter, LayerFilterValue]);

  // Combined useEffect for STP operation and raster layer display
  useEffect(() => {
    // Don't continue if map isn't initialized
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    // Part 1: Handle STP operation API call
    const performSTP = async () => {
      setRasterLoading(true);
      setError(null);
      setWmsDebugInfo(null);
      console.log("Sending STP request for:", selectedCategoryName);
      
      try {
        const resp = await fetch("http://localhost:7000/api/stp_operation/stp_raster", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            data: selectedCategoryName
          }),
        });
        
        if (!resp.ok) {
          throw new Error(`STP operation failed with status: ${resp.status}`);
        }
        
        const result = await resp.json();
        console.log("STP operation result:", result);
        
        // Store the raster layer information from the API response
        if (result && result.status === "success") {
          setRasterLayerInfo(result);
          console.log("Raster layer info set:", result);
        } else {
          console.error("STP operation did not return success:", result);
          setError(`STP operation failed: ${result.status || 'Unknown error'}`);
          setRasterLoading(false);
        }
        
      } catch (error) {
        console.error("Error performing STP operation:", error);
        setError(`Error communicating with STP service: ${error.message}`);
        setRasterLoading(false);
      } finally {
        setstpOperation(false);
      }
    };
    
    // Execute STP operation if flag is true
    if (stpOperation) {
      performSTP();
    }
    
    // Part 2: Handle raster layer display
    // First, remove all existing WMS/raster layers (but keep the base OSM)
    Object.entries(layersRef.current).forEach(([id, layer]) => {
      map.removeLayer(layer);
      delete layersRef.current[id];
    });
    
    // If there's no raster layer info, we're done after clearing
    if (!rasterLayerInfo) {
      setRasterLoading(false);
      return;
    }
    
    // Now add the raster layer if we have the necessary information
    try {
      console.log("Attempting to display raster:", rasterLayerInfo);
      
      // CORS FIX: Use direct URL that works in your second example
      const layerUrl = 'http://localhost:9090/geoserver/wms';
      
      // Get workspace - either from the layer info or use fixed workspace that works
      const workspace = rasterLayerInfo.workspace || 'raster_work';
      
      // Get layer name - use layer_name from API response first, then fall back to other properties
      const layerName = rasterLayerInfo.layer_name || 
                        rasterLayerInfo.layerName || 
                        rasterLayerInfo.id || 
                        'Clipped_STP_Priority_Map';
      
      // If workspace is provided, use it in the layer name
      const fullLayerName = workspace ? `${workspace}:${layerName}` : layerName;
      
      console.log("Creating WMS source with:", {
        url: layerUrl,
        layers: fullLayerName
      });
      
      // Create WMS source with simplified params (matching working example)
      const wmsSource = new ImageWMS({
        url: layerUrl,
        params: {
          'LAYERS': fullLayerName,
          'TILED': true,
          'FORMAT': 'image/png',
          'TRANSPARENT': true,
        },
        ratio: 1,
        serverType: 'geoserver',
      });
      
      // CORS FIX: Add small delay before adding layer to map (like in working example)
      setTimeout(() => {
        // Create the layer
        const newLayer = new ImageLayer({
          source: wmsSource,
          visible: true,
          opacity: layerOpacity/100,
          zIndex: 3 // Set higher zIndex to display above vector layers
        });
        
        // Generate a unique ID for the layer
        const layerId = `raster-${layerName}-${Date.now()}`;
        
        // Store the layer reference
        layersRef.current[layerId] = newLayer;
        
        // Add layer to map
        map.addLayer(newLayer);
        
        // Force a map render
        map.renderSync();
        
        setRasterLoading(false);
        console.log(`Raster layer added: ${fullLayerName}`);
      }, 100);
      
    } catch (error) {
      console.error("Error setting up raster layer:", error);
      setError(`Error setting up raster layer: ${error.message}`);
      setRasterLoading(false);
    }
    
  }, [mapInstanceRef.current, rasterLayerInfo, layerOpacity, stpOperation, selectedCategoryName]);
  
  // Helper function to update overall loading state
  function updateLoadingState() {
    setLoading(primaryLayerLoading || secondaryLayerLoading || rasterLoading);
  }
  
  return (
    <div className="w-full flex flex-col">
      <div className="text-lg font-semibold mb-2">Multi-Layer Vector Map</div>
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 border border-gray-300 rounded-md shadow-sm relative"
      >
        {/* Loading indicator */}
        {(loading || isMapLoading || stpOperation) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <div className="text-blue-600">
              {stpOperation ? "Processing STP operation..." : "Loading data..."}
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}
        
        {/* WMS Debug Info */}
        {wmsDebugInfo && (
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-yellow-100 text-yellow-800 p-2 text-xs">
            <span className="font-semibold">WMS Debug:</span> {wmsDebugInfo}
          </div>
        )}
        
        {/* Layer information */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-80 p-2 rounded text-xs">
          <div>Primary Layer: {primaryLayer} ({primaryFeatureCount} features)</div>
          {secondaryLayer && (
            <div>Secondary Layer: {secondaryLayer} ({secondaryFeatureCount} features)</div>
          )}
          {rasterLayerInfo && (
            <div>
              Raster Layer: {rasterLayerInfo.layer_name || rasterLayerInfo.layerName || rasterLayerInfo.id}
              <span className="ml-1 text-green-600">(From STP API)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maping;