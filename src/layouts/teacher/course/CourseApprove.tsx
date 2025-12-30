// src/layouts/teacher/course/CourseApprove.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  Clock3Icon,
  XCircleIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  XIcon,
} from "lucide-react";

type TabKey = "Pending" | "Approved" | "Rejected";

type ApproveRow = {
  id: string;
  regNo: string;
  student: string;
  courseCode: string;
  courseName: string;
  availableCount: number;
  requestedOn: string; // DD/MM/YYYY
  status: TabKey;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- UI atoms ----------
function Chip({
  tone = "neutral",
  icon,
  children,
  active,
  onClick,
}: {
  tone?: "neutral" | "info" | "success" | "danger";
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1";
  const map = {
    neutral:
      "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100/50 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40 dark:hover:bg-blue-950/55",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100/50 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40 dark:hover:bg-emerald-950/50",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100/50 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40 dark:hover:bg-rose-950/50",
  } as const;

  const activeRing =
    tone === "success"
      ? "ring-2 ring-emerald-400/70 dark:ring-emerald-300/60"
      : tone === "danger"
      ? "ring-2 ring-rose-400/70 dark:ring-rose-300/60"
      : tone === "info"
      ? "ring-2 ring-blue-400/70 dark:ring-blue-300/60"
      : "ring-2 ring-slate-300/70 dark:ring-slate-700/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, map[tone], active && activeRing)}
    >
      <span className={cn("opacity-90", active && "opacity-100")}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_12px_40px_-26px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300",
        "bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-10",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70",
        className
      )}
    >
      {children}
    </td>
  );
}

function ActionBtn({
  tone,
  children,
  onClick,
  disabled,
}: {
  tone: "approve" | "reject";
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const cls =
    tone === "approve"
      ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/20"
      : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-600/20";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-[0.99]",
        cls,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              aria-label="Close"
            >
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[95]">
      <div className="rounded-2xl bg-slate-900 text-white shadow-xl px-4 py-3 ring-1 ring-white/10 min-w-[280px]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
              <CheckCircle2Icon size={16} />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Updated</div>
            <div className="text-xs text-white/75 mt-0.5">{msg}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-white/10 grid place-items-center transition"
            aria-label="Close toast"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- utils ----------
function matches(row: ApproveRow, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    row.regNo.toLowerCase().includes(s) ||
    row.student.toLowerCase().includes(s) ||
    row.courseCode.toLowerCase().includes(s) ||
    row.courseName.toLowerCase().includes(s) ||
    row.requestedOn.toLowerCase().includes(s)
  );
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    total,
    slice: items.slice(start, end),
    start,
    end: Math.min(end, total),
  };
}

