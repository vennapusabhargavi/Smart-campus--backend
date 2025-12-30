// src/layouts/teacher/attendance/CourseAttendance.tsx
import React, { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type CourseOpt = { id: string; label: string };

export default function CourseAttendance() {
  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "c1", label: "MMA1088 - Mentor Mentee Meeting" },
      { id: "c2", label: "SPIC411 - Core Project" },
      { id: "c3", label: "CSA1524 - Cloud Computing & Big Data Analytics" },
    ],
    []
  );

  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState<string>(""); // default empty (as screenshot)
  const [viewed, setViewed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onView = () => {
    setViewed(true);
    if (!courseId) {
      setErr("Please select a course.");
      return;
    }
    setErr(null);
    // Later: call API with { courseId, date } (date may be empty by design)
  };

  const courseLabel = courses.find((c) => c.id === courseId)?.label ?? "";

  return (
    <div className="w-full">
      {/* top filter row (like screenshot) */}
      <div className="w-full bg-white dark:bg-slate-950">
        <div className="flex flex-wrap items-start gap-x-14 gap-y-4 px-3 sm:px-6 pt-4">
          {/* Course */}
          <div className="flex items-center gap-3 min-w-[420px]">
            <div className="w-[90px] text-sm text-rose-600">Course</div>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={cn(
                "h-9 w-[360px] rounded-none px-3 text-sm",
                "border border-slate-300 dark:border-slate-700",
                "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100",
                "focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-600"
              )}
            >
              <option value="">--Select--</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date + View */}
          <div className="flex items-center gap-3 min-w-[520px]">
            <div className="w-[110px] text-sm text-slate-700 dark:text-slate-200">
              Select Date
            </div>

            <div className="relative">
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className={cn(
                  "h-9 w-[360px] pr-10 px-3 text-sm",
                  "border border-slate-300 dark:border-slate-700",
                  "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100",
                  "focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-600"
                )}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <CalendarIcon size={16} />
              </span>

              {/* red helper text under date input (like screenshot) */}
              <div className="mt-1 text-center text-[12px] text-rose-600">
                By default "Date" selection is empty
              </div>
            </div>

            <button
              type="button"
              onClick={onView}
              className={cn(
                "h-9 px-5 text-sm font-semibold",
                "bg-teal-500 hover:bg-teal-600 text-white",
                "shadow-sm active:scale-[0.99] transition"
              )}
            >
              View
            </button>
          </div>
        </div>

        {/* thin divider line like classic pages */}
        <div className="mt-3 border-b border-slate-200 dark:border-slate-800" />

        {/* error (only if user clicks view) */}
        {viewed && err && (
          <div className="px-3 sm:px-6 py-3 text-sm text-rose-600">
            {err}
          </div>
        )}
      </div>

      {/* rest of page is intentionally empty (like screenshot) */}
      <div className="h-[calc(100vh-260px)] bg-white dark:bg-slate-950" />

      {/* optional: tiny “viewed” hint when course selected (keep subtle) */}
      {viewed && !err && (
        <div className="sr-only">
          Viewing {courseLabel} on {date || "all dates"}
        </div>
      )}
    </div>
  );
}
