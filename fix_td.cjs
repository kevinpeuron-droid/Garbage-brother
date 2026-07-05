const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
`                     <td className="px-4 py-3">
                       <div
                         className="w-4 h-4 rounded-full border border-black/20"
                         style={{ backgroundColor: binTypes.find(t => t.id === bin.type)?.color || "#ccc" }}
                       />
                     </td>`,
`                     <td className="px-4 py-3">
                       <div className="flex items-center gap-2">
                         <div
                           className="w-3 h-3 rounded-full border border-black/20"
                           style={{ backgroundColor: binCategories.find(c => c.id === binTypes.find(t => t.id === bin.type)?.categoryId)?.color || binTypes.find(t => t.id === bin.type)?.color || "#ccc" }}
                         />
                         <span className="text-xs font-medium">
                           {binCategories.find(c => c.id === binTypes.find(t => t.id === bin.type)?.categoryId)?.label || "-"}
                         </span>
                       </div>
                     </td>`
);

fs.writeFileSync('src/components/ListView.tsx', code);
