const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`              binTypes={binTypes}
            binCategories={binCategories}
              binCategories={binCategories}
              mode={viewMode}`,
`              binTypes={binTypes}
              binCategories={binCategories}
              mode={viewMode}`
);

code = code.replace(
`          <ListView
            bins={bins}
            binTypes={binTypes}
            onImportBins={handleImportBins}`,
`          <ListView
            bins={bins}
            binTypes={binTypes}
            binCategories={binCategories}
            onImportBins={handleImportBins}`
);

code = code.replace(
`          <SettingsView
            binTypes={binTypes}
            onUpdateBinTypes={setBinTypes}`,
`          <SettingsView
            binTypes={binTypes}
            onUpdateBinTypes={setBinTypes}
            binCategories={binCategories}
            onUpdateBinCategories={setBinCategories}`
);

fs.writeFileSync('src/App.tsx', code);
