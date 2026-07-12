const ExcelJS = require('exceljs');
const fs = require('fs');

fs.writeFileSync('test.csv', 'A;B;C\n1;2;3');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = await wb.csv.readFile('test.csv');
  console.log('Returned ws:', ws ? 'exists' : 'undefined');
  console.log('Worksheets length:', wb.worksheets.length);
  if (wb.worksheets.length > 0) {
    console.log('First sheet:', wb.worksheets[0] ? 'exists' : 'undefined');
  }
}
test();
