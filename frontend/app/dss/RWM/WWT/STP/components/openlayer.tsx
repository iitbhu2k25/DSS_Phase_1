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
import WKT from 'ol/format/WKT';

// Define base map type interface
interface BaseMapDefinition {
  name: string;
  source: () => OSM | XYZ;
  thumbnail?: string; 
  icon?: string;
}

// Define baseMaps with appropriate TypeScript typing
const baseMaps: Record<string, BaseMapDefinition> = {
  osm: {
    name: 'OpenStreetMap',
    source: () => new OSM(),
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
  },
  satellite: {
    name: 'Satellite',
    source: () => new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attributions: 'Tiles © Esri'
    }),
    icon: 'M17.66 8L12 2.35 6.34 8C4.78 9.56 4 11.64 4 13.64s.78 4.11 2.34 5.67 3.61 2.35 5.66 2.35 4.1-.79 5.66-2.35S20 15.64 20 13.64 19.22 9.56 17.66 8z'
  },
  terrain: {
    name: 'Terrain',
    source: () => new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attributions: 'Tiles © Esri'
    }),
    icon: 'M14 11l4-8H6l4 8H6l6 10 6-10h-4z'
  },
  dark: {
    name: 'Dark Mode',
    source: () => new XYZ({
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      maxZoom: 19,
      attributions: '© CARTO'
    }),
    icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
  },
  light: {
    name: 'Light Mode',
    source: () => new XYZ({
      url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      maxZoom: 19,
      attributions: '© CARTO'
    }),
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
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
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showLayerList, setShowLayerList] = useState<boolean>(true);
  
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

  const [wtkpoly,setwtkpoly]=useState<any>(null);

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

  // Toggle active panel function
  const togglePanel = (panelName: string) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
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
      
      // Coordinates display with custom format
      new MousePosition({
        coordinateFormat: (coordinate) => {
          if (!coordinate) return 'No coordinates';
          const [longitude, latitude] = coordinate;
          return `Lat: ${latitude.toFixed(6)}° | Long: ${longitude.toFixed(6)}°`;
        },
        projection: 'EPSG:4326',
        className: 'custom-mouse-position',
        undefinedHTML: 'Move mouse over map'
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
    
    mapInstanceRef.current = map;
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
    secondaryVectorSource.once('change', function() {
    
      if (secondaryVectorSource.getState() === 'ready') {
        // Get all features
        const features = secondaryVectorSource.getFeatures();
        
        // Filter for polygon features if needed
        const polygonFeatures = features.filter(feature => {
          const geometry = feature.getGeometry();
          return geometry && geometry.getType().includes('Polygon');
        });
        setwtkpoly(polygonFeatures);
      }
    });
    
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
      // const format = new WKT();
      // const geomInWGS84 = wtkpoly[0].getGeometry().clone();
      // const wktPolygon = format.writeGeometry(geomInWGS84);
      // console.log("test geo",wktPolygon)
      const format = new WKT();
      const wktPolygon = format.writeGeometry(wtkpoly[0].getGeometry().clone());
      // Create WMS source with simplified params (matching working example)
      const wmsSource = new ImageWMS({
        url: layerUrl,
        params: {
          'LAYERS': fullLayerName,
          'TILED': true,
          'FORMAT': 'image/png',
          'TRANSPARENT': true,
          'clip': wktPolygon
        },
        ratio: 1,
        serverType: 'geoserver',
      });
   
      
      // Generate legend URL for the WMS layer
      const legendUrlString = `${layerUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${fullLayerName}&STYLE=`;
      setLegendUrl(legendUrlString);
      if (secondaryLayerRef.current) {
        mapInstanceRef.current.removeLayer(secondaryLayerRef.current);
      }
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
    // bug  setLoading(primaryLayerLoading || secondaryLayerLoading || rasterLoading);
    setLoading(secondaryLayerLoading || rasterLoading);
  }

  // Generate the correct position class for the legend
  const getLegendPositionClass = () => {
    switch (legendPosition) {
      case 'top-left': return 'top-16 left-16';
      case 'top-right': return 'top-16 right-16';
      case 'bottom-left': return 'bottom-16 left-16';
      case 'bottom-right': return 'bottom-16 right-16';
      default: return 'bottom-16 right-16';
    }
  };

  // Move legend position
  const moveLegend = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    setLegendPosition(position);
  };
  
  return (
    <div className="relative w-full h-[600px] flex flex-col bg-gray-100">
      {/* Modern Map Container */}
      <div className="relative w-full h-full flex-grow overflow-hidden rounded-lg shadow-lg">
        {/* The Map */}
        <div 
          ref={mapRef} 
          className="w-full h-full bg-blue-50"
        />
        
        {/* Floating Header Panel - Always Visible */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-full shadow-lg px-4 py-2 flex items-center space-x-3 transition-all duration-300 ease-in-out">
          <span className="font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            GIS Viewer
          </span>
          
          <div className="flex space-x-1">
            <button
              onClick={() => togglePanel('layers')}
              className={`p-2 rounded-full transition-all duration-200 ${activePanel === 'layers' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
              title="Layers"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            
            <button
              onClick={() => togglePanel('basemap')}
              className={`p-2 rounded-full transition-all duration-200 ${activePanel === 'basemap' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
              title="Base Maps"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 012-2h1.945M5.05 9h13.9c.976 0 1.31-1.293.455-1.832L12 2 4.595 7.168C3.74 7.707 4.075 9 5.05 9z" />
              </svg>
            </button>
            
            <button
              onClick={() => togglePanel('tools')}
              className={`p-2 rounded-full transition-all duration-200 ${activePanel === 'tools' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
              title="Tools"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all duration-200"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {!isFullScreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Base Map Panel */}
        {activePanel === 'basemap' && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg p-4 max-w-md w-full animate-fade-in-down transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800">Base Maps</h3>
              <button 
                onClick={() => setActivePanel(null)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-3">
              {Object.entries(baseMaps).map(([key, baseMap]) => (
                <button 
                  key={key}
                  onClick={() => changeBaseMap(key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    selectedBaseMap === key 
                      ? 'bg-blue-100 ring-2 ring-blue-500 text-blue-700 transform scale-105' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={baseMap.icon} />
                  </svg>
                  <span className="text-xs font-medium">{baseMap.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Layers Panel */}
        {activePanel === 'layers' && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg p-4 max-w-md w-full animate-fade-in-down transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800">Map Layers</h3>
              <button 
                onClick={() => setActivePanel(null)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 mt-2">
              {/* Primary Layer */}
              {primaryFeatureCount > 0 && (
                <div className={`p-3 rounded-lg bg-blue-50 border border-blue-100 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="font-medium text-blue-800">Primary Layer</span>
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      {primaryFeatureCount} features
                    </span>
                  </div>
                </div>
              )}
              
              {/* Secondary Layer */}
              {secondaryFeatureCount > 0 && (
                <div className={`p-3 rounded-lg bg-green-50 border border-green-100 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="font-medium text-green-800">Secondary Layer</span>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {secondaryFeatureCount} features
                    </span>
                  </div>
                </div>
              )}
              
              {/* Raster Layer with Opacity Control */}
              {rasterLayerInfo && (
                <div className={`p-3 rounded-lg bg-purple-50 border border-purple-100 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="font-medium text-purple-800">Raster Layer</span>
                    </div>
                    <button 
                      onClick={() => setShowLegend(!showLegend)}
                      className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                        showLegend 
                          ? 'bg-purple-200 text-purple-800' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {showLegend ? 'Hide Legend' : 'Show Legend'}
                    </button>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>Opacity: {layerOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layerOpacity}
                      onChange={handleOpacityChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  
                  {/* Legend Position Controls */}
                  {showLegend && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Legend Position</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => moveLegend('top-left')}
                          className={`p-2 text-xs rounded transition-all duration-200 ${
                            legendPosition === 'top-left' 
                              ? 'bg-purple-200 text-purple-800' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Top Left
                        </button>
                        <button 
                          onClick={() => moveLegend('top-right')}
                          className={`p-2 text-xs rounded transition-all duration-200 ${
                            legendPosition === 'top-right' 
                              ? 'bg-purple-200 text-purple-800' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Top Right
                        </button>
                        <button 
                          onClick={() => moveLegend('bottom-left')}
                          className={`p-2 text-xs rounded transition-all duration-200 ${
                            legendPosition === 'bottom-left' 
                              ? 'bg-purple-200 text-purple-800' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Bottom Left
                        </button>
                        <button 
                          onClick={() => moveLegend('bottom-right')}
                          className={`p-2 text-xs rounded transition-all duration-200 ${
                            legendPosition === 'bottom-right' 
                              ? 'bg-purple-200 text-purple-800' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Bottom Right
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* No Layers Message */}
              {primaryFeatureCount === 0 && secondaryFeatureCount === 0 && !rasterLayerInfo && (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No layers are currently active</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tools Panel */}
        {activePanel === 'tools' && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg p-4 max-w-md w-full animate-fade-in-down transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">Map Tools</h3>
              <button 
                onClick={() => setActivePanel(null)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={toggleFullScreen}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6 mb-1 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
                <span className="text-xs font-medium">Full Screen</span>
              </button>
              
              <button
                onClick={() => setShowLayerList(!showLayerList)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-200 ${
                  showLayerList 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-medium">Layer List</span>
              </button>
              
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    const view = mapInstanceRef.current.getView();
                    view.setCenter(fromLonLat([INDIA_CENTER_LON, INDIA_CENTER_LAT]));
                    view.setZoom(INITIAL_ZOOM);
                  }
                }}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6 mb-1 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs font-medium">Home View</span>
              </button>
              
              {/* Additional tool buttons can be added here */}
            </div>
          </div>
        )}
        
        {/* Fixed Side Panel for Layer List */}
        {showLayerList && (
          <div className="absolute top-20 right-4 z-20 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-3 w-60 transition-all duration-300 ease-in-out animate-slide-in-right">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-800">Active Layers</h3>
              <button 
                onClick={() => setShowLayerList(false)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 mt-1">
              <div className="flex items-center p-2 rounded-md bg-blue-50 border border-blue-100">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs font-medium text-blue-800">Primary Layer</span>
                {primaryFeatureCount > 0 && (
                  <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">
                    {primaryFeatureCount}
                  </span>
                )}
              </div>
              
              {secondaryFeatureCount > 0 && (
                <div className="flex items-center p-2 rounded-md bg-green-50 border border-green-100">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium text-green-800">Secondary Layer</span>
                  <span className="ml-auto text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
                    {secondaryFeatureCount}
                  </span>
                </div>
              )}
              
              {rasterLayerInfo && (
                <div className="flex items-center p-2 rounded-md bg-purple-50 border border-purple-100">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium text-purple-800">Raster Layer</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layerOpacity}
                    onChange={handleOpacityChange}
                    className="ml-auto w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}
              
              <div className="flex items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-xs font-medium text-gray-800">Base Map</span>
                <span className="ml-auto text-xs bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-full">
                  {baseMaps[selectedBaseMap].name}
                </span>
              </div>
            </div>
            
            {/* Quick Base Map Switcher */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1.5">Quick Base Map Switch</div>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(baseMaps).slice(0, 3).map(([key, baseMap]) => (
                  <button 
                    key={key}
                    onClick={() => changeBaseMap(key)}
                    className={`p-1.5 rounded-md text-xs transition-all duration-200 ${
                      selectedBaseMap === key 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {baseMap.name.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Legend Display */}
        {showLegend && legendUrl && rasterLayerInfo && (
          <div 
            className={`absolute z-20 bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-lg shadow-lg ${getLegendPositionClass()} transition-all duration-500 ease-in-out transform hover:scale-105 animate-fade-in border border-gray-200`}
            style={{maxWidth: '250px'}}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-700 flex items-center">
                <svg className="h-3.5 w-3.5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Legend
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setShowLegend(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100 p-1"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="legend-container overflow-hidden rounded-md">
              <img 
                src={legendUrl} 
                alt="Layer Legend" 
                className="max-w-full h-auto hover:scale-105 transition-transform duration-300"
                onError={() => setError("Failed to load legend")}
              />
            </div>
          </div>
        )}
        
        {/* Enhanced Coordinates Display */}
        <div className="absolute bottom-4 left-4 z-20 bg-white bg-opacity-90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 transition-all duration-300 ease-in-out animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        {/* Modern Loading Overlay */}
        {(loading || isMapLoading || stpOperation) && (
          <div className="absolute inset-0 flex items-center justify-center  bg-opacity-25 backdrop-blur-sm z-50 transition-all duration-500 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm flex items-center space-x-4 transition-all transform animate-float">
              <div className="relative">
                <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                <div className="w-12 h-12 border-r-2 border-l-2 border-red-500 rounded-full animate-pulse absolute top-0 left-0" style={{animationDelay: '-0.2s'}}></div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800 tracking-wide">
                  {stpOperation ? "Processing STP Operation" : "Loading Map Data"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {stpOperation 
                    ? "This may take a few moments..." 
                    : "Fetching geographic information..."}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modern Error Message */}
        {error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300 animate-slide-up max-w-md">
            <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium pr-6">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="absolute right-2 top-2 text-red-500 hover:text-red-700 rounded-full p-1 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-up {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Maping;