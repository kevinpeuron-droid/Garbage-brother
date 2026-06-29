import React, { useState } from "react";
import { TrashBin, BinTypeConfig, defaultBinTypes } from "../types";
import { Upload, Plus, Trash2, Edit2, Check, X, FileUp } from "lucide-react";

interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  onImportBins: (bins: Omit<TrashBin, "id" | "lastEmptied">[], groupStrategy: "group" | "individual") => void;
  onStartPlacing: (id: string) => void;
  onDeleteBin: (id: string) => void;
  onDeleteAllBins: () => void;
  onAddBin: (bin: Omit<TrashBin, "id">) => void;
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  onUpdateBin: (id: string, updates: Partial<TrashBin>) => void;
}

export default function ListView({
  bins,
  binTypes,
  onImportBins,
  onStartPlacing,
  onDeleteBin,
  onDeleteAllBins,
  onAddBin,
  onUpdateBinTypes,
  onUpdateBin,
}: ListViewProps) {
  const [csvContent, setCsvContent] = useState("");
  const [importStrategy, setImportStrategy] = useState<"group" | "individual">("individual");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    try {
      const lines = csvContent.split("\n");
      // Basic CSV parsing
      const headers = lines[0].toLowerCase().split(/[;,]/);
      const importedBins: Omit<TrashBin, "id" | "lastEmptied">[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(/[;,]/);
        
        let name = "Nouvelle poubelle";
        let zone = "Général";
        let type = defaultBinTypes[0].id;
        let count = 1;
        let lat = undefined;
        let lng = undefined;

        headers.forEach((header, index) => {
          const val = values[index]?.trim();
          if (!val) return;

          if (header.includes("nom") || header.includes("name")) name = val;
          if (header.includes("zone") || header.includes("secteur")) zone = val;
          if (header.includes("type")) {
             const matchedType = binTypes.find(t => t.label.toLowerCase() === val.toLowerCase());
             if (matchedType) type = matchedType.id;
             else {
               // Fallback matching
               if (val.includes("1100")) type = "1100l";
               else if (val.includes("300")) type = "300l";
             }
          }
          if (header.includes("nombre") || header.includes("quant")) count = parseInt(val, 10) || 1;
          if (header.includes("lat")) lat = parseFloat(val);
          if (header.includes("lon") || header.includes("lng")) lng = parseFloat(val);
        });

        importedBins.push({
          name,
          zone,
          type,
          status: "to_install",
          count,
          lat: !isNaN(lat!) ? lat : undefined,
          lng: !isNaN(lng!) ? lng : undefined,
        });
      }

      onImportBins(importedBins, importStrategy);
      setCsvContent("");
      setIsImporting(false);
    } catch (e) {
      alert("Erreur lors de l'import. Vérifiez le format CSV.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
        setIsImporting(true);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#E5E0D5] p-4 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6 pb-20">
        
        <div className="bg-white rounded-xl shadow-sm border border-[#D9D3C7] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#3C413A] flex items-center gap-2">
              <Upload size={20} className="text-[#6B8E63]" /> Import de données
            </h2>
          </div>
          
          <div className="space-y-4">
            {!isImporting ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#D9D3C7] border-dashed rounded-lg cursor-pointer bg-[#F4F1EA] hover:bg-[#E5E0D5] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-3 text-[#7A8275]" />
                    <p className="mb-2 text-sm text-[#7A8275]"><span className="font-bold">Cliquez pour uploader</span> ou glissez un fichier CSV</p>
                    <p className="text-xs text-[#A08E78]">Nom, Zone, Type, Nombre</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                 <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full h-32 p-3 text-xs font-mono border rounded-lg border-[#D9D3C7]"
                  placeholder="Collez votre CSV ici..."
                 />
                 
                 <div className="flex gap-4 items-center">
                   <select 
                     value={importStrategy}
                     onChange={(e) => setImportStrategy(e.target.value as any)}
                     className="px-3 py-2 border rounded-lg border-[#D9D3C7] text-sm"
                   >
                     <option value="individual">Séparer chaque poubelle (ex: si 3 - crée 3 éléments)</option>
                     <option value="group">Garder groupé (ex: si 3 - crée 1 élément x3)</option>
                   </select>

                   <button
                     onClick={handleImport}
                     className="px-4 py-2 bg-[#6B8E63] text-white rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <Check size={16} /> Importer
                   </button>
                   <button
                     onClick={() => { setCsvContent(""); setIsImporting(false); }}
                     className="px-4 py-2 bg-[#FEE2E2] text-[#DC2626] rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <X size={16} /> Annuler
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#D9D3C7] p-6">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-[#3C413A]">Liste des poubelles ({bins.length})</h2>
             <button
               onClick={() => {
                 if (window.confirm("Tout supprimer ?")) onDeleteAllBins();
               }}
               className="px-3 py-1.5 bg-[#FEE2E2] text-[#DC2626] rounded-lg text-sm font-bold flex items-center gap-1"
             >
               <Trash2 size={16} /> Tout vider
             </button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-[#F4F1EA] text-[#7A8275]">
                 <tr>
                   <th className="px-4 py-2 font-bold rounded-tl-lg">Nom</th>
                   <th className="px-4 py-2 font-bold">Zone</th>
                   <th className="px-4 py-2 font-bold">Type</th>
                   <th className="px-4 py-2 font-bold">Statut</th>
                   <th className="px-4 py-2 font-bold text-center">Qté</th>
                   <th className="px-4 py-2 font-bold text-right rounded-tr-lg">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#E5E0D5]">
                 {bins.map(bin => (
                   <tr key={bin.id} className="hover:bg-[#F9F8F6]">
                     <td className="px-4 py-3 font-medium">{bin.name}</td>
                     <td className="px-4 py-3 text-[#7A8275]">{bin.zone}</td>
                     <td className="px-4 py-3">
                       <span className="px-2 py-1 bg-[#EBE7DF] rounded text-xs">
                         {binTypes.find(t => t.id === bin.type)?.label || bin.type}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${bin.status === 'to_install' ? 'bg-[#A08E78] text-white' : bin.status === 'installed' ? 'bg-[#6B8E63] text-white' : 'bg-[#E5E0D5]'}`}>
                         {bin.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-center font-mono">{bin.count || 1}</td>
                     <td className="px-4 py-3 flex justify-end gap-2">
                       {(!bin.lat || !bin.lng) && (
                         <button
                           onClick={() => onStartPlacing(bin.id)}
                           className="px-2 py-1 bg-[#6B8E63] text-white rounded text-xs font-bold"
                         >
                           Poser
                         </button>
                       )}
                       <button
                         onClick={() => onDeleteBin(bin.id)}
                         className="p-1 text-[#A08E78] hover:text-[#DC2626] transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
                 {bins.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-4 py-8 text-center text-[#A08E78]">
                       Aucune poubelle dans la liste. Utilisez l'import CSV ou ajoutez-en via la carte.
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
