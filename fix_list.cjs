const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
`                 <tr>
                   <th className="px-4 py-2 font-bold rounded-tl-lg">Nom</th>
                   <th className="px-4 py-2 font-bold">Zone</th>
                   <th className="px-4 py-2 font-bold">Type</th>
                   <th className="px-4 py-2 font-bold">Statut</th>
                   <th className="px-4 py-2 font-bold text-center">Qté</th>
                   <th className="px-4 py-2 font-bold text-right rounded-tr-lg">Actions</th>
                 </tr>`,
`                 <tr>
                   <th className="px-4 py-2 font-bold rounded-tl-lg">Nom</th>
                   <th className="px-4 py-2 font-bold">Zone</th>
                   <th className="px-4 py-2 font-bold text-center">Couleur</th>
                   <th className="px-4 py-2 font-bold">Type</th>
                   <th className="px-4 py-2 font-bold">Statut</th>
                   <th className="px-4 py-2 font-bold text-center">Qté</th>
                   <th className="px-4 py-2 font-bold text-right rounded-tr-lg">Actions</th>
                 </tr>`
);

code = code.replace(
`                     <td className="px-4 py-3">
                       <div className="flex items-center gap-2">
                         <div
                           className="w-3 h-3 rounded-full border border-black/20"
                           style={{ backgroundColor: binTypes.find(t => t.id === bin.type)?.color || "#ccc" }}
                         />
                         <span className="px-2 py-1 bg-[#EBE7DF] rounded text-xs">
                           {binTypes.find(t => t.id === bin.type)?.label || bin.type}
                         </span>
                       </div>
                     </td>`,
`                     <td className="px-4 py-3 flex justify-center">
                       <div
                         className="w-4 h-4 rounded-full border border-black/20"
                         style={{ backgroundColor: binTypes.find(t => t.id === bin.type)?.color || "#ccc" }}
                       />
                     </td>
                     <td className="px-4 py-3">
                       <span className="px-2 py-1 bg-[#EBE7DF] rounded text-xs">
                         {binTypes.find(t => t.id === bin.type)?.label || bin.type}
                       </span>
                     </td>`
);

fs.writeFileSync('src/components/ListView.tsx', code);
