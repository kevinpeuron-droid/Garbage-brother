const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  '  umapRefreshKey?: number;',
  '  umapRefreshKey?: number;\n  showUmapData?: boolean;\n  onUpdateShowUmapData?: (val: boolean) => void;'
);

code = code.replace(
  '  umapRefreshKey = 0,\n}: BinMapProps) {',
  '  umapRefreshKey = 0,\n  showUmapData = false,\n  onUpdateShowUmapData,\n}: BinMapProps) {'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
