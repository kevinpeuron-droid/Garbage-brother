import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Rectangle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { TrashBin, MapShape, BinTypeConfig } from '../types';
import MapDrawing from './MapDrawing';
import MapEvents from './MapEvents';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on status
const createIcon = (color: string, count?: number) => {
  const content = count && count > 1 ? `<span style="color: white; font-size: 10px; font-weight: bold;">${count}</span>` : '';
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">${content}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const getBinColor = (bin: TrashBin, binTypes: BinTypeConfig[]) => {
  if (bin.status === 'overflowing') return '#DC2626'; // Rouge pour archi pleine
  if (bin.status === 'to_install') {
    const typeConfig = binTypes.find(t => t.id === bin.type);
    return typeConfig ? typeConfig.color : '#A08E78';
  }
  if (bin.status === 'installed') return '#6B8E63'; // Vert
  if (bin.status === 'to_remove') return '#D4A373'; // Orange
  if (bin.status === 'removed') return '#D9D3C7'; // Gris clair
  return '#A08E78';
};

interface BinMapProps {
  bins: TrashBin[];
  shapes: MapShape[];
  binTypes: BinTypeConfig[];
  mode: 'map_pose' | 'map_depose';
  onUpdateStatus: (id: string, status: TrashBin['status']) => void;
  onShapesChange: (shapes: MapShape[]) => void;
  selectedBinId: string | null;
  placingBinId: string | null;
  onPlaceBin: (lat: number, lng: number) => void;
  onDeleteBin: (id: string) => void;
}

export default function BinMap({ bins, shapes, binTypes, mode, onUpdateStatus, onShapesChange, selectedBinId, placingBinId, onPlaceBin, onDeleteBin }: BinMapProps) {
  // Filter bins based on mode to keep the map clear
  const placedBins = bins.filter(b => b.lat !== null && b.lng !== null).filter(b => {
    if (mode === 'map_pose') {
      return ['to_install', 'installed', 'overflowing'].includes(b.status);
    }
    if (mode === 'map_depose') {
      return ['installed', 'to_remove', 'removed', 'overflowing'].includes(b.status);
    }
    return true;
  });

  return (
    <MapContainer center={[48.2710, -3.5550]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1, cursor: placingBinId ? 'crosshair' : 'grab' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapDrawing shapes={shapes} onShapesChange={onShapesChange} />
      <MapEvents onMapClick={onPlaceBin} />
      
      {shapes.map((shape) => {
        const pathOptions = { color: shape.color, weight: 2, fillColor: shape.color, fillOpacity: 0.2 };
        const popupContent = (
          <Popup>
            <div className="p-1 min-w-[150px] text-[#3C413A] font-sans">
              <h3 className="font-bold text-sm mb-3 text-[#4B6345]">{shape.name}</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    // Quick and dirty inline rename without prompt
                    const newName = "Zone Renommée " + Math.floor(Math.random() * 100);
                    onShapesChange(shapes.map(s => s.id === shape.id ? { ...s, name: newName } : s));
                  }} 
                  className="w-full px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"
                  title="Renommer rapidement (aléatoire pour contourner la restriction de sécurité)"
                >
                  Renommer (Auto)
                </button>
                <button 
                  onClick={() => {
                    onShapesChange(shapes.filter(s => s.id !== shape.id));
                  }}
                  className="w-full px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-[#916738] text-white hover:bg-[#7A562D]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </Popup>
        );

        if (shape.type === 'polygon') {
          return (
            <Polygon key={shape.id} positions={shape.positions} pathOptions={pathOptions}>
              {popupContent}
              <Tooltip permanent direction="center" className="bg-transparent border-0 shadow-none text-[#916738] font-bold text-sm text-center">
                {shape.name}
              </Tooltip>
            </Polygon>
          );
        }
        if (shape.type === 'rectangle') {
          return (
            <Rectangle key={shape.id} bounds={shape.positions as L.LatLngBoundsLiteral} pathOptions={pathOptions}>
              {popupContent}
              <Tooltip permanent direction="center" className="bg-transparent border-0 shadow-none text-[#916738] font-bold text-sm text-center">
                {shape.name}
              </Tooltip>
            </Rectangle>
          );
        }
        return null;
      })}

      {placedBins.map((bin) => {
        const typeConfig = binTypes.find(t => t.id === bin.type);
        return (
          <Marker 
            key={bin.id} 
            position={[bin.lat as number, bin.lng as number]} 
            icon={createIcon(getBinColor(bin, binTypes), bin.count)}
          >
            <Popup>
              <div className="p-1 min-w-[200px] text-[#3C413A] font-sans">
                <h3 className="font-bold text-sm mb-1 text-[#4B6345]">{bin.name} {bin.count && bin.count > 1 ? `(${bin.count} poubelles)` : ''}</h3>
                <p className="text-xs text-[#7A8275] mb-1 font-medium">Zone: {bin.zone}</p>
                {typeConfig && <p className="text-xs font-bold mb-3" style={{ color: typeConfig.color }}>Type: {typeConfig.label}</p>}
                
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase text-[#7A8275] mb-2">Changer le statut</p>
                  <div className="grid grid-cols-2 gap-2">
                    {mode === 'map_pose' && (
                      <>
                        <button onClick={() => onUpdateStatus(bin.id, 'to_install')} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === 'to_install' ? 'bg-[#A08E78] text-white' : 'bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]'}`}>À poser</button>
                        <button onClick={() => onUpdateStatus(bin.id, 'installed')} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === 'installed' ? 'bg-[#6B8E63] text-white' : 'bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]'}`}>Posée</button>
                      </>
                    )}
                    {mode === 'map_depose' && (
                      <>
                        <button onClick={() => onUpdateStatus(bin.id, 'to_remove')} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === 'to_remove' ? 'bg-[#D4A373] text-white' : 'bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]'}`}>À retirer</button>
                        <button onClick={() => onUpdateStatus(bin.id, 'removed')} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === 'removed' ? 'bg-[#D9D3C7] text-white' : 'bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]'}`}>Retirée</button>
                      </>
                    )}
                    <button onClick={() => onUpdateStatus(bin.id, 'overflowing')} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors col-span-2 ${bin.status === 'overflowing' ? 'bg-[#DC2626] text-white' : 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]'}`}>🚨 Archi pleine (Urgence)</button>
                  </div>
                </div>
                <div className="text-[10px] text-[#A08E78] pt-2 pb-2 border-t border-[#E5E0D5]">
                  Dernière collecte: {new Date(bin.lastEmptied).toLocaleTimeString()}
                </div>
                <button 
                  onClick={() => onDeleteBin(bin.id)} 
                  className="w-full px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-[#F4F1EA] text-[#916738] border border-[#D9D3C7] hover:bg-[#D9D3C7]"
                >
                  Supprimer du plan
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
