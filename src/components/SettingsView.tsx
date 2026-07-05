import React, { useState } from "react";
import { BinTypeConfig, BinCategoryConfig } from "../types";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Settings, Plus, Trash2 } from "lucide-react";

interface SettingsViewProps {
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  binCategories: BinCategoryConfig[];
  onUpdateBinCategories: (categories: BinCategoryConfig[]) => void;
  umapOffsetPC: { x: number; y: number };
  onUpdateUmapOffsetPC: (offset: { x: number; y: number }) => void;
  umapOffsetMobile: { x: number; y: number };
  onUpdateUmapOffsetMobile: (offset: { x: number; y: number }) => void;
}

export default function SettingsView({
  binTypes,
  onUpdateBinTypes,
  binCategories,
  onUpdateBinCategories,
  umapOffsetPC,
  onUpdateUmapOffsetPC,
  umapOffsetMobile,
  onUpdateUmapOffsetMobile,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"pc" | "mobile">("pc");
  const umapOffset = activeTab === "pc" ? umapOffsetPC : umapOffsetMobile;
  const onUpdateUmapOffset = activeTab === "pc" ? onUpdateUmapOffsetPC : onUpdateUmapOffsetMobile;

  const [newLabel, setNewLabel] = useState("");
  const [newTypeCategory, setNewTypeCategory] = useState(binCategories[0]?.id || "");
  
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6B7280");

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    
    onUpdateBinTypes([
      ...binTypes,
      {
        id: `type-${Date.now()}`,
        label: newLabel.trim(),
        categoryId: newTypeCategory,
        color: "#916738"
      }
    ]);
    setNewLabel("");
  };

  const handleDeleteType = (id: string) => {
    onUpdateBinTypes(binTypes.filter(t => t.id !== id));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    onUpdateBinCategories([
      ...binCategories,
      {
        id: `cat-${Date.now()}`,
        label: newCategoryLabel.trim(),
        color: newCategoryColor
      }
    ]);
    setNewCategoryLabel("");
  };

  const handleDeleteCategory = (id: string) => {
    onUpdateBinCategories(binCategories.filter(c => c.id !== id));
    // Optional: reset categoryId of types that used this category
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
          
          <div className="flex gap-2 mb-4 bg-[#F4F1EA] p-1 rounded-lg border border-[#D9D3C7]">
            <button
              onClick={() => setActiveTab("pc")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === "pc" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}`}
            >
              Ordi
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === "mobile" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}`}
            >
              Smartphone
            </button>
          </div>

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
            Catégories de poubelles
          </h2>
          
          <ul className="space-y-2 mb-4">
            {binCategories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between p-2 bg-[#F4F1EA] rounded border border-[#D9D3C7]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: cat.color }} />
                  <span className="font-bold text-sm text-[#3C413A]">{cat.label}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-[#A08E78] hover:text-[#DC2626] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              placeholder="Catégorie (ex: OMR)"
              className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg text-sm"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-10 h-10 p-1 border border-[#D9D3C7] rounded-lg cursor-pointer bg-white"
            />
            <button
              type="submit"
              disabled={!newCategoryLabel.trim()}
              className="px-3 py-2 bg-[#6B8E63] text-white rounded-lg disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D9D3C7]">
          <h2 className="text-lg font-bold text-[#3C413A] mb-4">
            Types de contenants
          </h2>
          
          <ul className="space-y-2 mb-4">
            {binTypes.map(type => (
              <li key={type.id} className="flex items-center justify-between p-2 bg-[#F4F1EA] rounded border border-[#D9D3C7]">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#3C413A]">{type.label}</span>
                  <span className="text-xs text-[#7A8275]">
                    Cat: {binCategories.find(c => c.id === type.categoryId)?.label || "-"}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteType(type.id)}
                  className="p-1 text-[#A08E78] hover:text-[#DC2626] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddType} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nouveau type (ex: 600L)"
                className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newTypeCategory}
                onChange={(e) => setNewTypeCategory(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg text-sm bg-white"
              >
                <option value="" disabled>Choisir une catégorie</option>
                {binCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!newLabel.trim() || !newTypeCategory}
                className="px-3 py-2 bg-[#6B8E63] text-white rounded-lg disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
