import React from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export default function MapEvents({ onMapClick, onZoomChange }: MapEventsProps) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend: () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    }
  });
  return null;
}
