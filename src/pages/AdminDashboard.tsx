// src/layouts/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExpandIcon,
  Minimize2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersIcon,
  Building2Icon,
  WalletIcon,
  GraduationCapIcon,
} from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- Premium Panel (matches your TeacherDashboard style) ----------
function useBodyScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}

function Panel({
  title,
  subtitle,
  tone = "indigo",
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "indigo" | "teal" | "rose";
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [max, setMax] = useState(false);
  useBodyScrollLock(max);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMax(false);
    };
    if (max) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [max]);

  const hdr =
    tone === "teal"
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600"
      : tone === "rose"
      ? "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500"
      : "bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600";

  const card =
    "rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0";

  const body = (
    <div className={cn(card, max && "h-[calc(100vh-3rem)]")}>
      <div className={cn(hdr, "px-4 py-3 flex items-start justify-between gap-3")}>
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
          {subtitle && <div className="text-white/80 text-xs mt-0.5 truncate">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-2">
          {right}
          <button
            type="button"
            onClick={() => setMax((v) => !v)}
            className="h-9 w-9 rounded-xl border border-white/25 text-white/95 hover:bg-white/10 grid place-items-center transition"
            aria-label={max ? "Minimize panel" : "Maximize panel"}
            title={max ? "Minimize" : "Maximize"}
          >
            {max ? <Minimize2Icon size={16} /> : <ExpandIcon size={16} />}
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );

  if (!max) return body;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] p-3 sm:p-6">
      <div className="h-full w-full">{body}</div>
    </div>
  );
}

// ---------- KPI cards ----------
function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: "indigo" | "teal" | "rose" | "slate";
}) {
  const ring =
    tone === "teal"
      ? "ring-emerald-200/70 dark:ring-emerald-900/40"
      : tone === "rose"
      ? "ring-rose-200/70 dark:ring-rose-900/40"
      : tone === "slate"
      ? "ring-slate-200/70 dark:ring-slate-800/70"
      : "ring-indigo-200/70 dark:ring-indigo-900/40";

  const badge =
    tone === "teal"
      ? "bg-emerald-600 text-white"
      : tone === "rose"
      ? "bg-rose-600 text-white"
      : tone === "slate"
      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      : "bg-indigo-600 text-white";

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/90 dark:bg-slate-950/60 backdrop-blur border border-slate-200/70 dark:border-slate-800/70 shadow-sm",
        "p-4 ring-1",
        ring
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{hint}</div>}
        </div>
        <div className={cn("h-11 w-11 rounded-2xl grid place-items-center", badge)}>{icon}</div>
      </div>
    </div>
  );
}

// ---------- Calendar (simple month grid) ----------
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
function toYmd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Holiday = { date: string; name: string; type: "Holiday" | "Event" | "Reminder" };

