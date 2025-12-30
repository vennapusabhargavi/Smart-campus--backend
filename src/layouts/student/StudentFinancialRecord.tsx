import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronDownIcon,
  SearchIcon,
  ChevronUpIcon,
  PrinterIcon,
} from "lucide-react";

type DueStatus = "Pending" | "Paid" | "Overdue";
type PayMode = "Online" | "Cash" | "Card" | "UPI";

type DueRow = {
  id: string;
  feeType: string;
  amount: number;
  dueDate: string; // dd/mm/yyyy
  status: DueStatus;
};

type PaymentRow = {
  id: string;
  feeType: string;
  amount: number;
  mode: PayMode;
  reference: string;
  datedOn: string; // e.g., "Jun 27 2025 8:56PM"
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toISOFromDMY(dmy: string): string {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function SectionCard({
  title,
  tone,
  defaultOpen = true,
  children,
}: {
  title: string;
  tone: "danger" | "teal";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const header =
    tone === "danger"
      ? "bg-[#e45a5a]"
      : "bg-[#2aa79b]";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-3",
          header,
          "text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/15">
            <span className="text-[12px] font-black">⦿</span>
          </span>
          <span className="text-[13px] font-semibold tracking-wide uppercase">
            {title}
          </span>
        </div>

        <ChevronDownIcon
          size={18}
          className={cn(
            "transition-transform duration-300",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 bg-white dark:bg-slate-900">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "px-3 py-2.5 text-left text-[13px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        onClick && "cursor-pointer select-none"
      )}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200", className)}>
      {children}
    </td>
  );
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: "asc" | "desc";
}) {
  if (!active) return <ChevronUpIcon size={14} className="opacity-30" />;
  return dir === "asc" ? (
    <ChevronUpIcon size={14} className="opacity-80" />
  ) : (
    <ChevronDownIcon size={14} className="opacity-80" />
  );
}

function DuePill({ s }: { s: DueStatus }) {
  const cls =
    s === "Paid"
      ? "bg-emerald-600"
      : s === "Overdue"
      ? "bg-rose-600"
      : "bg-amber-500";
  return (
    <span className={cn("inline-flex rounded-sm px-2.5 py-1 text-[12px] font-semibold text-white", cls)}>
      {s}
    </span>
  );
}

function PrintPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full",
        "bg-teal-500 hover:bg-teal-600",
        "text-white text-[12px] font-semibold",
        "px-2.5 py-1 transition"
      )}
    >
      <PrinterIcon size={14} />
      Print
    </button>
  );
}

