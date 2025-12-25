import { useEffect, useRef } from 'react';
import { Issue } from '../lib/localStorage';

type IssueMapProps = {
  issues: Issue[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
};

export function IssueMap({
  issues,
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
  onLocationSelect,
  height = '500px'
}: IssueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      if (!window.google) return;

      const map = new google.maps.Map(mapRef.current!, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      if (onLocationSelect) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onLocationSelect(e.latLng.lat(), e.latLng.lng());
          }
        });
      }
    };

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    mapInstanceRef.current.setCenter(center);
  }, [center]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    issues.forEach(issue => {
      const color =
        issue.status === 'resolved' ? '#10b981' :
        issue.status === 'in_progress' ? '#f59e0b' :
        '#ef4444';

      const marker = new google.maps.Marker({
        position: { lat: Number(issue.latitude), lng: Number(issue.longitude) },
        map: mapInstanceRef.current!,
        title: issue.issue_type,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; text-transform: capitalize;">${issue.issue_type}</h3>
            <p style="margin: 4px 0; font-size: 14px;">${issue.description}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Status: <span style="color: ${color}; font-weight: 600; text-transform: capitalize;">${issue.status.replace('_', ' ')}</span>
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });
  }, [issues]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height }}
      className="rounded-lg overflow-hidden border-2 border-gray-200"
    />
  );
}