function HolidayCalendar({
  items,
}: {
  items: Holiday[];
}) {
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);

  // Make 6 rows grid (like classic calendar)
  const startIdx = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = last.getDate();
  const totalCells = 42;

  const map = useMemo(() => {
    const m = new Map<string, Holiday[]>();
    for (const h of items) {
      const arr = m.get(h.date) ?? [];
      arr.push(h);
      m.set(h.date, arr);
    }
    return m;
  }, [items]);

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startIdx + 1;
    const d = new Date(first.getFullYear(), first.getMonth(), dayNum);
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    cells.push({ date: d, inMonth });
  }

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDaysIcon size={16} />
          {monthLabel(cursor)}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-xs font-semibold"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, +1))}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
            aria-label="Next month"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dow.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
            {d}
          </div>
        ))}
        {cells.map(({ date, inMonth }, idx) => {
          const ymd = toYmd(date);
          const hits = map.get(ymd) ?? [];
          const isToday = sameDay(date, today);
          return (
            <div
              key={`${ymd}-${idx}`}
              className={cn(
                "rounded-xl border p-2 min-h-[78px] transition",
                inMonth
                  ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  : "border-slate-100 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/20 opacity-70",
                isToday && "ring-2 ring-indigo-400/60 dark:ring-indigo-300/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("text-[11px] font-semibold", inMonth ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")}>
                  {date.getDate()}
                </div>
                {hits.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40">
                    {hits.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1">
                {hits.slice(0, 2).map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-lg border truncate",
                      h.type === "Holiday"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                        : h.type === "Event"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                    )}
                    title={h.name}
                  >
                    {h.name}
                  </div>
                ))}
                {hits.length > 2 && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                    +{hits.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-3">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Tip: Use this for academic events, exam windows, fee due reminders, placement drives.
        </div>
      </div>
    </div>
  );
}

// ---------- Notifications list (admin) ----------
type AdminNotif = {
  id: string;
  when: string;
  title: string;
  desc: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
};

function NotifDot({ s }: { s: AdminNotif["severity"] }) {
  const cls =
    s === "SUCCESS"
      ? "bg-emerald-500"
      : s === "WARNING"
      ? "bg-amber-500"
      : s === "DANGER"
      ? "bg-rose-500"
      : "bg-sky-500";
  return <span className={cn("h-2.5 w-2.5 rounded-full", cls)} />;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Main Admin Dashboard ----------
export const AdminDashboard: React.FC = () => {
  // Demo data (wire to API later)
  const kpis = useMemo(
    () => ({
      totalUsers: 12458,
      activeStudents: 10240,
      activeFaculty: 612,
      rooms: 148,
      pendingRoomReq: 9,
      pendingExamSessions: 2,
      feeDueCount: 341,
      paymentIssues: 7,
      placementDrives: 4,
      notificationsUnread: 6,
    }),
    []
  );

  const holidays: Holiday[] = useMemo(
    () => [
      { date: toYmd(new Date()), name: "System Health Check", type: "Reminder" },
      { date: "2025-06-10", name: "Internal Assessment Window", type: "Event" },
      { date: "2025-06-15", name: "Fee Due Reminder", type: "Reminder" },
      { date: "2025-06-20", name: "Placement Drive", type: "Event" },
      { date: "2025-06-24", name: "Holiday", type: "Holiday" },
    ],
    []
  );

  const [notifs, setNotifs] = useState<AdminNotif[]>(() => [
    {
      id: "n1",
      when: "Today 09:12",
      title: "Worker running",
      desc: "Agent worker polling agent_events successfully.",
      severity: "SUCCESS",
    },
    {
      id: "n2",
      when: "Today 10:05",
      title: "Fee dues pending",
      desc: "341 students pending fee clearance. Reminder batch queued.",
      severity: "WARNING",
    },
    {
      id: "n3",
      when: "Today 11:30",
      title: "Payment issue",
      desc: "7 payment issues require reconciliation.",
      severity: "DANGER",
    },
    {
      id: "n4",
      when: "Yesterday",
      title: "Exam session prepared",
      desc: "2 exam sessions created and rooms requested.",
      severity: "INFO",
    },
  ]);

  const exportNotifs = () => {
    const text = notifs
      .map((n) => `${n.when} [${n.severity}] ${n.title} — ${n.desc}`)
      .join("\n");
    downloadTextFile("admin_dashboard_notifications.txt", text);
  };

  const refreshDemo = () => {
    // in real app: fetch dashboard snapshot endpoints
    setNotifs((prev) => prev.slice());
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">
            Admin Dashboard
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Campus-wide snapshot for users, classrooms, exams, fees, placements and alerts.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshDemo}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
          >
            <RefreshCwIcon size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportNotifs}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <DownloadIcon size={16} />
            Download Report
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Total Users"
          value={kpis.totalUsers}
          hint="Students + Faculty + Admin"
          icon={<UsersIcon size={18} />}
          tone="slate"
        />
        <KpiCard
          label="Active Students"
          value={kpis.activeStudents}
          hint="Currently enrolled"
          icon={<GraduationCapIcon size={18} />}
          tone="indigo"
        />
        <KpiCard
          label="Active Faculty"
          value={kpis.activeFaculty}
          hint="Teaching staff"
          icon={<ShieldCheckIcon size={18} />}
          tone="teal"
        />
        <KpiCard
          label="Classrooms"
          value={kpis.rooms}
          hint="Available rooms in DB"
          icon={<Building2Icon size={18} />}
          tone="indigo"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left column */}
        <div className="xl:col-span-7 space-y-4 min-h-0">
          <Panel
            title="Campus Calendar"
            subtitle="Events • holidays • key reminders"
            tone="teal"
            right={
              <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
                Live
              </span>
            }
          >
            <HolidayCalendar items={holidays} />
          </Panel>

          <Panel
            title="Operations Queue"
            subtitle="Quick admin actions (demo)"
            tone="indigo"
            right={
              <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
                Snapshot
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Pending Room Requests",
                  value: kpis.pendingRoomReq,
                  icon: <Building2Icon size={16} />,
                  hint: "Classroom allocation queue",
                },
                {
                  title: "Pending Exam Sessions",
                  value: kpis.pendingExamSessions,
                  icon: <CalendarDaysIcon size={16} />,
                  hint: "Sessions awaiting scheduling",
                },
                {
                  title: "Fee Dues Pending",
                  value: kpis.feeDueCount,
                  icon: <WalletIcon size={16} />,
                  hint: "Students not cleared",
                },
                {
                  title: "Payment Issues",
                  value: kpis.paymentIssues,
                  icon: <TriangleAlertIcon size={16} />,
                  hint: "Mismatch / failure / recon",
                },
              ].map((x) => (
                <div
                  key={x.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {x.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {x.hint}
                      </div>
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 grid place-items-center">
                      {x.icon}
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {x.value}
                    </div>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                In production: these “View” buttons should route to AdminClassrooms, AdminFees,
                Exam sessions and Payment Issues pages.
              </div>
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="xl:col-span-5 space-y-4 min-h-0">
          <Panel
            title="Admin Notifications"
            subtitle="System + agents + operations"
            tone="rose"
            right={
              <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
                Unread: {kpis.notificationsUnread}
              </span>
            }
          >
            <div className="space-y-3">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <NotifDot s={n.severity} />
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {n.desc}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        {n.when}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}
                      className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      <BellIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {notifs.length === 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-6 text-center">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    All caught up
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    No new notifications.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setNotifs((prev) => [
                      {
                        id: `n_${Date.now()}`,
                        when: "Now",
                        title: "Manual test notification",
                        desc: "This is a demo notification added from AdminDashboard.",
                        severity: "INFO",
                      },
                      ...prev,
                    ])
                  }
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
                >
                  <CheckCircle2Icon size={16} />
                  Add test
                </button>

                <button
                  type="button"
                  onClick={exportNotifs}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <DownloadIcon size={16} />
                  Download
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Governance" subtitle="Access, audit and compliance" tone="indigo">
            <div className="space-y-3">
              {[
                { k: "Role-based access", v: "Enabled", icon: <ShieldCheckIcon size={16} /> },
                { k: "Audit logs", v: "Capturing", icon: <CheckCircle2Icon size={16} /> },
                { k: "Queue worker", v: "Online", icon: <CheckCircle2Icon size={16} /> },
                { k: "Security posture", v: "Good", icon: <CheckCircle2Icon size={16} /> },
              ].map((r) => (
                <div
                  key={r.k}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 grid place-items-center">
                      {r.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {r.k}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {r.v}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 transition"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
