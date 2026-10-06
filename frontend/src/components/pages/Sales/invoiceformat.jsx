import API_BASE_URL from "../../../config/api";
import React, { useState, useEffect } from "react";
import { toWords } from "number-to-words";
import { InvoiceAddressBlock } from "../../../utils/AddressBlock";

const ITEMS_PER_PAGE = 10;

const InvoiceLayout = ({ InvNumber }) => {
  const [invoice, setInvoice] = useState({
    items: [],
    client: {},
    header: {},
  });

  const amountInwords = (num) =>
    toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) +
    " Rupees Only";

  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "";
    if (String(dateStr).includes(",")) {
      return String(dateStr)
        .split(",")
        .map((d) => formatOrderDate(d.trim()))
        .filter(Boolean)
        .join(", ");
    }
    return dateStr;
  };

  useEffect(() => {
    if (!InvNumber || InvNumber === "") return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/salesinvoices/full/${encodeURIComponent(InvNumber)}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("DIRECT INVOICE ID:", data.header?.id);
        console.log("DIRECT INVOICE NUMBER:", data.header?.invoice_no);
        console.log("DIRECT INVOICE ITEMS:", data.items);
        console.log("DIRECT INVOICE ITEM COUNT:", data.items?.length);

        if (data && data.header) {
          setInvoice({
            ...data.header,
            items: data.items || [],
            client: data.client || {},
          });
        }
      } catch (error) {
        console.error("Fetch error in InvoiceLayout:", error);
      }
    };

    fetchData();
  }, [InvNumber]);

  const rawItems = invoice?.items || [];
  const pages = [];
  if (rawItems.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < rawItems.length; i += ITEMS_PER_PAGE) {
      pages.push(rawItems.slice(i, i + ITEMS_PER_PAGE));
    }
  }

  const copies = [
    { key: "original", label: "" },
    { key: "duplicate", label: "" },
  ];

  const InvoicePage = ({ pageItems, pageIndex, totalPages, copyLabel }) => {
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;
    const fillerCount = Math.max(0, ITEMS_PER_PAGE - pageItems.length);

    const allItems = invoice?.items || [];
    const allOrderNos = [...new Set(allItems.map((i) => i.order_no).filter(Boolean))];
    const allOrderDates = [...new Set(allItems.map((i) => i.order_date).filter(Boolean))];
    const orNo = allOrderNos.length ? allOrderNos.join(", ") : (invoice?.order_no || "");
    const orDate = allOrderDates.length
      ? allOrderDates.map((d) => formatOrderDate(d)).join(", ")
      : formatOrderDate(invoice?.order_date);

    const allDcNos = [...new Set(allItems.map((i) => i.dc_no).filter(Boolean))];
    const allDcDates = [...new Set(allItems.map((i) => i.dc_date).filter(Boolean))];
    const dcNoVal = allDcNos.length ? allDcNos.join(", ") : (invoice?.dc_no || "");
    const dcDateVal = allDcDates.length
      ? allDcDates.map((d) => formatOrderDate(d)).join(", ")
      : formatOrderDate(invoice?.dc_date);

    return (
      <div className="invoice-page py-3 print:py-0 flex flex-col items-center">
        {/* TOP BAR / LABEL */}
        <div className="w-[200mm] flex justify-between items-center px-2 pb-1 flex-shrink-0">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {totalPages > 1 ? `Page ${pageIndex + 1} of ${totalPages}` : ""}
          </span>
          {copyLabel && copyLabel.trim() !== "" && (
            <span className="text-[12px] font-extrabold uppercase tracking-widest text-gray-900 border border-black bg-gray-100 px-3 py-0.5 rounded-sm">
              {copyLabel}
            </span>
          )}
        </div>

        <div
          className="invoice-page-inner w-[200mm] border-2 border-black bg-white relative flex flex-col shadow-lg print:shadow-none"
          style={{ boxSizing: "border-box" }}
        >
          {/* HEADER / CONTINUATION HEADER */}
          {isFirstPage ? (
            <div className="flex-shrink-0">
              {/* HEADER */}
              <div className="flex flex-col justify-center items-center text-center border-2 border-black m-2 h-[120px] flex-shrink-0">
                <h1 className="text-red-600 text-[26px] font-extrabold mb-0.5 leading-tight uppercase tracking-tight">
                  ASWITHA TECH
                </h1>
                <div className="text-[11px] font-bold space-y-0.5">
                  <p>17, Abirami Nagar, Avarampalayam Road,</p>
                  <p>K.R. Puram, Ganapathi, Coimbatore - 641006</p>
                  <p>Email : aswithatech2020@gmail.com</p>
                  <div className="flex justify-center items-center gap-4 mt-0.5 text-[10px]">
                    <span>GSTIN : 33GYLPS7134C1Z9</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">📞</span>
                      <span>80725 37036, 96551 48537</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS */}
              <div className="flex border-2 border-black mx-2 flex-shrink-0" style={{ height: "217px" }}>
                {/* LEFT */}
                <div className="w-[55%] p-3 border-r-2 border-black flex flex-col justify-center">
                  <InvoiceAddressBlock
                    name={invoice?.client?.customer_name || invoice?.customer_name}
                    address={invoice?.client?.address || invoice?.client_address}
                    state={invoice?.client?.state || invoice?.client_state}
                    pincode={invoice?.client?.pincode || invoice?.client_pincode}
                    phone={invoice?.client?.phone || invoice?.client_phone}
                    gst={invoice?.client?.gst_number || invoice?.client_gst}
                    stateCode={invoice?.client?.state_code || ""}
                  />
                </div>

                {/* RIGHT */}
                <div className="w-[45%] flex flex-col overflow-visible">
                  <div className="p-1 text-center border-b-2 border-black bg-gray-50">
                    <h2 className="text-[18px] font-extrabold uppercase tracking-[5px]">
                      INVOICE
                    </h2>
                  </div>
                  <div className="p-3 space-y-1.5 flex flex-col justify-center">
                    {/* NO and DATE on same line */}
                    <div className="flex text-[11px] font-bold uppercase leading-[20px]">
                      <div className="flex flex-1 items-center">
                        <div className="w-[30px] shrink-0">NO</div>
                        <div className="w-[12px] text-center ml-[40px]">:</div>
                        <div className="font-extrabold ">{invoice?.invoice_no}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="shrink-0 font-bold">DATE</div>
                        <div className="text-center">:</div>
                        <div className="font-extrabold">{formatInvoiceDate(invoice?.invoice_date)}</div>
                      </div>
                    </div>

                    {[
                      { label: "OR NO", value: orNo },
                      { label: "OR DATE", value: orDate },
                      { label: "DC NO", value: dcNoVal },
                      { label: "DC DATE", value: dcDateVal },
                      { label: "DESPATCH", value: invoice?.dispatch_through },
                    ].map((row, i) => (
                      <div key={i} className="flex text-[11px] font-bold uppercase leading-[20px]">
                        <div className="w-[70px] shrink-0">{row.label}</div>
                        <div className="w-[12px] text-center">:</div>
                        <div className="flex-1 font-extrabold">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* CONTINUATION HEADER FOR SUBSEQUENT PAGES */
            <div className="flex justify-between items-center px-4 py-2.5 border-b-2 border-black bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-extrabold text-[15px] uppercase tracking-tight">ASWITHA TECH</span>
                <span className="text-blue-800 font-extrabold text-[13px] uppercase underline underline-offset-2">INVOICE (CONTD.)</span>
              </div>
              <div className="flex items-center gap-3 text-[12px] font-bold">
                <span>NO : <span className="font-extrabold text-black">{invoice?.invoice_no}</span></span>
                <span>DATE : <span className="text-black">{formatInvoiceDate(invoice?.invoice_date)}</span></span>
                {copyLabel && copyLabel.trim() !== "" && (
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-black border border-black px-2 py-0.5 bg-white rounded-sm">
                    {copyLabel}
                  </span>
                )}
                <span className="bg-white px-2 py-0.5 border border-black text-[11px] font-extrabold rounded-sm">
                  PAGE {pageIndex + 1} OF {totalPages}
                </span>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="mx-2 mt-2 border-2 border-black flex-shrink-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50 h-[32px]">
                  <th className="border-r-2 border-black p-1.5 w-[8%] text-left text-[12px] font-extrabold uppercase">S.No</th>
                  <th className="border-r-2 border-black p-1.5 w-[46%] text-left text-[12px] font-extrabold uppercase">Description</th>
                  <th className="border-r-2 border-black p-1.5 w-[12%] text-center text-[12px] font-extrabold uppercase">HSN</th>
                  <th className="border-r-2 border-black p-1.5 w-[10%] text-center text-[12px] font-extrabold uppercase">Qty</th>
                  <th className="border-r-2 border-black p-1.5 w-[11%] text-center text-[12px] font-extrabold uppercase">Rate</th>
                  <th className="p-1.5 w-[13%] text-center text-[12px] font-extrabold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, itemIndex) => {
                  const serialNumber = pageIndex * ITEMS_PER_PAGE + itemIndex + 1;
                  return (
                    <tr key={itemIndex} className="min-h-[28px] invoice-item-row">
                      <td className="border-r-2 border-black text-center text-[11px] font-bold w-[8%] py-1">{serialNumber}</td>
                      <td className="border-r-2 border-black px-3 py-1 text-[11px] font-bold uppercase w-[46%]">
                        {item.item_name}{item.serial_no ? ` (${item.serial_no})` : (item.sl_no ? ` (${item.sl_no})` : "")}
                      </td>
                      <td className="border-r-2 border-black text-center text-[11px] font-bold w-[12%] py-1">{item.hsn_code || item.hsn_number || "998719"}</td>
                      <td className="border-r-2 border-black text-center text-[11px] font-bold w-[10%] py-1">{item.quantity}</td>
                      <td className="border-r-2 border-black text-right text-[11px] font-bold pr-3 w-[11%] py-1">{Number(item.price).toFixed(2)}</td>
                      <td className="border-black text-right text-[11px] font-bold pr-3 w-[13%] py-1">{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  );
                })}
                {Array.from({ length: fillerCount }).map((_, i) => (
                  <tr key={`filler-${i}`} className="h-[28px]">
                    <td className="border-r-2 border-black border-t-0 border-b-0 w-[8%]"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0 w-[46%]"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0 w-[12%]"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0 w-[10%]"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0 w-[11%]"></td>
                    <td className="border-t-0 border-b-0 w-[13%]"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SECTION: EITHER SUMMARY & FOOTER (ON FINAL PAGE) OR CONTINUATION BAR */}
          {isLastPage ? (
            <div className="flex-shrink-0 invoice-summary-footer">
              {/* SUMMARY */}
              <div className="mx-2 border-2 border-black border-t-0 flex flex-shrink-0 h-[210px] invoice-summary">
                {/* LEFT */}
                <div className="w-[55%] p-3 border-r-2 border-black flex flex-col justify-between">
                  <div>
                    <h3 className="underline mb-2 text-[11px] font-bold">OUR BANK DETAILS :</h3>
                    <div className="text-[11px] font-bold">
                      <div className="grid grid-cols-[60px_10px_1fr] gap-y-1">
                        <span>NAME</span><span>:</span><span>HDFC BANK</span>
                        <span>A/C NO</span><span>:</span><span>50200054775934</span>
                        <span>IFSC</span><span>:</span><span>HDFC0001588</span>
                        <span>BRANCH</span><span>:</span><span>GANDHIPURAM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="w-[45%] flex flex-col leading-5 relative justify-between">
                  <div className="absolute top-0 bottom-0 left-[238.2px] border-l-2 border-black"></div>
                  <div className="flex-1 flex flex-col justify-start">
                    <div className="flex px-3 py-0.5">
                      <span className="flex-1 text-right text-[13px] font-bold pr-4">Sub Total</span>
                      <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex px-3 py-0.5">
                      <span className="flex-1 text-right text-[13px] font-bold pr-4">Forward Packing Charges</span>
                      <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.transport || 0).toFixed(2)}</span>
                    </div>
                    {Number(invoice.discount || 0) > 0 && (
                      <div className="flex px-3 py-0.5">
                        <span className="flex-1 text-right text-[12px] font-bold pr-4">Discount</span>
                        <span className="w-[110px] text-right text-[14px] font-bold text-red-600">-{Number(invoice.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex px-3 py-0.5">
                      <span className="flex-1 text-right text-[13px] font-bold pr-4">TAXABLE</span>
                      <span className="w-[110px] text-right text-[14px] font-bold">
                        {(Number(invoice.subtotal || 0) - Number(invoice.discount || 0) + Number(invoice.transport || 0)).toFixed(2)}
                      </span>
                    </div>
                    {(() => {
                      const taxable = Number(invoice.subtotal || 0) - Number(invoice.discount || 0) + Number(invoice.transport || 0);
                      const cgstAmt = Number(invoice.cgst || 0);
                      const sgstAmt = Number(invoice.sgst || 0);
                      const igstAmt = Number(invoice.igst || 0);
                      const cgstPct = taxable > 0 ? Math.round((cgstAmt / taxable) * 100) : 0;
                      const sgstPct = taxable > 0 ? Math.round((sgstAmt / taxable) * 100) : 0;
                      const igstPct = taxable > 0 ? Math.round((igstAmt / taxable) * 100) : 0;
                      return (
                        <>
                          <div className="flex px-3 ">
                            <span className="flex-1 text-right text-[13px] font-bold pr-4">CGST @{cgstPct}%</span>
                            <span className="w-[110px] text-right text-[14px] font-bold">{cgstAmt.toFixed(2)}</span>
                          </div>
                          <div className="flex px-3 py-0.5">
                            <span className="flex-1 text-right text-[13px] font-bold pr-4">SGST @{sgstPct}%</span>
                            <span className="w-[110px] text-right text-[14px] font-bold">{sgstAmt.toFixed(2)}</span>
                          </div>
                          <div className="flex px-3 py-0.5">
                            <span className="flex-1 text-right text-[13px] font-bold pr-4">IGST @{igstPct}%</span>
                            <span className="w-[110px] text-right text-[14px] font-bold">{igstAmt.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex px-3 py-0.5">
                      <span className="flex-1 text-right text-[13px] font-bold pr-4">Round Off</span>
                      <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.round_off || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex mb-2 items-center border-black">
                    <div className="flex-1 text-right text-[14px] font-extrabold pr-4 uppercase">NET TOTAL</div>
                    <div className="w-[110px] text-right mr-[10px] text-[14px] font-extrabold">{Number(invoice.grandtotal || invoice.grand_total || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              {/* RUPEES BOX */}
              <div className="mx-2 mt-3 border-2 border-black border-t-2 h-[50px] flex items-center px-4 flex-shrink-0">
                <span className="font-bold text-[14px]">Rupees :</span>
                <span className="ml-6 font-extrabold uppercase text-[14px]">
                  {amountInwords(invoice.grandtotal || invoice.grand_total || 0)}
                </span>
              </div>

              <div className="mx-2 mb-1 mt-2 border-2 border-black border-t-2 h-[160px] flex justify-between p-4 flex-shrink-0 invoice-footer">
                {/* LEFT SIDE TERMS */}
                <div className="text-[10px] leading-7">
                  <p>1. All Disputes are subject to Coimbatore jurisdiction.</p>
                  <p>2. Payment of this Bill mature is 30 Days.</p>
                  <p>3. Our responsibility ceases as soon as goods have left our premises.</p>
                  <p>4. Disputes if any should be notified to us in writing within 15 days from receipt of Bill.</p>
                  <p>5. Goods Sold Once cannot be taken back.</p>
                </div>

                {/* RIGHT SIDE SIGNATURE */}
                <div className="flex flex-col justify-between text-right">
                  <h2 className="text-red-600 text-[16px] font-extrabold uppercase">
                    For ASWITHA TECH
                  </h2>

                  <h3 className="text-[14px] font-extrabold">
                    Authorised Signatory
                  </h3>
                </div>
              </div>
            </div>
          ) : (
            /* CONTINUATION INDICATOR FOR INTERMEDIATE PAGES */
            <div className="mx-2 mt-2 border-2 border-black p-2.5 px-4 flex justify-between items-center text-[12px] font-bold text-gray-700 bg-gray-50 flex-shrink-0">
              <span>Invoice No: <span className="font-extrabold text-black">{invoice?.invoice_no}</span></span>
              <span className="uppercase text-blue-800 font-extrabold tracking-wider">Continued on Page {pageIndex + 2} →</span>
              <span>Page {pageIndex + 1} of {totalPages}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .invoice-print-root {
            display: block !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .invoice-copy-wrapper {
            display: block !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .invoice-page {
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            break-after: page !important;
            page-break-after: always !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .invoice-copy-wrapper:last-child .invoice-page:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }
          .invoice-page-inner {
            width: 200mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .invoice-item-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .invoice-summary, .invoice-footer, .invoice-summary-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table { border-collapse: collapse !important; }
          tr, td, th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <div className="invoice-print-root bg-white w-full flex flex-col items-center print:bg-white py-4 overflow-auto">
        {copies.map((copy, copyIdx) => (
          <React.Fragment key={copy.key}>
            {copyIdx > 0 && (
              <>
                {/* DEBUG MARKER: Confirm Duplicate Copy exists in DOM */}
                <div id="debug-duplicate-copy-marker" style={{ display: "none" }} data-desc="Duplicate Copy DOM verification marker"></div>
                <div className="no-print w-[200mm] my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-400"></div>
                  <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded border border-gray-300">
                    Duplicate Copy
                  </span>
                  <div className="flex-1 h-px bg-gray-400"></div>
                </div>
              </>
            )}
            <div className="invoice-copy-wrapper py-2 print:py-0 flex flex-col items-center">
              {pages.map((pageItems, pageIndex) => (
                <InvoicePage
                  key={`${copy.key}-${pageIndex}`}
                  pageItems={pageItems}
                  pageIndex={pageIndex}
                  totalPages={pages.length}
                  copyLabel={copy.label}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default InvoiceLayout;