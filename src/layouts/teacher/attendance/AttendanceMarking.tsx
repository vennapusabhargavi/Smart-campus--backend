// src/layouts/teacher/attendance/AttendanceMarking.tsx
import React, { useMemo, useState } from "react";

type StudentRow = {
  sno: number;
  regNo: string;
  name: string;
};

type CourseOption = {
  id: string;
  label: string;
};

const courses: CourseOption[] = [
  { id: "MMA1135", label: "MMA1135-Mentor Mentee Meeting" },
  { id: "CSA1524", label: "CSA1524-Cloud Computing & Big Data Analytics" },
  { id: "SPIC411", label: "SPIC411-Core Project" },
];

const studentsSeed: StudentRow[] = [
  { sno: 1, regNo: "192214001", name: "Adithyan SV" },
  { sno: 2, regNo: "192213025", name: "AKASH S" },
  { sno: 3, regNo: "192219005", name: "ALLOCIES JOHN BRITTO" },
  { sno: 4, regNo: "192219001", name: "AYSHA FARHA R" },
  { sno: 5, regNo: "192213026", name: "CHEJARLA CHAKRADHAR" },
  { sno: 6, regNo: "192213024", name: "DEVI G" },
  { sno: 7, regNo: "192213027", name: "JEEVAN ADITHYA .G" },
  { sno: 8, regNo: "192213023", name: "KISHORE A" },
  { sno: 9, regNo: "192217001", name: "MIRACLIN DAFNE M" },
  { sno: 10, regNo: "192213022", name: "NANDHINI Y" },
  { sno: 11, regNo: "192217002", name: "NIRANJAN S" },
  { sno: 12, regNo: "192217003", name: "NITHISHWAR V" },
  { sno: 13, regNo: "192219004", name: "NIVEDITHA S" },
  { sno: 14, regNo: "192215001", name: "RAKESH B" },
  { sno: 15, regNo: "192216002", name: "SOBHAN S K" },
  { sno: 16, regNo: "192216001", name: "THALLURU MOHAN KRISHNA" },
];

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AttendanceMarking() {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const students = useMemo(() => studentsSeed, []);

  // ✅ true = Present (tick), false = Absent (no tick)
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(students.map((s) => [s.regNo, true]))
  );

  const totals = useMemo(() => {
    let present = 0;
    for (const s of students) if (presentMap[s.regNo]) present += 1;
    const absent = students.length - present;
    return { present, absent, total: students.length };
  }, [presentMap, students]);

  const toggle = (regNo: string) =>
    setPresentMap((prev) => ({ ...prev, [regNo]: !prev[regNo] }));

  const markAllPresent = () => {
    const next: Record<string, boolean> = {};
    for (const s of students) next[s.regNo] = true;
    setPresentMap(next);
  };

  const markAllAbsent = () => {
    const next: Record<string, boolean> = {};
    for (const s of students) next[s.regNo] = false;
    setPresentMap(next);
  };

  const handleSave = () => {
    console.log("SAVE attendance", {
      courseId,
      rows: students.map((s) => ({
        regNo: s.regNo,
        name: s.name,
        status: presentMap[s.regNo] ? "P" : "A",
      })),
    });
    alert("Attendance saved (demo).");
  };

  const courseLabel = courses.find((c) => c.id === courseId)?.label ?? courseId;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Attendance Marking
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tick only for present. Unticked = absent.
          </p>
        </div>

        {/* Minimal counts (no icons, no dots) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Present: {totals.present}
          </span>
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Absent: {totals.absent}
          </span>
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Total: {totals.total}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Course select */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="text-rose-600 dark:text-rose-400">*</span> Course
            </div>

            <div className="min-w-[260px] w-full sm:w-[420px]">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                aria-label="Select course"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                Selected: {courseLabel}
              </div>
            </div>
          </div>

          {/* Actions (text-only) */}
          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <button
              type="button"
              onClick={markAllPresent}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Mark all Present
            </button>
            <button
              type="button"
              onClick={markAllAbsent}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Mark all Absent
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-700 via-sky-600 to-blue-600 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[80px]">
                  S No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Reg No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200">
                  Student Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Present
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, idx) => {
                const isPresent = !!presentMap[s.regNo];

                return (
                  <tr
                    key={s.regNo}
                    className={clsx(
                      "border-b border-slate-200 dark:border-slate-800",
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-950/30"
                        : "bg-slate-50/60 dark:bg-slate-900/30"
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {s.sno}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 tabular-nums">
                      {s.regNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      {s.name}
                    </td>

                    {/* ✅ only one tick */}
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          onChange={() => toggle(s.regNo)}
                          className={clsx(
                            "h-4 w-4 rounded border-slate-300 dark:border-slate-700",
                            "text-sky-600 focus:ring-sky-500/35",
                            "accent-sky-600"
                          )}
                          aria-label={`Mark ${s.name} present`}
                        />
                      </div>
                    </td>

                    {/* status is plain text (no symbol) */}
                    <td className="px-4 py-3">
                      <div className="text-center text-xs font-semibold">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded-lg border",
                            isPresent
                              ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-500/10 dark:text-sky-200"
                              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-200"
                          )}
                        >
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing 1 to {students.length} of {students.length} entries
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Note: Only tick for present. Unticked means absent.
          </div>
        </div>
      </div>
    </div>
  );
}
