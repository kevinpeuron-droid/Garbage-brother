const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const popupStart = code.indexOf('const BinPopupContent =');
const popupEnd = code.indexOf('};', popupStart) + '};'.length;

const newPopupContent = `const BinPopupContent = ({ bin, binTypes, binCategories, mode, deutzSubMode, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const typeConfig = binTypes.find((t: any) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find((c: any) => c.id === typeConfig.categoryId) : undefined;

  return (
    <div className="flex flex-col gap-3 min-w-[220px] max-w-[280px] text-[#3C413A] font-sans">
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base text-[#4B6345] leading-tight">
          {bin.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#7A8275] font-medium">
          <span className="bg-[#F4F1EA] px-1.5 py-0.5 rounded">Qté: {bin.count || 1}</span>
          <span className="bg-[#F4F1EA] px-1.5 py-0.5 rounded truncate max-w-[120px]">{bin.zone}</span>
        </div>
        {typeConfig && (
          <div className="mt-1">
             <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: typeConfig.color }}>
               {typeConfig.label}
             </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#E5E0D5] pt-3">
        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={\`text-xs font-bold \${bin.urgentPlacement ? "text-[#DC2626]" : "text-[#7A8275]"}\`}>
            À poser urgence
          </span>
          <input
            type="checkbox"
            checked={bin.urgentPlacement || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentPlacement: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
          />
        </label>
        
        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={\`text-xs font-bold \${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}\`}>
            À déposer urgence
          </span>
          <input
            type="checkbox"
            checked={bin.urgentRemoval || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentRemoval: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
          />
        </label>

        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={\`text-xs font-bold \${bin.maintenanceRequired ? "text-[#9333EA]" : "text-[#7A8275]"}\`}>
            Maintenance
          </span>
          <input
            type="checkbox"
            checked={bin.maintenanceRequired || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { maintenanceRequired: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#9333EA] focus:ring-[#9333EA]"
          />
        </label>
      </div>

      <div className="border-t border-[#E5E0D5] pt-3">
        <p className="text-[10px] font-bold uppercase text-[#A08E78] mb-2 tracking-wider">
          Statut
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {mode === "map_deutz" && deutzSubMode === "pose" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_install")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "to_install" ? "bg-[#A08E78] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                À poser
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "installed")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "installed" ? "bg-[#6B8E63] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                Posée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors col-span-2 flex items-center justify-center gap-1 \${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}\`}
              >
                <span>🚨</span> Archi pleine
              </button>
            </>
          )}
          {mode === "map_deutz" && deutzSubMode === "depose" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_remove")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "to_remove" ? "bg-[#D4A373] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                À retirer
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "removed")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "removed" ? "bg-[#D9D3C7] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                Retirée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors col-span-2 flex items-center justify-center gap-1 \${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}\`}
              >
                <span>🚨</span> Archi pleine
              </button>
            </>
          )}
          {mode !== "map_deutz" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_install")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "to_install" ? "bg-[#A08E78] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                À poser
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "installed")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "installed" ? "bg-[#6B8E63] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                Posée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_remove")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "to_remove" ? "bg-[#D4A373] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                À retirer
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "removed")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "removed" ? "bg-[#D9D3C7] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                Retirée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "missing")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "missing" ? "bg-[#9333EA] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}\`}
              >
                Manquante
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={\`p-2 text-xs font-bold rounded-lg transition-colors \${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}\`}
              >
                🚨 Pleine
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-[10px] text-[#A08E78] text-center pt-2">
        Mise à jour: {new Date(bin.lastEmptied).toLocaleTimeString()}
      </div>

      {mode === "map_edition" && (
        <button
          onClick={() => onDeleteBin(bin.id)}
          className="w-full mt-1 p-2 text-xs font-bold rounded-lg transition-colors bg-[#F4F1EA] text-[#916738] border border-[#D9D3C7] active:bg-[#EBE7DF]"
        >
          Supprimer
        </button>
      )}
    </div>
  );
};`;

code = code.substring(0, popupStart) + newPopupContent + code.substring(popupEnd);

fs.writeFileSync('src/components/BinMap.tsx', code);
