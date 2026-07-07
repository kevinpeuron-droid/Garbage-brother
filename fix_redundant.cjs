const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const regex = /\{onUpdateUmapOffset && \([\s\S]*?<\/div>\s*\)\}/;
code = code.replace(regex, '');

fs.writeFileSync('src/components/BinMap.tsx', code);
