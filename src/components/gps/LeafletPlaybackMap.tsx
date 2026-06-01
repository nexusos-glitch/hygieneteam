import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  is_on_site: boolean;
}

interface LeafletPlaybackMapProps {
  points: GPSPoint[];
  currentIndex: number;
  className?: string;
}

// Fix for default marker icons in Leaflet with webpack/vite
const createIcon = (color: string, size: number = 12) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createCurrentIcon = () => {
  return L.divIcon({
    className: 'current-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: 0;
        background-color: hsl(11, 100%, 49%);
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse 1.5s ease-in-out infinite;
      "></div>
      <div style="
        position: absolute;
        top: 4px;
        left: 4px;
        width: 12px;
        height: 12px;
        background-color: hsl(11, 100%, 49%);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const LeafletPlaybackMap: React.FC<LeafletPlaybackMapProps> = ({
  points,
  currentIndex,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pathLayerRef = useRef<L.LayerGroup | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([-36.8485, 174.7633], 13); // Default to Auckland, NZ

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layer group for path elements
    pathLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Add custom CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.5); opacity: 0.1; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      style.remove();
    };
  }, []);

  // Update path and markers when points or currentIndex changes
  useEffect(() => {
    if (!mapRef.current || !pathLayerRef.current || points.length === 0) return;

    const map = mapRef.current;
    const pathLayer = pathLayerRef.current;

    // Clear existing layers
    pathLayer.clearLayers();

    // Calculate bounds
    const allCoords = points.map(p => [p.latitude, p.longitude] as [number, number]);
    const bounds = L.latLngBounds(allCoords);

    // Draw full path (faded gray)
    const fullPathCoords = points.map(p => [p.latitude, p.longitude] as [number, number]);
    const fullPath = L.polyline(fullPathCoords, {
      color: '#888888',
      weight: 3,
      opacity: 0.3,
      dashArray: '5, 10',
    });
    pathLayer.addLayer(fullPath);

    // Draw traveled path (colored)
    if (currentIndex > 0) {
      const traveledCoords = points.slice(0, currentIndex + 1).map(p => [p.latitude, p.longitude] as [number, number]);
      
      // Color segments based on on_site status
      for (let i = 1; i <= currentIndex && i < points.length; i++) {
        const segment = L.polyline(
          [
            [points[i - 1].latitude, points[i - 1].longitude],
            [points[i].latitude, points[i].longitude],
          ],
          {
            color: points[i].is_on_site ? '#22c55e' : 'hsl(11, 100%, 49%)',
            weight: 4,
            opacity: 0.9,
          }
        );
        pathLayer.addLayer(segment);
      }
    }

    // Add start marker
    const startMarker = L.marker([points[0].latitude, points[0].longitude], {
      icon: createIcon('#22c55e', 14),
    }).bindPopup('<strong>Start</strong><br>' + new Date(points[0].recorded_at).toLocaleTimeString());
    pathLayer.addLayer(startMarker);

    // Add end marker
    if (points.length > 1) {
      const endPoint = points[points.length - 1];
      const endMarker = L.marker([endPoint.latitude, endPoint.longitude], {
        icon: createIcon('#ef4444', 14),
      }).bindPopup('<strong>End</strong><br>' + new Date(endPoint.recorded_at).toLocaleTimeString());
      pathLayer.addLayer(endMarker);
    }

    // Add on-site markers
    points.forEach((point, index) => {
      if (point.is_on_site && index > 0 && !points[index - 1].is_on_site) {
        // Mark start of on-site period
        const onSiteMarker = L.marker([point.latitude, point.longitude], {
          icon: createIcon('#f59e0b', 10),
        }).bindPopup('<strong>Arrived on site</strong><br>' + new Date(point.recorded_at).toLocaleTimeString());
        pathLayer.addLayer(onSiteMarker);
      }
    });

    // Add/update current position marker
    if (currentMarkerRef.current) {
      map.removeLayer(currentMarkerRef.current);
    }

    const currentPoint = points[currentIndex];
    if (currentPoint) {
      const currentMarker = L.marker([currentPoint.latitude, currentPoint.longitude], {
        icon: createCurrentIcon(),
        zIndexOffset: 1000,
      }).bindPopup(`
        <div style="text-align: center;">
          <strong>${currentPoint.is_on_site ? '📍 On Site' : '🚗 Traveling'}</strong><br>
          <small>${new Date(currentPoint.recorded_at).toLocaleTimeString()}</small><br>
          ${currentPoint.speed !== null ? `Speed: ${(currentPoint.speed * 3.6).toFixed(1)} km/h` : ''}
        </div>
      `);
      currentMarkerRef.current = currentMarker;
      pathLayer.addLayer(currentMarker);

      // Pan to current position (smooth)
      map.panTo([currentPoint.latitude, currentPoint.longitude], {
        animate: true,
        duration: 0.3,
      });
    }

    // Fit bounds on first load or when points change significantly
    if (currentIndex === 0 || currentIndex === points.length - 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [points, currentIndex]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full min-h-[300px] ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default LeafletPlaybackMap;
