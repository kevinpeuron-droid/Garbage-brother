const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

// 1. Remove the action column header
code = code.replace(
  '<th className="px-4 py-3 font-bold text-right rounded-tr-lg border-b border-[#D9D3C7]">Actions</th>',
  ''
);

// 2. Modify the td rendering
const oldTd = `<td key={t.id} className="px-4 py-3">
                           <div className="flex flex-col items-center gap-2">
                             <div className="flex items-center gap-2">
                               <input 
                                 type="checkbox" 
                                 checked={bin.status === "installed"}
                                 onChange={(e) => onUpdateStatus(bin.id, e.target.checked ? "installed" : "to_install")}
                                 className="w-5 h-5 rounded border-[#D9D3C7] text-[#6B8E63] focus:ring-[#6B8E63] cursor-pointer"
                                 title="Marquer comme posée"
                               />
                               <button 
                                 onClick={() => setSelectedBin(bin)}
                                 className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:brightness-95 \${getStatusColor(bin.status)} \${bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired ? 'ring-2 ring-offset-1 ring-red-400' : ''}\`}
                               >
                                 <span className="text-sm">{bin.count}</span>
                                 <Settings2 size={14} className="opacity-70" />
                               </button>
                             </div>
                             {(bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired) && (
                               <div className="flex gap-1">
                                 {bin.urgentPlacement && <span title="À poser urgence" className="w-2 h-2 rounded-full bg-[#DC2626]"></span>}
                                 {bin.urgentRemoval && <span title="À déposer urgence" className="w-2 h-2 rounded-full bg-[#D4A373]"></span>}
                                 {bin.maintenanceRequired && <span title="Maintenance" className="w-2 h-2 rounded-full bg-[#9333EA]"></span>}
                               </div>
                             )}
                           </div>
                         </td>`;

const newTd = `<td key={t.id} className="px-4 py-3">
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
                               className={\`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm hover:brightness-95 \${getStatusColor(bin.status)} \${bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired ? 'ring-2 ring-offset-1 ring-red-400' : ''}\`}
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
                         </td>`;

code = code.replace(oldTd, newTd);

// 3. Remove the actions column from the row
const oldActionCol = `<td className="px-4 py-3 text-right">
                       <button
                         onClick={() => {
                            if (window.confirm(\`Supprimer l'emplacement "\${loc.name}" ?\`)) onDeleteLocation(loc.name);
                         }}
                         className="p-2 text-[#A08E78] hover:text-[#DC2626] transition-colors rounded-lg hover:bg-white"
                         title="Supprimer l'emplacement"
                       >
                         <Trash2 size={18} />
                       </button>
                     </td>`;
code = code.replace(oldActionCol, "");

fs.writeFileSync('src/components/ListView.tsx', code);
