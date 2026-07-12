const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  console.log(wb.worksheets.length);
  console.log(wb.worksheets[0] ? 'exists' : 'undefined');
}
test();
