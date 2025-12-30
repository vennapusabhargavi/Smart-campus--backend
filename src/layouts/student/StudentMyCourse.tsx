// src/layouts/student/StudentMyCourse.tsx
import React, { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ListIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
} from "lucide-react";

type CourseInProgressRow = {
  courseCode: string;
  courseName: string;
  status: "InProgress";
  enrollOn: string;
};

type CourseCompletedRow = {
  sno: number;
  courseCode: string;
  courseName: string;
  grade: string;
  status: "PASS";
  monthYear: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SectionTone = { from: string; to: string; border: string; badge?: string };

function SectionCard({
  title,
  tone,
  icon,
  defaultOpen = true,
  right,
  children,
}: {
  title: string;
  tone: SectionTone;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "border bg-white dark:bg-slate-900",
        "shadow-sm shadow-slate-900/5 dark:shadow-black/20",
        "transition-shadow duration-300",
        "hover:shadow-md hover:shadow-slate-900/10 dark:hover:shadow-black/30",
        "border-slate-200/80 dark:border-slate-800"
      )}
      style={
        {
          ["--tone-from" as any]: tone.from,
          ["--tone-to" as any]: tone.to,
          ["--tone-border" as any]: tone.border,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3",
          "px-4 md:px-5 py-3",
          "text-white",
          "bg-[linear-gradient(90deg,var(--tone-from),var(--tone-to))]",
          "border-b border-[color:var(--tone-border)]/30",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/15 shadow-sm">
            {icon}
          </span>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[13px] md:text-sm font-semibold tracking-wide uppercase truncate">
                {title}
              </div>
              {tone.badge && (
                <span className="hidden sm:inline-flex items-center rounded-full bg-white/15 ring-1 ring-white/15 px-2 py-0.5 text-[11px] font-semibold">
                  {tone.badge}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-[12px] text-white/80 -mt-0.5">
              Click to {open ? "collapse" : "expand"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {right}
          <ChevronDownIcon
            size={18}
            className={cn(
              "shrink-0 transition-transform duration-300",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 bg-white/60 dark:bg-slate-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableShell({
  children,
  maxHeightClass = "",
}: {
  children: React.ReactNode;
  maxHeightClass?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.06)] dark:shadow-black/20">
      <div
        className={cn(
          "overflow-x-auto",
          maxHeightClass && "overflow-y-auto",
          maxHeightClass
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** ✅ FIX: allow colSpan, rowSpan, etc. */
function Th({
  children,
  className = "",
  align = "left",
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      {...rest}
      className={cn(
        "text-[12.5px] font-semibold",
        "bg-slate-50/95 dark:bg-slate-800/70",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-700",
        "px-3 py-2.5",
        "sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

/** ✅ FIX: allow colSpan, rowSpan, etc. */
function Td({
  children,
  className = "",
  align = "left",
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      {...rest}
      className={cn(
        "text-[13px] leading-5",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200/70 dark:border-slate-800",
        "px-3 py-3",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </td>
  );
}

function StatusBarInProgress() {
  return (
    <div className="w-[190px] max-w-full" aria-label="InProgress status">
      <div className="h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full w-full flex items-center justify-center text-[12px] font-semibold text-white shadow-inner"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(59,130,246,0.78) 0px, rgba(59,130,246,0.78) 12px, rgba(147,197,253,0.78) 12px, rgba(147,197,253,0.78) 24px)",
          }}
        >
          InProgress
        </div>
      </div>
    </div>
  );
}

function PassPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
      <CheckIcon size={14} />
      PASS
    </span>
  );
}

function Donut({
  label,
  ratioText,
  percent = 0,
}: {
  label: string;
  ratioText: string;
  percent?: number;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const size = 148;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[13px] font-semibold text-slate-900 dark:text-white text-center">
        {label}{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          - {ratioText}
        </span>
      </div>

      <div className="relative">
        <svg width={size} height={size} className="drop-shadow-sm">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(220,38,38,0.18)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(220,38,38)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center rounded-full">
          <div className="h-[96px] w-[96px] rounded-full bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-inner flex items-center justify-center">
            <div className="text-[14px] font-extrabold text-emerald-600">
              {p}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentMyCourse() {
  const regNo = useMemo(
    () => localStorage.getItem("userId") || "student-1",
    []
  );

  const inProgress: CourseInProgressRow[] = useMemo(
    () => [
      {
        courseCode: "MMA1088",
        courseName: "Mentor Mentee Meeting",
        status: "InProgress",
        enrollOn: "07/02/2025",
      },
    ],
    []
  );

  const completed: CourseCompletedRow[] = useMemo(
    () => [
      { sno: 1, courseCode: "SPIC4", courseName: "Core Project", grade: "A", status: "PASS", monthYear: "December-2025" },
      { sno: 2, courseCode: "ECA05", courseName: "Engineering Electromagnetics", grade: "C", status: "PASS", monthYear: "December-2025" },
      { sno: 3, courseCode: "ECA03", courseName: "Signals and Systems", grade: "C", status: "PASS", monthYear: "December-2025" },
      { sno: 4, courseCode: "ECA06", courseName: "Integrated Circuits", grade: "D", status: "PASS", monthYear: "December-2025" },
      { sno: 5, courseCode: "ECA15", courseName: "Transmission Lines And Waveguides", grade: "D", status: "PASS", monthYear: "December-2025" },
    ],
    []
  );

  const completedCount = completed.length;
  const inProgressCount = inProgress.length;

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      {/* ✅ Header EXACT structure like your screenshot (no card/background) */}
      <div className="px-0">
        <div className="text-[34px] font-light text-slate-800 dark:text-slate-50 tracking-tight">
          My Course
        </div>
        <div className="mt-1 text-[14px] text-slate-600 dark:text-slate-300">
          Register No:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {regNo}
          </span>
        </div>
      </div>

      {/* ✅ content directly (no outer gradient card wrapper) */}
      <div className="space-y-6">
        {/* INPROGRESS COURSES */}
        <SectionCard
          title="INPROGRESS COURSES"
          tone={{
            from: "#ef4444",
            to: "#fb7185",
            border: "#ef4444",
            badge: `${inProgressCount} course(s)`,
          }}
          icon={<ListIcon size={16} className="text-white" />}
          defaultOpen
        >
          <TableShell>
            <table className="min-w-[920px] w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[180px]" align="center">
                    Course Code
                  </Th>
                  <Th align="center">Course Name</Th>
                  <Th className="w-[220px]" align="center">
                    Status
                  </Th>
                  <Th className="w-[180px]" align="center">
                    Enroll On
                  </Th>
                </tr>
              </thead>
              <tbody>
                {inProgress.map((r, idx) => (
                  <tr
                    key={r.courseCode}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/60",
                      "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                    )}
                  >
                    <Td
                      align="center"
                      className="font-semibold text-slate-900 dark:text-white"
                    >
                      {r.courseCode}
                    </Td>
                    <Td align="center">{r.courseName}</Td>
                    <Td align="center">
                      <div className="flex justify-center">
                        <StatusBarInProgress />
                      </div>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.enrollOn}
                    </Td>
                  </tr>
                ))}

                {inProgress.length === 0 && (
                  <tr>
                    <Td
                      colSpan={4}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No in-progress courses.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </SectionCard>

        {/* GRADUATION STATUS */}
        <SectionCard
          title="GRADUATION STATUS"
          tone={{
            from: "#7c3aed",
            to: "#a78bfa",
            border: "#7c3aed",
            badge: "0% completed",
          }}
          icon={<BellIcon size={16} className="text-white" />}
          defaultOpen
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <Donut label="Program Elective" ratioText="0/6" percent={0} />
            <Donut label="Program Core" ratioText="0/25" percent={0} />
            <Donut label="University Core" ratioText="0/12" percent={0} />
            <Donut label="University Elective" ratioText="0/4" percent={0} />
          </div>
        </SectionCard>

        {/* COMPLETED COURSES */}
        <SectionCard
          title="COMPLETED COURSES"
          tone={{
            from: "#0ea5a4",
            to: "#34d399",
            border: "#0ea5a4",
            badge: `${completedCount} record(s)`,
          }}
          icon={<CheckCircle2Icon size={16} className="text-white" />}
          defaultOpen
        >
          <TableShell maxHeightClass="max-h-[420px]">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[80px]" align="center">
                    Sno
                  </Th>
                  <Th className="w-[170px]" align="center">
                    Course Code
                  </Th>
                  <Th align="center">Course Name</Th>
                  <Th className="w-[140px]" align="center">
                    Grade
                  </Th>
                  <Th className="w-[160px]" align="center">
                    Status
                  </Th>
                  <Th className="w-[220px]" align="center">
                    Month&amp;Year
                  </Th>
                </tr>
              </thead>
              <tbody>
                {completed.map((r, idx) => (
                  <tr
                    key={r.sno}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/60",
                      "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                    )}
                  >
                    <Td align="center" className="tabular-nums">
                      {r.sno}
                    </Td>
                    <Td
                      align="center"
                      className="font-semibold text-slate-900 dark:text-white"
                    >
                      {r.courseCode}
                    </Td>
                    <Td align="center">{r.courseName}</Td>
                    <Td align="center" className="font-semibold">
                      {r.grade}
                    </Td>
                    <Td align="center">
                      <PassPill />
                    </Td>
                    <Td align="center">{r.monthYear}</Td>
                  </tr>
                ))}

                {completed.length === 0 && (
                  <tr>
                    <Td
                      colSpan={6}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No completed courses.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </SectionCard>
      </div>
    </div>
  );
}

export default StudentMyCourse;
