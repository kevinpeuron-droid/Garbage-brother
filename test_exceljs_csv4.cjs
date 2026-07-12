const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const keys = [];
  for (let k in wb.csv) {
    keys.push(k);
  }
  console.log(keys);
}
test();