// ---------- main ----------
export default function CourseApprove() {
  const seed: ApproveRow[] = useMemo(
    () => [
      {
        id: "r1",
        regNo: "192211856",
        student: "KARMURI SRI RAMCHARAN REDDY",
        courseCode: "CSA1524",
        courseName: "Cloud Computing and Big Data Analytics with Apache",
        availableCount: 12,
        requestedOn: "27/05/2025",
        status: "Pending",
      },
      {
        id: "r2",
        regNo: "192124073",
        student: "PASALA THRIBHUVAN REDDY",
        courseCode: "CSA1524",
        courseName: "Cloud Computing and Big Data Analytics with Apache",
        availableCount: 0,
        requestedOn: "27/05/2025",
        status: "Approved",
      },
      {
        id: "r3",
        regNo: "192213301",
        student: "KAPPALA ABHISHEK DASS",
        courseCode: "SPIC411",
        courseName: "Core Project",
        availableCount: 7,
        requestedOn: "17/12/2025",
        status: "Rejected",
      },
    ],
    []
  );

  const [rows, setRows] = useState<ApproveRow[]>(seed);

  const [tab, setTab] = useState<TabKey>("Pending");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [active, setActive] = useState<ApproveRow | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => r.status === tab).filter((r) => matches(r, q));
  }, [rows, tab, q]);

  const { total, slice, start, end } = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [tab, q, pageSize]);

  const showingText =
    total === 0
      ? "Showing 0 to 0 of 0 entries"
      : `Showing ${start + 1} to ${end} of ${total} entries`;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const openConfirm = (r: ApproveRow, action: "approve" | "reject") => {
    setActive(r);
    setConfirmAction(action);
    setReason("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setActive(null);
    setReason("");
  };

  const commit = () => {
    if (!active) return;

    if (active.status !== "Pending") {
      setToast("Action is allowed only on Pending requests.");
      window.setTimeout(() => setToast(null), 2400);
      closeConfirm();
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id === active.id
          ? { ...r, status: confirmAction === "approve" ? "Approved" : "Rejected" }
          : r
      )
    );

    setToast(
      confirmAction === "approve"
        ? `Approved ${active.regNo} • ${active.courseCode}`
        : `Rejected ${active.regNo} • ${active.courseCode}${
            reason.trim() ? " (reason saved)" : ""
          }`
    );
    window.setTimeout(() => setToast(null), 2800);
    closeConfirm();
  };

  const TabBar = (
    <div className="flex flex-wrap gap-2">
      <Chip
        tone="info"
        icon={<Clock3Icon size={16} />}
        active={tab === "Pending"}
        onClick={() => setTab("Pending")}
      >
        Pending
      </Chip>
      <Chip
        tone="success"
        icon={<CheckCircle2Icon size={16} />}
        active={tab === "Approved"}
        onClick={() => setTab("Approved")}
      >
        Approved
      </Chip>
      <Chip
        tone="danger"
        icon={<XCircleIcon size={16} />}
        active={tab === "Rejected"}
        onClick={() => setTab("Rejected")}
      >
        Rejected
      </Chip>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div>
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Enrollment - Course Approve
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">{TabBar}</div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={cn(
              "h-10 rounded-xl px-3 text-sm",
              "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
              "ring-1 ring-slate-200 dark:ring-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
              "transition"
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            records
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Search:
          </div>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=""
              className={cn(
                "h-10 w-[220px] rounded-xl pl-9 pr-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "ring-1 ring-slate-200 dark:ring-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                "transition"
              )}
            />
          </div>
        </div>
      </div>

      <TableShell>
        <table className="min-w-[1120px] w-full">
          <thead>
            <tr>
              <Th className="w-[140px]">Reg No.</Th>
              <Th className="min-w-[260px]">Student</Th>
              <Th className="w-[160px]">Course Code</Th>
              <Th className="min-w-[320px]">Course Name</Th>
              <Th className="w-[160px]">Available Count</Th>
              <Th className="w-[160px]">Requested On</Th>
              <Th className="w-[150px]">Approve</Th>
              <Th className="w-[150px]">Reject</Th>
            </tr>
          </thead>

          <tbody>
            {slice.length === 0 ? (
              <tr>
                <Td
                  className="py-8 text-center text-slate-500 dark:text-slate-400"
                  colSpan={8}
                >
                  No data available in table
                </Td>
              </tr>
            ) : (
              slice.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-950"
                      : "bg-slate-50/60 dark:bg-slate-900/20",
                    "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25 transition"
                  )}
                >
                  <Td className="font-semibold">{r.regNo}</Td>
                  <Td>{r.student}</Td>
                  <Td className="font-semibold">{r.courseCode}</Td>
                  <Td>{r.courseName}</Td>

                  {/* ✅ Available count: ONLY number (no symbols/pills) */}
                  <Td>
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        r.availableCount === 0
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-slate-800 dark:text-slate-100"
                      )}
                    >
                      {r.availableCount}
                    </span>
                  </Td>

                  <Td className="tabular-nums">{r.requestedOn}</Td>

                  <Td>
                    <ActionBtn
                      tone="approve"
                      disabled={r.status !== "Pending"}
                      onClick={() => openConfirm(r, "approve")}
                    >
                      <ThumbsUpIcon size={14} />
                      Approve
                    </ActionBtn>
                  </Td>
                  <Td>
                    <ActionBtn
                      tone="reject"
                      disabled={r.status !== "Pending"}
                      onClick={() => openConfirm(r, "reject")}
                    >
                      <ThumbsDownIcon size={14} />
                      Reject
                    </ActionBtn>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {showingText}
        </div>

        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canPrev && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canNext && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Next"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title={confirmAction === "approve" ? "Approve Enrollment" : "Reject Enrollment"}
        subtitle={
          active
            ? `${active.regNo} • ${active.student} • ${active.courseCode}`
            : undefined
        }
        onClose={closeConfirm}
      >
        {active && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {active.courseName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requested on {active.requestedOn} • Available count:{" "}
                <span className="font-semibold tabular-nums">
                  {active.availableCount}
                </span>
              </div>
            </div>

            {confirmAction === "reject" && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Rejection reason (optional)
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a short reason (optional)"
                  rows={3}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-sm",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                    "ring-1 ring-slate-200 dark:ring-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-rose-400/60 dark:focus:ring-rose-300/60",
                    "transition"
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition",
                  "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
                  "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold text-white transition shadow-sm",
                  confirmAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20"
                )}
              >
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
