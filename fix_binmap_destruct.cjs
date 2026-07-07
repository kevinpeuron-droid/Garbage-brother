const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`  umapOffset = { x: 0, y: 0 },
  onUpdateUmapOffset,
}: BinMapProps) {`,
`  umapOffset = { x: 0, y: 0 },
  onUpdateUmapOffset,
  umapRefreshKey = 0,
}: BinMapProps) {`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
