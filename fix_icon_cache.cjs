const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const cacheStr = `
const iconCache: Record<string, L.DivIcon> = {};

const getCachedIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number) => {
  const key = \`\${fillColor}-\${borderColor}-\${count}-\${zoomLevel}\`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(fillColor, borderColor, count, zoomLevel);
  }
  return iconCache[key];
};

const clusterIconCache: Record<string, L.DivIcon> = {};

const getCachedClusterIcon = (colors: string[], count: number, zoomLevel: number) => {
  const key = \`\${colors.sort().join(',')}-\${count}-\${zoomLevel}\`;
  if (!clusterIconCache[key]) {
    clusterIconCache[key] = createClusterIcon(colors, count, zoomLevel);
  }
  return clusterIconCache[key];
};
`;

code = code.replace(
  'const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number) => {',
  cacheStr + '\nconst createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number) => {'
);

code = code.replace(
  /icon=\{createIcon\(/g,
  'icon={getCachedIcon('
);

code = code.replace(
  /icon=\{createClusterIcon\(/g,
  'icon={getCachedClusterIcon('
);

fs.writeFileSync('src/components/BinMap.tsx', code);
