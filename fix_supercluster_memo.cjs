const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  'const points = bins.map((bin: any) => ({',
  'const points = React.useMemo(() => bins.map((bin: any) => ({'
);

code = code.replace(
  'geometry: { type: "Point", coordinates: [bin.lng, bin.lat] }\n  }));',
  'geometry: { type: "Point", coordinates: [bin.lng, bin.lat] }\n  })), [bins]);'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
