const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

// Replace importState definition
code = code.replace(
  /const \[importState, setImportState\] = useState<\{[\s\S]*?\} \| null>\(null\);/,
  `const [importState, setImportState] = useState<{
    headers: { index: number; name: string; color?: string }[];
    rows: { values: any[]; colors: Record<number, string> }[];
  } | null>(null);`
);

// We need to add XLSX import if it's missing (it was removed earlier when we switched entirely to ExcelJS).
if (!code.includes('import * as XLSX from "xlsx";')) {
  code = code.replace(
    'import ExcelJS from "exceljs";',
    'import ExcelJS from "exceljs";\nimport * as XLSX from "xlsx";'
  );
}

// Replace handleFileUpload
const handleFileUploadRegex = /const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?setMapping\(newMapping\);\s*\}\ catch \(err\) \{[\s\S]*?if \(e\.target\) e\.target\.value = '';\n    \}\n  \};/;

const newHandleFileUpload = `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const data = await file.arrayBuffer();
      
      const extractedHeaders: { index: number; name: string; color?: string }[] = [];
      const extractedRows: { values: any[]; colors: Record<number, string> }[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (json.length > 0) {
          const headerRow = json[0];
          for (let i = 0; i < headerRow.length; i++) {
            if (headerRow[i] !== undefined && headerRow[i] !== null) {
              // we 1-index for consistency with exceljs
              extractedHeaders.push({ index: i + 1, name: headerRow[i].toString().trim() });
            }
          }
          for (let r = 1; r < json.length; r++) {
            const rowArr = json[r];
            const rowValues = [];
            for (let c = 0; c < rowArr.length; c++) {
              rowValues[c + 1] = rowArr[c];
            }
            extractedRows.push({ values: rowValues, colors: {} });
          }
        }
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];
        const headerRow = worksheet.getRow(1);
        
        if (!headerRow || !headerRow.values) {
           throw new Error("No header row found");
        }
        
        const headers = headerRow.values as any[];
        for (let i = 1; i < headers.length; i++) {
          if (headers[i] !== undefined && headers[i] !== null) {
            const headerCell = headerRow.getCell(i);
            let hexColor = undefined;
            if (headerCell.fill && headerCell.fill.type === 'pattern' && headerCell.fill.fgColor) {
                const argb = headerCell.fill.fgColor.argb;
                if (argb) hexColor = '#' + (argb.length === 8 ? argb.substring(2) : argb);
            }
            extractedHeaders.push({ index: i, name: headers[i].toString().trim(), color: hexColor });
          }
        }

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowValues = row.values as any[];
          const colors: Record<number, string> = {};
          
          row.eachCell((cell, colNumber) => {
            if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
               const argb = cell.fill.fgColor.argb;
               if (argb) colors[colNumber] = '#' + (argb.length === 8 ? argb.substring(2) : argb);
            }
            // Resolve formulas to value
            if (cell.value && typeof cell.value === 'object' && 'result' in cell.value) {
                rowValues[colNumber] = cell.value.result;
            }
          });
          
          extractedRows.push({ values: rowValues, colors });
        });
      }

      setImportState({ headers: extractedHeaders, rows: extractedRows });
      
      const newMapping: ColumnMapping = { locationCol: null, col1000: null, col300: null, col150: null };
      extractedHeaders.forEach(h => {
         const val = h.name.toLowerCase();
         if (!newMapping.locationCol && (val.includes("emplacement") || val.includes("container") || val.includes("lieu") || val.includes("site"))) {
            newMapping.locationCol = h.index;
         }
         if (!newMapping.col1000 && (val.includes("4 roues") || val.includes("1000"))) {
            newMapping.col1000 = h.index;
         }
         if (!newMapping.col300 && val.includes("300")) {
            newMapping.col300 = h.index;
         }
         if (!newMapping.col150 && val.includes("150")) {
            newMapping.col150 = h.index;
         }
      });
      setMapping(newMapping);
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };`;

code = code.replace(handleFileUploadRegex, newHandleFileUpload);

// Replace executeImport
const executeImportRegex = /const executeImport = \(\) => \{[\s\S]*?setImportState\(null\);\n  \};/;

const newExecuteImport = `const executeImport = () => {
    if (!importState || !mapping.locationCol) return;
    
    const { headers, rows } = importState;
    const importedBins: (Omit<TrashBin, "id" | "lastEmptied"> & { color?: string })[] = [];
    const newBinTypes = [...binTypes];
    let typesUpdated = false;

    const mappedColumns = [
       { key: '4_roues', colIndex: mapping.col1000, fallbackLabel: '4 roues 1000L' },
       { key: '2_roues_300l', colIndex: mapping.col300, fallbackLabel: '2 roues 300L' },
       { key: '2_roues_150l', colIndex: mapping.col150, fallbackLabel: '2 roues 150L' }
    ];

    mappedColumns.forEach(mappedCol => {
       if (!mappedCol.colIndex) return;
       const headerInfo = headers.find(h => h.index === mappedCol.colIndex);
       const hexColor = headerInfo?.color;
       const headerText = headerInfo ? headerInfo.name : mappedCol.fallbackLabel;
       
       let existingType = newBinTypes.find(t => t.id === mappedCol.key);
       if (!existingType) {
          existingType = {
             id: mappedCol.key,
             label: headerText,
             categoryId: 'cat-default',
             color: hexColor || '#60A5FA'
          };
          newBinTypes.push(existingType);
          typesUpdated = true;
       } else if (hexColor && existingType.color !== hexColor) {
          existingType.color = hexColor;
          typesUpdated = true;
       }
    });

    rows.forEach((row) => {
        const name = row.values[mapping.locationCol!]?.toString();
        if (!name || name.trim() === '') return;
        
        mappedColumns.forEach(mappedCol => {
           if (!mappedCol.colIndex) return;
           const val = row.values[mappedCol.colIndex];
           
           let count = 0;
           if (typeof val === 'number') {
              count = val;
           } else if (typeof val === 'string') {
              count = parseInt(val, 10) || 0;
           }
           
           if (count > 0) {
              const cellHexColor = row.colors[mappedCol.colIndex];

              importedBins.push({
                 name: name.trim(),
                 zone: "Excel",
                 type: mappedCol.key,
                 status: "to_install",
                 count: count,
                 lat: null,
                 lng: null,
                 color: cellHexColor
              });
           }
        });
    });

    if (typesUpdated) {
       onUpdateBinTypes(newBinTypes);
    }

    if (importedBins.length > 0) {
       onImportBins(importedBins, "group");
    } else {
       alert("Aucune donnée valide trouvée dans le fichier avec ce mapping.");
    }

    setImportState(null);
  };`;

code = code.replace(executeImportRegex, newExecuteImport);

fs.writeFileSync('src/components/ListView.tsx', code);
