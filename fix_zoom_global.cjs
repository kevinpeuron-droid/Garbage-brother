const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

// In UmapSync component
code = code.replace(
  'const center = map.getCenter();\n      const zoom = zoom;',
  'const center = map.getCenter();\n      const zoom = map.getZoom();'
);

code = code.replace(
  'const currentZoom = zoom;\n        const scale = map.getZoomScale(currentZoom, iframeRefState.zoom);',
  'const currentZoom = map.getZoom();\n        const scale = map.getZoomScale(currentZoom, iframeRefState.zoom);'
);

// cluster.id casting
code = code.replace(
  'const leaves = supercluster.getLeaves(cluster.id, Infinity);',
  'const leaves = supercluster.getLeaves(cluster.id as number, Infinity);'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
