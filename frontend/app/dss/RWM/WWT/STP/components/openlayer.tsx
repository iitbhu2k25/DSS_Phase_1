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
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls, ScaleLine, FullScreen, OverviewMap, MousePosition, ZoomSlider, ZoomToExtent, Rotate } from 'ol/control';
import { Style, Fill, Stroke } from 'ol/style';
import { useMap } from '@/app/contexts//STP/MapContext';
import { useCategory } from '@/app/contexts/STP/CategoryContext';
import { createStringXY } from 'ol/coordinate';
import 'ol/ol.css';

// Define base map type interface
interface BaseMapDefinition {
  name: string;
  source: () => OSM | XYZ;
  thumbnail?: string; // Optional thumbnail URL for the basemap
}

// Define baseMaps with appropriate TypeScript typing
const baseMaps: Record<string, BaseMapDefinition> = {
  osm: {
    name: 'OpenStreetMap',
    source: () => new OSM()
  },
  satellite: {
    name: 'Satellite',
    source: () => new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attributions: 'Tiles © Esri'
    })
  },
  terrain: {
    name: 'Terrain',
    source: () => new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attributions: 'Tiles © Esri'
    })
  },
  dark: {
    name: 'Dark Mode',
    source: () => new XYZ({
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      maxZoom: 19,
      attributions: '© CARTO'
    })
  },
  light: {
    name: 'Light Mode',
    source: () => new XYZ({
      url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      maxZoom: 19,
      attributions: '© CARTO'
    })
  }
};

