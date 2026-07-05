const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`      {maintenanceBins.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#9333EA] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto mb-2">`,
`      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      {maintenanceBins.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-[#9333EA] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">`
);

code = code.replace(
`        </div>
      )}

      {overflowingBins.length > 0 && (
        <div className={\`absolute \${maintenanceBins.length > 0 ? 'top-[280px]' : 'top-4'} left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto\`}>`,
`        </div>
      )}

      {overflowingBins.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">`
);

code = code.replace(
`                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Tools overlay */}`,
`                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Map Tools overlay */}`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
