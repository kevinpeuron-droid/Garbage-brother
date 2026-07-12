const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([["A", "B"], [1, 2]]);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
console.log(Object.keys(ws.A1));
