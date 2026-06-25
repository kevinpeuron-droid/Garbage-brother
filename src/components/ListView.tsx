import React, { useState } from 'react';
import { TrashBin, BinTypeConfig } from '../types';
import { Trash2, AlertTriangle, CheckCircle, Download, Search, Upload, MapPin, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  onImportBins: (importedBins: Omit<TrashBin, 'id' | 'lat' | 'lng' | 'lastEmptied'>[], groupStrategy: 'group' | 'individual') => void;
  onStartPlacing: (binId: string) => void;
  onDeleteBin: (id: string) => void;
  onAddBin: (bin: Omit<TrashBin, 'id'>) => void;
}

export default function ListView({ bins, binTypes, onImportBins, onStartPlacing, onDeleteBin, onAddBin }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [groupStrategy, setGroupStrategy] = useState<'group' | 'individual'>('group');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBin, setNewBin] = useState({
    name: '',
    zone: '',
    type: binTypes[0]?.id || '100l_peintes',
    count: 1
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBin.name) return;
    onAddBin({
      name: newBin.name,
      zone: newBin.zone || 'Non définie',
      status: 'to_install',
      type: newBin.type as any,
      count: newBin.count,
      lat: null,
      lng: null,
      lastEmptied: new Date().toISOString()
    });
    setNewBin({
      name: '',
      zone: '',
      type: binTypes[0]?.id || '100l_peintes',
      count: 1
    });
    setShowAddForm(false);
  };

  const filteredBins = bins.filter(bin => 
    bin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bin.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredBins.map(b => ({
      ID: b.id,
      Nom: b.name,
      Zone: b.zone,
      Type: binTypes.find(t => t.id === b.type)?.label || 'Inconnu',
      Statut: b.status,
      Latitude: b.lat,
      Longitude: b.lng,
      Quantite: b.count || 1,
      'Dernière collecte': new Date(b.lastEmptied).toLocaleString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Poubelles");
    XLSX.writeFile(wb, `poubelles_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
        
        const imported = jsonData.map(row => {
          // Try to match type by name or fallback to first
          const rawType = String(row.Type || '').toLowerCase();
          let matchedType = binTypes[0].id;
          if (rawType.includes('100') && rawType.includes('peint')) matchedType = '100l_peintes';
          else if (rawType.includes('100') && rawType.includes('roue')) matchedType = '100l_sans_roue';
          else if (rawType.includes('300')) matchedType = '300l';
          else if (rawType.includes('1100') && rawType.includes('point')) matchedType = '1100l_point_dechet';
          else if (rawType.includes('1100')) matchedType = '1100l';

          return {
            name: row.Nom || row.Name || 'Poubelle Inconnue',
            zone: row.Zone || 'Non définie',
            status: 'to_install' as const,
            type: matchedType,
            count: parseInt(row.Quantite || row.Count || 1, 10),
          };
        });
        
        onImportBins(imported, groupStrategy);
        setActiveTab('list');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 
      'application/vnd.ms-excel': ['.xls'] 
    } 
  } as any);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'to_install': return <MapPin className="text-[#A08E78]" size={18} />;
      case 'installed': return <CheckCircle className="text-[#6B8E63]" size={18} />;
      case 'overflowing': return <AlertTriangle className="text-[#916738]" size={18} />;
      case 'to_remove': return <Archive className="text-[#D4A373]" size={18} />;
      case 'removed': return <Trash2 className="text-[#D9D3C7]" size={18} />;
      case 'missing': return <AlertTriangle className="text-[#9333EA]" size={18} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'to_install': return 'À poser';
      case 'installed': return 'Posée / OK';
      case 'overflowing': return 'Archi pleine';
      case 'to_remove': return 'À retirer';
      case 'removed': return 'Retirée';
      case 'missing': return 'Manquante';
      default: return status;
    }
  };

  const stats = {
    total: bins.length,
    toInstall: bins.filter(b => b.status === 'to_install').length,
    toRemove: bins.filter(b => b.status === 'to_remove').length,
    overflowing: bins.filter(b => b.status === 'overflowing').length,
    unplaced: bins.filter(b => b.lat === null || b.lng === null).length
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F1EA] p-6">
      <div className="bg-white max-w-5xl mx-auto w-full h-full rounded-2xl shadow-sm border border-[#D9D3C7] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-[#D9D3C7] bg-[#F4F1EA]">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex-1 pb-2 font-bold text-sm ${activeTab === 'list' ? 'border-b-2 border-[#6B8E63] text-[#3C413A]' : 'text-[#7A8275] hover:text-[#3C413A] border-b-2 border-transparent'}`}
            >
              Liste des Poubelles
            </button>
            <button 
              onClick={() => setActiveTab('import')}
              className={`flex-1 pb-2 font-bold text-sm ${activeTab === 'import' ? 'border-b-2 border-[#6B8E63] text-[#3C413A]' : 'text-[#7A8275] hover:text-[#3C413A] border-b-2 border-transparent'}`}
            >
              Importer (Excel)
            </button>
          </div>

          {activeTab === 'list' && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E0D5] text-center">
                  <div className="text-2xl font-bold text-[#3C413A]">{stats.total}</div>
                  <div className="text-xs text-[#7A8275] font-bold uppercase tracking-wider mt-1">Total</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E0D5] text-center">
                  <div className="text-2xl font-bold text-[#A08E78]">{stats.toInstall}</div>
                  <div className="text-xs text-[#A08E78] font-bold uppercase tracking-wider mt-1">À Poser</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E0D5] text-center">
                  <div className="text-2xl font-bold text-[#D4A373]">{stats.toRemove}</div>
                  <div className="text-xs text-[#D4A373] font-bold uppercase tracking-wider mt-1">À Retirer</div>
                </div>
                <div className="bg-[#FFF8F0] p-4 rounded-xl shadow-sm border border-[#FEEAD1] text-center">
                  <div className="text-2xl font-bold text-[#916738]">{stats.overflowing}</div>
                  <div className="text-xs text-[#A08E78] font-bold uppercase tracking-wider mt-1">Urgences</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3 text-[#7A8275]" size={20} />
                  <input 
                    type="text" 
                    placeholder="Rechercher une poubelle..." 
                    className="w-full pl-12 pr-4 py-3 border border-[#D9D3C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E63] bg-white text-[#3C413A] placeholder-[#7A8275]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-6 py-3 bg-[#6B8E63] text-white font-bold rounded-xl hover:bg-[#5a7a53] transition-colors"
                >
                  {showAddForm ? 'Fermer' : 'Ajouter manuellement'}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleManualAdd} className="mt-4 p-4 bg-white rounded-xl border border-[#D9D3C7] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8275] mb-1">Nom</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                      value={newBin.name}
                      onChange={(e) => setNewBin({...newBin, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8275] mb-1">Zone</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                      value={newBin.zone}
                      onChange={(e) => setNewBin({...newBin, zone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8275] mb-1">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                      value={newBin.type}
                      onChange={(e) => setNewBin({...newBin, type: e.target.value as any})}
                    >
                      {binTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 bg-[#4B6345] text-white font-bold rounded-lg hover:bg-[#3C413A] transition-colors">
                    Enregistrer
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#F4F1EA]">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {filteredBins.map(bin => {
                const isUnplaced = bin.lat === null || bin.lng === null;
                const typeConfig = binTypes.find(t => t.id === bin.type);
                
                return (
                  <div 
                    key={bin.id} 
                    className={`p-4 bg-white rounded-xl border shadow-sm transition-colors flex items-center justify-between ${
                      isUnplaced ? 'border-[#D4A373] border-dashed' : 'border-[#E5E0D5] hover:border-[#D4A373]'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-[#4B6345]">{bin.name} {bin.count && bin.count > 1 ? `(x${bin.count})` : ''}</h3>
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                          bin.status === 'to_install' ? 'bg-[#EBE7DF] text-[#DC2626]' :
                          bin.status === 'installed' ? 'bg-[#6B8E63]/20 text-[#4B6345]' :
                          bin.status === 'to_remove' ? 'bg-[#D4A373]/20 text-[#916738]' :
                          bin.status === 'removed' ? 'bg-[#D9D3C7]/50 text-[#A08E78]' :
                          bin.status === 'missing' ? 'bg-[#9333EA] text-white' :
                          bin.status === 'overflowing' ? 'bg-[#DC2626] text-white' :
                          'bg-[#916738] text-white'
                        }`}>
                          {getStatusLabel(bin.status)}
                        </span>
                        {typeConfig && (
                          <span className="text-[10px] px-2 py-1 rounded font-bold uppercase border" style={{ borderColor: typeConfig.color, color: typeConfig.color }}>
                            {typeConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="text-sm flex items-center gap-4 text-[#7A8275]">
                        <span className="font-medium">{bin.zone}</span>
                        {!isUnplaced && <span>Collecté le {new Date(bin.lastEmptied).toLocaleTimeString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isUnplaced && (
                        <button 
                          onClick={() => onStartPlacing(bin.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7] rounded-lg text-sm font-bold transition-colors"
                        >
                          <MapPin size={16} />
                          Placer sur la carte
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteBin(bin.id)}
                        className="p-2 text-[#7A8275] hover:text-[#916738] hover:bg-[#FFF8F0] rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredBins.length === 0 && (
                <div className="text-center text-[#7A8275] p-8 font-medium bg-white rounded-xl border border-[#E5E0D5] border-dashed">
                  Aucune poubelle trouvée.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5]">
                <h3 className="font-bold text-[#3C413A] mb-4 text-base">Méthode d'importation</h3>
                <p className="text-sm text-[#7A8275] mb-4">Si une ligne du fichier excel indique plusieurs poubelles (ex: "Quantité: 10") :</p>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-[#D9D3C7] bg-[#F4F1EA] cursor-pointer hover:border-[#6B8E63] transition-colors">
                    <input 
                      type="radio" 
                      name="groupStrategy" 
                      value="group"
                      checked={groupStrategy === 'group'}
                      onChange={() => setGroupStrategy('group')}
                      className="mt-1 accent-[#6B8E63] w-4 h-4"
                    />
                    <div>
                      <span className="block text-base font-bold text-[#3C413A]">Grouper en un point</span>
                      <span className="block text-sm text-[#7A8275] mt-1">Crée 1 seul point sur la carte avec le nombre total. Pratique pour les "ilôts" de poubelles.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-[#D9D3C7] bg-[#F4F1EA] cursor-pointer hover:border-[#6B8E63] transition-colors">
                    <input 
                      type="radio" 
                      name="groupStrategy" 
                      value="individual"
                      checked={groupStrategy === 'individual'}
                      onChange={() => setGroupStrategy('individual')}
                      className="mt-1 accent-[#6B8E63] w-4 h-4"
                    />
                    <div>
                      <span className="block text-base font-bold text-[#3C413A]">Placer individuellement</span>
                      <span className="block text-sm text-[#7A8275] mt-1">Génère 10 poubelles distinctes à placer une par une sur la carte.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5]">
                <h3 className="font-bold text-[#3C413A] mb-4 text-base">Fichier Excel</h3>
                <div 
                  {...getRootProps()} 
                  className={`p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center ${
                    isDragActive ? 'border-[#6B8E63] bg-[#6B8E63]/10' : 'border-[#D9D3C7] hover:border-[#6B8E63] bg-[#F4F1EA] hover:bg-[#EBE7DF]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="text-[#8AA382] mb-4" size={40} />
                  <p className="text-base font-bold text-[#4A5046] mb-2">
                    {isDragActive ? 'Relâchez le fichier ici...' : 'Glissez-déposez votre fichier .xlsx'}
                  </p>
                  <p className="text-sm text-[#7A8275]">
                    Ou cliquez pour parcourir
                  </p>
                </div>
                <div className="mt-6 p-4 bg-[#FFF8F0] border border-[#FEEAD1] rounded-xl text-sm text-[#916738]">
                  <strong>Format attendu :</strong> Un tableau avec les colonnes "Nom", "Zone", "Type" (optionnel) et "Quantité" (optionnelle).
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'list' && (
          <div className="p-4 border-t border-[#D9D3C7] bg-white">
            <button 
              onClick={exportToExcel}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-[#6B8E63] hover:bg-[#5a7a53] text-white py-3 rounded-xl text-base font-bold shadow-sm transition-colors"
            >
              <Download size={20} />
              Exporter la liste (Excel)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
