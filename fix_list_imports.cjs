const fs = require('fs');
let listview = fs.readFileSync('src/components/ListView.tsx', 'utf-8');
listview = listview.replace(
  `import { TrashBin, BinTypeConfig, defaultBinTypes } from "../types";`,
  `import { TrashBin, BinTypeConfig, defaultBinTypes, BinCategoryConfig } from "../types";`
);
fs.writeFileSync('src/components/ListView.tsx', listview);
