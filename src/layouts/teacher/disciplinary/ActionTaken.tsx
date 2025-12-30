// src/layouts/teacher/disciplinary/ActionTaken.tsx
import React, { useMemo, useState } from "react";

type Status = "InProgress" | "Closed";

type DisciplinaryRow = {
  id: string;
  regNo: string;
  student: string;
  issueDetails: string;
  lastActionDetails: string;
  complainant: string;
  issueOn: string; // DD/MM/YYYY
  status: Status;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "indigo" | "violet";
}) {
  const toneCls =
    tone === "slate"
      ? "from-slate-800 via-slate-800 to-slate-700"
      : tone === "indigo"
      ? "from-indigo-800 via-indigo-700 to-slate-800"
      : "from-violet-800 via-violet-700 to-slate-800";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
      <div className={clsx("px-5 py-4 bg-gradient-to-r", toneCls)}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold tracking-wide text-white/85 uppercase truncate">
              {label}
            </div>
            <div className="mt-1 text-[11px] text-white/70">Disciplinary</div>
          </div>

          <div className="text-3xl font-semibold text-white tabular-nums">
            {value}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Updated just now
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition shadow-sm",
        "border",
        active
          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-white/90 dark:bg-slate-900" : "bg-slate-400"
        )}
      />
      {label}
    </button>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-14 text-center">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </div>
    </div>
  );
}

export default function ActionTaken() {
  // Demo data (replace with API later)
  const rows: DisciplinaryRow[] = useMemo(
    () => [
      // Keep a few examples; you can delete all to see the "No data" state like screenshot
      {
        id: "d1",
        regNo: "192211856",
        student: "KARMURI SRI RAMCHARAN REDDY",
        issueDetails: "Late submission of internal assignment (3 times).",
        lastActionDetails: "Counselling done. Warning issued to student.",
        complainant: "Class Advisor",
        issueOn: "18/12/2025",
        status: "InProgress",
      },
      {
        id: "d2",
        regNo: "192124073",
        student: "PASALA THRIBHUVAN REDDY",
        issueDetails: "Misconduct in lab session.",
        lastActionDetails: "Written apology received. Case closed.",
        complainant: "Lab In-charge",
        issueOn: "05/12/2025",
        status: "Closed",
      },
      {
        id: "d3",
        regNo: "192213301",
        student: "KAPPALA ABHISHEK DASS",
        issueDetails: "Attendance shortage with repeated warnings ignored.",
        lastActionDetails: "Parent meeting scheduled. Follow-up pending.",
        complainant: "Attendance Coordinator",
        issueOn: "21/12/2025",
        status: "InProgress",
      },
    ],
    []
  );

  const [tab, setTab] = useState<"InProgress" | "Closed">("InProgress");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const inProg = rows.filter((r) => r.status === "InProgress").length;
    const closed = rows.filter((r) => r.status === "Closed").length;
    return { inProg, closed, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.status === tab)
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.regNo} ${r.student} ${r.issueDetails} ${r.lastActionDetails} ${r.complainant} ${r.issueOn}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [tab, pageSize, query]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Disciplinary Action Taken
      </h1>

      {/* Top metric cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="In Progress" value={counts.inProg} tone="indigo" />
        <MetricCard label="Closed" value={counts.closed} tone="slate" />
        <MetricCard label="Total" value={counts.total} tone="violet" />
      </div>

      {/* Tabs + Controls */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Pill
                active={tab === "InProgress"}
                onClick={() => setTab("InProgress")}
                label="InProgress"
              />
              <Pill
                active={tab === "Closed"}
                onClick={() => setTab("Closed")}
                label="Closed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  records
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Search:
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="RegNo / Name / Issue..."
                  className="h-9 w-full sm:w-[240px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                  RegNo.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[220px]">
                  Student
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[320px]">
                  Issue Details
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[360px]">
                  Last Action Details
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[200px]">
                  Complainant
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                  Issue On
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[120px]">
                  View
                </th>
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4">
                    <EmptyState
                      title="No data available in table"
                      subtitle="Try changing the tab or clearing search."
                    />
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                      {r.regNo}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {r.student}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.issueDetails}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.lastActionDetails}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.complainant}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.issueOn}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition shadow-sm"
                        onClick={() => {
                          // keep simple; you can route later
                          alert(`View: ${r.regNo} - ${r.student}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: info + pagination */}
        <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing{" "}
            <span className="font-semibold">
              {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {Math.min(safePage * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-semibold">{filtered.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              title="Previous"
            >
              ‹
            </button>

            <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 tabular-nums">
              {safePage} / {totalPages}
            </div>

            <button
              type="button"
              className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              title="Next"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
