const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

const regex = /const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?if \(e\.target\) e\.target\.value = '';\n    \}\n  \};/m;

const newUpload = `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const data = await file.arrayBuffer();
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];

      const importedBins: (Omit<import("../types").TrashBin, "id" | "lastEmptied"> & { color?: string })[] = [];
      const newBinTypes = [...binTypes];
      let typesUpdated = false;

      const headerRow = worksheet.getRow(1);
      if (!headerRow || !headerRow.values) {
         throw new Error("No header row found");
      }
      
      const headers = headerRow.values as any[];
      
      let nameColIndex = -1;
      for (let i = 1; i < headers.length; i++) {
        const val = headers[i]?.toString().toLowerCase();
        if (val && (val.includes("emplacement") || val.includes("container") || val.includes("lieu"))) {
           nameColIndex = i;
           break;
        }
      }
      if (nameColIndex === -1 && headers.length > 1) nameColIndex = 1;
      if (nameColIndex === -1) return;

      const colToTypeMap: Record<number, string> = {};
      
      for (let i = 1; i < headers.length; i++) {
        if (i === nameColIndex || !headers[i]) continue;
        
        const headerText = headers[i].toString().trim();
        const typeId = headerText.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        let existingType = newBinTypes.find(t => t.id === typeId);
        
        const headerCell = headerRow.getCell(i);
        let hexColor = undefined;
        if (headerCell.fill && headerCell.fill.type === 'pattern' && headerCell.fill.fgColor) {
           const argb = headerCell.fill.fgColor.argb;
           if (argb) {
             hexColor = '#' + (argb.length === 8 ? argb.substring(2) : argb);
           }
        }
        
        if (!existingType) {
          existingType = {
             id: typeId,
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
        colToTypeMap[i] = typeId;
      }
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; 
        
        const rowValues = row.values as any[];
        const name = rowValues[nameColIndex]?.toString();
        if (!name) return;
        
        Object.entries(colToTypeMap).forEach(([colIndexStr, typeId]) => {
           const colIndex = parseInt(colIndexStr, 10);
           const cell = row.getCell(colIndex);
           
           let count = 0;
           if (typeof cell.value === 'number') {
              count = cell.value;
           } else if (typeof cell.value === 'string') {
              count = parseInt(cell.value, 10) || 0;
           } else if (cell.value && typeof cell.value === 'object' && 'result' in cell.value) {
              count = parseInt(cell.value.result as string, 10) || 0;
           }
           
           if (count > 0) {
              let cellHexColor = undefined;
              if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                 const argb = cell.fill.fgColor.argb;
                 if (argb) {
                   cellHexColor = '#' + (argb.length === 8 ? argb.substring(2) : argb);
                 }
              }

              importedBins.push({
                 name,
                 zone: "Excel",
                 type: typeId,
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
        alert("Aucune donnée valide trouvée dans le fichier.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier Excel.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };`;

code = code.replace(regex, newUpload);
fs.writeFileSync('src/components/ListView.tsx', code);
