'use client'
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

interface MapProps {
  selectedLocations?: {
    state: string;
    districts: string[];
    subDistricts: string[];
  };
}

const MapComponent: React.FC<MapProps> = ({ selectedLocations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [baseMapType, setBaseMapType] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({ 
    lat: 22.5, 
    lon: 80.0 
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Create layer instances
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: baseMapType === 'osm',
    });

    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }),
      visible: baseMapType === 'satellite',
    });

    const terrainLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      }),
      visible: baseMapType === 'terrain',
    });

    // Vector layer for India boundaries
    const indiaBoundaries = new VectorLayer({
      source: new VectorSource(),
      style: {
        'stroke-color': '#3388ff',
        'stroke-width': 2,
        'fill-color': 'rgba(255, 255, 255, 0.1)',
      },
    });

    const initialMap = new Map({
      target: mapRef.current,
      layers: [osmLayer, satelliteLayer, terrainLayer, indiaBoundaries],
      view: new View({
        center: fromLonLat([coordinates.lon, coordinates.lat]),
        zoom: 5,
        minZoom: 4,
        maxZoom: 19,
      }),
    });

    // Update coordinates when map is moved
    initialMap.on('moveend', () => {
      const view = initialMap.getView();
      const center = view.getCenter();
      if (center) {
        const lonLat = [center[0], center[1]];
        const transformedCoords = fromLonLat(lonLat, 'EPSG:4326');
        setCoordinates({
          lat: parseFloat(transformedCoords[1].toFixed(6)),
          lon: parseFloat(transformedCoords[0].toFixed(6)),
        });
      }
    });

    setMap(initialMap);

    // Cleanup
    return () => {
      initialMap.setTarget(undefined);
    };
  }, []);

  // Update base map visibility when type changes
  useEffect(() => {
    if (!map) return;
    
    map.getLayers().forEach((layer, i) => {
      if (i < 3) { // First three layers are our base layers
        const isVisible = 
          (i === 0 && baseMapType === 'osm') || 
          (i === 1 && baseMapType === 'satellite') || 
          (i === 2 && baseMapType === 'terrain');
        
        layer.setVisible(isVisible);
      }
    });
  }, [baseMapType, map]);

  // Update vector layer when selected locations change
  useEffect(() => {
    if (!map || !selectedLocations) return;
    // In a real app, this would update the vector layer with new GeoJSON
    console.log('Selected locations updated:', selectedLocations);
  }, [selectedLocations, map]);

  return (
    <div className="bg-white rounded-md shadow-md p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 font-medium">
          <span>🗺️</span> GIS Viewer
        </div>
        <div className="text-sm text-gray-500">
          Lat: {coordinates.lat}° | Long: {coordinates.lon}°
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="flex-1 border border-gray-200 rounded-md mb-4 min-h-96 bg-gray-50"
      ></div>
      
      <div className="flex justify-between">
        <div className="bg-gray-50 rounded-md p-3 w-1/2 mr-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Active Layers</h3>
            <button className="text-xl text-gray-500">×</button>
          </div>
          
          <div className="flex items-center mb-2 text-sm">
            <span className="text-blue-500 mr-2">●</span> Primary Layer
            <span className="ml-auto bg-blue-100 text-blue-800 px-2 rounded-full text-xs">37</span>
          </div>
          
          <div className="flex items-center text-sm">
            <span className="text-gray-500 mr-2">●</span> Base Map
            <span className="ml-auto">OpenStreetMap</span>
          </div>
        </div>
        
        <div className="w-1/2 ml-2">
          <div className="text-sm mb-2">Quick Base Map Switch</div>
          <div className="grid grid-cols-3 gap-1">
            <button 
              className={`text-sm px-3 py-1 rounded-md ${baseMapType === 'osm' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setBaseMapType('osm')}
            >
              Osm
            </button>
            <button 
              className={`text-sm px-3 py-1 rounded-md ${baseMapType === 'satellite' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setBaseMapType('satellite')}
            >
              Sat
            </button>
            <button 
              className={`text-sm px-3 py-1 rounded-md ${baseMapType === 'terrain' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setBaseMapType('terrain')}
            >
              Ter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;