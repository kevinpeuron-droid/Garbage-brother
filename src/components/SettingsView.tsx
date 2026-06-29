import React, { useState } from "react";
import { BinTypeConfig } from "../types";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Settings, Plus, Trash2 } from "lucide-react";

interface SettingsViewProps {
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  umapOffset: { x: number; y: number };
  onUpdateUmapOffset: (offset: { x: number; y: number }) => void;
}

export default function SettingsView({
  binTypes,
  onUpdateBinTypes,
  umapOffset,
  onUpdateUmapOffset,
}: SettingsViewProps) {
  const [newLabel, setNewLabel] = useState("");

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    
    onUpdateBinTypes([
      ...binTypes,
      {
        id: `type-${Date.now()}`,
        label: newLabel.trim(),
        color: "#916738"
      }
    ]);
    setNewLabel("");
  };

  const handleDeleteType = (id: string) => {
    onUpdateBinTypes(binTypes.filter(t => t.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#E5E0D5] p-4">
      <div className="max-w-md mx-auto space-y-6 pb-20">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D9D3C7]">
          <h2 className="text-lg font-bold text-[#3C413A] mb-4 flex items-center gap-2">
            <Settings size={20} className="text-[#6B8E63]" />
            Calibrage du plan (Umap)
          </h2>
          <p className="text-sm text-[#7A8275] mb-4">
            Ajustez le décalage du fond de carte pour l'aligner avec les points GPS de vos poubelles.
          </p>
          
          <div className="flex flex-col items-center gap-2 bg-[#F4F1EA] p-4 rounded-lg border border-[#D9D3C7]">
            <button
              onClick={() => onUpdateUmapOffset({ ...umapOffset, y: umapOffset.y - 10 })}
              className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
            >
              <ArrowUp size={24} className="text-[#3C413A]" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateUmapOffset({ ...umapOffset, x: umapOffset.x - 10 })}
                className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
              >
                <ArrowLeft size={24} className="text-[#3C413A]" />
              </button>
              <div className="w-12 flex flex-col items-center justify-center font-mono text-xs text-[#7A8275]">
                <div>X: {umapOffset.x}</div>
                <div>Y: {umapOffset.y}</div>
              </div>
              <button
                onClick={() => onUpdateUmapOffset({ ...umapOffset, x: umapOffset.x + 10 })}
                className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
              >
                <ArrowRight size={24} className="text-[#3C413A]" />
              </button>
            </div>
            <button
              onClick={() => onUpdateUmapOffset({ ...umapOffset, y: umapOffset.y + 10 })}
              className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
            >
              <ArrowDown size={24} className="text-[#3C413A]" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D9D3C7]">
          <h2 className="text-lg font-bold text-[#3C413A] mb-4">
            Types de contenants
          </h2>
          
          <ul className="space-y-2 mb-4">
            {binTypes.map(type => (
              <li key={type.id} className="flex items-center justify-between p-2 bg-[#F4F1EA] rounded border border-[#D9D3C7]">
                <span className="font-bold text-sm text-[#3C413A]">{type.label}</span>
                <button
                  onClick={() => handleDeleteType(type.id)}
                  className="p-1 text-[#A08E78] hover:text-[#DC2626] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nouveau type (ex: 600L)"
              className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={!newLabel.trim()}
              className="px-3 py-2 bg-[#6B8E63] text-white rounded-lg disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
