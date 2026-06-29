import React, { useState } from 'react';
import { TrashBin, BinTypeConfig } from '../types';
import { Trash2, AlertTriangle, CheckCircle, Download, Search, Upload, MapPin, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';

interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  onImportBins: (importedBins: Omit<TrashBin, 'id' | 'lastEmptied'>[], groupStrategy: 'group' | 'individual') => void;
  onStartPlacing: (binId: string) => void;
  onDeleteBin: (id: string) => void;
  onDeleteAllBins?: () => void;
  onAddBin: (bin: Omit<TrashBin, 'id'>) => void;
  onUpdateBinTypes?: (types: BinTypeConfig[]) => void;
  onUpdateBin?: (id: string, updates: Partial<TrashBin>) => void;
}

export default function ListView({ bins, binTypes, onImportBins, onStartPlacing, onDeleteBin, onDeleteAllBins, onAddBin, onUpdateBinTypes, onUpdateBin }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [groupStrategy, setGroupStrategy] = useState<'group' | 'individual'>('group');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newBin, setNewBin] = useState({
    name: '',
    zone: '',
    type: binTypes[0]?.id || '100l_peintes',
    count: 1
  });

  const [importData, setImportData] = useState<any[] | null>(null);
  const [pendingGeoJson, setPendingGeoJson] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [matrixMapping, setMatrixMapping] = useState<Record<string, string>>({
    zone: ''
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
  };  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.geojson') || file.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const geojson = JSON.parse(e.target?.result as string);
            if (geojson.type === 'FeatureCollection' && geojson.features) {
              processGeoJSON(geojson.features);
            } else if (Array.isArray(geojson)) {
               processGeoJSON(geojson);
            } else if (geojson.type === 'Feature') {
               processGeoJSON([geojson]);
            }
          } catch (err) {
            console.error("Error parsing GeoJSON", err);
          }
        };
        reader.readAsText(file);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const jsonData = results.data as any[];
            if (jsonData.length > 0) {
              processImportedData(jsonData, Object.keys(jsonData[0]));
            }
          }
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
          
          if (jsonData.length > 0) {
            processImportedData(jsonData, Object.keys(jsonData[0]));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const processGeoJSON = (features: any[]) => {
    let newBinTypes = [...binTypes];
    let typesChanged = false;
    
    const imported: any[] = [];
    
    const processPoint = (lat: number, lng: number, props: any) => {
      const name = props.name || 'Poubelle Inconnue';
      let typeLabel = props.name || 'Standard';
      let typeId = typeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let count = 1;

      // Spécificités d'import pour "bac 4 roues x2" ou "point déchet"
      if (name.toLowerCase().includes('bac 4 roues x2')) {
        typeLabel = '1100L Point Déchet';
        typeId = '1100l_point_dechet';
        count = 2;
      } else if (name.toLowerCase().includes('point déchet') || name.toLowerCase().includes('point dechet')) {
        typeLabel = '1100L Point Déchet';
        typeId = '1100l_point_dechet';
      }

      // Déduplication (vérifier si un bac existe déjà à ces coordonnées proches)
      const threshold = 0.00002; // Environ 2 mètres
      const isDuplicate = bins.some(b => 
        b.lat !== null && b.lng !== null &&
        Math.abs(b.lat - lat) < threshold && 
        Math.abs(b.lng - lng) < threshold
      ) || imported.some(b => 
        Math.abs(b.lat - lat) < threshold && 
        Math.abs(b.lng - lng) < threshold
      );

      if (isDuplicate) {
        return; // Ignorer ce point car il existe déjà
      }
      
      const umapOptions = props._umap_options || {};
      let typeColor = umapOptions.color || props.color;
      
      if (!typeColor) {
        const existing = newBinTypes.find(t => t.id === typeId);
        if (existing) {
          typeColor = existing.color;
        } else {
          const colors = ['#60A5FA', '#FBBF24', '#34D399', '#FB923C', '#1E3A8A', '#9ca3af', '#c084fc', '#f43f5e'];
          typeColor = colors[newBinTypes.length % colors.length];
        }
      }
      
      if (!newBinTypes.find(t => t.id === typeId)) {
        newBinTypes.push({
          id: typeId,
          label: typeLabel,
          color: typeColor
        });
        typesChanged = true;
      }
      
      imported.push({
        name,
        zone: props.description || 'Non définie',
        status: 'to_install',
        type: typeId,
        count: count,
        lat,
        lng
      });
    };

    features.forEach(feature => {
       const props = feature.properties || {};
       if (feature.geometry && feature.geometry.type === 'Point') {
         const [lng, lat] = feature.geometry.coordinates;
         processPoint(lat, lng, props);
       } else if (feature.geometry && feature.geometry.type === 'LineString') {
         feature.geometry.coordinates.forEach((coord: number[]) => {
            const [lng, lat] = coord;
            processPoint(lat, lng, props);
         });
       }
    });
    
    if (typesChanged && onUpdateBinTypes) {
       onUpdateBinTypes(newBinTypes);
    }
    
    if (imported.length > 0) {
      setPendingGeoJson(imported);
      setActiveTab('import');
    }
  };

  const handleConfirmGeoJsonImport = () => {
    if (!pendingGeoJson) return;
    onImportBins(pendingGeoJson, 'individual');
    setPendingGeoJson(null);
    setActiveTab('list');
  };

  const processImportedData = (jsonData: any[], cols: string[]) => {
    setColumns(cols);
    setImportData(jsonData);

    // Try to auto-guess mapping for Matrix Mode
    const guessedMatrixMapping: Record<string, string> = {
      zone: cols.find(c => c.toLowerCase().includes('emplacement') || c.toLowerCase().includes('zone') || c.toLowerCase().includes('lieu')) || ''
    };
    
    binTypes.forEach(type => {
      const matchedCol = cols.find(c => {
         const cleanCol = c.toLowerCase().trim();
         
         const is1100l = type.id === '1100l';
         const is1100lPoint = type.id === '1100l_point_dechet';
         const is300l = type.id === '300l';
         const is100l = type.id === '100l_sans_roue';
         const is100lPeinte = type.id === '100l_peintes';
         
         if (is1100l && cleanCol === '4 roues') return true;
         if (is1100lPoint && (cleanCol.includes('4 roues poin') || cleanCol.includes('4 roues point'))) return true;
         if (is300l && cleanCol.includes('2 roues 300l')) return true;
         if (is100l && cleanCol === '2 roues') return true;
         if (is100lPeinte && cleanCol.includes('2 roues peintes')) return true;

         // Fallbacks
         const cleanLabel = type.label.toLowerCase();
         return cleanCol.includes(cleanLabel) || 
                (cleanLabel.includes('1100l') && cleanCol.includes('4 roues') && !cleanCol.includes('point') && !type.id.includes('point') && !cleanCol.includes('peinte') && !cleanCol.includes('poin')) ||
                (cleanLabel.includes('point déchet') && (cleanCol.includes('point déchet') || cleanCol.includes('point dechet') || cleanCol.includes('poin'))) ||
                (cleanLabel.includes('300l') && cleanCol.includes('300l')) ||
                ((cleanLabel.includes('100l') || cleanLabel.includes('110l')) && (cleanCol.includes('150l') || cleanCol === '2 roues') && type.id.includes('sans_roue')) ||
                (cleanLabel.includes('peintes') && cleanCol.includes('peintes'));
      });
      if (matchedCol) {
         guessedMatrixMapping[type.id] = matchedCol;
      } else {
         guessedMatrixMapping[type.id] = '';
      }
    });

    setMatrixMapping(guessedMatrixMapping);
  };

  const handleConfirmImport = () => {
    if (!importData) return;

    let imported: any[] = [];

    // Matrix mode
    importData.forEach(row => {
      const rowName = matrixMapping.zone ? String(row[matrixMapping.zone] || '').trim() : '';
      if (!rowName) return;

      binTypes.forEach(type => {
        const colName = matrixMapping[type.id];
        if (colName && row[colName]) {
          const count = parseInt(String(row[colName]), 10);
          if (!isNaN(count) && count > 0) {
            imported.push({
              name: rowName,
              zone: 'Non définie',
              status: 'to_install' as const,
              type: type.id,
              count: count
            });
          }
        }
      });
    });
    
    if (imported.length > 0) {
      onImportBins(imported, groupStrategy);
    }
    setImportData(null);
    setActiveTab('list');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/geo+json': ['.geojson'],
      'application/json': ['.json']
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
                      <div className="text-sm flex items-center gap-4 text-[#7A8275] mb-2">
                        <span className="font-medium">{bin.zone}</span>
                        {!isUnplaced && <span>Collecté le {new Date(bin.lastEmptied).toLocaleTimeString()}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={bin.urgentPlacement || false}
                            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentPlacement: e.target.checked })}
                            className="w-4 h-4 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
                          />
                          <span className={`text-xs font-bold transition-colors ${bin.urgentPlacement ? 'text-[#DC2626]' : 'text-[#7A8275]'}`}>À poser en priorité</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={bin.urgentRemoval || false}
                            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentRemoval: e.target.checked })}
                            className="w-4 h-4 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
                          />
                          <span className={`text-xs font-bold transition-colors ${bin.urgentRemoval ? 'text-[#D4A373]' : 'text-[#7A8275]'}`}>À déposer en priorité</span>
                        </label>
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
          ) : pendingGeoJson ? (
              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] max-w-4xl mx-auto">
                <h3 className="font-bold text-[#3C413A] mb-4 text-base">Aperçu de l'import GeoJSON</h3>
                <p className="text-sm text-[#7A8275] mb-6">Voici les {pendingGeoJson.length} éléments détectés dans le fichier.</p>
                <div className="max-h-96 overflow-y-auto mb-6">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#F4F1EA] sticky top-0">
                      <tr>
                        <th className="px-4 py-2 font-bold text-[#4B6345]">Nom</th>
                        <th className="px-4 py-2 font-bold text-[#4B6345]">Zone/Desc</th>
                        <th className="px-4 py-2 font-bold text-[#4B6345]">Type</th>
                        <th className="px-4 py-2 font-bold text-[#4B6345]">Coordonnées</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D5]">
                      {pendingGeoJson.map((bin, i) => {
                        const typeConfig = binTypes.find(t => t.id === bin.type);
                        return (
                          <tr key={i} className="hover:bg-[#F9F8F6]">
                            <td className="px-4 py-2 font-medium">{bin.name}</td>
                            <td className="px-4 py-2 text-[#7A8275]">{bin.zone}</td>
                            <td className="px-4 py-2">
                              {typeConfig ? (
                                <span className="px-2 py-1 rounded font-bold uppercase text-[10px] border" style={{ borderColor: typeConfig.color, color: typeConfig.color }}>
                                  {typeConfig.label}
                                </span>
                              ) : bin.type}
                            </td>
                            <td className="px-4 py-2 text-[#7A8275] text-[10px] font-mono">
                              {bin.lat.toFixed(5)}, {bin.lng.toFixed(5)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => setPendingGeoJson(null)}
                    className="flex-1 py-3 bg-[#EBE7DF] text-[#7A8275] font-bold rounded-xl hover:bg-[#D9D3C7] transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleConfirmGeoJsonImport}
                    className="flex-1 py-3 bg-[#6B8E63] text-white font-bold rounded-xl hover:bg-[#5a7a53] transition-colors"
                  >
                    Confirmer l'importation ({pendingGeoJson.length})
                  </button>
                </div>
              </div>
          ) : importData ? (
              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] max-w-2xl mx-auto">
               <h3 className="font-bold text-[#3C413A] mb-4 text-base">Correspondance des colonnes</h3>
               
               <p className="text-sm text-[#7A8275] mb-6">Dans ce mode, la colonne des emplacements sert de nom, et les autres colonnes représentent les quantités par type de poubelle.</p>
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <label className="w-1/3 text-sm font-bold text-[#3C413A]">Colonne des Emplacements</label>
                   <select 
                     value={matrixMapping.zone}
                     onChange={e => setMatrixMapping({...matrixMapping, zone: e.target.value})}
                     className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                   >
                     <option value="">-- Sélectionner la colonne --</option>
                     {columns.map(col => <option key={col} value={col}>{col}</option>)}
                   </select>
                 </div>
                 <div className="pt-4 border-t border-[#E5E0D5]">
                   <h4 className="text-xs font-bold text-[#7A8275] mb-4 uppercase tracking-wider">Colonnes des Types de poubelles</h4>
                   {binTypes.map(type => (
                     <div key={type.id} className="flex items-center gap-4 mb-3">
                       <div className="w-1/3 flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                         <label className="text-sm font-bold text-[#3C413A] truncate" title={type.label}>{type.label}</label>
                       </div>
                       <select 
                         value={matrixMapping[type.id] || ''}
                         onChange={e => setMatrixMapping({...matrixMapping, [type.id]: e.target.value})}
                         className="flex-1 px-3 py-2 border border-[#D9D3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E63]"
                       >
                         <option value="">-- Ignorer ce type --</option>
                         {columns.map(col => <option key={col} value={col}>{col}</option>)}
                       </select>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="mt-8 flex gap-4">
                 <button 
                   onClick={() => setImportData(null)}
                   className="flex-1 py-3 bg-[#EBE7DF] text-[#7A8275] font-bold rounded-xl hover:bg-[#D9D3C7] transition-colors"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={handleConfirmImport}
                   disabled={!matrixMapping.zone}
                   className="flex-1 py-3 bg-[#6B8E63] text-white font-bold rounded-xl hover:bg-[#5a7a53] transition-colors disabled:opacity-50"
                 >
                   Confirmer l'importation
                 </button>
               </div>
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
          <div className="p-4 border-t border-[#D9D3C7] bg-white flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button 
              onClick={exportToExcel}
              className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 bg-[#6B8E63] hover:bg-[#5a7a53] text-white py-3 rounded-xl text-base font-bold shadow-sm transition-colors"
            >
              <Download size={20} />
              Exporter (Excel)
            </button>
            {bins.length > 0 && onDeleteAllBins && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 bg-white hover:bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626] py-3 rounded-xl text-base font-bold shadow-sm transition-colors"
              >
                <Trash2 size={20} />
                Tout supprimer
              </button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[#E5E0D5]/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[#D9D3C7]">
            <div className="flex items-center gap-3 text-[#DC2626] mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Suppression totale</h3>
            </div>
            <p className="text-[#3C413A] mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <strong>toutes les poubelles</strong> du plan et de la base de données ? 
              Cette action est <strong className="text-[#DC2626]">définitive et irréversible</strong>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-[#F4F1EA] text-[#3C413A] font-bold rounded-xl hover:bg-[#D9D3C7] transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  onDeleteAllBins?.();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 bg-[#DC2626] text-white font-bold rounded-xl hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Oui, tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
