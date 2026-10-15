/**
 * Professional Excel Export Utility — ERP System
 * Uses ExcelJS for full cell styling support.
 *
 * Palette:
 *   Header bg    : #1e3a5f  (dark navy)
 *   Header text  : #FFFFFF  (white)
 *   Month header : #2563eb  (blue-600)
 *   Month text   : #FFFFFF
 *   Total row    : #FFF9C4  (light yellow)  bold
 *   Grand total  : #DBEAFE  (light blue)    bold
 *   Alt row      : #EEF3FB  (very light blue)
 *   Border       : #A0AEC0
 */
import ExcelJS from "exceljs";

// ─── Shared style builders ──────────────────────────────────────────────────
function borderSide(style = "thin") {
  return { style, color: { argb: "A0AEC0" } };
}
function allBorder(style = "thin") {
  return { top: borderSide(style), left: borderSide(style), bottom: borderSide(style), right: borderSide(style) };
}
function thickTopBorder() {
  return { top: { style: "medium", color: { argb: "1e3a5f" } }, left: borderSide(), bottom: borderSide(), right: borderSide() };
}
function fill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function makeFont(opts) {
  return { name: "Calibri", size: opts.size || 11, bold: opts.bold || false, color: { argb: opts.color || "000000" } };
}
function makeAlign(h, wrap) {
  return { horizontal: h || "left", vertical: "middle", wrapText: wrap || false };
}

function styleHeaderRow(row, colCount) {
  row.height = 22;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill      = fill("1e3a5f");
    cell.font      = makeFont({ bold: true, color: "FFFFFF", size: 11 });
    cell.border    = allBorder();
    cell.alignment = makeAlign("center", false);
  }
}

function styleDataRow(row, rowIndex, colCount, numCols, wrapCols, amountCols = []) {
  const isAlt = rowIndex % 2 === 0;
  row.height = 18;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    if (isAlt) cell.fill = fill("EEF3FB");
    cell.border    = allBorder();
    cell.font      = makeFont({ size: 10 });
    const isNum    = numCols.includes(i);
    const isAmt    = amountCols.includes(i);
    const isWrap   = wrapCols.includes(i);
    cell.alignment = makeAlign(isNum || isAmt ? "right" : "left", isWrap);
    if (isAmt && typeof cell.value === "number") {
      cell.numFmt = "0.00";
    }
    if (isWrap && cell.value && String(cell.value).length > 40) row.height = 36;
  }
}

function styleMonthRow(row, colCount) {
  row.height = 20;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill      = fill("2563eb");
    cell.font      = makeFont({ bold: true, color: "FFFFFF", size: 11 });
    cell.border    = allBorder();
    cell.alignment = makeAlign("left", false);
  }
}

function styleTotalsRow(row, colCount, isGrand, amountCols = []) {
  row.height = 20;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill   = fill(isGrand ? "DBEAFE" : "FFF9C4");
    cell.font   = makeFont({ bold: true, size: isGrand ? 12 : 11, color: isGrand ? "1e3a5f" : "000000" });
    cell.border = isGrand ? thickTopBorder() : allBorder("thin");
    const isNum = typeof cell.value === "number";
    const isAmt = amountCols.includes(i);
    cell.alignment = makeAlign(isNum || isAmt ? "right" : "left", false);
    if ((isAmt || (amountCols.length === 0 && isNum)) && typeof cell.value === "number") {
      cell.numFmt = "0.00";
    }
  }
}

function addInfoBlock(ws, reportTitle, filterInfo) {
  const r1 = ws.addRow([reportTitle]);
  r1.getCell(1).font = makeFont({ bold: true, size: 14, color: "1e3a5f" });
  r1.getCell(1).alignment = makeAlign("left");
  r1.height = 24;
  if (filterInfo) {
    const r2 = ws.addRow([filterInfo]);
    r2.getCell(1).font = makeFont({ size: 10, color: "555555" });
    r2.height = 16;
  }
  const r3 = ws.addRow(["Generated: " + new Date().toLocaleString("en-IN")]);
  r3.getCell(1).font = makeFont({ size: 9, color: "888888" });
  r3.height = 14;
  ws.addRow([]);
}

async function downloadWorkbook(wb, filename) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * exportSimpleTable - Flat single-table reports
 */
export async function exportSimpleTable({
  filename, sheetName, reportTitle, filterInfo = "",
  headers, rows, totalsRow = null,
  colWidths, numCols = [], wrapCols = [],
  amountCols = [],
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP System";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  ws.columns = colWidths.map((w) => ({ width: w }));

  addInfoBlock(ws, reportTitle, filterInfo);

  const headerRow = ws.addRow(headers);
  styleHeaderRow(headerRow, headers.length);
  ws.views = [{ state: "frozen", ySplit: ws.rowCount }];

  rows.forEach((rowData, idx) => {
    const row = ws.addRow(rowData);
    styleDataRow(row, idx, headers.length, numCols, wrapCols, amountCols);
  });

  if (totalsRow) {
    const tr = ws.addRow(totalsRow);
    styleTotalsRow(tr, headers.length, true, amountCols);
  }

  await downloadWorkbook(wb, filename);
}

/**
 * exportGroupedTable - Month-grouped reports (Tax Purchase, Billwise, etc.)
 */
export async function exportGroupedTable({
  filename, sheetName, reportTitle, filterInfo = "",
  headers, groups, grandTotalsRow = null,
  colWidths, numCols = [], wrapCols = [],
  amountCols = [],
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP System";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  ws.columns = colWidths.map((w) => ({ width: w }));

  addInfoBlock(ws, reportTitle, filterInfo);

  const headerRow = ws.addRow(headers);
  styleHeaderRow(headerRow, headers.length);
  ws.views = [{ state: "frozen", ySplit: ws.rowCount }];

  let dataIdx = 0;
  for (const group of groups) {
    const mRow = ws.addRow([group.label]);
    styleMonthRow(mRow, headers.length);

    for (const rowData of group.rows) {
      const row = ws.addRow(rowData);
      styleDataRow(row, dataIdx, headers.length, numCols, wrapCols, amountCols);
      dataIdx++;
    }

    if (group.totalsRow) {
      const tr = ws.addRow(group.totalsRow);
      styleTotalsRow(tr, headers.length, false, amountCols);
    }
  }

  if (grandTotalsRow) {
    const gtr = ws.addRow(grandTotalsRow);
    styleTotalsRow(gtr, headers.length, true, amountCols);
  }

  await downloadWorkbook(wb, filename);
}
