const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  '<Popup className="cluster-popup" maxWidth={800}>',
  '<Popup className="cluster-popup" maxWidth={800} autoPanPadding={[20, 20]}>'
);

code = code.replace(
  '<Popup>',
  '<Popup autoPanPadding={[20, 20]}>'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
