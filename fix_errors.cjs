const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

// Fix: "No worksheet found in the Excel file"
// We can use workbook.worksheets.find(s => !!s) or something similar.
code = code.replace(
  /const worksheet = workbook\.worksheets\[0\] \|\| workbook\.getWorksheet\(1\);\s*if \(\!worksheet\) \{\s*throw new Error\("No worksheet found in the Excel file"\);\s*\}/,
  `const worksheet = workbook.worksheets.find(s => !!s) || (workbook.worksheets.length > 0 ? workbook.worksheets[0] : null) || workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file. Sheets count: " + workbook.worksheets.length);
        }`
);

// Fix: "Unsupported field value: undefined"
// We need to change `color: cellHexColor` to `color: cellHexColor || null`
// and for binTypes, `color: hexColor || '#60A5FA'` is already safe.
// Wait, when we create `importedBins.push`, we can just omit color if it's undefined or use null.

code = code.replace(
  /color: cellHexColor/g,
  'color: cellHexColor || null'
);

fs.writeFileSync('src/components/ListView.tsx', code);
