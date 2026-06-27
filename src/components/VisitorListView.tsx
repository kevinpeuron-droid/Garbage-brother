import React, { useState } from 'react';
import { TrashBin, BinTypeConfig } from '../types';
import { MapPin, CheckSquare, Search } from 'lucide-react';

interface VisitorListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  onUpdateBin: (id: string, updates: Partial<TrashBin>) => void;
}

export default function VisitorListView({ bins, binTypes, onUpdateBin }: VisitorListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBins = bins.filter(bin => {
    const term = searchTerm.toLowerCase();
    const typeLabel = binTypes.find(t => t.id === bin.type)?.label?.toLowerCase() || '';
    return bin.name.toLowerCase().includes(term) || bin.zone.toLowerCase().includes(term) || typeLabel.includes(term);
  });

  return (
    <div className="flex-1 overflow-auto bg-[#F9F8F6] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#E5E0D5]">
          <h2 className="text-xl font-bold text-[#3C413A] font-serif">Liste des poubelles (Visiteurs)</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8275]" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F4F1EA] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#6B8E63]"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F4F1EA]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#4B6345] whitespace-nowrap">Statut / Action</th>
                  <th className="px-6 py-4 font-bold text-[#4B6345]">Nom / Zone</th>
                  <th className="px-6 py-4 font-bold text-[#4B6345]">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]">
                {filteredBins.map(bin => {
                  const typeConfig = binTypes.find(t => t.id === bin.type);
                  return (
                    <tr key={bin.id} className="hover:bg-[#F9F8F6] transition-colors">
                      <td className="px-6 py-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={bin.urgentPlacement || false}
                            onChange={(e) => onUpdateBin(bin.id, { urgentPlacement: e.target.checked })}
                            className="w-5 h-5 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
                          />
                          <span className={`font-bold transition-colors ${bin.urgentPlacement ? 'text-[#DC2626]' : 'text-[#7A8275] group-hover:text-[#4B6345]'}`}>
                            À placer en urgence
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#3C413A]">{bin.name}</div>
                        <div className="text-[#7A8275] text-xs flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {bin.zone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {typeConfig ? (
                          <span className="px-2 py-1 rounded font-bold uppercase text-[10px] border" style={{ borderColor: typeConfig.color, color: typeConfig.color }}>
                            {typeConfig.label}
                          </span>
                        ) : (
                          <span className="text-[#7A8275]">{bin.type}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredBins.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#7A8275]">
                      Aucune poubelle trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
