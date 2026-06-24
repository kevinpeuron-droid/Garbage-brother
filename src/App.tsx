import React, { useState, useEffect } from 'react';
import BinMap from './components/BinMap';
import ListView from './components/ListView';
import SettingsView from './components/SettingsView';
import { TrashBin, MapShape, BinTypeConfig, defaultBinTypes } from './types';
import { mockBins } from './data';
import { Trash2, Map, List, Settings } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

type ViewMode = 'map_pose' | 'map_depose' | 'map_exploitation' | 'list' | 'settings';

export default function App() {
  const [bins, setBins] = useState<TrashBin[]>(() => {
    const saved = localStorage.getItem('vcp-bins');
    return saved ? JSON.parse(saved) : mockBins;
  });
  
  const [shapes, setShapes] = useState<MapShape[]>(() => {
    const saved = localStorage.getItem('vcp-shapes');
    return saved ? JSON.parse(saved) : [];
  });

  const [binTypes, setBinTypes] = useState<BinTypeConfig[]>(() => {
    const saved = localStorage.getItem('vcp-types');
    return saved ? JSON.parse(saved) : defaultBinTypes;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('map_pose');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [placingBinId, setPlacingBinId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vcp-bins', JSON.stringify(bins));
  }, [bins]);

  useEffect(() => {
    localStorage.setItem('vcp-shapes', JSON.stringify(shapes));
  }, [shapes]);

  useEffect(() => {
    localStorage.setItem('vcp-types', JSON.stringify(binTypes));
  }, [binTypes]);

  const updateBinStatus = (id: string, status: TrashBin['status']) => {
    setBins(prev => prev.map(bin => {
      if (bin.id === id) {
        return {
          ...bin,
          status,
          ...(status === 'installed' ? { lastEmptied: new Date().toISOString() } : {})
        };
      }
      return bin;
    }));
  };

  const handleImportBins = (importedBins: Omit<TrashBin, 'id' | 'lat' | 'lng' | 'lastEmptied'>[], groupStrategy: 'group' | 'individual') => {
    const newBins: TrashBin[] = [];
    
    importedBins.forEach((binData, index) => {
      if (groupStrategy === 'group' || binData.count === 1) {
        newBins.push({
          ...binData,
          status: 'to_install',
          id: `imported-${Date.now()}-${index}`,
          lat: null,
          lng: null,
          lastEmptied: new Date().toISOString(),
        });
      } else {
        // Individual placement
        const count = binData.count || 1;
        for (let i = 0; i < count; i++) {
          newBins.push({
            ...binData,
            status: 'to_install',
            id: `imported-${Date.now()}-${index}-${i}`,
            name: `${binData.name} #${i + 1}`,
            count: 1,
            lat: null,
            lng: null,
            lastEmptied: new Date().toISOString(),
          });
        }
      }
    });

    setBins(prev => [...prev, ...newBins]);
  };

  const handlePlaceBin = (lat: number, lng: number) => {
    if (placingBinId) {
      setBins(prev => prev.map(bin => 
        bin.id === placingBinId ? { ...bin, lat, lng } : bin
      ));
      setPlacingBinId(null);
    }
  };

  const handleDeleteBin = (id: string) => {
    // Suppressed window.confirm to avoid iframe blocking
    setBins(prev => prev.filter(bin => bin.id !== id));
    if (selectedBinId === id) setSelectedBinId(null);
    if (placingBinId === id) setPlacingBinId(null);
  };

  const handleStartPlacing = (id: string) => {
    setPlacingBinId(id);
    setViewMode('map_pose');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F1EA] text-[#3C413A] font-sans">
      <header className="h-16 bg-[#F4F1EA] border-b border-[#D9D3C7] flex items-center justify-between px-6 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6B8E63] rounded-lg flex items-center justify-center text-white">
            <Trash2 size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:block">VC GREEN</span>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-[#E5E0D5] overflow-x-auto">
          <button 
            onClick={() => setViewMode('map_pose')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'map_pose' ? 'bg-[#6B8E63] text-white' : 'text-[#7A8275] hover:bg-[#F4F1EA]'}`}
          >
            <Map size={16} /> Mode Pose
          </button>
          <button 
            onClick={() => setViewMode('map_depose')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'map_depose' ? 'bg-[#D4A373] text-white' : 'text-[#7A8275] hover:bg-[#F4F1EA]'}`}
          >
            <Map size={16} /> Mode Dépose
          </button>
          <button 
            onClick={() => setViewMode('map_exploitation')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'map_exploitation' ? 'bg-[#DC2626] text-white' : 'text-[#7A8275] hover:bg-[#F4F1EA]'}`}
          >
            <Map size={16} /> Mode Exploitation
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-[#4B6345] text-white' : 'text-[#7A8275] hover:bg-[#F4F1EA]'}`}
          >
            <List size={16} /> Liste / Import
          </button>
          <button 
            onClick={() => setViewMode('settings')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'settings' ? 'bg-[#7A8275] text-white' : 'text-[#7A8275] hover:bg-[#F4F1EA]'}`}
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-[#6B8E63] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[#5a7a53] transition-colors hidden md:block">
            Nouvelle Alerte
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden relative">
        {(viewMode === 'map_pose' || viewMode === 'map_depose' || viewMode === 'map_exploitation') && (
          <div className="flex-1 relative z-0">
            <BinMap 
              bins={bins}
              shapes={shapes}
              binTypes={binTypes}
              mode={viewMode}
              onUpdateStatus={updateBinStatus} 
              onShapesChange={setShapes}
              selectedBinId={selectedBinId}
              placingBinId={placingBinId}
              onPlaceBin={handlePlaceBin}
              onDeleteBin={handleDeleteBin}
            />
          </div>
        )}
        
        {viewMode === 'list' && (
          <ListView 
            bins={bins} 
            binTypes={binTypes}
            onImportBins={handleImportBins}
            onStartPlacing={handleStartPlacing}
            onDeleteBin={handleDeleteBin}
          />
        )}

        {viewMode === 'settings' && (
          <SettingsView
            binTypes={binTypes}
            onUpdateBinTypes={setBinTypes}
          />
        )}
      </main>
    </div>
  );
}
