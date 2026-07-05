const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`import { TrashBin, MapShape, BinTypeConfig } from "../types";`,
`import { TrashBin, MapShape, BinTypeConfig, BinCategoryConfig } from "../types";`
);

code = code.replace(
`const getBinStyle = (bin: TrashBin, binTypes: BinTypeConfig[]) => {
  const typeConfig = binTypes.find((t) => t.id === bin.type);
  const fillColor = typeConfig ? typeConfig.color : "#A08E78";`,
`const getBinStyle = (bin: TrashBin, binTypes: BinTypeConfig[], binCategories: BinCategoryConfig[]) => {
  const typeConfig = binTypes.find((t) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find(c => c.id === typeConfig.categoryId) : undefined;
  const fillColor = categoryConfig ? categoryConfig.color : (typeConfig?.color || "#A08E78");`
);

code = code.replace(
`interface BinMapProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];`,
`interface BinMapProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  binCategories: BinCategoryConfig[];`
);

code = code.replace(
`export default function BinMap({
  bins,
  binTypes,`,
`export default function BinMap({
  bins,
  binTypes,
  binCategories,`
);

code = code.replace(
`          const { fillColor, borderColor } = getBinStyle(bin, binTypes);`,
`          const { fillColor, borderColor } = getBinStyle(bin, binTypes, binCategories);`
);

code = code.replace(
`              const { fillColor, borderColor } = getBinStyle(bin, binTypes);`,
`              const { fillColor, borderColor } = getBinStyle(bin, binTypes, binCategories);`
);

code = code.replace(
`              {binTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onAddAndPlaceBin?.(type.id)}
                  className="flex flex-col items-center gap-2 p-2 bg-white border border-[#D9D3C7] rounded-lg hover:bg-[#F4F1EA] transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: type.color }}
                  />`,
`              {binTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onAddAndPlaceBin?.(type.id)}
                  className="flex flex-col items-center gap-2 p-2 bg-white border border-[#D9D3C7] rounded-lg hover:bg-[#F4F1EA] transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: binCategories.find(c => c.id === type.categoryId)?.color || type.color || "#ccc" }}
                  />`
);

code = code.replace(
`            {binTypes.map((type) => {
              const count = placedBins.filter((b) => b.type === type.id).length;
              if (count === 0) return null;
              return (
                <div key={type.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-[#3C413A]">{type.label}</span>`,
`            {binTypes.map((type) => {
              const count = placedBins.filter((b) => b.type === type.id).length;
              if (count === 0) return null;
              return (
                <div key={type.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: binCategories.find(c => c.id === type.categoryId)?.color || type.color || "#ccc" }}
                    />
                    <span className="text-[#3C413A]">{type.label}</span>`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
