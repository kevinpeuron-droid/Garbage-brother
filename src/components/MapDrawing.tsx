import React, { useEffect } from 'react';
import L from 'leaflet';
// Ensure L is available globally for plugins that might need it
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';
import { MapShape } from '../types';

interface MapDrawingProps {
  shapes: MapShape[];
  onShapesChange: (shapes: MapShape[]) => void;
}

export default function MapDrawing({ shapes, onShapesChange }: MapDrawingProps) {
  const map = useMap();

  useEffect(() => {
    if (!map.pm) return;
    
    // Add Geoman controls
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
    });

    // Handle create
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      const type = e.shape; // 'Polygon' or 'Rectangle'
      
      let positions: any = [];
      
      if (type === 'Rectangle' && layer.getBounds) {
        const bounds = layer.getBounds();
        positions = [
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
        ];
      } else if (layer.getLatLngs) {
        const latLngs = layer.getLatLngs();
        // Flatten array if needed. leaflet polygons are usually arrays of rings (which are arrays of latlngs)
        let outerRing = latLngs;
        while (outerRing.length > 0 && Array.isArray(outerRing[0])) {
          outerRing = outerRing[0];
        }
        positions = outerRing.map((ll: any) => [ll.lat, ll.lng]);
      }

      // In iframe, window.prompt might be blocked. Just use a default name.
      // They can rename it later.
      const defaultName = `Zone ${type === 'Polygon' ? 'Personnalisée' : 'Rectangulaire'}`;
      
      const newShape: MapShape = {
        id: `shape-${Date.now()}`,
        name: defaultName,
        type: type.toLowerCase() as 'polygon' | 'rectangle',
        color: '#D4A373', // default color
        positions
      };

      // Remove the geoman layer so we can let react-leaflet render it via state
      map.removeLayer(layer);
      
      onShapesChange([...shapes, newShape]);
    });

    // Handle remove
    map.on('pm:remove', (e: any) => {
      // Find the shape that was removed. Geoman wraps our react-leaflet layers?
      // Wait, Geoman toolbar edits the existing layers?
      // Actually, Geoman intercepts clicks on any layer that has pm.enable() or was drawn.
      // But we render shapes via react-leaflet! They might not have pm enabled by default unless geoman auto-enables them.
      // If we don't enable them, geoman removal mode might not work on them. We have our own delete button in the popup anyway!
      // Let's just catch any removals if they somehow happen.
      if (e.layer && e.layer.options && e.layer.options.id) {
        onShapesChange(shapes.filter(s => s.id !== e.layer.options.id));
      }
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map, shapes, onShapesChange]);

  return null;
}
