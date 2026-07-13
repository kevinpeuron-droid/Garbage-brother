const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

const oldCode = `      if (file.name.toLowerCase().endsWith('.csv')) {
        const workbook = XLSX.read(data, { type: "array" });`;

const newCode = `      if (file.name.toLowerCase().endsWith('.csv')) {
        let text;
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(data);
        } catch (e) {
          text = new TextDecoder('windows-1252').decode(data);
        }
        const workbook = XLSX.read(text, { type: "string" });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/ListView.tsx', code);
