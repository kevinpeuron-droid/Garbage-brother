const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

// Update BinPopupContent to be more mobile-friendly
const popupStart = code.indexOf('const BinPopupContent =');
const popupEnd = code.indexOf('};', popupStart) + '};'.length;

const newPopupContent = `const BinPopupContent = ({ bin, binTypes, binCategories, mode, deutzSubMode, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const typeConfig = binTypes.find((t: any) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find((c: any) => c.id === typeConfig.categoryId) : undefined;
  
  const handleStop = (e: any) => e.stopPropagation();

  return (
    <div className="p-2 min-w-[240px] md:min-w-[200px] text-[#3C413A] font-sans" onClick={handleStop} onTouchEnd={handleStop}>
      <h3 className="font-bold text-lg md:text-sm mb-1 text-[#4B6345]">
        {bin.name}
      </h3>
      <p className="text-sm md:text-xs text-[#7A8275] mb-1 font-medium">
        Nombre: {bin.count || 1}
      </p>
      <p className="text-sm md:text-xs text-[#7A8275] mb-1 font-medium">
        Zone: {bin.zone}
      </p>
      {typeConfig && (
        <p
          className="text-sm md:text-xs font-bold mb-4"
          style={{ color: typeConfig.color }}
        >
          Type: {typeConfig.label}
        </p>
      )}

      <div className="mb-4 space-y-3 border-t border-[#E5E0D5] pt-3">
        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={bin.urgentPlacement || false}
            onChange={(e) =>
              onUpdateBin &&
              onUpdateBin(bin.id, {
                urgentPlacement: e.target.checked,
              })
            }
            className="w-5 h-5 md:w-3.5 md:h-3.5 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
          />
          <span
            className={\`text-xs md:text-[10px] font-bold transition-colors \${bin.urgentPlacement ? "text-[#DC2626]" : "text-[#7A8275]"}\`}
          >
            À poser en priorité
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={bin.urgentRemoval || false}
            onChange={(e) =>
              onUpdateBin &&
              onUpdateBin(bin.id, {
                urgentRemoval: e.target.checked,
              })
            }
            className="w-5 h-5 md:w-3.5 md:h-3.5 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
          />
          <span
            className={\`text-xs md:text-[10px] font-bold transition-colors \${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}\`}
          >
            À déposer en priorité
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={bin.maintenanceRequired || false}
            onChange={(e) =>
              onUpdateBin &&
              onUpdateBin(bin.id, {
                maintenanceRequired: e.target.checked,
              })
            }
            className="w-5 h-5 md:w-3.5 md:h-3.5 rounded border-[#D9D3C7] text-[#9333EA] focus:ring-[#9333EA]"
          />
          <span
            className={\`text-xs md:text-[10px] font-bold transition-colors \${bin.maintenanceRequired ? "text-[#9333EA]" : "text-[#7A8275]"}\`}
          >
            Maintenance nécessaire
          </span>
        </label>
      </div>

      <div className="mb-4">
        <p className="text-xs md:text-[10px] font-bold uppercase text-[#7A8275] mb-2">
          Changer le statut
        </p>
        <div className="grid grid-cols-2 gap-2">
          {mode === "map_deutz" && deutzSubMode === "pose" && (
            <>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "to_install"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "to_install" ? "bg-[#A08E78] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                À poser
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "installed"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "installed" ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                Posée
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "overflowing"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors col-span-2 \${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}\`}
              >
                🚨 Archi pleine
              </button>
            </>
          )}
          {mode === "map_deutz" && deutzSubMode === "depose" && (
            <>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "to_remove"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "to_remove" ? "bg-[#D4A373] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                À retirer
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "removed"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "removed" ? "bg-[#D9D3C7] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                Retirée
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "overflowing"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors col-span-2 \${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}\`}
              >
                🚨 Archi pleine
              </button>
            </>
          )}
          {mode !== "map_deutz" && (
            <>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "to_install"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "to_install" ? "bg-[#A08E78] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                À poser
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "installed"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "installed" ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                Posée
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "to_remove"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "to_remove" ? "bg-[#D4A373] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                À retirer
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "removed"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "removed" ? "bg-[#D9D3C7] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                Retirée
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "missing"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "missing" ? "bg-[#9333EA] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}\`}
              >
                Manquante
              </button>
              <button
                onClick={(e) => { handleStop(e); onUpdateStatus(bin.id, "overflowing"); }}
                className={\`px-2 py-3 md:py-1.5 text-xs md:text-[10px] font-bold uppercase rounded transition-colors \${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}\`}
              >
                🚨 Archi pleine
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-xs md:text-[10px] text-[#A08E78] pt-3 pb-2 border-t border-[#E5E0D5]">
        Dernière collecte:{" "}
        {new Date(bin.lastEmptied).toLocaleTimeString()}
      </div>

      {mode === "map_edition" && (
        <button
          onClick={(e) => { handleStop(e); onDeleteBin(bin.id); }}
          className="w-full px-2 py-3 md:py-1.5 mt-2 text-xs md:text-[10px] font-bold uppercase rounded transition-colors bg-[#F4F1EA] text-[#916738] border border-[#D9D3C7] hover:bg-[#D9D3C7]"
        >
          Supprimer du plan
        </button>
      )}
    </div>
  );
};`;

code = code.substring(0, popupStart) + newPopupContent + code.substring(popupEnd);

// Fix the zoom scaling to make icons slightly smaller at max zoom
code = code.replace(
  'const size = Math.max(10, baseSize * Math.pow(2, zoomLevel - baseZoom)); // Min size 10px',
  'const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px'
);

code = code.replace(
  'const size = Math.max(16, baseSize * Math.pow(2, zoomLevel - baseZoom));',
  'const size = Math.min(48, Math.max(16, baseSize * Math.pow(1.5, zoomLevel - baseZoom)));'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
