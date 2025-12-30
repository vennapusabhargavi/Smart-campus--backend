import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Maximize2Icon,
  Minimize2Icon,
  DownloadIcon,
  XIcon,
} from "lucide-react";

// -------------------- helpers --------------------
const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDDMMYYYY = (d: Date) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const monthText = (d: Date) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, delta: number) =>
  new Date(d.getFullYear(), d.getMonth() + delta, 1);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type PanelKey = "holiday" | "notifications" | "attendance";

// -------------------- Premium Panel (with maximize) --------------------
function Panel({
  title,
  tone,
  children,
  maximized,
  onToggleMaximize,
}: {
  title: string;
  tone: "teal" | "red";
  children: React.ReactNode;
  maximized?: boolean;
  onToggleMaximize?: () => void;
}) {
  const header =
    tone === "teal"
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600"
      : "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500";

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0">
      {/* header */}
      <div className={`${header} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMaximize}
          className="h-8 w-8 grid place-items-center rounded-full border border-white/30 text-white hover:bg-white/10 active:scale-95 transition"
          aria-label={maximized ? "Minimize" : "Maximize"}
          title={maximized ? "Minimize" : "Maximize"}
        >
          {maximized ? <Minimize2Icon size={16} /> : <Maximize2Icon size={16} />}
        </button>
      </div>

      {/* body */}
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// -------------------- Calendar (controlled so it keeps state even if maximized) --------------------
function HolidayCalendar({
  cursor,
  setCursor,
  selected,
  setSelected,
}: {
  cursor: Date;
  setCursor: React.Dispatch<React.SetStateAction<Date>>;
  selected: Date;
  setSelected: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const today = useMemo(() => new Date(), []);
  const mStart = startOfMonth(cursor);
  const mEnd = endOfMonth(cursor);
  const leadBlanks = mStart.getDay(); // Sun=0
  const daysInMonth = mEnd.getDate();

  const cells: Array<{ kind: "blank" } | { kind: "day"; date: Date }> = [];
  for (let i = 0; i < leadBlanks; i++) cells.push({ kind: "blank" });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      kind: "day",
      date: new Date(cursor.getFullYear(), cursor.getMonth(), d),
    });
  }
  while (cells.length < 42) cells.push({ kind: "blank" });

  const onPrev = () => setCursor((d) => addMonths(d, -1));
  const onNext = () => setCursor((d) => addMonths(d, 1));
  const onToday = () => {
    const now = new Date();
    setCursor(now);
    setSelected(now);
  };

  return (
    <div className="flex flex-col h-full min-h-[430px]">
      {/* top controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={onPrev}
              className="h-9 w-9 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Previous month"
              title="Previous"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="h-9 w-9 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 transition"
              aria-label="Next month"
              title="Next"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToday}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            Today
          </button>
        </div>

        <div className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">
          {fmtDDMMYYYY(selected)}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {monthText(cursor)}
          </div>
          <span className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm">
            Month
          </span>
        </div>
      </div>

      {/* month label for mobile */}
      <div className="sm:hidden mt-2 text-sm text-slate-500 dark:text-slate-400">
        {monthText(cursor)}
      </div>

      {/* calendar box fills remaining height */}
      <div className="mt-3 flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        {/* day labels */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {d}
            </div>
          ))}
        </div>

        {/* 6 rows that stretch equally */}
        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {cells.map((c, idx) => {
            if (c.kind === "blank") {
              return (
                <div
                  key={idx}
                  className="border-b border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              );
            }

            const d = c.date;
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(d)}
                className={[
                  "border-b border-r border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
                  "px-2 pt-2 text-left relative",
                  isToday ? "bg-yellow-50 dark:bg-yellow-500/10" : "",
                  isSel ? "ring-2 ring-emerald-500 ring-inset" : "",
                ].join(" ")}
                aria-label={`Select ${fmtDDMMYYYY(d)}`}
              >
                <div className="text-xs font-medium text-slate-900 dark:text-slate-50">
                  {d.getDate()}
                </div>

                {/* subtle dot indicator for “events” (demo) */}
                {d.getDate() % 9 === 0 && (
                  <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------- Notifications --------------------
type Notice = {
  id: string;
  by: string;
  dateLabel: string;
  body: string;
  hasDownload?: boolean;
};

function NotificationItem({ n }: { n: Notice }) {
  return (
    <div className="flex gap-3 py-4 border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 grid place-items-center shadow-sm">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {n.by.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-sky-700 dark:text-sky-400">
          {n.by}{" "}
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            on
          </span>{" "}
          {n.dateLabel}
        </div>

        <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {n.body}
        </div>

        {n.hasDownload && (
          <div className="mt-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] transition shadow-sm"
            >
              <DownloadIcon size={14} />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------- Attendance Confirmation --------------------
function AttendanceConfirmationEmpty() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid place-items-center shadow-sm">
          <XIcon size={26} className="text-slate-600 dark:text-slate-200" />
        </div>
        <div className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">
          No Notification
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Attendance confirmation messages will appear here.
        </div>
      </div>
    </div>
  );
}

// -------------------- MAIN DASHBOARD --------------------
export default function StudentDashboard() {
  // maximize overlay
  const [maxPanel, setMaxPanel] = useState<PanelKey | null>(null);

  const toggleMax = (k: PanelKey) => {
    setMaxPanel((prev) => (prev === k ? null : k));
  };

  // ESC closes maximize
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaxPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // calendar state is lifted (so it stays consistent even after maximize toggles)
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());

  const notices: Notice[] = [
    {
      id: "n1",
      by: "Principal",
      dateLabel: "26/12/2025",
      body:
        "Notice: For all students residing in college hostel, the holidays will be from 12th Jan 2026 till 22th Jan 2026. Attendance is mandatory on 10th Jan 2026 and 26th Jan 2026.",
    },
    {
      id: "n2",
      by: "Principal",
      dateLabel: "26/12/2025",
      body:
        "Notice: For all day scholar students, the holidays will be from 12th Jan 2026 till 18th Jan 2026. Attendance is mandatory on 10th Jan 2026 and 19th Jan 2026.",
    },
    {
      id: "n3",
      by: "Principal",
      dateLabel: "10/12/2025",
      body: "2025 Batch - Exam Schedule (SLOT A & SLOT B) - Revised due to rain",
      hasDownload: true,
    },
    {
      id: "n4",
      by: "Principal",
      dateLabel: "08/12/2025",
      body:
        "MS2-Slot-D course survey form for 2022 2023, & 2024 batch students - Complete this before 8.00 AM tomorrow (09.12.2025)",
    },
    {
      id: "n5",
      by: "Principal",
      dateLabel: "05/12/2025",
      body:
        "I Year (2025 Batch) - SLOT B - Revision Class - Classroom Details (06.12.2025 to 10.12.2025)",
      hasDownload: true,
    },
    {
      id: "n6",
      by: "Principal",
      dateLabel: "05/12/2025",
      body:
        "Instructions to be followed While Enrolling the course in NPTEL 1. Choose the Correct college name (Saveetha School of Engineering) 2. Student use College register number for enrollment...",
    },
  ];

  // lock background scroll when maximized
  useEffect(() => {
    if (!maxPanel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [maxPanel]);

  // ---- panel content builders (so overlay uses the same content) ----
  const holidayContent = (
    <HolidayCalendar
      cursor={cursor}
      setCursor={setCursor}
      selected={selected}
      setSelected={setSelected}
    />
  );

  const notificationContent = (
    <div className="h-full overflow-y-auto scrollbar-hide pr-2">
      {notices.map((n) => (
        <NotificationItem key={n.id} n={n} />
      ))}
    </div>
  );

  const attendanceContent = <AttendanceConfirmationEmpty />;

  // Overlay panel renderer
  const renderOverlay = () => {
    if (!maxPanel) return null;

    const cfg =
      maxPanel === "holiday"
        ? { title: "HOLIDAY & EVENTS", tone: "teal" as const, body: holidayContent }
        : maxPanel === "notifications"
        ? { title: "NOTIFICATION", tone: "red" as const, body: notificationContent }
        : { title: "ATTENDANCE CONFIRMATION", tone: "teal" as const, body: attendanceContent };

    return (
      <div className="fixed inset-0 z-[80]">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMaxPanel(null)}
          aria-hidden="true"
        />

        {/* panel */}
        <div className="absolute inset-3 sm:inset-6 lg:inset-10">
          <div className="h-full w-full animate-[fadeIn_140ms_ease-out]">
            <Panel
              title={cfg.title}
              tone={cfg.tone}
              maximized
              onToggleMaximize={() => setMaxPanel(null)}
            >
              <div className="h-full min-h-0">{cfg.body}</div>
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative">
      {/* ---- main dashboard grid ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:min-h-[720px] xl:h-[calc(100vh-160px)]">
        {/* LEFT: Holiday + Attendance */}
        <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Holiday */}
          <div className="min-h-[540px] xl:flex-1 xl:min-h-0">
            <Panel
              title="HOLIDAY & EVENTS"
              tone="teal"
              maximized={maxPanel === "holiday"}
              onToggleMaximize={() => toggleMax("holiday")}
            >
              {holidayContent}
            </Panel>
          </div>

          {/* Attendance */}
          <div className="h-[270px]">
            <Panel
              title="ATTENDANCE CONFIRMATION"
              tone="teal"
              maximized={maxPanel === "attendance"}
              onToggleMaximize={() => toggleMax("attendance")}
            >
              {attendanceContent}
            </Panel>
          </div>
        </div>

        {/* RIGHT: Notifications (internal scroll) */}
        <div className="xl:col-span-4 min-h-[540px] xl:min-h-0 flex flex-col">
          <Panel
            title="NOTIFICATION"
            tone="red"
            maximized={maxPanel === "notifications"}
            onToggleMaximize={() => toggleMax("notifications")}
          >
            {/* IMPORTANT: fixed height on mobile/tablet; full height on xl */}
            <div className="h-[540px] xl:h-full min-h-0">{notificationContent}</div>
          </Panel>
        </div>
      </div>

      {/* ---- maximize overlay ---- */}
      {renderOverlay()}

      {/* Keyframes (Tailwind doesn't ship fadeIn by default) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
