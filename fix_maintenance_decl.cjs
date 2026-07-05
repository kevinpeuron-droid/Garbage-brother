const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`  const overflowingBins = placedBins.filter((b) => b.status === "overflowing");`,
`  const overflowingBins = placedBins.filter((b) => b.status === "overflowing");
  const maintenanceBins = placedBins.filter((b) => b.maintenanceRequired);`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
