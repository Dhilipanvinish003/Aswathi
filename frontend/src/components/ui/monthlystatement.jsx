/* eslint-disable react-hooks/exhaustive-deps */
import API_BASE_URL from "../../config/api";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import { exportSimpleTable, exportGroupedTable } from "../../utils/excelExport";
const fmt = (n) => Number(n || 0).toFixed(2);

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

const PurchaseReport = ({ onMinimize, onClose, setIsMinimizedInternal, title }) => {
  const contentRef = useRef(null);
  const [data, setData] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const navigate = useNavigate();
  const [reportMode, setReportMode] = useState("billwise");

  const [receiptList, setReceiptList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [openBillNo, setOpenBillNo] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const billDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const modalContainerRef = useRef(null);

  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);
  const fromDateFp = useRef(null);
  const toDateFp = useRef(null);

  useOutsideClick([
    { ref: billDropdownRef, onClose: () => setOpenBillNo(false) },
    { ref: supplierDropdownRef, onClose: () => setOpenSupplier(false) },
    { ref: modalContainerRef, onClose: () => { if (!isMaximized) handleClose(); } }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);


  // Today Date 
  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({ fromdate: "", todate: TODAY, bill_no: "", supplier_name: "" });

  useEffect(() => {
    if (isMinimized) return;
    if (!fromDateRef.current) return;
    fromDateFp.current = flatpickr(fromDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      allowInput: true,
      defaultDate: filters.fromdate ? toDmy(filters.fromdate) : "",
      onChange: (selectedDates, dateStr) => {
        setFilters(p => ({ ...p, fromdate: toYmd(dateStr) }));
      },
    });
    return () => {
      fromDateFp.current?.destroy();
      fromDateFp.current = null;
    };
  }, [isMinimized]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fromDateFp.current) {
      fromDateFp.current.setDate(filters.fromdate ? toDmy(filters.fromdate) : "", false);
    }
  }, [filters.fromdate]);

  useEffect(() => {
    if (isMinimized) return;
    if (!toDateRef.current) return;
    toDateFp.current = flatpickr(toDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      allowInput: true,
      defaultDate: filters.todate ? toDmy(filters.todate) : "",
      onChange: (selectedDates, dateStr) => {
        setFilters(p => ({ ...p, todate: toYmd(dateStr) }));
      },
    });
    return () => {
      toDateFp.current?.destroy();
      toDateFp.current = null;
    };
  }, [isMinimized]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (toDateFp.current) {
      toDateFp.current.setDate(filters.todate ? toDmy(filters.todate) : "", false);
    }
  }, [filters.todate]);

  const baseApi = reportMode === "billwise"
    ? `${API_BASE_URL}/billpayment`
    : `${API_BASE_URL}/taxpurchases`;

  const generateReport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fromdate && filters.todate) { params.append("fromdate", filters.fromdate); params.append("todate", filters.todate); }
      if (filters.bill_no) params.append("billno", filters.bill_no);
      if (filters.supplier_name) params.append("suppliername", filters.supplier_name);
      const endpoint = reportMode === "billwise" ? `${baseApi}/report/filters` : `${baseApi}/report`;
      const res = await fetch(`${endpoint}?${params}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportMode, filters, baseApi]);

  useEffect(() => { generateReport(); }, [generateReport]);



  const fetchBillNos = async (q) => {
    const res = await fetch(`${baseApi}/billno/search?q=${encodeURIComponent(q)}`);
    setReceiptList(await res.json());
  };

  const fetchSuppliers = async (q) => {
    const endpoint = reportMode === "billwise" ? `${baseApi}/clients/search` : `${baseApi}/supplier/search`;
    const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setSupplierList([...new Set(d.map(r => r.supplier_name))].map(n => ({ supplier_name: n })));
  };

  const groupedData = useMemo(() => {
    if (!Array.isArray(data) || !data.length) return [];
    if (reportMode === "billwise") {
      const months = {};
      data.forEach(row => {
        const month = row.entry_date ? row.entry_date.substring(0, 7) : "Unknown";
        if (!months[month]) months[month] = [];
        months[month].push(row);
      });
      return Object.keys(months).sort().map(month => ({ month, transactions: months[month] }));
    } else {
      const months = {};
      data.forEach(row => {
        const month = row.bill_date ? row.bill_date.substring(0, 7) : "Unknown";
        if (!months[month]) months[month] = {};
        const bill = row.bill_no;
        if (!months[month][bill]) {
          months[month][bill] = {
            ...row, items: []
          };
        }
        if (row.item_name) {
          months[month][bill].items.push({
            item_name: row.item_name, hsn: row.hsn, uom: row.uom,
            quantity: row.quantity, price: row.price, amount: row.amount
          });
        }
      });
      return Object.keys(months).sort().map(month => {
        const bills = Object.values(months[month]);
        const totals = bills.reduce((acc, b) => ({
          subtotal: acc.subtotal + Number(b.subtotal || 0),
          cgst: acc.cgst + Number(b.cgst || 0),
          sgst: acc.sgst + Number(b.sgst || 0),
          igst: acc.igst + Number(b.igst || 0),
          other_charges: acc.other_charges + Number(b.other_charges || 0),
          discount: acc.discount + Number(b.discount || 0),
          grand_total: acc.grand_total + Number(b.grand_total || 0)
        }), { subtotal: 0, cgst: 0, sgst: 0, igst: 0, other_charges: 0, discount: 0, grand_total: 0 });
        return { month, bills, totals };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reportMode]);

  const overall = useMemo(() => {
    if (reportMode === "billwise") {
      return groupedData.reduce((acc, g) => {
        const t = g.transactions.reduce((tAcc, row) => ({
          bill_amount: tAcc.bill_amount + Number(row.bill_amount || 0),
          paid_amount: tAcc.paid_amount + Number(row.paid_amount || 0),
          balance_amount: tAcc.balance_amount + Number(row.balance_amount || 0),
          grand_total: tAcc.grand_total + Number(row.grand_total || 0)
        }), { bill_amount: 0, paid_amount: 0, balance_amount: 0, grand_total: 0 });
        return {
          bill_amount: acc.bill_amount + t.bill_amount,
          paid_amount: acc.paid_amount + t.paid_amount,
          balance_amount: acc.balance_amount + t.balance_amount,
          grand_total: acc.grand_total + t.grand_total
        };
      }, { bill_amount: 0, paid_amount: 0, balance_amount: 0, grand_total: 0 });
    } else {
      return groupedData.reduce((acc, g) => ({
        subtotal: acc.subtotal + g.totals.subtotal,
        cgst: acc.cgst + g.totals.cgst,
        sgst: acc.sgst + g.totals.sgst,
        igst: acc.igst + g.totals.igst,
        other_charges: acc.other_charges + g.totals.other_charges,
        discount: acc.discount + g.totals.discount,
        grand_total: acc.grand_total + g.totals.grand_total
      }), { subtotal: 0, cgst: 0, sgst: 0, igst: 0, other_charges: 0, discount: 0, grand_total: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedData, reportMode]);

  const taxPurchaseRows = useMemo(() => {
    if (reportMode !== "taxpurchase" || !groupedData.length) return [];
    const rows = [];
    groupedData.forEach(g => {
      (g.bills || []).forEach(b => {
        const totalQty = (b.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
        const firstHsn = (b.items || []).find(it => it.hsn)?.hsn || b.hsn || "";
        const taxable = Number(b.subtotal || 0);
        const cgstAmt = Number(b.cgst || 0);
        const sgstAmt = Number(b.sgst || 0);
        const igstAmt = Number(b.igst || 0);

        const cgstPct = taxable > 0 && cgstAmt > 0 ? (cgstAmt / taxable) * 100 : 0;
        const sgstPct = taxable > 0 && sgstAmt > 0 ? (sgstAmt / taxable) * 100 : 0;
        const igstPct = taxable > 0 && igstAmt > 0 ? (igstAmt / taxable) * 100 : 0;

        rows.push({
          gstin: b.gst_number || b.gst_no || "—",
          supplier_name: b.supplier_name || "",
          hsn_sac: firstHsn,
          invoice_no: b.bill_no || "",
          bill_date: b.bill_date || "",
          total_invoice_value: Number(b.grand_total || 0),
          taxable_value: taxable,
          total_qty: totalQty,
          cgst_percent: cgstPct,
          cgst_amount: cgstAmt,
          sgst_percent: sgstPct,
          sgst_amount: sgstAmt,
          igst_percent: igstPct,
          igst_amount: igstAmt,
        });
      });
    });
    return rows;
  }, [groupedData, reportMode]);

  const taxPurchaseTotals = useMemo(() => {
    return taxPurchaseRows.reduce((acc, r) => ({
      total_invoice_value: acc.total_invoice_value + Number(r.total_invoice_value || 0),
      taxable_value:       acc.taxable_value       + Number(r.taxable_value || 0),
      total_qty:           acc.total_qty           + Number(r.total_qty || 0),
      cgst_amount:         acc.cgst_amount         + Number(r.cgst_amount || 0),
      sgst_amount:         acc.sgst_amount         + Number(r.sgst_amount || 0),
      igst_amount:         acc.igst_amount         + Number(r.igst_amount || 0),
    }), { total_invoice_value: 0, taxable_value: 0, total_qty: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0 });
  }, [taxPurchaseRows]);

  const billwiseRows = useMemo(() => {
    if (reportMode !== "billwise" || !Array.isArray(data)) return [];
    return data.map((row, i) => ({
      sno: i + 1,
      receipt_no: row.receipt_no || "—",
      bill_no: row.bill_no || "",
      bill_date: row.bill_date || "",
      entry_date: row.entry_date || "",
      supplier_name: row.supplier_name || "",
      payment_mode: row.payment_mode || "",
      bank_name: row.bank_name || "—",
      bill_amount: Number(row.bill_amount || 0),
      paid_amount: Number(row.paid_amount || 0),
      balance_amount: Number(row.balance_amount || 0),
      grand_total: Number(row.grand_total || 0),
    }));
  }, [data, reportMode]);

  const billwiseTotals = useMemo(() => {
    return billwiseRows.reduce((acc, r) => ({
      bill_amount: acc.bill_amount + r.bill_amount,
      paid_amount: acc.paid_amount + r.paid_amount,
      balance_amount: acc.balance_amount + r.balance_amount,
      grand_total: acc.grand_total + r.grand_total,
    }), { bill_amount: 0, paid_amount: 0, balance_amount: 0, grand_total: 0 });
  }, [billwiseRows]);

  const handlePrint = () => {
    const fromStr = filters.fromdate ? fmtDate(filters.fromdate) : "—";
    const toStr = filters.todate ? fmtDate(filters.todate) : "—";
    const supplierStr = filters.supplier_name ? filters.supplier_name.toUpperCase() : "ALL SUPPLIERS";

    const win = window.open("", "", "width=1200,height=800");
    if (!win) return;

    const htmlContent = reportMode === "taxpurchase"
      ? `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #000; width: 100%; box-sizing: border-box; padding: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; letter-spacing: 0.5px;">TAX PURCHASE DETAILS</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 4px;">
            <span>From : ${fromStr} To : ${toStr}</span>
            <span>Supplier : ${supplierStr}</span>
          </div>
          <div style="border-bottom: 1.5px solid #000; margin-bottom: 4px;"></div>
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
              ${taxPurchaseRows.map((row) => {
                const hasCgst = Number(row.cgst_amount) > 0 || Number(row.cgst_percent) > 0;
                const hasSgst = Number(row.sgst_amount) > 0 || Number(row.sgst_percent) > 0;
                const hasIgst = Number(row.igst_amount) > 0 || Number(row.igst_percent) > 0;
                return `
                  <tr style="border: none; page-break-inside: avoid;">
                    <td style="text-align: left; padding: 2px 2px; white-space: nowrap;">${row.gstin || "—"}</td>
                    <td style="text-align: left; padding: 2px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${row.supplier_name || ""}</td>
                    <td style="text-align: center; padding: 2px 2px; font-size: 7.5pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.hsn_sac || ""}">${fmtHsn(row.hsn_sac)}</td>
                    <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${row.invoice_no || ""}</td>
                    <td style="text-align: center; padding: 2px 2px; white-space: nowrap;">${fmtDate(row.bill_date)}</td>
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
                <td colspan="5" style="text-align: right; padding: 4px 4px; text-transform: uppercase;">TOTAL :</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(taxPurchaseTotals.total_invoice_value)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(taxPurchaseTotals.taxable_value)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">${Number(taxPurchaseTotals.total_qty || 0)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(taxPurchaseTotals.cgst_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(taxPurchaseTotals.sgst_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; white-space: nowrap;">-</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums; white-space: nowrap;">${fmt(taxPurchaseTotals.igst_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
      : `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #000; width: 100%; box-sizing: border-box; padding: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; letter-spacing: 0.5px;">BILLWISE PAYMENT DETAILS</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: bold; margin-bottom: 4px;">
            <span>From : ${fromStr} To : ${toStr}</span>
            <span>Supplier : ${supplierStr}</span>
          </div>
          <div style="border-bottom: 1.5px solid #000; margin-bottom: 4px;"></div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; color: #000; table-layout: fixed;">
            <colgroup>
              <col style="width: 5%" />
              <col style="width: 10%" />
              <col style="width: 12%" />
              <col style="width: 10%" />
              <col style="width: 10%" />
              <col style="width: 25%" />
              <col style="width: 14%" />
              <col style="width: 14%" />
            </colgroup>
            <thead>
              <tr style="border-bottom: 1.5px solid #000;">
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">SNO</th>
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">ENTRY DATE</th>
                <th style="text-align: center; padding: 4px 2px; font-weight: bold;">BILL NO</th>
                <th style="text-align: left; padding: 4px 2px; font-weight: bold;">SUPPLIER NAME</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">BILL AMOUNT</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">PAID AMOUNT</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">BALANCE DUE</th>
                <th style="text-align: right; padding: 4px 2px; font-weight: bold;">GRAND TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${billwiseRows.map((row, i) => `
                <tr style="border: none; page-break-inside: avoid;">
                  <td style="text-align: center; padding: 2px 2px;">${i + 1}</td>
                  <td style="text-align: center; padding: 2px 2px;">${fmtDate(row.entry_date)}</td>
                  <td style="text-align: center; padding: 2px 2px;">${row.bill_no}</td>
                  <td style="text-align: left; padding: 2px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${row.supplier_name}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums;">${fmt(row.bill_amount)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums;">${fmt(row.paid_amount)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums;">${fmt(row.balance_amount)}</td>
                  <td style="text-align: right; padding: 2px 2px; font-variant-numeric: tabular-nums;">${fmt(row.grand_total)}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding: 4px 4px; text-transform: uppercase;">TOTAL :</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums;">${fmt(billwiseTotals.bill_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums;">${fmt(billwiseTotals.paid_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums;">${fmt(billwiseTotals.balance_amount)}</td>
                <td style="text-align: right; padding: 4px 2px; font-variant-numeric: tabular-nums;">${fmt(billwiseTotals.grand_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

    win.document.write(`
      <html>
        <head>
          <title>${reportMode === "taxpurchase" ? "Tax Purchase Details" : "Billwise Payment Details"}</title>
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
    const filename = reportMode === "taxpurchase"
      ? `TaxPurchaseReport_${filters.supplier_name || "All"}.pdf`
      : `BillwisePaymentReport_${filters.supplier_name || "All"}.pdf`;

    const el = contentRef.current;

    // 1. Synchronously update state to render the clean accounting PDF layout inside contentRef
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

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export. Please generate the report first.");
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filterInfo = [
      filters.fromdate ? `From: ${filters.fromdate}` : "From: All",
      filters.todate   ? `To: ${filters.todate}`     : "To: All",
      filters.supplier_name ? `Supplier: ${filters.supplier_name}` : "",
    ].filter(Boolean).join("   |   ");

    if (reportMode === "billwise") {
      // ── Billwise Payment Report ──
      const dataRows = data.map((row, i) => [
        i + 1,
        row.entry_date ? new Date(row.entry_date).toLocaleDateString("en-IN") : "",
        row.bill_no || "",
        row.supplier_name || "",
        Number(row.bill_amount || 0),
        Number(row.paid_amount || 0),
        Number(row.balance_amount || 0),
        Number(row.grand_total || 0),
      ]);
      exportSimpleTable({
        filename:    `Billwise_Payment_Report_${dateStr}.xlsx`,
        sheetName:   "Billwise Payment",
        reportTitle: "BILLWISE PAYMENT REPORT",
        filterInfo,
        headers:   ["S.No", "Entry Date", "Bill No", "Supplier Name", "Bill Amount", "Paid Amount", "Balance Amount", "Grand Total"],
        rows:      dataRows,
        totalsRow:  null,
        colWidths: [7, 14, 18, 32, 15, 15, 16, 15],
        numCols:   [5, 6, 7, 8],
        wrapCols:  [],
      });
    } else {
      // ── Tax Purchase Report (Grouped by Month) ──
      const TAX_HEADERS = [
        "S.No", "Bill No", "Bill Date", "Order No", "Supplier Name",
        "Item Name", "HSN", "UOM", "Qty", "Price", "Amount",
        "Subtotal", "CGST", "SGST", "IGST", "Other Charges", "Discount", "Grand Total"
      ];
      const groups = [];
      groupedData.forEach(group => {
        const monthLabel = new Date(group.month + "-01").toLocaleString("default", { month: "long", year: "numeric" });
        const groupRows = [];
        let sno = 1;
        group.bills.forEach(bill => {
          if (bill.items.length > 0) {
            bill.items.forEach((item, ii) => {
              groupRows.push([
                ii === 0 ? sno : "",
                ii === 0 ? (bill.bill_no || "") : "",
                ii === 0 ? (bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "") : "",
                ii === 0 ? (bill.order_no || "") : "",
                ii === 0 ? (bill.supplier_name || "") : "",
                item.item_name || "",
                item.hsn || "",
                item.uom || "",
                Number(item.quantity || 0),
                Number(item.price || 0),
                Number(item.amount || 0),
                ii === 0 ? Number(bill.subtotal || 0) : "",
                ii === 0 ? Number(bill.cgst || 0) : "",
                ii === 0 ? Number(bill.sgst || 0) : "",
                ii === 0 ? Number(bill.igst || 0) : "",
                ii === 0 ? Number(bill.other_charges || 0) : "",
                ii === 0 ? Number(bill.discount || 0) : "",
                ii === 0 ? Number(bill.grand_total || 0) : "",
              ]);
            });
          } else {
            groupRows.push([
              sno, bill.bill_no || "",
              bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "",
              bill.order_no || "", bill.supplier_name || "",
              "", "", "", 0, 0, 0,
              Number(bill.subtotal || 0),
              Number(bill.cgst || 0),
              Number(bill.sgst || 0),
              Number(bill.igst || 0),
              Number(bill.other_charges || 0),
              Number(bill.discount || 0),
              Number(bill.grand_total || 0),
            ]);
          }
          sno++;
        });
        groups.push({
          label: monthLabel,
          rows:  groupRows,
          totalsRow: [
            "", "", "", "", `${monthLabel} — TOTAL`,
            "", "", "", "", "", "",
            Number(group.totals.subtotal || 0),
            Number(group.totals.cgst || 0),
            Number(group.totals.sgst || 0),
            Number(group.totals.igst || 0),
            Number(group.totals.other_charges || 0),
            Number(group.totals.discount || 0),
            Number(group.totals.grand_total || 0),
          ],
        });
      });

      const grandTotalsRow = [
        "", "", "", "", "GRAND TOTAL",
        "", "", "", "", "", "",
        Number(overall.subtotal || 0),
        Number(overall.cgst || 0),
        Number(overall.sgst || 0),
        Number(overall.igst || 0),
        Number(overall.other_charges || 0),
        Number(overall.discount || 0),
        Number(overall.grand_total || 0),
      ];

      exportGroupedTable({
        filename:       `Tax_Purchase_Report_${dateStr}.xlsx`,
        sheetName:      "Tax Purchase Report",
        reportTitle:    "TAX PURCHASE REPORT",
        filterInfo,
        headers:        TAX_HEADERS,
        groups,
        grandTotalsRow,
        colWidths:      [6, 18, 12, 12, 26, 36, 10, 8, 8, 12, 12, 12, 10, 10, 10, 14, 12, 15],
        numCols:        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        wrapCols:       [6],
      });
    }
  };

  const handleMinimize = () => {
    if (setIsMinimizedInternal) setIsMinimizedInternal(true);
    onMinimize ? onMinimize() : setIsMinimized(true);
  };

  const handleClose = () => onClose ? onClose() : navigate(-1);

  if (isMinimized) return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
      <button onClick={() => { setIsMinimized(false); if (setIsMinimizedInternal) setIsMinimizedInternal(false); }}
        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600">
        <div className="w-3 h-3 border border-white/50" />
        {title || "Purchase Report"}
      </button>
    </div>
  );

  
 
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex",
        alignItems: isMaximized ? "stretch" : "center",
        justifyContent: isMaximized ? "stretch" : "center",
        background: isMaximized ? "transparent" : "rgba(0,0,0,0.45)",
        padding: isMaximized ? 0 : "0",
      }}
    >
      <div
        ref={modalContainerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          border: "2px solid #888",
          width: isMaximized ? "100%" : "calc(100vw - 40px)",
          maxWidth: isMaximized ? "100%" : "1500px",
          height: isMaximized ? "100%" : "90vh",
          background: "#f0f0f0",
          pointerEvents: "auto",
        }}
      >

        {/* ── TITLE BAR ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          style={{
            background: "linear-gradient(to right, #0050a0, #1478d4)",
            color: "white",
            padding: "3px 6px 3px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "default",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>{title || "Purchase / Tax Report"}</span>
            <select
              value={reportMode}
              onChange={(e) => {
                const mode = e.target.value;
                setReportMode(mode);
                setData([]);
                setFilters({ fromdate: "", todate: TODAY, bill_no: "", supplier_name: "" });
              }}
              style={{
                fontSize: "11px",
                border: "1px solid #aaa",
                borderRadius: "3px",
                padding: "2px 4px",
                background: "white",
                color: "black",
                outline: "none",
              }}
            >
              <option value="billwise">Billwise Payment Report</option>
              <option value="taxpurchase">Tax Purchase Report</option>
            </select>
          </div>
          <div style={{ display: "flex" }}>
            <button
              onClick={handleMinimize}
              title="Minimize"
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Minus size={12} strokeWidth={3} />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Down" : "Maximize"}
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Square size={10} strokeWidth={3} />
            </button>
            <button
              onClick={handleClose}
              style={{
                width: 32, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2,
              }}
              onMouseOver={e => e.currentTarget.style.background = "#e81123"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div
          style={{
            background: "#000",
            padding: "8px 16px 10px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {/* Left: filter fields */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>

            {/* FROM DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                ref={fromDateRef}
                placeholder="Select From Date"
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* TO DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                ref={toDateRef}
                placeholder="Select To Date"
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* BILL NUMBER */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="bill-dropdown" ref={billDropdownRef}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                BILL NUMBER
              </label>
              <input
                type="text"
                placeholder="Bill Number"
                value={filters.bill_no}
                onFocus={() => { setOpenBillNo(true); fetchBillNos(""); }}
                onChange={e => { const val = e.target.value.trim(); setFilters({ ...filters, bill_no: val }); fetchBillNos(val); }}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {openBillNo && receiptList.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    maxHeight: 200, overflowY: "auto", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {receiptList.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setFilters({ ...filters, bill_no: item.bill_no.trim() }); setOpenBillNo(false); }}
                      style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                      onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                      onMouseOut={e => e.currentTarget.style.background = "white"}
                    >
                      {item.bill_no}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUPPLIER NAME */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="supplier-dropdown" ref={supplierDropdownRef}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                SUPPLIER NAME
              </label>
              <input
                type="text"
                placeholder="Supplier Name"
                value={filters.supplier_name}
                onFocus={() => { setOpenSupplier(true); fetchSuppliers(""); }}
                onChange={e => { const val = e.target.value.trim(); setFilters({ ...filters, supplier_name: val }); fetchSuppliers(val); }}
                style={{
                  width: 150, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {openSupplier && supplierList.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    maxHeight: 200, overflowY: "auto",
                  }}
                >
                  {supplierList.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setFilters({ ...filters, supplier_name: item.supplier_name.trim() }); setOpenSupplier(false); }}
                      style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                      onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                      onMouseOut={e => e.currentTarget.style.background = "white"}
                    >
                      {item.supplier_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right: action buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button
              onClick={generateReport}
              style={{
                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#fff"}
              onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
            >
              GENERATE
            </button>
            <button
              onClick={handleExport}
              style={{
                background: "#28a745", color: "#fff", border: "1px solid #1e7e34",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#218838"}
              onMouseOut={e => e.currentTarget.style.background = "#28a745"}
            >
              EXPORT EXCEL
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: "#1a5ea8", color: "#fff", border: "1px solid #154c8a",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: "4px"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#154c8a"}
              onMouseOut={e => e.currentTarget.style.background = "#1a5ea8"}
            >
              <Printer size={12} /> PRINT
            </button>
            <button
              onClick={exportPDF}
              style={{
                background: "#b22222", color: "#fff", border: "1px solid #8b1a1a",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#8b1a1a"}
              onMouseOut={e => e.currentTarget.style.background = "#b22222"}
            >
              EXPORT PDF
            </button>
            <button
              onClick={handleClose}
              style={{
                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#fff"}
              onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div
          className="custom-scrollbar"
          style={{ flex: 1, overflowY: "auto", background: "#f0f0f0", padding: "12px 14px" }}
        >
          {/* Main report area wrapper mimicking SalesWindowModal printable-area */}
          <div
            ref={contentRef}
            style={{
              background: "white",
              border: "1px solid #bbb",
              padding: "16px 18px 20px 18px",
              minHeight: "297mm",
              width: "100%",
            }}
          >
            {isExportingPdf ? (
              /* ── CLEAN ACCOUNTING PDF LAYOUT (Matches Image Exactly) ── */
              <div style={{ width: "1080px", background: "#ffffff", boxSizing: "border-box", color: "#000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                {reportMode === "taxpurchase" ? (
                  chunkRecords(taxPurchaseRows, 20, 24).map((pageRows, pageIdx, pagesArr) => {
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
                                  <span style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textUnderlineOffset: "3px", letterSpacing: "0.5px" }}>TAX PURCHASE DETAILS</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8.5pt", fontWeight: "bold", marginBottom: "6px" }}>
                                  <span>From : {filters.fromdate ? fmtDate(filters.fromdate) : "—"} To : {filters.todate ? fmtDate(filters.todate) : "—"}</span>
                                  {filters.supplier_name && <span>Supplier : {filters.supplier_name.toUpperCase()}</span>}
                                  {pagesArr.length > 1 && <span>Page {pageIdx + 1} of {pagesArr.length}</span>}
                                </div>
                                <div style={{ borderBottom: "1.5px solid #000", marginBottom: "8px" }}></div>
                              </>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8pt", fontWeight: "bold", marginBottom: "6px", paddingBottom: "2px", borderBottom: "1.5px solid #000" }}>
                                <span>TAX PURCHASE DETAILS (Continued)</span>
                                <span>From : {filters.fromdate ? fmtDate(filters.fromdate) : "—"} To : {filters.todate ? fmtDate(filters.todate) : "—"}</span>
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
                                      <td style={{ textAlign: "left", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{row.gstin || "—"}</td>
                                      <td style={{ textAlign: "left", padding: "2px 2px", whiteSpace: "normal", wordBreak: "normal", overflowWrap: "break-word", lineHeight: "1.15", fontWeight: "500", verticalAlign: "top" }} title={row.supplier_name}>{row.supplier_name || ""}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", fontSize: "7.5pt", whiteSpace: "nowrap", verticalAlign: "top" }} title={row.hsn_sac || ""}>{fmtHsn(row.hsn_sac)}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{row.invoice_no || ""}</td>
                                      <td style={{ textAlign: "center", padding: "2px 2px", whiteSpace: "nowrap", verticalAlign: "top" }}>{fmtDate(row.bill_date)}</td>
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
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(taxPurchaseTotals.total_invoice_value)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(taxPurchaseTotals.taxable_value)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(taxPurchaseTotals.cgst_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(taxPurchaseTotals.sgst_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", whiteSpace: "nowrap" }}></td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(taxPurchaseTotals.igst_amount)}</td>
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
                ) : (
                  chunkRecords(billwiseRows, 20, 24).map((pageRows, pageIdx, pagesArr) => {
                    const isFirstPage = pageIdx === 0;
                    const isLastPage = pageIdx === pagesArr.length - 1;
                    const startSno = pageIdx === 0 ? 0 : 20 + (pageIdx - 1) * 24;
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
                                  <span style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textUnderlineOffset: "3px", letterSpacing: "0.5px" }}>BILLWISE PAYMENT DETAILS</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8.5pt", fontWeight: "bold", marginBottom: "6px" }}>
                                  <span>From : {filters.fromdate ? fmtDate(filters.fromdate) : "—"} To : {filters.todate ? fmtDate(filters.todate) : "—"}</span>
                                  {filters.supplier_name && <span>Supplier : {filters.supplier_name.toUpperCase()}</span>}
                                  {pagesArr.length > 1 && <span>Page {pageIdx + 1} of {pagesArr.length}</span>}
                                </div>
                                <div style={{ borderBottom: "1.5px solid #000", marginBottom: "8px" }}></div>
                              </>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "8pt", fontWeight: "bold", marginBottom: "6px", paddingBottom: "2px", borderBottom: "1.5px solid #000" }}>
                                <span>BILLWISE PAYMENT DETAILS (Continued)</span>
                                <span>From : {filters.fromdate ? fmtDate(filters.fromdate) : "—"} To : {filters.todate ? fmtDate(filters.todate) : "—"}</span>
                                <span>Page {pageIdx + 1} of {pagesArr.length}</span>
                              </div>
                            )}

                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", color: "#000", tableLayout: "fixed" }}>
                              <colgroup>
                                <col style={{ width: "5%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "12%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "25%" }} />
                                <col style={{ width: "14%" }} />
                                <col style={{ width: "14%" }} />
                              </colgroup>
                              <thead>
                                <tr style={{ borderBottom: "1.5px solid #000", height: "32px" }}>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>SNO</th>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>ENTRY DATE</th>
                                  <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>BILL NO</th>
                                  <th style={{ textAlign: "left", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>SUPPLIER NAME</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>BILL AMOUNT</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>PAID AMOUNT</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>BALANCE DUE</th>
                                  <th style={{ textAlign: "right", padding: "6px 2px", fontWeight: "bold", verticalAlign: "middle" }}>GRAND TOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageRows.map((row, i) => (
                                  <tr key={i} style={{ border: "none" }}>
                                    <td style={{ textAlign: "center", padding: "2px 2px" }}>{startSno + i + 1}</td>
                                    <td style={{ textAlign: "center", padding: "2px 2px" }}>{fmtDate(row.entry_date)}</td>
                                    <td style={{ textAlign: "center", padding: "2px 2px" }}>{row.bill_no}</td>
                                    <td style={{ textAlign: "left", padding: "2px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row.supplier_name}>{row.supplier_name}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(row.bill_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(row.paid_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(row.balance_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "2px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(row.grand_total)}</td>
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
                                  <col style={{ width: "5%" }} />
                                  <col style={{ width: "10%" }} />
                                  <col style={{ width: "12%" }} />
                                  <col style={{ width: "10%" }} />
                                  <col style={{ width: "10%" }} />
                                  <col style={{ width: "25%" }} />
                                  <col style={{ width: "14%" }} />
                                  <col style={{ width: "14%" }} />
                                </colgroup>
                                <tfoot>
                                  <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", fontWeight: "bold" }}>
                                    <td colSpan="4" style={{ textAlign: "right", padding: "4px 4px", textTransform: "uppercase" }}>TOTAL :</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(billwiseTotals.bill_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(billwiseTotals.paid_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(billwiseTotals.balance_amount)}</td>
                                    <td style={{ textAlign: "right", padding: "4px 2px", fontVariantNumeric: "tabular-nums" }}>{fmt(billwiseTotals.grand_total)}</td>
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
              <>
            <div className="mb-3 flex gap-6 text-sm font-semibold no-print">
              {filters.fromdate && <span>FROM: <span className="text-red-600">{filters.fromdate}</span></span>}
              {filters.todate && <span>TO: <span className="text-red-600">{filters.todate}</span></span>}
              {filters.supplier_name && <span>SUPPLIER: <span className="text-red-600">{filters.supplier_name}</span></span>}
            </div>

            <div className="overflow-x-auto">
              {reportMode === "billwise" ? (
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1300 }}>
                  <thead>
                    <tr className="bg-gray-200 border-b-2 border-gray-500 text-[11px] font-bold">
                      <th className="p-2 text-left w-8">SNO</th>
                      <th className="p-2 text-left">RECEIPT NO</th>
                      <th className="p-2 text-left">BILL NO</th>
                      <th className="p-2 text-left">BILL DATE</th>
                      <th className="p-2 text-left">ENTRY DATE</th>
                      <th className="p-2 text-left">SUPPLIER NAME</th>
                      <th className="p-2 text-center">PAYMENT MODE</th>
                      <th className="p-2 text-left">BANK NAME</th>
                      <th className="p-2 text-right">BILL AMOUNT</th>
                      <th className="p-2 text-right">PAID AMOUNT</th>
                      <th className="p-2 text-right">BALANCE</th>
                      <th className="p-2 text-right">GRAND TOTAL</th>
                      <th className="p-2 text-left">REFERENCE NO</th>
                      <th className="p-2 text-left">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.length > 0 ? groupedData.map((group) => (
                      <React.Fragment key={group.month}>
                        <tr className="bg-blue-700">
                          <td colSpan={14} className="p-1.5 text-white font-bold text-[12px] pl-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                          </td>
                        </tr>
                        {group.transactions.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="p-1.5 text-center text-gray-500">{i + 1}</td>
                            <td className="p-1.5 font-medium text-purple-800">{row.receipt_no || "—"}</td>
                            <td className="p-1.5 font-medium text-blue-800">{row.bill_no}</td>
                            <td className="p-1.5">{row.bill_date}</td>
                            <td className="p-1.5">{row.entry_date}</td>
                            <td className="p-1.5 truncate max-w-[160px]">{row.supplier_name}</td>
                            <td className="p-1.5 text-center">{row.payment_mode}</td>
                            <td className="p-1.5">{row.bank_name || "—"}</td>
                            <td className="p-1.5 text-right">{fmt(row.bill_amount)}</td>
                            <td className="p-1.5 text-right">{fmt(row.paid_amount)}</td>
                            <td className="p-1.5 text-right">{fmt(row.balance_amount)}</td>
                            <td className="p-1.5 text-right font-semibold text-blue-700">{fmt(row.grand_total)}</td>
                            <td className="p-1.5">{row.reference_no || row.reference_number || "—"}</td>
                            <td className="p-1.5">{row.remarks}</td>
                          </tr>
                        ))}
                        <tr className="bg-yellow-50 border-t-2 border-gray-400 font-bold text-[12px]">
                          <td colSpan={9} className="p-1.5 text-right text-red-700 pr-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long" })} Total :
                          </td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.bill_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.paid_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.balance_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right text-blue-800">{fmt(group.transactions.reduce((s, r) => s + Number(r.grand_total || 0), 0))}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </React.Fragment>
                    )) : (
                      <tr><td colSpan={14} className="text-center p-6 text-gray-400">No data found</td></tr>
                    )}

                    <tr className="bg-blue-50 border-t-2 border-blue-700 font-bold text-[13px]">
                      <td colSpan={9} className="p-2 text-right text-red-700 pr-3">GRAND TOTAL :</td>
                      <td className="p-2 text-right">{fmt(overall.bill_amount)}</td>
                      <td className="p-2 text-right">{fmt(overall.paid_amount)}</td>
                      <td className="p-2 text-right">{fmt(overall.balance_amount)}</td>
                      <td className="p-2 text-right text-blue-900">{fmt(overall.grand_total)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1300, tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "36px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "300px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "50px" }} />
                    <col style={{ width: "50px" }} />
                    <col style={{ width: "75px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "90px" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-200 border-b-2 border-gray-500 text-[11px] font-bold">
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>SNO</th>
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>BILL NO</th>
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>BILL DATE</th>
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>ORDER NO</th>
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>SUPPLIER NAME</th>
                      <th className="p-2 text-left" style={{ whiteSpace: "nowrap" }}>ITEM NAME</th>
                      <th className="p-2 text-center" style={{ whiteSpace: "nowrap" }}>HSN</th>
                      <th className="p-2 text-center" style={{ whiteSpace: "nowrap" }}>UOM</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>QTY</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>PRICE</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>AMOUNT</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>SUBTOTAL</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>CGST</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>SGST</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>IGST</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>OTHER CHG</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>DISCOUNT</th>
                      <th className="p-2 text-right" style={{ whiteSpace: "nowrap" }}>GRAND TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.length > 0 ? groupedData.map((group) => (
                      <React.Fragment key={group.month}>
                        <tr className="bg-blue-700">
                          <td colSpan={18} className="p-1.5 text-white font-bold text-[12px] pl-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                          </td>
                        </tr>
                        {group.bills.map((bill, bi) => {
                            const billBg = bi % 2 === 0 ? "#ffffff" : "#f8fafc";
                            return (
                          <React.Fragment key={bill.bill_no}>
                            {bill.items.length > 0 ? bill.items.map((item, ii) => (
                              <tr
                                key={ii}
                                style={{ background: billBg, verticalAlign: "top" }}
                                className="border-b border-gray-200"
                              >
                                <td className="p-1.5 text-center text-gray-500" style={{ verticalAlign: "top" }}>{ii === 0 ? bi + 1 : ""}</td>
                                <td className="p-1.5 font-medium text-blue-800" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{ii === 0 ? bill.bill_no : ""}</td>
                                <td className="p-1.5" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{ii === 0 ? bill.bill_date : ""}</td>
                                <td className="p-1.5" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{ii === 0 ? bill.order_no : ""}</td>
                                <td className="p-1.5" style={{ verticalAlign: "top", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ii === 0 ? bill.supplier_name : ""}</td>
                                <td className="p-1.5" style={{ verticalAlign: "top", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}>{item.item_name}</td>
                                <td className="p-1.5 text-center" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{item.hsn}</td>
                                <td className="p-1.5 text-center" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{item.uom}</td>
                                <td className="p-1.5 text-right" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{item.quantity}</td>
                                <td className="p-1.5 text-right" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{fmt(item.price)}</td>
                                <td className="p-1.5 text-right" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{fmt(item.amount)}</td>
                                {ii === 0 ? (
                                  <>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.subtotal)}</td>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.cgst)}</td>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.sgst)}</td>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.igst)}</td>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.other_charges)}</td>
                                    <td
                                      className="p-1.5 text-right"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.discount)}</td>
                                    <td
                                      className="p-1.5 text-right font-semibold text-blue-700"
                                      rowSpan={bill.items.length}
                                      style={{ verticalAlign: "top", background: billBg, borderLeft: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                                    >{fmt(bill.grand_total)}</td>
                                  </>
                                ) : null}
                              </tr>
                            )) : (
                              <tr className="border-b border-gray-200 bg-white">
                                <td className="p-1.5 text-center text-gray-500">{bi + 1}</td>
                                <td className="p-1.5 font-medium text-blue-800">{bill.bill_no}</td>
                                <td className="p-1.5">{bill.bill_date}</td>
                                <td className="p-1.5">{bill.order_no}</td>
                                <td className="p-1.5 truncate max-w-[160px]">{bill.supplier_name}</td>
                                <td className="p-1.5" colSpan={6} />
                                <td className="p-1.5 text-right">{fmt(bill.subtotal)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.cgst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.sgst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.igst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.other_charges)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.discount)}</td>
                                <td className="p-1.5 text-right font-semibold text-blue-700">{fmt(bill.grand_total)}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );})}
                        <tr className="bg-yellow-50 border-t-2 border-gray-400 font-bold text-[12px]">
                          <td colSpan={11} className="p-1.5 text-right text-red-700 pr-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long" })} Total :
                          </td>
                          <td className="p-1.5 text-right">{fmt(group.totals.subtotal)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.cgst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.sgst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.igst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.other_charges)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.discount)}</td>
                          <td className="p-1.5 text-right text-blue-800">{fmt(group.totals.grand_total)}</td>
                        </tr>
                      </React.Fragment>
                    )) : (
                      <tr><td colSpan={18} className="text-center p-6 text-gray-400">No data found</td></tr>
                    )}

                    <tr className="bg-blue-50 border-t-2 border-blue-700 font-bold text-[13px]">
                      <td colSpan={11} className="p-2 text-right text-red-700 pr-3">GRAND TOTAL :</td>
                      <td className="p-2 text-right">{fmt(overall.subtotal)}</td>
                      <td className="p-2 text-right">{fmt(overall.cgst)}</td>
                      <td className="p-2 text-right">{fmt(overall.sgst)}</td>
                      <td className="p-2 text-right">{fmt(overall.igst)}</td>
                      <td className="p-2 text-right">{fmt(overall.other_charges)}</td>
                      <td className="p-2 text-right">{fmt(overall.discount)}</td>
                      <td className="p-2 text-right text-blue-900">{fmt(overall.grand_total)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>

        {/* ── STATUS BAR ── */}
        <div
          style={{
            background: "#f0f0f0",
            borderTop: "1px solid #aaa",
            padding: "2px 12px",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#555",
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ borderRight: "1px solid #aaa", paddingRight: "16px" }}>Total Page No: 1</span>
            <span>READY</span>
          </span>
          <span>ZOOM: 100%</span>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #d1d5db; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #9ca3af; }
        .printable-area { width: 100% !important; max-width: 100% !important; }
        @media print {
          body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .printable-area { width: 100% !important; overflow: visible !important; }
          tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};

export default PurchaseReport;
