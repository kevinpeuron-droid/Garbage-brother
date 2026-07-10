const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const oldCreateIcon = `const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const baseZoom = 18;
  const baseSize = 24;
  const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px

  const content =
    count && count > 1
      ? \`<span style="color: \${borderColor === "white" ? "white" : borderColor}; font-size: \${Math.max(8, size/2.5)}px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">\${count}</span>\`
      : "";`;

const newCreateIcon = `const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const baseZoom = 18;
  const baseSize = 24;
  const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px

  const textColor = isOverflowing ? "white" : (borderColor === "white" ? "white" : borderColor);
  
  const content =
    count && count > 1
      ? \`<span style="color: \${textColor}; font-size: \${Math.max(8, size/2.5)}px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">\${count}</span>\`
      : "";`;

code = code.replace(oldCreateIcon, newCreateIcon);
fs.writeFileSync('src/components/BinMap.tsx', code);
