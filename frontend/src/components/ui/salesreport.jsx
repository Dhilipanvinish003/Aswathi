/* eslint-disable react-hooks/exhaustive-deps */
import API_BASE_URL from "../../config/api";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { exportSimpleTable } from "../../utils/excelExport";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const API = `${API_BASE_URL}/salesinvoices`;

// Helper to chunk records cleanly across PDF pages without table/row cutting
const chunkRecords = (records, firstPageMax = 20, otherPageMax = 24) => {
  if (!records || records.length === 0) return [[]];
  if (records.length <= firstPageMax) return [records];
  const pages = [];
  pages.push(records.slice(0, firstPageMax));
  let start = firstPageMax;
  while (start < records.length) {
    pages.push(records.slice(start, start + otherPageMax));
    start += otherPageMax;
  }
  return pages;
};

const SalesReport = ({ onClose, onMinimize, title = "Sales Report" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);
  const fromDateFp = useRef(null);
  const toDateFp = useRef(null);

  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({ fromDate: "", toDate: TODAY, clientName: "" });

  useEffect(() => {
    if (isMinimized) return;
    if (!fromDateRef.current) return;
    fromDateFp.current = flatpickr(fromDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      allowInput: true,
      defaultDate: filters.fromDate ? toDmy(filters.fromDate) : "",
      onChange: (selectedDates, dateStr) => {
        setFilters(p => ({ ...p, fromDate: toYmd(dateStr) }));
      },
    });
    return () => {
      fromDateFp.current?.destroy();
      fromDateFp.current = null;
    };
  }, [isMinimized]);

  useEffect(() => {
    if (fromDateFp.current) {
      fromDateFp.current.setDate(filters.fromDate ? toDmy(filters.fromDate) : "", false);
    }
  }, [filters.fromDate]);

  useEffect(() => {
    if (isMinimized) return;
    if (!toDateRef.current) return;
    toDateFp.current = flatpickr(toDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      allowInput: true,
      defaultDate: filters.toDate ? toDmy(filters.toDate) : "",
      onChange: (selectedDates, dateStr) => {
        setFilters(p => ({ ...p, toDate: toYmd(dateStr) }));
      },
    });
    return () => {
      toDateFp.current?.destroy();
      toDateFp.current = null;
    };
  }, [isMinimized]);

  useEffect(() => {
    if (toDateFp.current) {
      toDateFp.current.setDate(filters.toDate ? toDmy(filters.toDate) : "", false);
    }
  }, [filters.toDate]);

  const [clientList, setClientList] = useState([]);
  const [data, setData] = useState([]);

  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab === "pending" ? "pending" : "main";
  });
  const [pendingData, setPendingData] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const fmt = (val) => Number(val || 0).toFixed(2);
  const fmtDate = (d) => {
    if (!d) return "";
    if (typeof d === "string") {
      const clean = d.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, day] = clean.split("-");
        return `${day}/${m}/${y}`;
      }
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fmtHsn = (val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (str.includes(",")) {
      return str.split(",")[0].trim();
    }
    return str;
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API}/report/customers`);
      const json = await res.json();
      setClientList(Array.isArray(json) ? json : []);
    } catch {
      setClientList([]);
    }
  };

  const loadReport = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.clientName) params.set("clientName", f.clientName);
      const res = await fetch(`${API}/report/filters?${params}`);
      const json = await res.json();
      const records = Array.isArray(json) ? json : [];
      setData(records);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingReport = useCallback(async (f) => {
    setLoadingPending(true);
    try {
      const params = new URLSearchParams();
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.clientName) params.set("clientName", f.clientName);
      const res = await fetch(`${API}/report/pending-bills?${params}`);
      const json = await res.json();
      setPendingData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setPendingData([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const generateBoth = useCallback((f) => {
    loadReport(f);
    loadPendingReport(f);
  }, [loadReport, loadPendingReport]);

  useEffect(() => {
    fetchClients();
    generateBoth({ fromDate: "", toDate: "", clientName: "" });
  }, [generateBoth]);

  const handleClose = () => { if (onClose) onClose(); else navigate(-1); };
  const handleMinimize = () => { setIsMinimized(true); if (onMinimize) onMinimize(); };

  // Main report totals
  const totals = data.reduce((acc, r) => ({
    total_invoice_value: acc.total_invoice_value + Number(r.total_invoice_value || 0),
    paid_amount:         acc.paid_amount         + Number(r.paid_amount         || 0),
    balance_amount:      acc.balance_amount      + Number(r.balance_amount      || 0),
    taxable_value:       acc.taxable_value       + Number(r.taxable_value       || 0),
    total_qty:           acc.total_qty           + Number(r.total_qty           || 0),
    cgst_amount:         acc.cgst_amount         + Number(r.cgst_amount         || 0),
    sgst_amount:         acc.sgst_amount         + Number(r.sgst_amount         || 0),
    igst_amount:         acc.igst_amount         + Number(r.igst_amount         || 0),
  }), { total_invoice_value: 0, paid_amount: 0, balance_amount: 0, taxable_value: 0, total_qty: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0 });

  // Pending report totals
  const pendingTotals = pendingData.reduce((acc, r) => ({
    bill_amount:    acc.bill_amount    + Number(r.bill_amount    || 0),
    paid_amount:    acc.paid_amount    + Number(r.paid_amount    || 0),
    balance_amount: acc.balance_amount + Number(r.balance_amount || 0),
  }), { bill_amount: 0, paid_amount: 0, balance_amount: 0 });

  const handlePrint = () => {
    const fromStr = filters.fromDate ? fmtDate(filters.fromDate) : "—";
    const toStr = filters.toDate ? fmtDate(filters.toDate) : "—";
    const customerStr = filters.clientName ? filters.clientName.toUpperCase() : "ALL CUSTOMERS";

    const win = window.open("", "", "width=1200,height=800");
    if (!win) return;

    const htmlContent = activeTab === "pending"
      ? `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #000; width: 100%; box-sizing: border-box; padding: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; letter-spacing: 0.5px;">PENDING BILLS DETAILS</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 4px;">
            <span>From : ${fromStr} To : ${toStr}</span>
            <span>Customer : ${customerStr}</span>
          </div>
          <div style="border-bottom: 1.5px solid #000; margin-bottom: 4px;"></div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; color: #000; table-layout: fixed;">
            <colgroup>
              <col style="width: 6%" />
              <col style="width: 34%" />
              <col style="width: 15%" />
              <col style="width: 15%" />
              <col style="width: 10%" />
              <col style="width: 10%" />
              <col style="width: 10%" />
            </colgroup>
            <thead>
              <tr style="border-bottom: 1.5px solid #000;">
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">SNO</th>
                <th style="text-align: left; padding: 4px 2px; font-weight: bold;">CUSTOMER NAME</th>
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">BILL NO</th>
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">DATE</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">BILL AMOUNT</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">PAID AMOUNT</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">BALANCE DUE</th>
              </tr>
            </thead>
            <tbody>
              ${pendingData.map((row, i) => `
                <tr style="border: none; page-break-inside: avoid;">
                  <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${i + 1}</td>
                  <td style="text-align: left; padding: 2px 2px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${row.customer_name || ""}</td>
                  <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${row.invoice_no || ""}</td>
                  <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${fmtDate(row.invoice_date)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(row.bill_amount)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(row.paid_amount)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(row.balance_amount)}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; font-weight: bold; page-break-inside: avoid;">
                <td colspan="4" style="text-align: right; padding: 4px 4px; text-transform: uppercase;">TOTAL</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(pendingTotals.bill_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(pendingTotals.paid_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(pendingTotals.balance_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
      : `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #000; width: 100%; box-sizing: border-box; padding: 8px 12px;">
          <div style="text-align: center; margin-bottom: 6px;">
            <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; letter-spacing: 0.5px;">SALES DETAILS</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5pt; font-weight: bold; margin-bottom: 4px;">
            <span>From : ${fromStr} To : ${toStr}</span>
            ${filters.clientName ? `<span>Customer : ${customerStr}</span>` : ""}
          </div>
          <div style="border-bottom: 1.5px solid #000; margin-bottom: 2px;"></div>
          <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; color: #000; table-layout: fixed;">
            <colgroup>
              <col style="width: 13%" />
              <col style="width: 22%" />
              <col style="width: 6%" />
              <col style="width: 6.5%" />
              <col style="width: 6.5%" />
              <col style="width: 7.5%" />
              <col style="width: 7%" />
              <col style="width: 3.5%" />
              <col style="width: 4.5%" />
              <col style="width: 6.5%" />
              <col style="width: 4.5%" />
              <col style="width: 6.5%" />
              <col style="width: 4.5%" />
              <col style="width: 7.5%" />
            </colgroup>
            <thead>
              <tr style="border-bottom: 1.5px solid #000;">
                <th style="text-align: left; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">GSTIN</th>
                <th style="text-align: left; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">NAME</th>
                <th style="text-align: center; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">HSN\\SAC</th>
                <th style="text-align: center; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">Invoice No</th>
                <th style="text-align: center; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">Date</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom; line-height: 1.15;">TOTAL<br/>INVOICE<br/>VALUE</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom; line-height: 1.15;">TAXABLE<br/>VALUE</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">QTY</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">CGST %</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">CGST AMT</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">SGST %</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">SGST AMT</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">IGST %</th>
                <th style="text-align: right; padding: 3px 2px; font-weight: bold; vertical-align: bottom;">IGST AMT</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((row) => {
                const hasCgst = Number(row.cgst_amount) > 0 || Number(row.cgst_percent) > 0;
                const hasSgst = Number(row.sgst_amount) > 0 || Number(row.sgst_percent) > 0;
                const hasIgst = Number(row.igst_amount) > 0 || Number(row.igst_percent) > 0;
                return `
                  <tr style="border: none; page-break-inside: avoid;">
                    <td style="text-align: left; padding: 2px 2px; white-space: nowrap;">${row.gst_no || row.gstin || "—"}</td>
                    <td style="text-align: left; padding: 2px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${row.customer_name || ""}</td>
                    <td style="text-align: center; padding: 2px 2px; font-size: 7.5pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.hsn_sac || ""}">${fmtHsn(row.hsn_sac)}</td>
                    <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${row.invoice_no || ""}</td>
                    <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${fmtDate(row.invoice_date)}</td>
                    <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(row.total_invoice_value)}</td>
                    <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(row.taxable_value)}</td>
                    <td style="text-align: right; padding: 2px 2px; white-space: nowrap;">${Number(row.total_qty || 0)}</td>
                    <td style="text-align: right; padding: 2px 2px; white-space: nowrap;">${hasCgst ? fmt(row.cgst_percent) : "-"}</td>
                    <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${hasCgst ? fmt(row.cgst_amount) : "-"}</td>
                    <td style="text-align: right; padding: 2px 2px; white-space: nowrap;">${hasSgst ? fmt(row.sgst_percent) : "-"}</td>
                    <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${hasSgst ? fmt(row.sgst_amount) : "-"}</td>
                    <td style="text-align: right; padding: 2px 2px; white-space: nowrap;">${hasIgst ? fmt(row.igst_percent) : "-"}</td>
                    <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${hasIgst ? fmt(row.igst_amount) : "-"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
            <tfoot>
              <tr style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; font-weight: bold; page-break-inside: avoid;">
                <td colspan="5" style="text-align: right; padding: 4px 4px; text-transform: uppercase;">TOTAL</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(totals.total_invoice_value)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(totals.taxable_value)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">${Number(totals.total_qty || 0)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(totals.cgst_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(totals.sgst_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(totals.igst_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

    win.document.write(`
      <html>
        <head>
          <title>${activeTab === "pending" ? "Pending Bills Details" : "Sales Details"}</title>
          <style>
            @page { size: A4 landscape; margin: 6mm 5mm; }
            body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
            table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed; }
            tr { page-break-inside: avoid; }
            th, td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const exportPDF = async () => {
    if (!contentRef.current) return;
    const filename = activeTab === "pending"
      ? `PendingBills_${filters.clientName || "All"}.pdf`
      : `SalesReport_${filters.clientName || "All"}.pdf`;

    const el = contentRef.current;

    // 1. Synchronously update state to render the PDF layout inside contentRef
    flushSync(() => {
      setIsExportingPdf(true);
    });

    const prevElWidth = el.style.width;
    const prevElMaxWidth = el.style.maxWidth;
    const prevBorder = el.style.border;
    const prevBackground = el.style.background;
    const prevPadding = el.style.padding;

    el.style.width = "1080px";
    el.style.maxWidth = "none";
    el.style.border = "none";
    el.style.background = "#ffffff";
    el.style.padding = "0px";

    // Wait a brief moment for React and DOM paint
    await new Promise((resolve) => setTimeout(resolve, 80));

    const opt = {
      margin: [5, 4, 5, 4],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      pagebreak: { mode: ["legacy"] },
    };

    try {
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      // 2. Restore on-screen layout styles and switch back to old UI
      el.style.width = prevElWidth;
      el.style.maxWidth = prevElMaxWidth;
      el.style.border = prevBorder;
      el.style.background = prevBackground;
      el.style.padding = prevPadding;
      flushSync(() => {
        setIsExportingPdf(false);
      });
    }
  };

  const exportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filterInfo = [
      filters.fromDate ? `From: ${fmtDate(filters.fromDate)}` : "From: All",
      filters.toDate   ? `To: ${fmtDate(filters.toDate)}`     : "To: All",
      `Customer: ${filters.clientName || "All Customers"}`,
    ].join("   |   ");

    if (activeTab === "pending") {
      const dataRows = pendingData.map((r, i) => [
        i + 1,
        r.customer_name || "",
        r.invoice_no || "",
        Number(fmt(r.bill_amount)),
        Number(fmt(r.paid_amount)),
        Number(fmt(r.balance_amount)),
      ]);
      const totalsRow = [
        "TOTAL", "", "",
        Number(fmt(pendingTotals.bill_amount)),
        Number(fmt(pendingTotals.paid_amount)),
        Number(fmt(pendingTotals.balance_amount)),
      ];
      exportSimpleTable({
        filename:    `Pending_Bills_${filters.clientName || "All"}_${dateStr}.xlsx`,
        sheetName:   "Pending Bills",
        reportTitle: "PENDING BILLS REPORT",
        filterInfo,
        headers:   ["S.No", "Customer Name", "Invoice Number", "Bill Amount", "Paid Amount", "Balance Amount"],
        rows:      dataRows,
        totalsRow,
        colWidths: [6, 30, 20, 16, 16, 16],
        numCols:   [4, 5, 6],
        amountCols:[4, 5, 6],
        wrapCols:  [],
      });
    } else {
      const dataRows = data.map((r) => {
        const hasCgst = Number(r.cgst_amount) > 0 || Number(r.cgst_percent) > 0;
        const hasSgst = Number(r.sgst_amount) > 0 || Number(r.sgst_percent) > 0;
        const hasIgst = Number(r.igst_amount) > 0 || Number(r.igst_percent) > 0;
        return [
          r.gst_no || r.gstin || "",
          r.customer_name || "",
          fmtHsn(r.hsn_sac),
          r.invoice_no || "",
          fmtDate(r.invoice_date),
          Number(fmt(r.total_invoice_value)),
          Number(fmt(r.taxable_value)),
          Number(r.total_qty || 0),
          hasCgst ? Number(fmt(r.cgst_percent)) : "-",
          hasCgst ? Number(fmt(r.cgst_amount)) : "-",
          hasSgst ? Number(fmt(r.sgst_percent)) : "-",
          hasSgst ? Number(fmt(r.sgst_amount)) : "-",
          hasIgst ? Number(fmt(r.igst_percent)) : "-",
          hasIgst ? Number(fmt(r.igst_amount)) : "-",
        ];
      });
      const totalsRow = [
        "TOTAL", "", "", "", "",
        Number(fmt(totals.total_invoice_value)),
        Number(fmt(totals.taxable_value)),
        Number(totals.total_qty || 0),
        "-",
        Number(fmt(totals.cgst_amount)),
        "-",
        Number(fmt(totals.sgst_amount)),
        "-",
        Number(fmt(totals.igst_amount)),
      ];
      exportSimpleTable({
        filename:    `Sales_Report_${filters.clientName || "All"}_${dateStr}.xlsx`,
        sheetName:   "Sales Report",
        reportTitle: "SALES GST REPORT",
        filterInfo,
        headers:   [
          "GSTIN", "NAME", "HSN/SAC", "Invoice No", "Date",
          "TOTAL INVOICE VALUE", "TAXABLE VALUE", "QTY",
          "CGST %", "CGST AMT", "SGST %", "SGST AMT",
          "IGST %", "IGST AMT"
        ],
        rows:      dataRows,
        totalsRow,
        colWidths: [18, 30, 12, 14, 12, 18, 16, 8, 10, 14, 10, 14, 10, 14],
        numCols:   [6, 7, 8, 9, 10, 11, 12, 13, 14],
        amountCols:[6, 7, 9, 10, 11, 12, 13, 14],
        wrapCols:  [2],
      });
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
        <button onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600">
          <div className="w-3 h-3 border border-white/50" />
          {title}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"}`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200 ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* ── Title Bar ── */}
        <div onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none">
          <span className="text-xs font-bold tracking-wide">{title}</span>
          <div className="flex shrink-0">
            <button onClick={handleMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize"><Minus size={12} strokeWidth={3} /></button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Maximize"><Square size={10} strokeWidth={3} /></button>
            <button onClick={handleClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5"><X size={14} strokeWidth={3} /></button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input ref={fromDateRef}
              placeholder="Select From Date"
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input ref={toDateRef}
              placeholder="Select To Date"
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">CUSTOMER NAME</label>
            <select value={filters.clientName}
              onChange={(e) => {
                const updated = { ...filters, clientName: e.target.value };
                setFilters(updated);
                generateBoth(updated);
              }}
              className="w-[210px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: "26px" }}>
              <option value="">-- ALL CUSTOMERS --</option>
              {clientList.map((c, i) => (
                <option key={i} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          <div className="ml-20 flex gap-5">
            <button
              onClick={() => setActiveTab("main")}
              className={`text-[10px] px-4 py-1 font-bold border ${activeTab === "main" ? "bg-[#1a5ea8] text-white border-[#154c8a]" : "bg-white text-black border-gray-400 hover:bg-gray-100 active:bg-gray-200"}`}
              style={{ letterSpacing: "0.5px" }}>
              MAIN REPORT
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`text-[10px] px-4 py-1 font-bold border ${activeTab === "pending" ? "bg-[#1a5ea8] text-white border-[#154c8a]" : "bg-white text-black border-gray-400 hover:bg-gray-100 active:bg-gray-200"}`}
              style={{ letterSpacing: "0.5px" }}>
              PENDING REPORT
            </button>
          </div>

          <div className="flex gap-2 ml-auto items-end pb-0">
            <button onClick={() => generateBoth(filters)}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}>
              GENERATE REPORT
            </button>
            <button onClick={handleClose}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}>
              CLOSE
            </button>
          </div>
        </div>

        {/* ── Report Area ── */}
        <div className="flex-1 overflow-auto bg-[#f4f4f4] custom-scrollbar">

          {/* Action strip */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#ececec] border-b border-gray-300 no-print">
            <button onClick={exportExcel}
              className="bg-green-600 text-white text-[10px] px-3 py-1 font-bold border border-green-700 hover:bg-green-700 active:bg-green-800"
              style={{ letterSpacing: "0.5px" }}>
              EXPORT EXCEL
            </button>
            <button onClick={handlePrint}
              className="bg-[#1a5ea8] text-white text-[10px] px-3 py-1 font-bold border border-[#154c8a] hover:bg-[#154c8a] flex items-center gap-1">
              <Printer size={10} /> PRINT
            </button>
            <button onClick={exportPDF}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a]">
              EXPORT PDF
            </button>
          </div>

          {/* White report canvas */}
          <div className="bg-white mx-2 my-2 border border-gray-300" ref={contentRef}>

            {isExportingPdf ? (
              /* ── CLEAN ACCOUNTING PDF LAYOUT (Matches Image 1) ── */
              <div style={{ width: "1080px", background: "#ffffff", boxSizing: "border-box", color: "#000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                {activeTab === "pending" ? (
                  chunkRecords(pendingData, 20, 24).map((pageRows, pageIdx, pagesArr) => {
                    const isFirstPage = pageIdx === 0;
                    const isLastPage = pageIdx === pagesArr.length - 1;
                    return (
                      <div
                        key={pageIdx}
                        className={pageIdx < pagesArr.length - 1 ? "html2pdf__page-break" : ""}
                        style={{
                          width: "1080px",
                          height: "725px",
                          background: "#ffffff",
                          boxSizing: "border-box",
                          color: "#000",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          pageBreakAfter: pageIdx < pagesArr.length - 1 ? "always" : "auto",
                          padding: "8px 12px",
                        }}
                      >
                        {/* Framed Page Box matching Reference Image */}
                        <div
                          style={{
                            border: "1px solid #777",
                            height: "705px",
                            boxSizing: "border-box",
                            padding: "10px 14px 10px 14px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            background: "#ffffff",
                          }}
                        >
                          {/* Top Section: Header + Table */}
                          <div>
                            {isFirstPage ? (
                              <>
                                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textUnderlineOffset: "3px", letterSpacing: "0.5px" }}>PENDING BILLS DETAILS</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8.5pt", fontWeight: "bold", marginBottom: "4px" }}>
                                  <span>From : {filters.fromDate ? fmtDate(filters.fromDate) : "—"} To : {filters.toDate ? fmtDate(filters.toDate) : "—"}</span>
                                  <span>Customer : {filters.clientName ? filters.clientName.toUpperCase() : "ALL CUSTOMERS"}</span>
                                  {pagesArr.length > 1 && <span>Page {pageIdx + 1} of {pagesArr.length}</span>}
                                </div>
                                <div style={{ borderBottom: "1.5px solid #000", marginBottom: "2px" }}></div>
                              </>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8pt", fontWeight: "bold", marginBottom: "4px", paddingBottom: "2px", borderBottom: "1.5px solid #000" }}>
                                <span>PENDING BILLS DETAILS (Continued)</span>
                                <span>From : {filters.fromDate ? fmtDate(filters.fromDate) : "—"} To : {filters.toDate ? fmtDate(filters.toDate) : "—"}</span>
                                <span>Page {pageIdx + 1} of {pagesArr.length}</span>
                              </div>
                            )}

                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", color: "#000", tableLayout: "fixed" }}>
                              <colgroup>
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "34%" }} />
                                <col style={{ width: "15%" }} />
                                <col style={{ width: "15%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "10%" }} />
                              </colgroup>
                              <thead>
                                <tr style={{ borderBottom: "1.5px solid #000" }}>
                                  <th style={{ textAlign: "center", padding: "4px 2px", fontWeight: "bold" }}>SNO</th>
                                  <th style={{ textAlign: "left", padding: "4px 2px", fontWeight: "bold" }}>CUSTOMER NAME</th>
                                  <th style={{ textAlign: "center", padding: "4px 2px", fontWeight: "bold" }}>BILL NO</th>
                                  <th style={{ textAlign: "center", padding: "4px 2px", fontWeight: "bold" }}>DATE</th>
                                  <th style={{ textAlign: "right", padding: "4px 2px", fontWeight: "bold" }}>BILL AMOUNT</th>
                                  <th style={{ textAlign: "right", padding: "4px 2px", fontWeight: "bold" }}>PAID AMOUNT</th>
                                  <th style={{ textAlign: "right", padding: "4px 2px", fontWeight: "bold" }}>BALANCE DUE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageRows.map((row, i) => (
                                  <tr key={i} style={{ border: "none" }}>
                                    <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap" }}>{pageIdx * 20 + i + 1}</td>
                                    <td style={{ textAlign: "left", padding: "2px 2px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row.customer_name}>{row.customer_name || ""}</td>
                                    <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap" }}>{row.invoice_no || ""}</td>
                                    <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap" }}>{fmtDate(row.invoice_date)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(row.bill_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(row.paid_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(row.balance_amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Bottom Section: Totals Pinned at Bottom + Accent Line */}
                          <div style={{ marginTop: "auto" }}>
                            {isLastPage && (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", color: "#000", tableLayout: "fixed" }}>
                                <colgroup>
                                  <col style={{ width: "6%" }} />
                                  <col style={{ width: "34%" }} />
                                  <col style={{ width: "15%" }} />
                                  <col style={{ width: "15%" }} />
                                  <col style={{ width: "10%" }} />
                                  <col style={{ width: "10%" }} />
                                  <col style={{ width: "10%" }} />
                                </colgroup>
                                <tfoot>
                                  <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", fontWeight: "bold" }}>
                                    <td colSpan="4" style={{ textAlign: "right", padding: "4px 4px", textTransform: "uppercase" }}>TOTAL :</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(pendingTotals.bill_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(pendingTotals.paid_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(pendingTotals.balance_amount)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                            <div style={{ borderBottom: "1px solid #777", marginTop: "14px", marginBottom: "2px" }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  chunkRecords(data, 20, 24).map((pageRows, pageIdx, pagesArr) => {
                    const isFirstPage = pageIdx === 0;
                    const isLastPage = pageIdx === pagesArr.length - 1;
                    return (
                      <div
                        key={pageIdx}
                        className={pageIdx < pagesArr.length - 1 ? "html2pdf__page-break" : ""}
                        style={{
                          width: "1080px",
                          height: "725px",
                          background: "#ffffff",
                          boxSizing: "border-box",
                          color: "#000",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          pageBreakAfter: pageIdx < pagesArr.length - 1 ? "always" : "auto",
                          padding: "8px 12px",
                        }}
                      >
                        {/* Framed Page Box matching Reference Image */}
                        <div
                          style={{
                            border: "1px solid #777",
                            height: "705px",
                            boxSizing: "border-box",
                            padding: "10px 14px 10px 14px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            background: "#ffffff",
                          }}
                        >
                          {/* Top Section: Header + Table */}
                          <div>
                            {isFirstPage ? (
                              <>
                                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textUnderlineOffset: "3px", letterSpacing: "0.5px" }}>SALES DETAILS</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8.5pt", fontWeight: "bold", marginBottom: "6px" }}>
                                  <span>From : {filters.fromDate ? fmtDate(filters.fromDate) : "—"} To : {filters.toDate ? fmtDate(filters.toDate) : "—"}</span>
                                  {filters.clientName && <span>Customer : {filters.clientName.toUpperCase()}</span>}
                                  {pagesArr.length > 1 && <span>Page {pageIdx + 1} of {pagesArr.length}</span>}
                                </div>
                                <div style={{ borderBottom: "1.5px solid #000", marginBottom: "8px" }}></div>
                              </>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8pt", fontWeight: "bold", marginBottom: "6px", paddingBottom: "2px", borderBottom: "1.5px solid #000" }}>
                                <span>SALES DETAILS (Continued)</span>
                                <span>From : {filters.fromDate ? fmtDate(filters.fromDate) : "—"} To : {filters.toDate ? fmtDate(filters.toDate) : "—"}</span>
                                <span>Page {pageIdx + 1} of {pagesArr.length}</span>
                              </div>
                            )}

                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt", color: "#000", tableLayout: "fixed" }}>
                              <colgroup>
                                <col style={{ width: "10.5%" }} />
                                <col style={{ width: "18.5%" }} />
                                <col style={{ width: "5.5%" }} />
                                <col style={{ width: "6.0%" }} />
                                <col style={{ width: "6.5%" }} />
                                <col style={{ width: "7.5%" }} />
                                <col style={{ width: "7.0%" }} />
                                <col style={{ width: "3.5%" }} />
                                <col style={{ width: "4.5%" }} />
                                <col style={{ width: "6.5%" }} />
                                <col style={{ width: "4.5%" }} />
                                <col style={{ width: "6.5%" }} />
                                <col style={{ width: "5.0%" }} />
                                <col style={{ width: "8.0%" }} />
                              </colgroup>
                              <thead>
                                <tr style={{ borderBottom: "1.5px solid #000", height: "36px" }}>
                                  <th style={{ textAlign: "left", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>GSTIN</th>
                                  <th style={{ textAlign: "left", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>NAME</th>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>HSN\SAC</th>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>Invoice No</th>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>Date</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle", lineHeight: "1.15" }}>TOTAL<br />INVOICE<br />VALUE</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle", lineHeight: "1.15" }}>TAXABLE<br />VALUE</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>QTY</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>CGST %</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>CGST AMT</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>SGST %</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>SGST AMT</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>IGST %</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>IGST AMT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageRows.map((row, i) => {
                                  const hasCgst = Number(row.cgst_amount) > 0 || Number(row.cgst_percent) > 0;
                                  const hasSgst = Number(row.sgst_amount) > 0 || Number(row.sgst_percent) > 0;
                                  const hasIgst = Number(row.igst_amount) > 0 || Number(row.igst_percent) > 0;
                                  return (
                                    <tr key={i} style={{ border: "none" }}>
                                      <td style={{ textAlign: "left", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{row.gst_no || row.gstin || "—"}</td>
                                      <td style={{ textAlign: "left", padding: "2px 2px", whiteSpace: "normal", wordBreak: "normal", overflowWrap: "break-word", lineHeight: "1.15", fontWeight: "500", verticalAlign: "top" }} title={row.customer_name}>{row.customer_name || ""}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", fontSize: "7.5pt", whiteSpace: "nowrap", verticalAlign: "top" }} title={row.hsn_sac || ""}>{fmtHsn(row.hsn_sac)}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{row.invoice_no || ""}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{fmtDate(row.invoice_date)}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" }}>{fmt(row.total_invoice_value)}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" }}>{fmt(row.taxable_value)}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{Number(row.total_qty || 0)}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasCgst ? fmt(row.cgst_percent) : "-"}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasCgst ? fmt(row.cgst_amount) : "-"}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasSgst ? fmt(row.sgst_percent) : "-"}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasSgst ? fmt(row.sgst_amount) : "-"}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasIgst ? fmt(row.igst_percent) : "-"}</td>
                                      <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" }}>{hasIgst ? fmt(row.igst_amount) : "-"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Bottom Section: Totals Pinned at Bottom + Accent Line */}
                          <div style={{ marginTop: "auto" }}>
                            {isLastPage && (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt", color: "#000", tableLayout: "fixed" }}>
                                <colgroup>
                                  <col style={{ width: "10.5%" }} />
                                  <col style={{ width: "18.5%" }} />
                                  <col style={{ width: "5.5%" }} />
                                  <col style={{ width: "6.0%" }} />
                                  <col style={{ width: "6.5%" }} />
                                  <col style={{ width: "7.5%" }} />
                                  <col style={{ width: "7.0%" }} />
                                  <col style={{ width: "3.5%" }} />
                                  <col style={{ width: "4.5%" }} />
                                  <col style={{ width: "6.5%" }} />
                                  <col style={{ width: "4.5%" }} />
                                  <col style={{ width: "6.5%" }} />
                                  <col style={{ width: "5.0%" }} />
                                  <col style={{ width: "8.0%" }} />
                                </colgroup>
                                <tfoot>
                                  <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", fontWeight: "bold" }}>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "4px 4px", textTransform: "uppercase" }}>TOTAL :</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(totals.total_invoice_value)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(totals.taxable_value)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(totals.cgst_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(totals.sgst_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(totals.igst_amount)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                            {/* Bottom accent line matching reference image (Y=668-669) */}
                            <div style={{ borderBottom: "1px solid #777", marginTop: "14px", marginBottom: "2px" }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ── EXISTING ON-SCREEN OLD UI ── */
              <>
                {/* Report heading */}
                <div className="border-b border-gray-300 px-4 py-2 bg-white">
                  <div className="text-[13px] font-bold text-black tracking-wide uppercase">
                    {activeTab === "pending" ? "Pending Bills Report" : "Sales Report"}
                  </div>
                  <div className="flex gap-8 mt-1 text-[10px] text-gray-700 font-semibold">
                    <span>FROM : <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate) : "—"}</span></span>
                    <span>TO : <span className="text-black">{filters.toDate ? fmtDate(filters.toDate) : "—"}</span></span>
                    <span>CUSTOMER : <span className="text-black uppercase">{filters.clientName || "ALL CUSTOMERS"}</span></span>
                  </div>
                </div>

                {/* ── MAIN REPORT TABLE (OLD UI) ── */}
                {activeTab === "main" && (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse table-auto min-w-full" style={{ fontSize: "13px", fontFamily: "Arial, sans-serif" }}>
                      <thead>
                        <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                          {[
                            ["SNO",                 "center", "36px"],
                            ["GST NO",              "left",   "110px"],
                            ["CUSTOMER NAME",       "left",   "300px"],
                            ["HSN/SAC",             "center", "80px"],
                            ["INVOICE NO",          "left",   "130px"],
                            ["DATE",                "center", "80px"],
                            ["TOTAL INVOICE VALUE", "right",  "110px"],
                            ["PAID AMOUNT",         "right",  "95px"],
                            ["BALANCE DUE",         "right",  "95px"],
                            ["TAXABLE VALUE",       "right",  "95px"],
                            ["QTY",                 "right",  "50px"],
                            ["CGST %",              "right",  "58px"],
                            ["CGST AMT",            "right",  "82px"],
                            ["SGST %",              "right",  "58px"],
                            ["SGST AMT",            "right",  "82px"],
                            ["IGST %",              "right",  "58px"],
                            ["IGST AMT",            "right",  "82px"],
                          ].map(([label, align, width]) => (
                            <th key={label} style={{ border: "1px solid #8ca8c5", padding: "4px 5px", textAlign: align, fontWeight: "bold", whiteSpace: "nowrap", width, minWidth: width }}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan="17" style={{ textAlign: "center", padding: "20px", color: "#666", fontStyle: "italic", border: "1px solid #ddd" }}>Loading...</td></tr>
                        ) : data.length > 0 ? (
                          <>
                            {data.map((row, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#333", whiteSpace: "nowrap" }}>{row.gst_no || row.gstin || <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{row.customer_name}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px" }} title={row.hsn_sac || ""}>{fmtHsn(row.hsn_sac) || <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>{row.invoice_no}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{fmtDate(row.invoice_date)}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#8b0000", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{fmt(row.total_invoice_value)}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#006400", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{fmt(row.paid_amount)}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#8b0000", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{fmt(row.balance_amount)}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.taxable_value)}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right" }}>{row.total_qty || "—"}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.cgst_percent) > 0 ? `${fmt(row.cgst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.cgst_amount) > 0 ? fmt(row.cgst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.sgst_percent) > 0 ? `${fmt(row.sgst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.sgst_amount) > 0 ? fmt(row.sgst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.igst_percent) > 0 ? `${fmt(row.igst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.igst_amount) > 0 ? fmt(row.igst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                              </tr>
                            ))}
                            <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                              <td colSpan="6" style={{ border: "1px solid #a0bbd0", padding: "4px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>TOTAL</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#8b0000", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.total_invoice_value)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#006400", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.paid_amount)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#8b0000", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.balance_amount)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.taxable_value)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right" }}>{totals.total_qty}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.cgst_amount)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.sgst_amount)}</td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.igst_amount)}</td>
                            </tr>
                          </>
                        ) : (
                          <tr><td colSpan="17" style={{ textAlign: "center", padding: "24px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>No sales records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── PENDING REPORT TABLE (OLD UI) ── */}
                {activeTab === "pending" && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border border-gray-600 border-collapse" style={{ fontSize: '13px', fontFamily: "'Tahoma','Arial',sans-serif" }}>
                      <thead>
                        <tr style={{ background: '#c5d7e9', color: '#0d2340', position: 'sticky', top: 0, zIndex: 10 }}>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 5px', textAlign: 'center', width: '42px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SNO</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>CUSTOMER NAME</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BILL NO</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DATE</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BILL AMOUNT</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PAID AMOUNT</th>
                          <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BALANCE DUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPending ? (
                          <tr><td colSpan="7" className="text-center py-8 text-gray-500 italic">Loading...</td></tr>
                        ) : pendingData.length > 0 ? (
                          <>
                            {pendingData.map((row, i) => (
                              <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"} hover:bg-yellow-50`}>
                                <td className="border border-gray-300 px-3 py-1.5 text-center">{i + 1}</td>
                                <td className="border border-gray-300 px-3 py-1.5 font-semibold text-blue-800">{row.customer_name}</td>
                                <td className="border border-gray-300 px-3 py-1.5 font-semibold text-blue-800">{row.invoice_no}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-gray-700">{fmtDate(row.invoice_date)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-700">{fmt(row.bill_amount)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-700">{fmt(row.paid_amount)}</td>
                                <td className="border border-gray-300 px-3 py-1.5 text-right font-bold text-gray-800">{fmt(row.balance_amount)}</td>
                              </tr>
                            ))}
                            <tr className="bg-[#dde3ec] font-bold border-t-2 border-gray-600">
                              <td colSpan="4" className="border border-gray-400 px-3 py-2 text-right uppercase">Total</td>
                              <td className="border border-gray-400 px-3 py-2 text-right text-gray-700">{fmt(pendingTotals.bill_amount)}</td>
                              <td className="border border-gray-400 px-3 py-2 text-right text-gray-700">{fmt(pendingTotals.paid_amount)}</td>
                              <td className="border border-gray-400 px-3 py-2 text-right text-gray-800 font-bold">{fmt(pendingTotals.balance_amount)}</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-10 text-gray-400 italic">
                              No pending bills found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0px white; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default SalesReport;
