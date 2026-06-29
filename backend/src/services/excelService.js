const ExcelJS = require('exceljs');

async function exportToExcel(data, columns, name) {
  const workbook = new ExcelJS.Workbook();
  addSheet(workbook, 'Datos', columns, data);
  return workbook;
}

function addSheet(workbook, sheetName, columns, data) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width || 20,
  }));

  sheet.getRow(1).font = { bold: true, size: 12 };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e3a5f' },
  };
  sheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };

  data.forEach(row => sheet.addRow(row));
}

module.exports = { exportToExcel, addSheet };
