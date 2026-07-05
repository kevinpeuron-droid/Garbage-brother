const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');
code = code.replace('colSpan={6}', 'colSpan={7}');
fs.writeFileSync('src/components/ListView.tsx', code);
