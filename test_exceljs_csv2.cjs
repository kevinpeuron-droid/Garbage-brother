const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = await wb.csv.load('A;B;C\n1;2;3');
  console.log('Worksheets length:', wb.worksheets.length);
}
test();
