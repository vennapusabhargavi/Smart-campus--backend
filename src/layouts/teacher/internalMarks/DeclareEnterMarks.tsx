// src/layouts/teacher/internalMarks/DeclareEnterMarks.tsx
import React, { useMemo, useState } from "react";

type StudentRow = {
  id: string;
  regNo: string;
  name: string;
};

type CourseOpt = { id: string; label: string };

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isValidMark(v: string) {
  // allow "" while typing, but final submit should not be empty
  if (v.trim() === "") return true;
  // allow integer/decimal (no negative)
  if (!/^\d+(\.\d{0,2})?$/.test(v.trim())) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export default function DeclareEnterMarks() {
  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "", label: "--Select--" },
      { id: "CSA0289", label: "CSA0289 - C programming for Quantum Computing" },
      { id: "CSA1524", label: "CSA1524 - Cloud Computing & Big Data Analytics" },
      { id: "SPIC411", label: "SPIC411 - Core Project" },
    ],
    []
  );

  const students: StudentRow[] = useMemo(
    () => [
      { id: "s1", regNo: "192425321", name: "ANKEPALLI LOKANATH REDDY" },
      { id: "s2", regNo: "192425201", name: "BADHRI HARSHA VARDHAN" },
      { id: "s3", regNo: "192425028", name: "BODDI SURYA KATHYAKEYA" },
      { id: "s4", regNo: "192472193", name: "CHARISHMA C G" },
      { id: "s5", regNo: "192425397", name: "CHEKKARA VENKATA LAKSHMI HYMA VATHI" },
      { id: "s6", regNo: "192424237", name: "CHITTIBOINA DHARMA TEJA" },
      { id: "s7", regNo: "192472057", name: "CHITTTIBABU ANUKEERTHANA" },
      { id: "s8", regNo: "192472235", name: "GOPIREDDY JASWANTH" },
      { id: "s9", regNo: "192424166", name: "GUNDALA NAGESWARRAO SAI SREE" },
      { id: "s10", regNo: "192425232", name: "GUZHALINITHA K" },
      { id: "s11", regNo: "192425272", name: "IMMADISETTY, LEELA SRAVAN KUMAR" },
      { id: "s12", regNo: "192421268", name: "KISHAN RAM B" },
      { id: "s13", regNo: "192421001", name: "KAVYA S" },
      { id: "s14", regNo: "192421002", name: "KARTHIK R" },
      { id: "s15", regNo: "192421003", name: "KRISHNA P" },
      { id: "s16", regNo: "192421004", name: "KIRTHANA V" },
    ],
    []
  );

  const [testName, setTestName] = useState("");
  const [competency, setCompetency] = useState("");
  const [courseId, setCourseId] = useState("CSA0289");

  // default marks = "0"
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    students.forEach((s) => (init[s.id] = "0"));
    return init;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pageError, setPageError] = useState<string>("");

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === courseId)?.label ?? "--Select--",
    [courses, courseId]
  );

  const onChangeMark = (id: string, v: string) => {
    // keep raw for typing, but guard against obviously invalid formats
    if (v === "" || /^\d+(\.\d{0,2})?$/.test(v)) {
      setMarks((p) => ({ ...p, [id]: v }));
    } else {
      // ignore extra characters (keeps UX clean)
      setMarks((p) => ({ ...p, [id]: p[id] ?? "0" }));
    }
  };

  const resetAll = () => {
    setTestName("");
    setCompetency("");
    setCourseId("CSA0289");
    const init: Record<string, string> = {};
    students.forEach((s) => (init[s.id] = "0"));
    setMarks(init);
    setTouched({});
    setPageError("");
  };

  const submit = () => {
    setPageError("");

    if (!testName.trim()) return setPageError("Please enter Name of the Test.");
    if (!courseId) return setPageError("Please select Course.");

    // final validation: no empty, numeric, 0..100
    for (const s of students) {
      const v = (marks[s.id] ?? "").trim();
      if (v === "") {
        setTouched((p) => ({ ...p, [s.id]: true }));
        return setPageError("Please fill the mark % without empty. Enter Zero if absent.");
      }
      if (!isValidMark(v)) {
        setTouched((p) => ({ ...p, [s.id]: true }));
        return setPageError("Please enter marks in % (only decimal or integer values, 0 to 100).");
      }
    }

    const payload = {
      testName: testName.trim(),
      competency: competency.trim(),
      courseId,
      courseLabel,
      marks: students.map((s, idx) => ({
        sNo: idx + 1,
        regNo: s.regNo,
        name: s.name,
        markPercent: Number(marks[s.id]),
      })),
    };

    console.log("DECLARE & ENTER MARKS (demo)", payload);
    alert("Marks saved (demo). Check console for payload.");
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Declare &amp; Enter Marks
      </h1>

      {/* Top form (matches screenshot layout, but polished) */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left (Test + Competency) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-rose-600 dark:text-rose-400">*</span>{" "}
                  Name of the Test
                </div>
                <input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Name of the Test"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Competency Text
                </div>
                <input
                  value={competency}
                  onChange={(e) => setCompetency(e.target.value)}
                  placeholder="Competency"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Right (Course) */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] lg:grid-cols-1 gap-2 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:text-right lg:text-left">
                  <span className="text-rose-600 dark:text-rose-400">*</span>{" "}
                  Course
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
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selected: <span className="font-semibold">{courseLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions (center red like screenshot, but cleaner) */}
          <div className="mt-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-500/10 px-4 py-3">
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-200 text-center">
              Please enter marks in % (only decimal or integer values)
            </div>
            <div className="text-sm text-rose-700 dark:text-rose-200 text-center">
              Please fill the mark % without empty. Enter Zero if absent
            </div>
          </div>

          {pageError && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {pageError}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Students
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing 1 to {students.length} of {students.length} entries
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[72px]">
                  S No.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[220px]">
                  Reg No.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[200px]">
                  Mark %
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, idx) => {
                const v = marks[s.id] ?? "";
                const showErr = !!touched[s.id] && (v.trim() === "" || !isValidMark(v));
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {s.regNo}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {s.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <input
                          value={v}
                          inputMode="decimal"
                          onChange={(e) => onChangeMark(s.id, e.target.value)}
                          onBlur={() => setTouched((p) => ({ ...p, [s.id]: true }))}
                          className={clsx(
                            "h-10 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2",
                            showErr
                              ? "border-rose-300 dark:border-rose-900/60 focus:ring-rose-500/25"
                              : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30"
                          )}
                          placeholder="0"
                          aria-label={`Mark percent for ${s.regNo}`}
                        />
                        {showErr && (
                          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">
                            Enter 0–100 (integer/decimal). Keep not empty.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={submit}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
          >
            Save Marks
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="h-10 px-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
