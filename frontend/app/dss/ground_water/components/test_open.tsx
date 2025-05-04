'use client';
import { useEffect, useRef, useState } from 'react';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

const MapComponent = () => {
  // Default configuration - replace with your actual values
  const url = 'http://localhost:9090/geoserver/wms';
  const workspace = 'raster_work';
  const layerName = 'Clipped_STP_Priority_Map';
  const opacity = 80;
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  
  // Initialize map only once when component mounts
  useEffect(() => {
    // Guard clause to prevent re-initialization
    if (mapRef.current === null || mapInstance.current !== null) return;
    
    console.log('Initializing map...');
    
    // Create base map with OSM layer
    const olMap = new Map({
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
    
    // Store map instance in ref
    mapInstance.current = olMap;
    
    // Add WMS layer after map is initialized
    setTimeout(() => {
      try {
        console.log('Adding WMS layer...');
        const fullLayerName = `${workspace}:${layerName}`;
        
        const wmsLayer = new ImageLayer({
          source: new ImageWMS({
            url: url,
            params: {
              'LAYERS': fullLayerName,
              'TILED': true,
              'FORMAT': 'image/png'
            },
            ratio: 1,
            serverType: 'geoserver'
          }),
          opacity: opacity / 100
        });
        
        olMap.addLayer(wmsLayer);
        olMap.renderSync();
      } catch (error) {
        console.error('Error adding WMS layer:', error);
      }
    }, 100); // Small delay to ensure map is ready
    
    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-full border rounded-lg shadow-sm"
      style={{ minHeight: '500px' }}
    />
  );
};

export default MapComponent;