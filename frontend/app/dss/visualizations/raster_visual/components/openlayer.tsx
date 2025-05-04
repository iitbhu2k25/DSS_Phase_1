'use client';
import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '@/app/contexts/rasterContext';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

// Basic interfaces
interface RasterLayerProps {
  id: string;
  visible: boolean;
  url?: string;
  opacity?: number;
  name?: string;
  extent?: [number, number, number, number];
  type?: 'geotiff' | 'wms';
  workspace?: string; 
  layerName?: string;
  storeName?: string;
}

interface PixelInfoValue {
  coords: [number, number];
  value: number | null;
  loading: boolean;
  error?: string;
}

const MapComponent = () => {
  const {
    currentRasterLayer,
    pixelInfo,
    setPixelInfo,
    layerOpacity,
  } = useMapContext();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const layersRef = useRef<Record<string, TileLayer<any> | ImageLayer<any>>>({});
  const initializedRef = useRef<boolean>(false);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;
    
    initializedRef.current = true;
    
    // Initialize the OpenLayers map
    const initialMap = new Map({
      target: mapRef.current,
      controls: defaultControls(),
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]), // Center on India
        zoom: 5
      })
    });
    
    setMap(initialMap);
    
    // Simple click handler
    initialMap.on('click', (event) => {
      if (!currentRasterLayer || !currentRasterLayer.visible || !currentRasterLayer.id) return;
      
      const coordinate = event.coordinate;
      
      // Get value for the current layer
      const layerId = currentRasterLayer.id;
      const layer = layersRef.current[layerId];
      
     
    });
    
    return () => {
      initialMap.setTarget(undefined);
      initializedRef.current = false;
    };
  }, [setPixelInfo]);
  
  
  // Handle raster layer changes from context
  useEffect(() => {
    if (!map) return;
    

    
    // First, remove all existing WMS/raster layers (but keep the base OSM)
    Object.entries(layersRef.current).forEach(([id, layer]) => {
      //console.log(`Removing layer with ID: ${id}`);
      map.removeLayer(layer);
      delete layersRef.current[id];
    });
    
    // If there's no current layer, we're done after clearing
    if (!currentRasterLayer) {
      //console.log("No current raster layer to display");
      return;
    }
    
    // Now add the current layer if it exists
    if (currentRasterLayer.url && currentRasterLayer.id) {
      //console.log(`Creating new layer for ${currentRasterLayer.name || currentRasterLayer.id}`);
      
      let newLayer;
      
      // Different handling based on layer type
      if (currentRasterLayer.type === 'wms' || currentRasterLayer.layerName) {
        // Create WMS layer for GeoServer
        const workspace = currentRasterLayer.workspace || '';
        const layerName = currentRasterLayer.layerName || currentRasterLayer.id;
        
        // If workspace is provided, use it in the layer name
        const fullLayerName = workspace ? `${workspace}:${layerName}` : layerName;
        
        //console.log(`Creating WMS layer with URL: ${currentRasterLayer.url}, Layer: ${fullLayerName}`);
        
        //console.log("layer",layerOpacity);
        try {
          newLayer = new ImageLayer({
            source: new ImageWMS({
              url: currentRasterLayer.url,
              params: {
                'LAYERS': fullLayerName,
                'TILED': true,
                'FORMAT': 'image/png'
              },
              ratio: 1,
              serverType: 'geoserver'
            }),
            visible: true, // Force to visible for debugging
            opacity: layerOpacity/100
          });
          
          //console.log(`WMS layer created successfully`);
        } catch (error) {
          console.error("Error creating WMS layer:", error);
          return;
        }
      } else {
        console.warn("Unsupported layer type - GeoTIFF not implemented in this component");
        return;
      }
      
      // Set extent if available
      if (currentRasterLayer.extent) {
        //console.log(`Setting layer extent:`, currentRasterLayer.extent);
        newLayer.setExtent(currentRasterLayer.extent);
      }
      
      // Store the layer reference
      layersRef.current[currentRasterLayer.id] = newLayer;
      
      // Add layer to map
      map.addLayer(newLayer);
      //console.log(`Layer added to map: ${currentRasterLayer.id}`);
      
      // Force a map render
      map.renderSync();
      
      // Zoom to layer extent if available
      if (currentRasterLayer.extent) {
        map.getView().fit(currentRasterLayer.extent, {
          padding: [20, 20, 20, 20],
          duration: 1000
        });
      }
    } else {
      console.warn("Current layer missing URL or ID:", currentRasterLayer);
    }
  }, [map, currentRasterLayer, layerOpacity]);
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-full border rounded-lg shadow-sm"
      style={{ minHeight: '500px' }}
    />
  );
};

export default MapComponent;