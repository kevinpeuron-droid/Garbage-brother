const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`  const overflowingBins = bins.filter((b) => b.status === "overflowing");`,
`  const overflowingBins = bins.filter((b) => b.status === "overflowing");
  const maintenanceBins = bins.filter((b) => b.maintenanceRequired);`
);

code = code.replace(
`      {overflowingBins.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">`,
`      {maintenanceBins.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#9333EA] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto mb-2">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F3E8FF]">
            <AlertTriangle size={18} className="text-[#9333EA]" />
            <h3 className="font-bold text-sm text-[#9333EA]">
              Maintenance nécessaire ({maintenanceBins.length})
            </h3>
          </div>
          <div className="overflow-y-auto pr-2 space-y-2">
            {maintenanceBins.map((bin) => {
              const typeConfig = binTypes.find((t) => t.id === bin.type);
              return (
                <div
                  key={bin.id}
                  onClick={() => onSelectBin && onSelectBin(bin.id)}
                  className={\`p-2 rounded border border-[#F3E8FF] bg-[#FAF5FF] cursor-pointer hover:bg-[#E9D5FF] transition-colors \${selectedBinId === bin.id ? "ring-2 ring-[#9333EA]" : ""}\`}
                >
                  <div className="font-bold text-xs text-[#6B21A8]">
                    {bin.name}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-[#9333EA]">
                      {bin.zone}
                    </span>
                    {typeConfig && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#9333EA] text-[#9333EA] bg-white">
                        {typeConfig.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {overflowingBins.length > 0 && (
        <div className={\`absolute \${maintenanceBins.length > 0 ? 'top-[280px]' : 'top-4'} left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto\`}>`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
