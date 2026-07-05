const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
`import { TrashBin, BinTypeConfig } from "../types";`,
`import { TrashBin, BinTypeConfig, BinCategoryConfig } from "../types";`
);

code = code.replace(
`interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];`,
`interface ListViewProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  binCategories: BinCategoryConfig[];`
);

code = code.replace(
`export default function ListView({
  bins,
  binTypes,`,
`export default function ListView({
  bins,
  binTypes,
  binCategories,`
);

code = code.replace(
`                   <th className="px-4 py-2 font-bold text-center">Couleur</th>
                   <th className="px-4 py-2 font-bold">Type</th>`,
`                   <th className="px-4 py-2 font-bold">Catégorie</th>
                   <th className="px-4 py-2 font-bold">Type</th>`
);

code = code.replace(
`                     <td className="px-4 py-3 flex justify-center">
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

code = code.replace(
`                                     <option key={t.id} value={t.id}>{t.label}</option>`,
`                                     <option key={t.id} value={t.id}>{t.label} ({binCategories.find(c => c.id === t.categoryId)?.label})</option>`
);

fs.writeFileSync('src/components/ListView.tsx', code);
