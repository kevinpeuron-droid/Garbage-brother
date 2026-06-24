import React from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapEvents({ onMapClick }: MapEventsProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
