const fs = require('fs');

let listViewCode = fs.readFileSync('src/components/ListView.tsx', 'utf-8');
if (!listViewCode.includes("import ExcelJS from 'exceljs';")) {
  listViewCode = listViewCode.replace(
    'import * as XLSX from "xlsx";',
    'import * as XLSX from "xlsx";\nimport ExcelJS from "exceljs";'
  );
  fs.writeFileSync('src/components/ListView.tsx', listViewCode);
}
