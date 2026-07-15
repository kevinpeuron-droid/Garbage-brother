
import React, { useState, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { TrashBin, BinTypeConfig } from "../types";
import { Upload, Trash2, Check, X, FileUp, Settings2, AlertTriangle, MoreVertical, ArrowRight, Search } from "lucide-react";

interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  onImportBins: (bins: Omit<TrashBin, "id" | "lastEmptied">[], groupStrategy: "group" | "individual") => void;
  onDeleteAllBins: () => void;
  onUpdateBin: (id: string, updates: Partial<TrashBin>) => void;
  onUpdateStatus: (id: string, status: TrashBin["status"]) => void;
  onDeleteLocation: (name: string) => void;
}

type ColumnMapping = {
  locationCol: number | null;
  col1000: number | null;
  col300: number | null;
  col150: number | null;
};

export default function ListView({
  bins,
  binTypes,
  onUpdateBinTypes,
  onImportBins,
  onDeleteAllBins,
  onUpdateBin,
  onUpdateStatus,
  onDeleteLocation,
}: ListViewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBin, setSelectedBin] = useState<TrashBin | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importState, setImportState] = useState<{
    headers: { index: number; name: string; color?: string }[];
    rows: { values: any[]; colors: Record<number, string> }[];
  } | null>(null);

  const [mapping, setMapping] = useState<ColumnMapping>({
    locationCol: null,
    col1000: null,
    col300: null,
    col150: null
  });

  const locationsMap = new Map<string, { [type: string]: TrashBin }>();
  bins.forEach((bin) => {
    if (!locationsMap.has(bin.name)) {
      locationsMap.set(bin.name, {});
    }
    if (bin.type) {
      locationsMap.get(bin.name)![bin.type] = bin;
    }
  });

  const locations = Array.from(locationsMap.entries())
    .map(([name, types]) => ({
      name,
      types
    }))
    .filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeBinTypes = binTypes.filter(t => bins.some(b => b.type === t.id));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const data = await file.arrayBuffer();
      
      const extractedHeaders: { index: number; name: string; color?: string }[] = [];
      const extractedRows: { values: any[]; colors: Record<number, string> }[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        let text;
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(data);
        } catch (e) {
          text = new TextDecoder('windows-1252').decode(data);
        }
        const workbook = XLSX.read(text, { type: "string" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (json.length > 0) {
          const headerRow = json[0];
          for (let i = 0; i < headerRow.length; i++) {
            if (headerRow[i] !== undefined && headerRow[i] !== null) {
              // we 1-index for consistency with exceljs
              extractedHeaders.push({ index: i + 1, name: headerRow[i].toString().trim() });
            }
          }
          for (let r = 1; r < json.length; r++) {
            const rowArr = json[r];
            const rowValues = [];
            for (let c = 0; c < rowArr.length; c++) {
              rowValues[c + 1] = rowArr[c];
            }
            extractedRows.push({ values: rowValues, colors: {} });
          }
        }
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets.find(s => !!s) || (workbook.worksheets.length > 0 ? workbook.worksheets[0] : null) || workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file. Sheets count: " + workbook.worksheets.length);
        }
        const headerRow = worksheet.getRow(1);
        
        if (!headerRow || !headerRow.values) {
           throw new Error("No header row found");
        }
        
        const headers = headerRow.values as any[];
        for (let i = 1; i < headers.length; i++) {
          if (headers[i] !== undefined && headers[i] !== null) {
            const headerCell = headerRow.getCell(i);
            let hexColor = undefined;
            if (headerCell.fill && headerCell.fill.type === 'pattern' && headerCell.fill.fgColor) {
                const argb = headerCell.fill.fgColor.argb;
                if (argb) hexColor = '#' + (argb.length === 8 ? argb.substring(2) : argb);
            }
            extractedHeaders.push({ index: i, name: headers[i].toString().trim(), color: hexColor });
          }
        }

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowValues = row.values as any[];
          const colors: Record<number, string> = {};
          
          row.eachCell((cell, colNumber) => {
            if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
               const argb = cell.fill.fgColor.argb;
               if (argb) colors[colNumber] = '#' + (argb.length === 8 ? argb.substring(2) : argb);
            }
            // Resolve formulas to value
            if (cell.value && typeof cell.value === 'object' && 'result' in cell.value) {
                rowValues[colNumber] = cell.value.result;
            }
          });
          
          extractedRows.push({ values: rowValues, colors });
        });
      }

      setImportState({ headers: extractedHeaders, rows: extractedRows });
      
      const newMapping: ColumnMapping = { locationCol: null, col1000: null, col300: null, col150: null };
      extractedHeaders.forEach(h => {
         const val = h.name.toLowerCase();
         if (!newMapping.locationCol && (val.includes("emplacement") || val.includes("container") || val.includes("lieu") || val.includes("site"))) {
            newMapping.locationCol = h.index;
         }
         if (!newMapping.col1000 && (val.includes("4 roues") || val.includes("1000"))) {
            newMapping.col1000 = h.index;
         }
         if (!newMapping.col300 && val.includes("300")) {
            newMapping.col300 = h.index;
         }
         if (!newMapping.col150 && val.includes("150")) {
            newMapping.col150 = h.index;
         }
      });
      setMapping(newMapping);
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const executeImport = () => {
    if (!importState || !mapping.locationCol) return;
    
    const { headers, rows } = importState;
    const importedBins: (Omit<TrashBin, "id" | "lastEmptied"> & { color?: string })[] = [];
    const newBinTypes = [...binTypes];
    let typesUpdated = false;

    const mappedColumns = [
       { key: '4_roues', colIndex: mapping.col1000, fallbackLabel: '4 roues 1000L' },
       { key: '2_roues_300l', colIndex: mapping.col300, fallbackLabel: '2 roues 300L' },
       { key: '2_roues_150l', colIndex: mapping.col150, fallbackLabel: '2 roues 150L' }
    ];

    mappedColumns.forEach(mappedCol => {
       if (!mappedCol.colIndex) return;
       const headerInfo = headers.find(h => h.index === mappedCol.colIndex);
       const hexColor = headerInfo?.color;
       const headerText = headerInfo ? headerInfo.name : mappedCol.fallbackLabel;
       
       let existingType = newBinTypes.find(t => t.id === mappedCol.key);
       if (!existingType) {
          existingType = {
             id: mappedCol.key,
             label: headerText,
             categoryId: 'cat-default',
             color: hexColor || '#60A5FA'
          };
          newBinTypes.push(existingType);
          typesUpdated = true;
       } else if (hexColor && existingType.color !== hexColor) {
          existingType.color = hexColor;
          typesUpdated = true;
       }
    });

    rows.forEach((row) => {
        const name = row.values[mapping.locationCol!]?.toString();
        if (!name || name.trim() === '') return;
        
        mappedColumns.forEach(mappedCol => {
           if (!mappedCol.colIndex) return;
           const val = row.values[mappedCol.colIndex];
           
           let count = 0;
           if (typeof val === 'number') {
              count = val;
           } else if (typeof val === 'string') {
              count = parseInt(val, 10) || 0;
           }
           
           if (count > 0) {
              const cellHexColor = row.colors[mappedCol.colIndex];

              importedBins.push({
                 name: name.trim(),
                 zone: "Excel",
                 type: mappedCol.key,
                 status: "to_install",
                 count: count,
                 lat: null,
                 lng: null,
                 color: cellHexColor || null
              });
           }
        });
    });

    if (typesUpdated) {
       onUpdateBinTypes(newBinTypes);
    }

    if (importedBins.length > 0) {
       onImportBins(importedBins, "group");
    } else {
       alert("Aucune donnée valide trouvée dans le fichier avec ce mapping.");
    }

    setImportState(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedBin(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_install": return "bg-[#A08E78] text-white";
      case "installed": return "bg-[#6B8E63] text-white";
      case "overflowing": return "bg-[#DC2626] text-white";
      case "missing": return "bg-[#9333EA] text-white";
      case "to_remove": return "bg-[#D4A373] text-white";
      case "removed": return "bg-[#D9D3C7] text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  if (importState) {
    return (
      <div className="flex-1 h-full overflow-y-auto w-full"><div className="w-full max-w-4xl mx-auto py-6 pb-32 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D5] overflow-hidden p-6">
           <h2 className="text-xl font-bold text-[#3C413A] mb-6">Mappage des colonnes du fichier</h2>
           <p className="text-[#7A8275] mb-6">Sélectionnez les colonnes correspondantes pour importer vos poubelles.</p>
           
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
               <label className="font-bold text-[#3C413A]">Colonne Emplacement (Obligatoire)</label>
               <select 
                 className="p-2 border border-[#E5E0D5] rounded-lg bg-[#F9F8F6] w-full"
                 value={mapping.locationCol || ""}
                 onChange={(e) => setMapping({...mapping, locationCol: e.target.value ? parseInt(e.target.value) : null})}
               >
                 <option value="">-- Ignorer --</option>
                 {importState.headers.map(h => <option key={h.index} value={h.index}>{h.name}</option>)}
               </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
               <label className="font-bold text-[#3C413A]">Colonne 4 roues (1000L)</label>
               <select 
                 className="p-2 border border-[#E5E0D5] rounded-lg bg-[#F9F8F6] w-full"
                 value={mapping.col1000 || ""}
                 onChange={(e) => setMapping({...mapping, col1000: e.target.value ? parseInt(e.target.value) : null})}
               >
                 <option value="">-- Ignorer --</option>
                 {importState.headers.map(h => <option key={h.index} value={h.index}>{h.name}</option>)}
               </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
               <label className="font-bold text-[#3C413A]">Colonne 2 roues 300L</label>
               <select 
                 className="p-2 border border-[#E5E0D5] rounded-lg bg-[#F9F8F6] w-full"
                 value={mapping.col300 || ""}
                 onChange={(e) => setMapping({...mapping, col300: e.target.value ? parseInt(e.target.value) : null})}
               >
                 <option value="">-- Ignorer --</option>
                 {importState.headers.map(h => <option key={h.index} value={h.index}>{h.name}</option>)}
               </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
               <label className="font-bold text-[#3C413A]">Colonne 2 roues 150L</label>
               <select 
                 className="p-2 border border-[#E5E0D5] rounded-lg bg-[#F9F8F6] w-full"
                 value={mapping.col150 || ""}
                 onChange={(e) => setMapping({...mapping, col150: e.target.value ? parseInt(e.target.value) : null})}
               >
                 <option value="">-- Ignorer --</option>
                 {importState.headers.map(h => <option key={h.index} value={h.index}>{h.name}</option>)}
               </select>
             </div>
           </div>

           <div className="mt-8 flex justify-end gap-3">
             <button onClick={() => setImportState(null)} className="px-4 py-2 rounded-lg font-bold text-[#7A8275] hover:bg-[#F4F1EA]">
               Annuler
             </button>
             <button 
               onClick={executeImport} 
               disabled={!mapping.locationCol}
               className="px-4 py-2 rounded-lg font-bold bg-[#8B9D83] text-white hover:bg-[#7A8C72] disabled:opacity-50 flex items-center gap-2"
             >
               Importer les données <ArrowRight size={18} />
             </button>
           </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto"><div className="w-full max-w-6xl mx-auto py-6 pb-32 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5E0D5]">
          <h3 className="text-[#7A8275] font-medium mb-3">À poser encore</h3>
          <div className="flex flex-wrap gap-4">
            {activeBinTypes.map(t => {
              const count = bins.filter(b => b.type === t.id && (b.status === "to_install" || b.status === "missing")).length;
              if (count === 0) return null;
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: t.color || '#6B8E63' }} />
                  <span className="text-sm font-bold text-[#3C413A]">{t.label}:</span>
                  <span className="text-lg font-bold text-[#6B8E63]">{count}</span>
                </div>
              );
            })}
            {bins.filter(b => (b.status === "to_install" || b.status === "missing")).length === 0 && (
              <span className="text-sm text-[#A08E78]">Tout est posé !</span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5E0D5]">
          <h3 className="text-[#7A8275] font-medium mb-3">À déposer</h3>
          <div className="flex flex-wrap gap-4">
            {activeBinTypes.map(t => {
              const count = bins.filter(b => b.type === t.id && b.status === "to_remove").length;
              if (count === 0) return null;
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: t.color || '#D4A373' }} />
                  <span className="text-sm font-bold text-[#3C413A]">{t.label}:</span>
                  <span className="text-lg font-bold text-[#D4A373]">{count}</span>
                </div>
              );
            })}
            {bins.filter(b => b.status === "to_remove").length === 0 && (
              <span className="text-sm text-[#A08E78]">Rien à déposer pour l'instant.</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D5] overflow-hidden">
        <div className="p-4 sm:p-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
             <div>
               <h2 className="text-xl font-bold text-[#3C413A]">Vue Liste</h2>
               <p className="text-sm text-[#7A8275] mt-1">{bins.length} éléments au total</p>
             </div>
             
             <div className="relative w-full sm:w-64">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={16} className="text-[#A08E78]" />
               </div>
               <input
                 type="text"
                 placeholder="Rechercher un emplacement..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B8E63] transition-all"
               />
             </div>

             <div className="flex gap-2">
               <input
                 type="file"
                 accept=".xlsx,.xls,.csv"
                 onChange={handleFileUpload}
                 ref={fileInputRef}
                 className="hidden"
               />
               <button
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isImporting}
                 className="px-3 py-1.5 bg-[#F9F8F6] text-[#3C413A] border border-[#E5E0D5] rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-[#EBE7DF] transition-colors disabled:opacity-50"
               >
                 <FileUp size={16} />
                 {isImporting ? 'Lecture...' : 'Importer CSV/Excel'}
               </button>
               <button
                 onClick={() => {
                   if (window.confirm("Voulez-vous vraiment tout supprimer ?")) onDeleteAllBins();
                 }}
                 className="px-3 py-1.5 bg-[#FEE2E2] text-[#DC2626] rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-[#FECACA] transition-colors"
               >
                 <Trash2 size={16} /> Tout vider
               </button>
             </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm border-collapse">
               <thead>
                 <tr>
                   <th className="px-4 py-3 font-bold rounded-tl-lg border-b border-[#D9D3C7]">Emplacements Containers</th>
                   {activeBinTypes.map(t => (
                     <th key={t.id} className="px-4 py-3 font-bold text-center border-b border-[#D9D3C7]">{t.label}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#E5E0D5]">
                 {locations.map(loc => (
                   <tr key={loc.name} className="hover:bg-[#F9F8F6]">
                     <td className="px-4 py-3 font-medium text-[#3C413A]">{loc.name}</td>
                     {activeBinTypes.map(t => {
                       const bin = loc.types[t.id];
                       if (!bin) return <td key={t.id} className="px-4 py-3 text-center text-[#A08E78]">-</td>;
                       
                       return (
                         <td key={t.id} className="px-4 py-3">
                           <div className="flex items-center justify-center gap-3">
                             <input 
                               type="checkbox" 
                               checked={bin.status === "installed"}
                               onChange={(e) => onUpdateStatus(bin.id, e.target.checked ? "installed" : "to_install")}
                               className="w-5 h-5 rounded border-[#D9D3C7] text-[#6B8E63] focus:ring-[#6B8E63] cursor-pointer"
                               title="Marquer comme posée"
                             />
                             <div 
                               onClick={() => setSelectedBin(bin)}
                               className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm hover:brightness-95 ${bin.status === "installed" ? "opacity-50" : ""} ${bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired ? 'ring-2 ring-offset-1 ring-red-400' : ''}`}
                               style={{ 
                                  backgroundColor: bin.color || t.color || (bin.status === "installed" ? "#6B8E63" : "#F4F1EA"),
                                  color: (bin.color || t.color) ? '#FFFFFF' : (bin.status === "installed" ? "#FFFFFF" : "#3C413A"),
                                  textShadow: (bin.color || t.color) ? '0px 1px 2px rgba(0,0,0,0.5)' : 'none'
                               }}
                             >
                               {bin.count}
                               {(bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired) && (
                                 <div className="flex gap-0.5 mt-0.5">
                                   {bin.urgentPlacement && <span title="À poser urgence" className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>}
                                   {bin.urgentRemoval && <span title="À déposer urgence" className="w-1.5 h-1.5 rounded-full bg-[#D4A373]"></span>}
                                   {bin.maintenanceRequired && <span title="Maintenance" className="w-1.5 h-1.5 rounded-full bg-[#9333EA]"></span>}
                                 </div>
                               )}
                             </div>
                           </div>
                         </td>
                       );
                     })}
                   </tr>
                 ))}
                 {locations.length === 0 && (
                   <tr>
                     <td colSpan={activeBinTypes.length + 1} className="px-4 py-8 text-center text-[#A08E78]">
                       Aucun emplacement. Importez un fichier CSV ou Excel pour commencer.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
           
           {selectedBin && (
             <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
               <div ref={popupRef} className="bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-start mb-4 border-b border-[#E5E0D5] pb-3">
                   <div>
                     <h3 className="font-bold text-lg text-[#3C413A]">{selectedBin.name}</h3>
                     <p className="text-sm font-medium text-[#7A8275]">{binTypes.find(t => t.id === selectedBin.type)?.label} (x{selectedBin.count})</p>
                   </div>
                   <button onClick={() => setSelectedBin(null)} className="p-1 text-[#7A8275] hover:bg-[#F4F1EA] rounded-lg transition-colors">
                     <X size={20} />
                   </button>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-2">
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "to_install")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors ${selectedBin.status === "to_install" ? "bg-[#A08E78] text-white" : "bg-[#F4F1EA] text-[#7A8275] hover:bg-[#EBE7DF]"}`}
                     >
                       À poser
                     </button>
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "installed")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors ${selectedBin.status === "installed" ? "bg-[#6B8E63] text-white" : "bg-[#F4F1EA] text-[#7A8275] hover:bg-[#EBE7DF]"}`}
                     >
                       Posée
                     </button>
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "to_remove")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors ${selectedBin.status === "to_remove" ? "bg-[#D4A373] text-white" : "bg-[#F4F1EA] text-[#7A8275] hover:bg-[#EBE7DF]"}`}
                     >
                       À retirer
                     </button>
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "removed")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors ${selectedBin.status === "removed" ? "bg-[#D9D3C7] text-white" : "bg-[#F4F1EA] text-[#7A8275] hover:bg-[#EBE7DF]"}`}
                     >
                       Retirée
                     </button>
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "missing")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors ${selectedBin.status === "missing" ? "bg-[#9333EA] text-white" : "bg-[#F4F1EA] text-[#7A8275] hover:bg-[#EBE7DF]"}`}
                     >
                       Manquante
                     </button>
                     <button
                       onClick={() => onUpdateStatus(selectedBin.id, "overflowing")}
                       className={`p-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${selectedBin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}`}
                     >
                       <AlertTriangle size={16} /> Archi pleine
                     </button>
                   </div>
                   
                   <div className="space-y-2 pt-4 border-t border-[#E5E0D5]">
                     <label className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] hover:bg-[#E5E0D5] transition-colors cursor-pointer">
                       <span className={`text-sm font-bold ${selectedBin.urgentPlacement ? "text-[#DC2626]" : "text-[#7A8275]"}`}>
                         À poser urgence
                       </span>
                       <input
                         type="checkbox"
                         checked={selectedBin.urgentPlacement || false}
                         onChange={(e) => onUpdateBin(selectedBin.id, { urgentPlacement: e.target.checked })}
                         className="w-5 h-5 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
                       />
                     </label>
                     <label className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] hover:bg-[#E5E0D5] transition-colors cursor-pointer">
                       <span className={`text-sm font-bold ${selectedBin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}`}>
                         À déposer urgence
                       </span>
                       <input
                         type="checkbox"
                         checked={selectedBin.urgentRemoval || false}
                         onChange={(e) => onUpdateBin(selectedBin.id, { urgentRemoval: e.target.checked })}
                         className="w-5 h-5 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
                       />
                     </label>
                     <label className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] hover:bg-[#E5E0D5] transition-colors cursor-pointer">
                       <span className={`text-sm font-bold ${selectedBin.maintenanceRequired ? "text-[#9333EA]" : "text-[#7A8275]"}`}>
                         Maintenance
                       </span>
                       <input
                         type="checkbox"
                         checked={selectedBin.maintenanceRequired || false}
                         onChange={(e) => onUpdateBin(selectedBin.id, { maintenanceRequired: e.target.checked })}
                         className="w-5 h-5 rounded border-[#D9D3C7] text-[#9333EA] focus:ring-[#9333EA]"
                       />
                     </label>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
      </div>
    </div>
  );
}