export function StudentFinancialRecord() {
  // DUE LIST (screenshot shows empty — keep empty by default)
  const [dues] = useState<DueRow[]>([]);

  // PAYMENT HISTORY (screenshot has many rows — demo dataset)
  const payments: PaymentRow[] = useMemo(
    () => [
      { id: "p1", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "E2506270I8V9XO", datedOn: "Jun 27 2025 8:56PM" },
      { id: "p2", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "371537129", datedOn: "Jul 3 2024 10:59PM" },
      { id: "p3", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "55605181", datedOn: "Jun 16 2023 3:03PM" },
      { id: "p4", feeType: "COLLEGE COMMON BREAKAGE", amount: 200, mode: "Online", reference: "E2506090HDM7KC", datedOn: "Jun 9 2025 4:23PM" },
      { id: "p5", feeType: "COLLEGE COMMON BREAKAGE", amount: 100, mode: "Online", reference: "229401104", datedOn: "Feb 8 2024 9:50PM" },
      { id: "p6", feeType: "COLLEGE COMMON BREAKAGE", amount: 150, mode: "Online", reference: "176758977", datedOn: "Dec 1 2023 4:16PM" },
      { id: "p7", feeType: "COLLEGE COMMON BREAKAGE", amount: 100, mode: "Online", reference: "E2511280PWC47L", datedOn: "Nov 28 2025 9:56PM" },
      { id: "p8", feeType: "COLLEGE COMMON BREAKAGE", amount: 200, mode: "Online", reference: "53206272", datedOn: "Jun 14 2023 6:35PM" },
      { id: "p9", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "55887093", datedOn: "Jun 16 2023 7:25PM" },
      { id: "p10", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "405248040", datedOn: "Aug 12 2024 7:05AM" },
      { id: "p11", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "290020623", datedOn: "Apr 5 2024 1:46AM" },
      { id: "p12", feeType: "COURSE STUDY MATERIAL FEES", amount: 650, mode: "Online", reference: "511447506", datedOn: "Dec 4 2024 11:37PM" },
      { id: "p13", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "114184483", datedOn: "Sep 1 2023 4:35PM" },
      { id: "p14", feeType: "CULTURAL FEE", amount: 1500, mode: "Online", reference: "371541796", datedOn: "Jul 3 2024 11:07PM" },
      { id: "p15", feeType: "CULTURAL FEE", amount: 2500, mode: "Online", reference: "E2506270I8VI2D", datedOn: "Jun 27 2025 8:59PM" },
      { id: "p16", feeType: "EXAM FEES DUE", amount: 9000, mode: "Online", reference: "182810296", datedOn: "Dec 9 2023 10:44PM" },
    ],
    []
  );

  // Due List table controls
  type DueSortKey = keyof Pick<DueRow, "feeType" | "amount" | "dueDate" | "status">;
  const [dueSortKey, setDueSortKey] = useState<DueSortKey>("feeType");
  const [dueSortDir, setDueSortDir] = useState<"asc" | "desc">("asc");

  // Payment History table controls
  type PaySortKey = keyof Pick<PaymentRow, "feeType" | "amount" | "mode" | "reference" | "datedOn">;
  const [paySortKey, setPaySortKey] = useState<PaySortKey>("feeType");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");
  const [payPageSize, setPayPageSize] = useState<number>(10);
  const [paySearch, setPaySearch] = useState("");
  const [payPage, setPayPage] = useState(1);

  function toggleDueSort(k: DueSortKey) {
    if (dueSortKey === k) setDueSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setDueSortKey(k);
      setDueSortDir("asc");
    }
  }

  function togglePaySort(k: PaySortKey) {
    if (paySortKey === k) setPaySortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setPaySortKey(k);
      setPaySortDir("asc");
    }
  }

  const dueSorted = useMemo(() => {
    const arr = [...dues];
    arr.sort((a, b) => {
      const va = a[dueSortKey] as any;
      const vb = b[dueSortKey] as any;

      if (dueSortKey === "amount") return Number(va) - Number(vb);
      if (dueSortKey === "dueDate") {
        const da = toISOFromDMY(String(va)) || "";
        const db = toISOFromDMY(String(vb)) || "";
        if (da === db) return 0;
        return da < db ? -1 : 1;
      }

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa === sb) return 0;
      return sa < sb ? -1 : 1;
    });
    return dueSortDir === "asc" ? arr : arr.reverse();
  }, [dues, dueSortKey, dueSortDir]);

  const dueTotal = useMemo(() => dues.reduce((sum, r) => sum + (r.status !== "Paid" ? r.amount : 0), 0), [dues]);

  const payFiltered = useMemo(() => {
    const q = paySearch.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((r) =>
      [r.feeType, String(r.amount), r.mode, r.reference, r.datedOn]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, paySearch]);

  const paySorted = useMemo(() => {
    const arr = [...payFiltered];
    arr.sort((a, b) => {
      const va = a[paySortKey] as any;
      const vb = b[paySortKey] as any;
      if (paySortKey === "amount") return Number(va) - Number(vb);

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa === sb) return 0;
      return sa < sb ? -1 : 1;
    });
    return paySortDir === "asc" ? arr : arr.reverse();
  }, [payFiltered, paySortKey, paySortDir]);

  const payTotal = paySorted.length;
  const payTotalPages = Math.max(1, Math.ceil(payTotal / payPageSize));
  const paySafePage = Math.min(payPage, payTotalPages);

  const payPaged = useMemo(() => {
    const start = (paySafePage - 1) * payPageSize;
    return paySorted.slice(start, start + payPageSize);
  }, [paySorted, paySafePage, payPageSize]);

  useEffect(() => {
    setPayPage(1);
  }, [paySearch, payPageSize]);

  function printReceipt(row: PaymentRow) {
    // simple demo: open a printable window
    const html = `
      <html>
        <head><title>Receipt</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Payment Receipt</h2>
          <p><b>Fee Type:</b> ${row.feeType}</p>
          <p><b>Amount:</b> ${row.amount}</p>
          <p><b>Mode:</b> ${row.mode}</p>
          <p><b>Reference:</b> ${row.reference}</p>
          <p><b>Dated On:</b> ${row.datedOn}</p>
          <hr/>
          <p style="color:#64748b">Demo receipt print.</p>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=720,height=720");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mb-4">
        <div className="text-[30px] font-light text-slate-700 dark:text-slate-100">
          Financial Record
        </div>
      </div>

      <div className="space-y-6">
        {/* DUE LIST */}
        <SectionCard title="DUE LIST" tone="danger" defaultOpen>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th onClick={() => toggleDueSort("feeType")}>
                      Fee Type{" "}
                      <SortIcon active={dueSortKey === "feeType"} dir={dueSortDir} />
                    </Th>
                    <Th onClick={() => toggleDueSort("amount")}>
                      Amount{" "}
                      <SortIcon active={dueSortKey === "amount"} dir={dueSortDir} />
                    </Th>
                    <Th onClick={() => toggleDueSort("dueDate")}>
                      Due Date{" "}
                      <SortIcon active={dueSortKey === "dueDate"} dir={dueSortDir} />
                    </Th>
                    <Th onClick={() => toggleDueSort("status")}>
                      Status{" "}
                      <SortIcon active={dueSortKey === "status"} dir={dueSortDir} />
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {dueSorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    dueSorted.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <Td>{r.feeType}</Td>
                        <Td>{r.amount}</Td>
                        <Td>{r.dueDate}</Td>
                        <Td><DuePill s={r.status} /></Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount badge like screenshot */}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center rounded-sm bg-[#e45a5a] px-3 py-1.5 text-[12px] font-semibold text-white">
              Total Amount: {dueTotal}
            </span>
          </div>
        </SectionCard>

        {/* PAYMENT HISTORY */}
        <SectionCard title="PAYMENT HISTORY" tone="teal" defaultOpen>
          <div className="mb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={payPageSize}
                onChange={(e) => setPayPageSize(Number(e.target.value))}
                className={cn(
                  "rounded-lg border border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900",
                  "px-2 py-1.5 text-[13px]"
                )}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-[13px] text-slate-700 dark:text-slate-200">
                records
              </span>
            </div>

            <div className="flex items-center gap-2 justify-start lg:justify-end">
              <span className="text-[13px] text-slate-700 dark:text-slate-200">
                Search:
              </span>
              <div className="relative">
                <input
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className={cn(
                    "w-[220px] rounded-lg border border-slate-200 dark:border-slate-800",
                    "bg-white dark:bg-slate-900",
                    "pl-9 pr-3 py-2 text-[13px]",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
                  )}
                  placeholder=""
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <SearchIcon size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th onClick={() => togglePaySort("feeType")}>
                      Fee Type{" "}
                      <SortIcon active={paySortKey === "feeType"} dir={paySortDir} />
                    </Th>
                    <Th onClick={() => togglePaySort("amount")}>
                      Amount{" "}
                      <SortIcon active={paySortKey === "amount"} dir={paySortDir} />
                    </Th>
                    <Th onClick={() => togglePaySort("mode")}>
                      Mode of Payment{" "}
                      <SortIcon active={paySortKey === "mode"} dir={paySortDir} />
                    </Th>
                    <Th onClick={() => togglePaySort("reference")}>
                      Reference{" "}
                      <SortIcon active={paySortKey === "reference"} dir={paySortDir} />
                    </Th>
                    <Th onClick={() => togglePaySort("datedOn")}>
                      Dated On{" "}
                      <SortIcon active={paySortKey === "datedOn"} dir={paySortDir} />
                    </Th>
                    <Th>Action</Th>
                  </tr>
                </thead>

                <tbody>
                  {payPaged.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <Td>{r.feeType}</Td>
                      <Td>{r.amount}</Td>
                      <Td>{r.mode}</Td>
                      <Td>{r.reference}</Td>
                      <Td>{r.datedOn}</Td>
                      <Td>
                        <PrintPill onClick={() => printReceipt(r)} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[12px] text-slate-600 dark:text-slate-300">
                Showing{" "}
                <span className="font-semibold">
                  {payTotal === 0 ? 0 : (paySafePage - 1) * payPageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(paySafePage * payPageSize, payTotal)}
                </span>{" "}
                of <span className="font-semibold">{payTotal}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPayPage(1)}
                  disabled={paySafePage === 1}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                    "bg-white dark:bg-slate-900",
                    "ring-slate-200 dark:ring-slate-800",
                    "disabled:opacity-50"
                  )}
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setPayPage((p) => Math.max(1, p - 1))}
                  disabled={paySafePage === 1}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                    "bg-white dark:bg-slate-900",
                    "ring-slate-200 dark:ring-slate-800",
                    "disabled:opacity-50"
                  )}
                >
                  Prev
                </button>

                <div className="text-[13px] text-slate-700 dark:text-slate-200">
                  Page <span className="font-semibold">{paySafePage}</span> /{" "}
                  <span className="font-semibold">{payTotalPages}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPayPage((p) => Math.min(payTotalPages, p + 1))}
                  disabled={paySafePage === payTotalPages}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                    "bg-white dark:bg-slate-900",
                    "ring-slate-200 dark:ring-slate-800",
                    "disabled:opacity-50"
                  )}
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setPayPage(payTotalPages)}
                  disabled={paySafePage === payTotalPages}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                    "bg-white dark:bg-slate-900",
                    "ring-slate-200 dark:ring-slate-800",
                    "disabled:opacity-50"
                  )}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
