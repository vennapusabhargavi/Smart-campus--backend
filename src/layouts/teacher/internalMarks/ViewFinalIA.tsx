// src/layouts/teacher/internalMarks/ViewFinalIA.tsx
import React, { useMemo, useState } from "react";

type CourseOpt = { id: string; label: string };

type WeightageRow = {
  id: string;
  testName: string;
  weightage: number;
  datedOn: string; // DD/MM/YYYY
};

type MarkRow = {
  id: string;
  sno: number;
  regNo: string;
  name: string;
  markValue: number;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 shadow-sm">
      {text}
    </span>
  );
}

function TableShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function ViewFinalIA() {
  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "", label: "--Select--" },
      { id: "CSA0204", label: "CSA0204 - C programming for Computing System" },
      { id: "CSA0289", label: "CSA0289 - C programming for Quantum Computing" },
      { id: "CSA1524", label: "CSA1524 - Cloud Computing & Big Data Analytics" },
    ],
    []
  );

  const weightageData: Record<string, WeightageRow[]> = useMemo(
    () => ({
      CSA0204: [
        { id: "w1", testName: "ASSIGNMENT", weightage: 10, datedOn: "28/03/2025" },
        { id: "w2", testName: "Capstone project", weightage: 10, datedOn: "28/03/2025" },
        { id: "w3", testName: "Class practical", weightage: 10, datedOn: "28/03/2025" },
        { id: "w4", testName: "Debug", weightage: 15, datedOn: "28/03/2025" },
        { id: "w5", testName: "LEVEL 1", weightage: 15, datedOn: "28/03/2025" },
        { id: "w6", testName: "LEVEL 2", weightage: 15, datedOn: "28/03/2025" },
        { id: "w7", testName: "LEVEL 3", weightage: 15, datedOn: "28/03/2025" },
        { id: "w8", testName: "Viva", weightage: 10, datedOn: "28/03/2025" },
      ],
      CSA0289: [
        { id: "w1", testName: "Assignment", weightage: 20, datedOn: "10/04/2025" },
        { id: "w2", testName: "Quiz", weightage: 20, datedOn: "10/04/2025" },
        { id: "w3", testName: "Lab Practical", weightage: 30, datedOn: "10/04/2025" },
        { id: "w4", testName: "Viva", weightage: 30, datedOn: "10/04/2025" },
      ],
      CSA1524: [
        { id: "w1", testName: "IA-1", weightage: 40, datedOn: "08/05/2025" },
        { id: "w2", testName: "IA-2", weightage: 40, datedOn: "08/05/2025" },
        { id: "w3", testName: "Assignment", weightage: 20, datedOn: "08/05/2025" },
      ],
    }),
    []
  );

  const markData: Record<string, MarkRow[]> = useMemo(
    () => ({
      CSA0204: [
        { id: "m1", sno: 1, regNo: "192425174", name: "AMBATI SHIVA SHANKAR REDDY", markValue: 87.8 },
        { id: "m2", sno: 2, regNo: "192472089", name: "APPANABOYINA NITHIN", markValue: 89.25 },
        { id: "m3", sno: 3, regNo: "192421346", name: "ARUN B", markValue: 86.75 },
        { id: "m4", sno: 4, regNo: "192472251", name: "BATTULA JASWANTH", markValue: 87.55 },
        { id: "m5", sno: 5, regNo: "192425064", name: "DANTI SRI PAVAN SANTOSH RAJA GUNA", markValue: 87.1 },
        { id: "m6", sno: 6, regNo: "192472226", name: "DILNA P", markValue: 87.15 },
        { id: "m7", sno: 7, regNo: "192424191", name: "DOEPALLI BALA SATYA SAI AJAY KUMAR", markValue: 88.9 },
        { id: "m8", sno: 8, regNo: "192424221", name: "DINESH K", markValue: 86.4 },
        { id: "m9", sno: 9, regNo: "192424231", name: "DIVYA S", markValue: 90.1 },
      ],
      CSA0289: [
        { id: "m1", sno: 1, regNo: "192420011", name: "AADHITHYAN S V", markValue: 82.4 },
        { id: "m2", sno: 2, regNo: "192420012", name: "AKASH S", markValue: 84.1 },
        { id: "m3", sno: 3, regNo: "192420013", name: "ALLOICES JOHN BRITTO", markValue: 86.0 },
      ],
      CSA1524: [
        { id: "m1", sno: 1, regNo: "192211856", name: "KARMURI SRI RAMCHARAN REDDY", markValue: 78.5 },
        { id: "m2", sno: 2, regNo: "192124073", name: "PASALA THRIBHUVAN REDDY", markValue: 81.25 },
      ],
    }),
    []
  );

  const [courseId, setCourseId] = useState<string>("CSA0204");
  const [loadedCourse, setLoadedCourse] = useState<string>("CSA0204"); // only changes on View click
  const [error, setError] = useState<string>("");

  const currentWeightage = weightageData[loadedCourse] ?? [];
  const currentMarks = markData[loadedCourse] ?? [];

  const totalWeightage = useMemo(
    () => currentWeightage.reduce((sum, r) => sum + (Number(r.weightage) || 0), 0),
    [currentWeightage]
  );

  const stats = useMemo(() => {
    if (!currentMarks.length) return { avg: 0, min: 0, max: 0 };
    const vals = currentMarks.map((m) => m.markValue);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { avg, min, max };
  }, [currentMarks]);

  const onView = () => {
    setError("");
    if (!courseId) {
      setError("Please select a course to view Final IA.");
      return;
    }
    setLoadedCourse(courseId);
  };

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === loadedCourse)?.label ?? "--Select--",
    [courses, loadedCourse]
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">View Final IA</h1>

      {/* Top row (course + view button like screenshot) */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-rose-600 dark:text-rose-400">*</span> Course
                </div>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {courses.map((c) => (
                    <option key={c.id + c.label} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Viewing: <span className="font-semibold">{courseLabel}</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex items-center gap-3 lg:justify-end">
              <button
                type="button"
                onClick={onView}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
              >
                View
              </button>

              <div className="hidden lg:flex items-center gap-2">
                <Badge text={`Weightage: ${totalWeightage}%`} />
                <Badge text={`${currentMarks.length} Students`} />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Weightage Details */}
      <div className="mt-4">
        <TableShell
          title="Weightage Details"
          subtitle="Configured weightage details below"
          right={
            <div className="flex items-center gap-2">
              <Badge text={`Total: ${totalWeightage}%`} />
            </div>
          }
        >
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Test Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                    Weightage
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[160px]">
                    Dated On
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentWeightage.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {r.testName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.weightage}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.datedOn}
                    </td>
                  </tr>
                ))}

                {currentWeightage.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        No Weightage Configured
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Configure weightage to compute Final IA.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      {/* Mark Details */}
      <div className="mt-4">
        <TableShell
          title="Mark Details"
          subtitle="Mark details below"
          right={
            <div className="hidden sm:flex items-center gap-2">
              <Badge text={`Avg: ${stats.avg.toFixed(2)}`} />
              <Badge text={`Min: ${stats.min.toFixed(2)}`} />
              <Badge text={`Max: ${stats.max.toFixed(2)}`} />
            </div>
          }
        >
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[90px]">
                    Sno.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[260px]">
                    Registration Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[160px]">
                    MarkValue
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentMarks.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{m.sno}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{m.regNo}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">{m.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center justify-center min-w-[88px] px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm",
                          "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        )}
                      >
                        {m.markValue}
                      </span>
                    </td>
                  </tr>
                ))}

                {currentMarks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        No Marks Available
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Please click “View” after selecting a course.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>
    </div>
  );
}