const Maping: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const primaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const secondaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const baseLayerRef = useRef<TileLayer<any> | null>(null);
  const layersRef = useRef<{[key: string]: any}>({}); 
  
  // Set initial loading state to true independent of any selection
  const [loading, setLoading] = useState<boolean>(true);
  const [primaryLayerLoading, setPrimaryLayerLoading] = useState<boolean>(true);
  const [secondaryLayerLoading, setSecondaryLayerLoading] = useState<boolean>(false);
  const [rasterLoading, setRasterLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryFeatureCount, setPrimaryFeatureCount] = useState<number>(0);
  const [secondaryFeatureCount, setSecondaryFeatureCount] = useState<number>(0);
  const [layerOpacity, setLayerOpacity] = useState<number>(70);
  const [rasterLayerInfo, setRasterLayerInfo] = useState<any>(null);
  const [wmsDebugInfo, setWmsDebugInfo] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [legendUrl, setLegendUrl] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [legendPosition, setLegendPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('bottom-right');
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('osm');
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  
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
  } = useMap();

  const {
    selectedCategoryName
  } = useCategory();
  
  const INDIA_CENTER_LON = 78.9629;
  const INDIA_CENTER_LAT = 20.5937;
  const INITIAL_ZOOM = 6;

  // Helper function to toggle full screen manually
  const toggleFullScreen = () => {
    if (!mapRef.current) return;
    
    if (!isFullScreen) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Helper to change base map
  const changeBaseMap = (baseMapKey: string) => {
    if (!mapInstanceRef.current || !baseLayerRef.current) return;
    
    // Remove current base layer
    mapInstanceRef.current.removeLayer(baseLayerRef.current);
    
    // Create and add new base layer
    const baseMapConfig = baseMaps[baseMapKey];
    const newBaseLayer = new TileLayer({
      source: baseMapConfig.source(),
      zIndex: 0,
      properties: {
        type: 'base'
      }
    });
    
    // Update reference and add to map
    baseLayerRef.current = newBaseLayer;
    mapInstanceRef.current.getLayers().insertAt(0, newBaseLayer);
    
    // Update state
    setSelectedBaseMap(baseMapKey);
  };

  // Initialize the map once with all controls
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create base OSM layer
    const initialBaseLayer = new TileLayer({
      source: baseMaps.osm.source(),
      zIndex: 0,
      properties: {
        type: 'base'
      }
    });
    
    baseLayerRef.current = initialBaseLayer;
    
    // Configure controls
    const controls = defaultControls().extend([
      // Full screen control
      new FullScreen({
        tipLabel: 'Toggle full-screen mode',
        source: mapRef.current
      }),
      
      // Scale line (distance indicator)
      new ScaleLine({
        units: 'metric',
        bar: true,
        steps: 4,
        minWidth: 140
      }),
      
      // Compass / Rotation reset control
      new Rotate({
        tipLabel: 'Reset rotation',
        autoHide: false
      }),
      
      // Coordinates display
      new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: 'EPSG:4326',
        className: 'custom-mouse-position',
        undefinedHTML: '&nbsp;'
      }),
      
      // Overview map (small map in corner)
      new OverviewMap({
        tipLabel: 'Overview map',
        layers: [
          new TileLayer({
            source: baseMaps.osm.source()
          })
        ],
        collapsed: true
      }),
      
      // Zoom slider
      new ZoomSlider(),
      
      // Zoom to extent button
      new ZoomToExtent({
        tipLabel: 'Zoom to India',
        extent: fromLonLat([68, 7]).concat(fromLonLat([97, 37]))
      })
    ]);
    
    // Create the map with controls
    const map = new Map({
      target: mapRef.current,
      layers: [initialBaseLayer],
      controls: controls,
      view: new View({
        center: fromLonLat([INDIA_CENTER_LON, INDIA_CENTER_LAT]),
        zoom: INITIAL_ZOOM,
        enableRotation: true,
        constrainRotation: false,
      })
    });
    
    // Store the map instance in a ref for other effects to use
    mapInstanceRef.current = map;
    
    // Set initial loading to false after map is initialized
    // This ensures loading is independent of selection state
    setTimeout(() => {
      setLoading(false);
      setPrimaryLayerLoading(false);
    }, 500);
    
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
      updateLoadingState();
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
      const secondaryExtent = secondaryVectorSource.getExtent();
      if (secondaryExtent && secondaryExtent.some(val => isFinite(val))) {
        mapInstanceRef.current?.getView().fit(secondaryExtent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      }
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
          // Automatically show legend when raster layer is added
          setShowLegend(true);
        } else {
          console.error("STP operation did not return success:", result);
          setError(`STP operation failed: ${result.status || 'Unknown error'}`);
          setRasterLoading(false);
        }
        
      } catch (error: any) {
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
    Object.entries(layersRef.current).forEach(([id, layer]: [string, any]) => {
      map.removeLayer(layer);
      delete layersRef.current[id];
    });
    
    // If there's no raster layer info, we're done after clearing
    if (!rasterLayerInfo) {
      setRasterLoading(false);
      // Clear the legend URL
      setLegendUrl(null);
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
      
      // Generate legend URL for the WMS layer
      const legendUrlString = `${layerUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${fullLayerName}&STYLE=`;
      setLegendUrl(legendUrlString);
      
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
      
    } catch (error: any) {
      console.error("Error setting up raster layer:", error);
      setError(`Error setting up raster layer: ${error.message}`);
      setRasterLoading(false);
    }
    
  }, [mapInstanceRef.current, rasterLayerInfo, layerOpacity, stpOperation, selectedCategoryName]);
  
  // Handle opacity change
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseInt(e.target.value);
    setLayerOpacity(newOpacity);
    
    // Update opacity of all raster layers
    Object.values(layersRef.current).forEach((layer: any) => {
      layer.setOpacity(newOpacity/100);
    });
  };
  
  // Helper function to update overall loading state
  function updateLoadingState() {
    setLoading(primaryLayerLoading || secondaryLayerLoading || rasterLoading);
  }

  // Generate the correct position class for the legend
  const getLegendPositionClass = () => {
    switch (legendPosition) {
      case 'top-left': return 'top-2 left-2';
      case 'top-right': return 'top-2 right-2';
      case 'bottom-left': return 'bottom-12 left-2';
      case 'bottom-right': return 'bottom-12 right-2';
      default: return 'bottom-12 right-2';
    }
  };

  // Move legend position
  const moveLegend = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    setLegendPosition(position);
  };
  
  return (
    <div className="w-full flex flex-col">
      {/* Improved header with better spacing and responsive design */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-3 bg-white rounded-lg p-3 shadow-sm">
        <div className="text-lg font-bold text-gray-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          GIS Viewer
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowToolbar(!showToolbar)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm flex items-center transition-colors font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Map Tools
          </button>
          
          <button 
            onClick={toggleFullScreen}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center transition-colors font-medium"
          >
            {!isFullScreen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
                Full Screen
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit Full Screen
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Improved toolbar with more intuitive layout and better visualization */}
      {showToolbar && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4 transition-all duration-200 ease-in-out">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Base Map Selector */}
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Base Map
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(baseMaps).map(([key, baseMap]) => (
                  <button 
                    key={key}
                    onClick={() => changeBaseMap(key)}
                    className={`text-xs py-2 px-3 rounded-md flex items-center justify-center transition-colors ${
                      selectedBaseMap === key 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {baseMap.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Raster Layer Controls - only show if raster is loaded */}
            {rasterLayerInfo && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Raster Layer Opacity: {layerOpacity}%
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layerOpacity}
                    onChange={handleOpacityChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Legend Controls - only show if raster is loaded */}
            {rasterLayerInfo && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Legend Controls
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowLegend(!showLegend)}
                    className={`flex-1 py-2 px-3 rounded-md text-xs transition-colors ${
                      showLegend 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showLegend ? 'Hide Legend' : 'Show Legend'}
                  </button>
                  
                  <div className="grid grid-cols-2 gap-1">
                    <button 
                      onClick={() => moveLegend('top-right')}
                      className={`p-2 rounded-md transition-colors ${
                        legendPosition === 'top-right' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Top Right"
                    >
                      ↗
                    </button>
                    <button 
                      onClick={() => moveLegend('top-left')}
                      className={`p-2 rounded-md transition-colors ${
                        legendPosition === 'top-left' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Top Left"
                    >
                      ↖
                    </button>
                    <button 
                      onClick={() => moveLegend('bottom-right')}
                      className={`p-2 rounded-md transition-colors ${
                        legendPosition === 'bottom-right' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Bottom Right"
                    >
                      ↘
                    </button>
                    <button 
                      onClick={() => moveLegend('bottom-left')}
                      className={`p-2 rounded-md transition-colors ${
                        legendPosition === 'bottom-left' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Bottom Left"
                    >
                      ↙
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Layer Info Section */}
          {(primaryFeatureCount > 0 || secondaryFeatureCount > 0) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Current Layers</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {primaryFeatureCount > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <div className="text-xs">
                      <span className="font-medium">Primary Layer:</span> {primaryFeatureCount} features
                    </div>
                  </div>
                )}
                
                {secondaryFeatureCount > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-md p-2 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <div className="text-xs">
                      <span className="font-medium">Secondary Layer:</span> {secondaryFeatureCount} features
                    </div>
                  </div>
                )}
                
                {rasterLayerInfo && (
                  <div className="bg-purple-50 border border-purple-100 rounded-md p-2 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <div className="text-xs">
                      <span className="font-medium">Raster Layer:</span> {rasterLayerInfo.layer_name || 'STP Map'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Map container with overlay elements */}
      <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
        <div 
          ref={mapRef} 
          className="w-full h-[500px] transition-all duration-300"
          style={{ height: isFullScreen ? '100vh' : '500px' }}
        >
          {/* Improved floating overlay legend */}
          {showLegend && legendUrl && rasterLayerInfo && (
            <div 
              className={`absolute z-40 bg-white bg-opacity-95 p-3 rounded-md shadow-lg ${getLegendPositionClass()} transition-all duration-300 ease-in-out border border-gray-200`}
              style={{maxWidth: '250px'}}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Map Legend
                </span>
                <button 
                  onClick={() => setShowLegend(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="legend-container">
                <img 
                  src={legendUrl} 
                  alt="Layer Legend" 
                  className="max-w-full h-auto"
                  onError={() => setError("Failed to load legend")}
                />
              </div>
            </div>
          )}
          
          {/* Improved loading indicator */}
          {(loading || isMapLoading || stpOperation) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50 backdrop-blur-sm transition-all duration-300">
              <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                <div className="text-blue-700 font-medium">
                  {stpOperation ? "Processing STP operation..." : "Loading map data..."}
                </div>
                {stpOperation && (
                  <div className="text-gray-500 text-xs mt-1 max-w-xs text-center">
                    This may take a few moments depending on data complexity
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Improved error message */}
          {error && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-100 border-t border-red-300 text-red-700 p-3 text-sm z-40 flex items-center transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Coordinates display with better styling */}
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded-md shadow-md text-xs z-30 border border-gray-200">
            <div className="custom-mouse-position font-mono">Hover to see coordinates</div>
          </div>
          
          {/* Quick base map switcher with improved UI */}
          <div className="absolute top-2 right-2 bg-white bg-opacity-95 p-2 rounded-md shadow-md z-30 border border-gray-200">
            <div className="flex flex-wrap gap-1">
              {Object.entries(baseMaps).slice(0, 3).map(([key, baseMap]) => (
                <button 
                  key={key}
                  onClick={() => changeBaseMap(key)}
                  className={`text-xs py-1 px-2 rounded-md transition-colors ${
                    selectedBaseMap === key 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={baseMap.name}
                >
                  {baseMap.name.substring(0, 3)}
                </button>
              ))}
              <button 
                onClick={() => setShowToolbar(!showToolbar)}
                className="text-xs py-1 px-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Layer toggle panel */}
          <div className="absolute top-12 right-2 bg-white bg-opacity-95 p-2 rounded-md shadow-md z-30 border border-gray-200">
            <div className="text-xs font-semibold mb-1 text-gray-700">Layers</div>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
                <span className="text-xs">Primary</span>
              </div>
              {secondaryFeatureCount > 0 && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                  <span className="text-xs">Secondary</span>
                </div>
              )}
              {rasterLayerInfo && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></div>
                  <span className="text-xs">Raster</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maping;