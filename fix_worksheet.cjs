const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
  'const worksheet = workbook.worksheets[0];',
  `const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file");
        }`
);

fs.writeFileSync('src/components/ListView.tsx', code);
