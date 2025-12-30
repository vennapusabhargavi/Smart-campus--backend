import React from "react";
import { StudentPageShell } from "./StudentPageShell";

export function StudentHome() {
  return (
    <StudentPageShell
      title="Home"
      subtitle="Student portal overview (minimal demo)."
      crumbs={[{ label: "Student" }, { label: "Home" }]}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Quick status
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Attendance: — <br />
            Internal Marks: — <br />
            No Due: — <br />
            Offer: —
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Shortcuts
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Use sidebar dropdowns: Attendance → Examination.
          </p>
        </div>
      </div>
    </StudentPageShell>
  );
}
