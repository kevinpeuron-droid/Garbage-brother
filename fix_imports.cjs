const fs = require('fs');

let binmap = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');
binmap = binmap.replace(
  `import { TrashBin, MapShape, BinTypeConfig, OverlayImage } from "../types";`,
  `import { TrashBin, MapShape, BinTypeConfig, OverlayImage, BinCategoryConfig } from "../types";`
);
fs.writeFileSync('src/components/BinMap.tsx', binmap);

let listview = fs.readFileSync('src/components/ListView.tsx', 'utf-8');
listview = listview.replace(
  `import { TrashBin, BinTypeConfig } from "../types";`,
  `import { TrashBin, BinTypeConfig, BinCategoryConfig } from "../types";`
);
// just in case ListView also has a different import
if (!listview.includes('BinCategoryConfig')) {
  listview = listview.replace(
    /import \{[^}]+\} from "\.\.\/types";/,
    (match) => match.replace('}', ', BinCategoryConfig }')
  );
  fs.writeFileSync('src/components/ListView.tsx', listview);
} else {
  fs.writeFileSync('src/components/ListView.tsx', listview);
}
