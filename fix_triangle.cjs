const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const oldGetCachedIcon = `const getCachedIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number) => {
  const key = \`\${fillColor}-\${borderColor}-\${count}-\${zoomLevel}\`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(fillColor, borderColor, count, zoomLevel);
  }
  return iconCache[key];
};`;

const newGetCachedIcon = `const getCachedIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const key = \`\${fillColor}-\${borderColor}-\${count}-\${zoomLevel}-\${isOverflowing}\`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(fillColor, borderColor, count, zoomLevel, isOverflowing);
  }
  return iconCache[key];
};`;

code = code.replace(oldGetCachedIcon, newGetCachedIcon);

const oldCreateIcon = `const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number) => {
  const baseZoom = 18;
  const baseSize = 24;
  const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px

  const content =
    count && count > 1
      ? \`<span style="color: \${borderColor === "white" ? "white" : borderColor}; font-size: \${Math.max(8, size/2.5)}px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">\${count}</span>\`
      : "";
  return new L.DivIcon({
    className: "custom-icon",
    html: \`<div style="background-color: \${fillColor}; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${Math.max(1, size/8)}px solid \${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">\${content}</div>\`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};`;

const newCreateIcon = `const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const baseZoom = 18;
  const baseSize = 24;
  const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px

  const content =
    count && count > 1
      ? \`<span style="color: \${borderColor === "white" ? "white" : borderColor}; font-size: \${Math.max(8, size/2.5)}px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">\${count}</span>\`
      : "";

  if (isOverflowing) {
    const html = \`
      <div style="
        width: 0;
        height: 0;
        border-left: \${size/1.2}px solid transparent;
        border-right: \${size/1.2}px solid transparent;
        border-bottom: \${size * 1.5}px solid #DC2626;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        position: relative;
        display: flex;
        justify-content: center;
      ">
        <div style="position: absolute; top: \${size * 0.7}px;">
          \${content}
        </div>
      </div>
    \`;
    return new L.DivIcon({
      className: "custom-icon-triangle",
      html,
      iconSize: [size * 2, size * 1.5],
      iconAnchor: [size, size * 0.75],
    });
  }

  return new L.DivIcon({
    className: "custom-icon",
    html: \`<div style="background-color: \${fillColor}; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${Math.max(1, size/8)}px solid \${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">\${content}</div>\`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};`;

code = code.replace(oldCreateIcon, newCreateIcon);

// Find getCachedIcon call and add isOverflowing
// icon={getCachedIcon(fillColor, borderColor, bin.count, zoom)}
code = code.replace(
  'icon={getCachedIcon(fillColor, borderColor, bin.count, zoom)}',
  'icon={getCachedIcon(fillColor, borderColor, bin.count, zoom, bin.status === "overflowing")}'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
