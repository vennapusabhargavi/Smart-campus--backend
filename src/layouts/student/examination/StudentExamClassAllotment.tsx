// src/layouts/student/examination/StudentExamClassAllotment.tsx
import React, { useEffect, useMemo, useState } from "react";
import { StudentPageShell } from "../StudentPageShell";
import {
  CalendarDaysIcon,
  SearchIcon,
  DownloadIcon,
  MapPinIcon,
  BadgeCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";

type AllotmentStatus = "ALLOCATED" | "PENDING" | "NOT_ELIGIBLE";

type ExamClassAllotmentItem = {
  id: string;

  // exam info
  examDate: string; // yyyy-mm-dd
  session: string; // FN/AN or "Morning/Evening"
  subjectCode: string;
  subjectName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  // allocation info (from exam + classroom allocation agents)
  roomCode: string; // e.g., B-201
  roomName?: string; // optional
  building?: string; // optional
  seatNo?: string; // optional
  tokenNo?: number; // optional
  venueNote?: string; // optional

  // hall ticket / eligibility
  hallTicketNo?: string;
  status: AllotmentStatus;
  statusReason?: string;

  // provenance
  allocatedBy?: string; // e.g., "Classroom Allocation Agent"
  allocatedAt?: string; // dd/mm/yyyy HH:mm
};

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

const THEME_TEXT = {
  panel:
    "rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur " +
    "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden",
  card:
    "rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur " +
    "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-4",
  pillBase: "text-xs px-2 py-1 rounded-lg border font-semibold inline-flex items-center gap-1",
};

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isPast(dateYmd: string) {
  const d = new Date(dateYmd + "T00:00:00");
  const now = new Date();
  // compare by date only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return d.getTime() < today;
}

/**
 * Optional API (if your backend exposes it):
 *   GET  /student/exams/class-allotment
 *   -> { ok: true, items: ExamClassAllotmentItem[] }
 *
 * If it doesn't exist yet, this component still works using local demo data.
 */
async function fetchAllotmentsFromApi(): Promise<ExamClassAllotmentItem[] | null> {
  try {
    const API_BASE =
      (import.meta as any)?.env?.VITE_API_BASE_URL ||
      (window as any).__API_BASE_URL__ ||
      "http://localhost:4000";

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("access_token") ||
      "";

    const res = await fetch(`${API_BASE}/student/exams/class-allotment`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json || json.ok !== true || !Array.isArray(json.items)) return null;

    return json.items as ExamClassAllotmentItem[];
  } catch {
    return null;
  }
}

const DEMO_ITEMS: ExamClassAllotmentItem[] = [
  {
    id: "exa_1",
    examDate: "2025-12-29",
    session: "FN",
    subjectCode: "CS3401",
    subjectName: "Database Management Systems",
    startTime: "09:30",
    endTime: "12:30",
    roomCode: "B-201",
    building: "Main Block",
    seatNo: "B201-18",
    hallTicketNo: "HT-2025-192213001",
    status: "ALLOCATED",
    allocatedBy: "Classroom Allocation Agent",
    allocatedAt: "27/12/2025 10:14",
    venueNote: "Report 15 minutes early. Carry ID card.",
  },
  {
    id: "exa_2",
    examDate: "2025-12-31",
    session: "AN",
    subjectCode: "CS3402",
    subjectName: "Operating Systems",
    startTime: "13:30",
    endTime: "16:30",
    roomCode: "C-105",
    building: "Tech Block",
    seatNo: "C105-07",
    hallTicketNo: "HT-2025-192213001",
    status: "ALLOCATED",
    allocatedBy: "Classroom Allocation Agent",
    allocatedAt: "27/12/2025 10:14",
  },
  {
    id: "exa_3",
    examDate: "2026-01-03",
    session: "FN",
    subjectCode: "CS3403",
    subjectName: "Computer Networks",
    startTime: "09:30",
    endTime: "12:30",
    roomCode: "—",
    status: "PENDING",
    statusReason: "Allocation pending (slots not generated yet).",
    allocatedBy: "Examination Management Agent",
    allocatedAt: "27/12/2025 09:58",
  },
];

type ViewTab = "upcoming" | "past" | "all";

export function StudentExamClassAllotment() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExamClassAllotmentItem[]>([]);
  const [tab, setTab] = useState<ViewTab>("upcoming");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const toastMsg = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const api = await fetchAllotmentsFromApi();
      if (!alive) return;

      if (api && api.length) {
        setItems(api);
      } else {
        // fallback demo
        setItems(DEMO_ITEMS);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    let base = items.slice();

    if (tab === "upcoming") base = base.filter((x) => !isPast(x.examDate));
    if (tab === "past") base = base.filter((x) => isPast(x.examDate));

    if (!s) return base.sort((a, b) => a.examDate.localeCompare(b.examDate));

    return base
      .filter((x) =>
        `${x.examDate} ${x.session} ${x.subjectCode} ${x.subjectName} ${x.roomCode} ${x.building ?? ""} ${
          x.seatNo ?? ""
        } ${x.status} ${x.hallTicketNo ?? ""}`
          .toLowerCase()
          .includes(s)
      )
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [items, q, tab]);

  const kpis = useMemo(() => {
    const total = items.length;
    const allocated = items.filter((x) => x.status === "ALLOCATED").length;
    const pending = items.filter((x) => x.status === "PENDING").length;
    const notEligible = items.filter((x) => x.status === "NOT_ELIGIBLE").length;
    return { total, allocated, pending, notEligible };
  }, [items]);

  const StatusPill = ({ status }: { status: AllotmentStatus }) => {
    const cls =
      status === "ALLOCATED"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        : status === "PENDING"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";

    return (
      <span className={clsx(THEME_TEXT.pillBase, cls)}>
        {status === "ALLOCATED" ? <BadgeCheckIcon className="h-3.5 w-3.5" /> : <AlertTriangleIcon className="h-3.5 w-3.5" />}
        {status}
      </span>
    );
  };

  const TabBtn = ({ k, children }: { k: ViewTab; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => setTab(k)}
      className={clsx(
        "h-10 px-4 text-sm font-semibold transition",
        tab === k
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );

  return (
    <StudentPageShell
      title="Examination • Class Allotment"
      subtitle="Room and seat details allocated by the Examination + Classroom Allocation agents."
      crumbs={[
        { label: "Student", to: "/student/home" },
        { label: "Examination", to: "/student/examination" },
        { label: "Class Allotment" },
      ]}
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Exams", value: kpis.total },
          { label: "Allocated", value: kpis.allocated },
          { label: "Pending", value: kpis.pending },
          { label: "Not Eligible", value: kpis.notEligible },
        ].map((c) => (
          <div key={c.label} className={THEME_TEXT.card}>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className={clsx("mt-4", THEME_TEXT.panel)}>
        {/* header strip */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-slate-800/70">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/60">
                <CalendarDaysIcon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Your Exam Seat & Room</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Allocation source: <span className="font-semibold">Classroom Allocation Agent</span> (after Exam scheduling)
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <TabBtn k="upcoming">Upcoming</TabBtn>
                <TabBtn k="past">Past</TabBtn>
                <TabBtn k="all">All</TabBtn>
              </div>

              <div className="relative">
                <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search subject / room / date..."
                  className={clsx(
                    "h-10 w-[280px] max-w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                    "pl-9 pr-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  downloadJson(`exam_class_allotment_${Date.now()}.json`, filtered);
                  toastMsg("Downloaded JSON.");
                }}
                className={clsx(
                  "h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                  "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                  "active:scale-[0.99] transition shadow-sm inline-flex items-center gap-2"
                )}
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="px-4 sm:px-6 py-5">
          <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                    Date / Session
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[320px]">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                    Room / Seat
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                    Hall Ticket
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Loading…</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Fetching class allotment (or showing demo if API not available).
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No records</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        If allocation is pending, it will appear once the agents assign rooms/seats.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((x) => (
                    <tr
                      key={x.id}
                      className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white tabular-nums">{x.examDate}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{x.session}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {x.subjectCode} • {x.subjectName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Allocated by: <span className="font-semibold">{x.allocatedBy ?? "—"}</span>
                          {x.allocatedAt ? <span className="tabular-nums"> • {x.allocatedAt}</span> : null}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                        {x.startTime}–{x.endTime}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          {x.roomCode}
                          {x.building ? (
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              • {x.building}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Seat: <span className="font-semibold tabular-nums">{x.seatNo ?? "—"}</span>
                          {typeof x.tokenNo === "number" ? (
                            <span className="ml-2">Token: <span className="font-semibold tabular-nums">{x.tokenNo}</span></span>
                          ) : null}
                        </div>
                        {x.venueNote ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.venueNote}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        <div className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {x.hallTicketNo ?? "—"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          (Download via portal if enabled)
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill status={x.status} />
                        {x.statusReason ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.statusReason}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* small footer actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> record(s)
            </div>

            <button
              type="button"
              onClick={() => {
                setQ("");
                setTab("upcoming");
                toastMsg("Filters reset.");
              }}
              className={clsx(
                "h-9 px-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                "active:scale-[0.99] transition shadow-sm"
              )}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">{toast}</div>
        </div>
      )}
    </StudentPageShell>
  );
}
