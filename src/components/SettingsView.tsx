import React from 'react';
import { BinTypeConfig } from '../types';

interface SettingsViewProps {
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
}

export default function SettingsView({ binTypes, onUpdateBinTypes }: SettingsViewProps) {
  const handleColorChange = (id: string, newColor: string) => {
    onUpdateBinTypes(binTypes.map(t => t.id === id ? { ...t, color: newColor } : t));
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    onUpdateBinTypes(binTypes.map(t => t.id === id ? { ...t, label: newLabel } : t));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F1EA] p-6">
      <div className="bg-white max-w-2xl mx-auto w-full rounded-2xl shadow-sm border border-[#D9D3C7] overflow-hidden">
        <div className="p-6 border-b border-[#D9D3C7] bg-[#F4F1EA]">
          <h2 className="text-xl font-bold text-[#3C413A]">Paramètres</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-bold text-[#3C413A] mb-4">Types de Poubelles</h3>
            <p className="text-sm text-[#7A8275] mb-6">Personnalisez les noms et les couleurs des différents types de poubelles (utilisés pour le marquage sur la carte).</p>
            
            <div className="space-y-4">
              {binTypes.map(type => (
                <div key={type.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#D9D3C7] bg-[#F4F1EA]">
                  <input 
                    type="color" 
                    value={type.color} 
                    onChange={(e) => handleColorChange(type.id, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={type.label}
                      onChange={(e) => handleLabelChange(type.id, e.target.value)}
                      className="w-full px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                    />
                  </div>
                  <div className="text-xs font-mono text-[#7A8275] bg-[#EBE7DF] px-2 py-1 rounded">
                    ID: {type.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
