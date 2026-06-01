import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed?: number | null;
  accuracy?: number | null;
  is_on_site?: boolean;
}

interface GPSClusterMapProps {
  gpsPoints: GPSPoint[];
  height?: string;
}

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function GPSClusterMap({ gpsPoints, height = '400px' }: GPSClusterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([-36.8485, 174.7633], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    if (markersRef.current) {
      mapRef.current.removeLayer(markersRef.current);
    }

    // Create marker cluster group with custom options
    markersRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let className = 'marker-cluster-small';
        
        if (count > 100) {
          size = 'large';
          className = 'marker-cluster-large';
        } else if (count > 10) {
          size = 'medium';
          className = 'marker-cluster-medium';
        }
        
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    // Add markers for each GPS point
    const validPoints = gpsPoints.filter(p => 
      p.latitude !== null && 
      p.longitude !== null && 
      !isNaN(p.latitude) && 
      !isNaN(p.longitude)
    );

    validPoints.forEach(point => {
      const marker = L.marker([point.latitude, point.longitude]);
      
      const popupContent = `
        <div class="p-2">
          <p class="font-semibold">GPS Point</p>
          <p class="text-sm text-gray-600">${new Date(point.recorded_at).toLocaleString()}</p>
          ${point.speed ? `<p class="text-xs">Speed: ${point.speed.toFixed(1)} m/s</p>` : ''}
          ${point.accuracy ? `<p class="text-xs">Accuracy: ±${point.accuracy.toFixed(0)}m</p>` : ''}
          <p class="text-xs">${point.is_on_site ? '✓ On Site' : '○ Off Site'}</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current?.addLayer(marker);
    });

    mapRef.current.addLayer(markersRef.current);

    // Fit bounds if we have points
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(
        validPoints.map(p => [p.latitude, p.longitude] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Cleanup on unmount only
    };
  }, [gpsPoints]);

  // Cleanup map on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (gpsPoints.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="flex items-center justify-center bg-muted rounded-lg border"
      >
        <p className="text-muted-foreground">No GPS points to display</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      style={{ height }} 
      className="rounded-lg border overflow-hidden z-0"
    />
  );
}
