import React, { useState } from "react";
import { TrashBin, BinTypeConfig, defaultBinTypes, BinCategoryConfig } from "../types";
import { Upload, Plus, Trash2, Edit2, Check, X, FileUp } from "lucide-react";

interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  binCategories: BinCategoryConfig[];
  onImportBins: (bins: (Omit<TrashBin, "id" | "lastEmptied"> & { id?: string })[], groupStrategy: "group" | "individual") => void;
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
  binCategories,
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
  const [pendingImportData, setPendingImportData] = useState<{
    bins: any[];
    unmapped: { key: string; typeStr: string; colorStr: string; count: number }[];
  } | null>(null);
  const [typeMappings, setTypeMappings] = useState<Record<string, { typeId: string, label: string, color: string }>>({});

  const handleProcessFile = () => {
    try {
      let importedBins: any[] = [];
      let isGeoJson = false;

      try {
        const json = JSON.parse(csvContent);
        if (json.type === "FeatureCollection" && json.features) {
          isGeoJson = true;
          json.features.forEach((feature: any) => {
            let lng: number | undefined;
            let lat: number | undefined;

            if (feature.geometry?.type === "Point") {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry?.type === "Polygon") {
              if (feature.geometry.coordinates[0]?.[0]) {
                [lng, lat] = feature.geometry.coordinates[0][0];
              }
            } else if (feature.geometry?.type === "LineString") {
              if (feature.geometry.coordinates[0]) {
                [lng, lat] = feature.geometry.coordinates[0];
              }
            }

            if (lng !== undefined && lat !== undefined) {
              const props = feature.properties || {};
              
              const rawName = (props.name || props.nom || props.Name || props.Nom || "").toString();
              const description = (props.description || "").toString();
              const nameWithDesc = rawName + (description ? ` - ${description}` : "");
              
              const typeStr = (props.type || props.Type || props.TYPE || rawName || "").toString();
              
              let umapOptions = props._umap_options || {};
              if (typeof umapOptions === 'string') {
                try {
                  umapOptions = JSON.parse(umapOptions);
                } catch(e) {}
              }
              const colorStr = (umapOptions.fillColor || umapOptions.color || props.fillColor || props.color || props.Color || props.couleur || props.Couleur || "").toString();
              
              const providedId = props.id || feature.id;

              importedBins.push({
                ...(providedId ? { id: providedId.toString() } : {}),
                name: nameWithDesc || typeStr || "Nouvelle poubelle",
                zone: props.zone || props.secteur || props.Zone || props.Secteur || "Général",
                originalTypeStr: typeStr,
                originalColorStr: colorStr,
                status: "to_install",
                count: parseInt(props.nombre || props.quantite || props.count || props.Nombre || props.Quantite || "1", 10) || 1,
                lat,
                lng,
              });
            }
          });
        }
      } catch (e) {
        // Fallback to CSV parsing
      }

      if (!isGeoJson) {
        const lines = csvContent.split("\n");
        const headers = lines[0].toLowerCase().split(/[;,]/);
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(/[;,]/);
          
          let name = "Nouvelle poubelle";
          let zone = "Général";
          let typeStr = "";
          let colorStr = "";
          let count = 1;
          let lat = undefined;
          let lng = undefined;

          headers.forEach((header, index) => {
            const val = values[index]?.trim();
            if (!val) return;

            if (header.includes("nom") || header.includes("name")) name = val;
            else if (header.includes("zone") || header.includes("secteur")) zone = val;
            else if (header.includes("type")) typeStr = val;
            else if (header.includes("color") || header.includes("couleur")) colorStr = val;
            else if (header.includes("nombre") || header.includes("quant")) count = parseInt(val, 10) || 1;
            else if (header.includes("lat")) lat = parseFloat(val);
            else if (header.includes("lon") || header.includes("lng")) lng = parseFloat(val);
          });

          if (!typeStr) typeStr = name;

          importedBins.push({
            name,
            zone,
            originalTypeStr: typeStr,
            originalColorStr: colorStr,
            status: "to_install",
            count,
            lat: !isNaN(lat!) ? lat : undefined,
            lng: !isNaN(lng!) ? lng : undefined,
          });
        }
      }

      if (importedBins.length > 0) {
        // Analyze unmapped types/colors
        const unmappedMap = new Map<string, { typeStr: string; colorStr: string; count: number }>();
        importedBins.forEach(bin => {
          const key = `${bin.originalTypeStr}|${bin.originalColorStr}`;
          if (!unmappedMap.has(key)) {
            unmappedMap.set(key, { typeStr: bin.originalTypeStr, colorStr: bin.originalColorStr, count: 0 });
          }
          unmappedMap.get(key)!.count++;
        });

        const initialMappings: Record<string, { typeId: string, label: string, color: string }> = {};
        
        Array.from(unmappedMap.entries()).forEach(([key, data]) => {
          const matchedType = binTypes.find(t => 
            t.label.toLowerCase() === data.typeStr.toLowerCase() || 
            (data.colorStr && t.color.toLowerCase() === data.colorStr.toLowerCase())
          );

          if (matchedType) {
            initialMappings[key] = {
              typeId: matchedType.id,
              label: matchedType.label,
              color: data.colorStr || matchedType.color
            };
          } else {
             // Fallback default
             let tId = "new";
             let tLabel = data.typeStr || "Nouveau Type";
             let tColor = data.colorStr || "#916738";
             
             if (!data.typeStr && data.colorStr) {
               tLabel = `Type Couleur ${data.colorStr}`;
             }
             
             initialMappings[key] = { typeId: tId, label: tLabel, color: tColor };
          }
        });

        setTypeMappings(initialMappings);
        setPendingImportData({
          bins: importedBins,
          unmapped: Array.from(unmappedMap.entries()).map(([k, v]) => ({ key: k, ...v }))
        });
      } else {
        alert("Aucune donnée valide trouvée dans le fichier.");
      }
    } catch (e) {
      alert("Erreur lors de l'import. Vérifiez le format (CSV ou GeoJSON).");
    }
  };

  const handleFinalizeImport = () => {
    if (!pendingImportData) return;
    
    let currentBinTypes = [...binTypes];
    let newTypesAdded = false;

    const mappedBins = pendingImportData.bins.map(bin => {
      const key = `${bin.originalTypeStr}|${bin.originalColorStr}`;
      const mapping = typeMappings[key];
      
      let finalTypeId = defaultBinTypes[0].id;
      
      if (mapping) {
        if (mapping.typeId === "new") {
           const newId = `type_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
           currentBinTypes.push({
             id: newId,
             label: mapping.label,
             color: mapping.color
           });
           newTypesAdded = true;
           mapping.typeId = newId; // Update for subsequent identical bins
           finalTypeId = newId;
        } else {
           finalTypeId = mapping.typeId;
           // Optionally update color of existing type if changed?
           const existing = currentBinTypes.find(t => t.id === finalTypeId);
           if (existing && mapping.color && existing.color !== mapping.color) {
              existing.color = mapping.color;
              newTypesAdded = true;
           }
        }
      }

      const { originalTypeStr, originalColorStr, ...rest } = bin;
      return {
        ...rest,
        type: finalTypeId
      };
    });

    if (newTypesAdded) {
      onUpdateBinTypes(currentBinTypes);
    }
    onImportBins(mappedBins, importStrategy);
    setCsvContent("");
    setIsImporting(false);
    setPendingImportData(null);
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
                    <p className="mb-2 text-sm text-[#7A8275]"><span className="font-bold">Cliquez pour uploader</span> ou glissez un fichier CSV / GeoJSON</p>
                    <p className="text-xs text-[#A08E78]">Nom, Zone, Type, Nombre</p>
                  </div>
                  <input type="file" accept=".csv,.json,.geojson" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                 <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full h-32 p-3 text-xs font-mono border rounded-lg border-[#D9D3C7]"
                  placeholder="Collez votre CSV ou JSON ici..."
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
                     onClick={handleProcessFile}
                     className="px-4 py-2 bg-[#6B8E63] text-white rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <Check size={16} /> Analyser
                   </button>
                   <button
                     onClick={() => { setCsvContent(""); setIsImporting(false); }}
                     className="px-4 py-2 bg-[#FEE2E2] text-[#DC2626] rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <X size={16} /> Annuler
                   </button>
                 </div>
                 
                 {pendingImportData && (
                   <div className="mt-6 border-t border-[#D9D3C7] pt-4">
                     <h3 className="font-bold text-sm text-[#3C413A] mb-3">Associations détectées</h3>
                     <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                       {pendingImportData.unmapped.map(item => (
                         <div key={item.key} className="flex items-center gap-3 bg-[#F4F1EA] p-3 rounded-lg border border-[#D9D3C7]">
                           <div className="flex-1 flex items-center gap-2">
                             <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: item.colorStr || "#ccc" }} />
                             <div>
                               <div className="text-xs font-bold text-[#3C413A]">{item.typeStr || "Sans nom"}</div>
                               <div className="text-[10px] text-[#7A8275]">{item.count} élément(s)</div>
                             </div>
                           </div>
                           <div className="flex-1 flex items-center gap-2">
                             <span className="text-xs text-[#7A8275]">➡️</span>
                             <div className="flex-1 space-y-1">
                               <select
                                 value={typeMappings[item.key]?.typeId || ""}
                                 onChange={(e) => setTypeMappings(prev => ({
                                   ...prev,
                                   [item.key]: { ...prev[item.key], typeId: e.target.value }
                                 }))}
                                 className="w-full text-xs p-1.5 border border-[#D9D3C7] rounded"
                               >
                                 <option value="new">+ Créer comme nouveau type</option>
                                 <optgroup label="Types existants">
                                   {binTypes.map(t => (
                                     <option key={t.id} value={t.id}>{t.label} ({binCategories.find(c => c.id === t.categoryId)?.label})</option>
                                   ))}
                                 </optgroup>
                               </select>
                               {typeMappings[item.key]?.typeId === "new" && (
                                 <div className="flex gap-1">
                                   <input 
                                     type="text"
                                     value={typeMappings[item.key]?.label || ""}
                                     onChange={(e) => setTypeMappings(prev => ({
                                       ...prev,
                                       [item.key]: { ...prev[item.key], label: e.target.value }
                                     }))}
                                     placeholder="Nom"
                                     className="flex-1 text-xs p-1.5 border border-[#D9D3C7] rounded"
                                   />
                                   <input 
                                     type="color"
                                     value={typeMappings[item.key]?.color || "#916738"}
                                     onChange={(e) => setTypeMappings(prev => ({
                                       ...prev,
                                       [item.key]: { ...prev[item.key], color: e.target.value }
                                     }))}
                                     className="w-8 h-7 p-0 border-0 rounded cursor-pointer"
                                   />
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                     <div className="mt-4 flex justify-end">
                       <button
                         onClick={handleFinalizeImport}
                         className="px-4 py-2 bg-[#D4A373] text-white rounded-lg text-sm font-bold flex items-center gap-2"
                       >
                         <Check size={16} /> Finaliser l'import ({pendingImportData.bins.length} éléments)
                       </button>
                     </div>
                   </div>
                 )}
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
                   <th className="px-4 py-2 font-bold">Catégorie</th>
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
                       <div className="flex items-center gap-2">
                         <div
                           className="w-3 h-3 rounded-full border border-black/20"
                           style={{ backgroundColor: binCategories.find(c => c.id === binTypes.find(t => t.id === bin.type)?.categoryId)?.color || binTypes.find(t => t.id === bin.type)?.color || "#ccc" }}
                         />
                         <span className="text-xs font-medium">
                           {binCategories.find(c => c.id === binTypes.find(t => t.id === bin.type)?.categoryId)?.label || "-"}
                         </span>
                       </div>
                     </td>
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
                     <td colSpan={7} className="px-4 py-8 text-center text-[#A08E78]">
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
