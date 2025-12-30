// src/layouts/student/ViewMarks.tsx
import React, { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

type CourseOpt = { id: string; label: string };

type MarksRow = {
  regNo: string;
  studentName: string;
  level1: number;
  level2: number;
  level3: number;
  assignment: number;
  viva: number;
  debug: number;
  classPractical: number;
  capstoneProject: number;
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
    </div>
  );
}

export default function ViewMarks() {
  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "", label: "--Select--" },
      { id: "CSA0204", label: "CSA0204 - C programming for Computing System" },
      { id: "CSA6416", label: "CSA6416 - Google Cloud Certification for Devops" },
      { id: "MMA1254", label: "MMA1254 - Mentor Mentee Meeting" },
    ],
    []
  );

  const allRows: MarksRow[] = useMemo(
    () => [
      {
        regNo: "192425174",
        studentName: "AMBATI SHIVA SHANKAR REDDY",
        level1: 84,
        level2: 84,
        level3: 85,
        assignment: 100,
        viva: 85,
        debug: 95,
        classPractical: 87,
        capstoneProject: 84,
      },
      {
        regNo: "192472089",
        studentName: "APPANABOYINA NITHIN",
        level1: 85,
        level2: 82,
        level3: 86,
        assignment: 100,
        viva: 88,
        debug: 100,
        classPractical: 90,
        capstoneProject: 85,
      },
      {
        regNo: "192421346",
        studentName: "ARUN B",
        level1: 85,
        level2: 78,
        level3: 86,
        assignment: 100,
        viva: 83,
        debug: 90,
        classPractical: 92,
        capstoneProject: 84,
      },
      {
        regNo: "192472251",
        studentName: "BATTULA JASWANTH",
        level1: 85,
        level2: 82,
        level3: 86,
        assignment: 100,
        viva: 85,
        debug: 90,
        classPractical: 92,
        capstoneProject: 84,
      },
      {
        regNo: "192425064",
        studentName: "DANTI SRI PAVAN SANTOSH RAJA GUNA",
        level1: 85,
        level2: 80,
        level3: 87,
        assignment: 98,
        viva: 85,
        debug: 90,
        classPractical: 92,
        capstoneProject: 83,
      },
      {
        regNo: "192472226",
        studentName: "DILNA P",
        level1: 83,
        level2: 80,
        level3: 85,
        assignment: 98,
        viva: 86,
        debug: 95,
        classPractical: 91,
        capstoneProject: 82,
      },
      {
        regNo: "192424191",
        studentName: "DOEPALLI BALA SATYA SAI AJAY KUMAR",
        level1: 84,
        level2: 84,
        level3: 85,
        assignment: 100,
        viva: 89,
        debug: 95,
        classPractical: 92,
        capstoneProject: 86,
      },
      {
        regNo: "192425132",
        studentName: "G AKSHYA",
        level1: 84,
        level2: 82,
        level3: 86,
        assignment: 100,
        viva: 85,
        debug: 95,
        classPractical: 90,
        capstoneProject: 84,
      },
      {
        regNo: "192472086",
        studentName: "GOKARAJU VENKATA CHAITANYA RAJ",
        level1: 83,
        level2: 78,
        level3: 85,
        assignment: 98,
        viva: 84,
        debug: 95,
        classPractical: 90,
        capstoneProject: 84,
      },
      {
        regNo: "192472285",
        studentName: "HEMANTH P",
        level1: 89,
        level2: 86,
        level3: 87,
        assignment: 100,
        viva: 90,
        debug: 95,
        classPractical: 90,
        capstoneProject: 85,
      },
      {
        regNo: "192424236",
        studentName: "HEMANTH SAGAR I",
        level1: 84,
        level2: 81,
        level3: 85,
        assignment: 98,
        viva: 90,
        debug: 95,
        classPractical: 92,
        capstoneProject: 85,
      },
      {
        regNo: "192472026",
        studentName: "JAGAN K Y",
        level1: 84,
        level2: 79,
        level3: 84,
        assignment: 96,
        viva: 83,
        debug: 95,
        classPractical: 90,
        capstoneProject: 85,
      },
      {
        regNo: "192425062",
        studentName: "JAGATHA VEERA VENKATA JASWANTH",
        level1: 85,
        level2: 81,
        level3: 86,
        assignment: 95,
        viva: 87,
        debug: 95,
        classPractical: 90,
        capstoneProject: 84,
      },
      {
        regNo: "192425070",
        studentName: "JERIN J",
        level1: 82,
        level2: 81,
        level3: 86,
        assignment: 100,
        viva: 85,
        debug: 100,
        classPractical: 91,
        capstoneProject: 82,
      },
      {
        regNo: "192424285",
        studentName: "KONDU SAMPATH REDDY",
        level1: 82,
        level2: 82,
        level3: 86,
        assignment: 100,
        viva: 90,
        debug: 95,
        classPractical: 90,
        capstoneProject: 82,
      },
      {
        regNo: "192411177",
        studentName: "KOPPU A SUNNY",
        level1: 80,
        level2: 79,
        level3: 82,
        assignment: 95,
        viva: 80,
        debug: 95,
        classPractical: 90,
        capstoneProject: 82,
      },
      {
        regNo: "192472157",
        studentName: "KOVVURI YASWANTH VENKATA SATYANARAYANA REDDY",
        level1: 86,
        level2: 83,
        level3: 85,
        assignment: 95,
        viva: 85,
        debug: 95,
        classPractical: 88,
        capstoneProject: 82,
      },
    ],
    []
  );

  const [courseId, setCourseId] = useState("CSA0204");
  const [viewed, setViewed] = useState(true);

  const rows = useMemo(() => {
    // demo: same rows for any selected course
    if (!viewed) return [];
    if (!courseId) return [];
    return allRows;
  }, [allRows, courseId, viewed]);

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="View Marks" />

      {/* top controls (no card background) */}
      <div className="max-w-[1280px]">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="text-[13px] text-rose-600 font-medium">Course</div>

            <div className="relative w-[420px] max-w-full">
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setViewed(false);
                }}
                className={cn(
                  "w-full h-10 rounded-sm px-3 pr-10 text-[13px]",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-200 dark:border-slate-800 shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                )}
              >
                {courses.map((c) => (
                  <option key={c.id || "empty"} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setViewed(true)}
              className={cn(
                "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                "shadow-sm transition"
              )}
            >
              View
            </button>
          </div>
        </div>

        {/* table */}
        <div className="mt-6 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-950">
                  <th className="px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Registration Number
                  </th>
                  <th className="px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Student Name
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 1
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 2
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 3
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    ASSIGNMENT
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Viva
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Debug
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Class practical
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Capstone project
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={`${r.regNo}-${idx}`}
                    className={cn(
                      "border-b border-slate-200/70 dark:border-slate-800/70",
                      "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    )}
                  >
                    <td className="px-3 py-3 text-[13px]">{r.regNo}</td>
                    <td className="px-3 py-3 text-[13px]">
                      <div className="text-center">{r.studentName}</div>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.level1}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.level2}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.level3}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.assignment}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.viva}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.debug}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.classPractical}</td>
                    <td className="px-3 py-3 text-[13px] text-center">{r.capstoneProject}</td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400"
                    >
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
