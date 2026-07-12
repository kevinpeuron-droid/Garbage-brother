const fs = require('fs');

let listViewCode = fs.readFileSync('src/components/ListView.tsx', 'utf-8');
listViewCode = listViewCode.replace(
  '  binTypes: BinTypeConfig[];\n  onImportBins',
  '  binTypes: BinTypeConfig[];\n  onUpdateBinTypes: (types: BinTypeConfig[]) => void;\n  onImportBins'
);
listViewCode = listViewCode.replace(
  'export default function ListView({\n  bins,\n  binTypes,\n  onImportBins,',
  'export default function ListView({\n  bins,\n  binTypes,\n  onUpdateBinTypes,\n  onImportBins,'
);
fs.writeFileSync('src/components/ListView.tsx', listViewCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  '      binTypes={binTypes}\n      onImportBins=',
  '      binTypes={binTypes}\n      onUpdateBinTypes={setBinTypes}\n      onImportBins='
);
fs.writeFileSync('src/App.tsx', appCode);

