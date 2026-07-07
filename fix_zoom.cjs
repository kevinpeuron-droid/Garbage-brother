const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  'const [zoom, setZoom] = React.useState(zoom);',
  'const [zoom, setZoom] = React.useState(map.getZoom());'
);

code = code.replace(
  'setZoom(zoom);',
  'setZoom(map.getZoom());'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
