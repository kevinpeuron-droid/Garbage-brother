const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  console.log(Object.keys(wb.csv));
}
test();
