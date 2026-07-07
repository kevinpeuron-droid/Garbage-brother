const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`        dx -= (currentOffset.x - iframeRefState.refreshUmapOffset.x);
        dy -= (currentOffset.y - iframeRefState.refreshUmapOffset.y);`,
`        dx += (currentOffset.x - iframeRefState.refreshUmapOffset.x);
        dy += (currentOffset.y - iframeRefState.refreshUmapOffset.y);`
);

code = code.replace(
`className="absolute z-0 pointer-events-auto"`,
`className="absolute z-0 pointer-events-none"`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
