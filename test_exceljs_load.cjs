const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.getCell('A1').value = 'Test';
  const buffer = await wb.xlsx.writeBuffer();
  
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(buffer);
  console.log(wb2.worksheets.length);
  console.log(wb2.worksheets[0] ? 'exists' : 'undefined');
  console.log('Worksheet name:', wb2.worksheets[0]?.name);
}
test();
