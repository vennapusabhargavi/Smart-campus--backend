import React, { useMemo, useState, useEffect } from "react";
import { ChevronDownIcon, InfoIcon, CheckIcon } from "lucide-react";

type Slot = "Slot A" | "Slot B" | "Slot C" | "Slot D";
type CourseStatus = "APPROVED" | "PENDING" | "REJECTED" | "NONE";

type Course = {
  id: string;
  code: string;
  title: string;
  faculty: string;
  seats: number;
};

type SlotDecision = {
  approvedCourseId?: string; // only ONE
  pendingCourseId?: string;  // only ONE
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusLegendPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : "bg-rose-100 text-rose-800 ring-rose-200";

  return (
    <span className={cn("inline-flex px-3 py-1.5 rounded-md text-[13px] font-medium ring-1", toneClass)}>
      {label}
    </span>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3",
          "px-4 md:px-5 py-3",
          "bg-gradient-to-r from-slate-600 to-slate-500 text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/15">
            <InfoIcon size={16} />
          </span>
          <span className="text-[14px] font-semibold">{title}</span>
        </div>

        <ChevronDownIcon
          size={18}
          className={cn("transition-transform duration-300", open ? "rotate-180" : "rotate-0")}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CourseCell({
  course,
  status,
  selected,
  onSelect,
}: {
  course: Course;
  status: CourseStatus;
  selected: boolean;
  onSelect: () => void;
}) {
  const statusTone =
    status === "APPROVED"
      ? "bg-emerald-50 dark:bg-emerald-950/20"
      : status === "PENDING"
      ? "bg-amber-50 dark:bg-amber-950/15"
      : status === "REJECTED"
      ? "bg-rose-50 dark:bg-rose-950/15"
      : "bg-white dark:bg-slate-900";

  const ringTone =
    status === "APPROVED"
      ? "ring-emerald-200 dark:ring-emerald-900/40"
      : status === "PENDING"
      ? "ring-amber-200 dark:ring-amber-900/40"
      : status === "REJECTED"
      ? "ring-rose-200 dark:ring-rose-900/40"
      : "ring-slate-200 dark:ring-slate-800";

  const statusLabel =
    status === "APPROVED" ? "Approved" : status === "PENDING" ? "Pending" : status === "REJECTED" ? "Rejected" : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left min-h-[92px] p-3 rounded-xl ring-1 transition",
        "hover:shadow-sm hover:shadow-slate-900/5 dark:hover:shadow-black/20",
        selected ? "ring-2 ring-slate-900 dark:ring-white shadow-sm" : ringTone,
        statusTone
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 inline-flex h-4 w-4 rounded-full border",
            selected ? "border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-700"
          )}
          aria-hidden="true"
        >
          <span className={cn("m-auto h-2 w-2 rounded-full transition", selected ? "bg-slate-900 dark:bg-white" : "bg-transparent")} />
        </span>

        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug">
            {course.code} - {course.title}
          </div>
          <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{course.faculty}</div>

          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-teal-600/90 px-2 py-0.5 text-[11px] font-bold text-white">
              {course.seats}
            </span>

            {status !== "NONE" && (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function StudentEnrollment() {
  const reg = localStorage.getItem("userId") || "ST-0000";

  const courses: Course[] = useMemo(
    () => [
      {
        id: "c1",
        code: "UBA0115",
        title: "Engineering Mathematics - I and its Impact on Data Encryption and Protection",
        faculty: "Dr. Sudar mozhi K",
        seats: 0,
      },
      {
        id: "c2",
        code: "BTA0161",
        title: "Biology and Environmental Science for Engineers for Green Environment",
        faculty: "Rajesh",
        seats: 40,
      },
      {
        id: "c3",
        code: "CEA6601",
        title: "Building Planning and Modeling using BIM for Traditional Engineers",
        faculty: "Dr. KANDASAMY",
        seats: 16,
      },
      {
        id: "c4",
        code: "EEM2203",
        title: "Advanced Energy Storage Technologies for Renewable Integration",
        faculty: "Dr. R. Mannegalaai",
        seats: 30,
      },
      {
        id: "c5",
        code: "ARM0703",
        title: "Humanoid Robotics with Artificial Intelligence",
        faculty: "Dr. Maheswari S",
        seats: 18,
      },
      {
        id: "c6",
        code: "COM0303",
        title: "Soft Computing for Intelligent Systems",
        faculty: "Dr. Smitha G L",
        seats: 3,
      },
      {
        id: "c7",
        code: "PDM1703",
        title: "Design of Hydraulic and Pneumatic Systems for Industrial Applications",
        faculty: "Sakthivel",
        seats: 29,
      },
      {
        id: "c8",
        code: "EEM2503",
        title: "Environmental Engineering & Pollution Control for Green Technology",
        faculty: "ARJUN",
        seats: 8,
      },
      {
        id: "c9",
        code: "ENGSW03811",
        title: "Introduction to Internet of Things",
        faculty: "Dr. BANU",
        seats: 0,
      },
      {
        id: "c10",
        code: "ENGSW03813",
        title: "Introduction to Internet of Things for Real Time Applications",
        faculty: "Dr. S. Pandiaraj",
        seats: 40,
      },
    ],
    []
  );

  const [slot, setSlot] = useState<Slot>("Slot B");

  // ✅ Per-slot rule: at most ONE course can be Approved OR Pending.
  const [decisions, setDecisions] = useState<Record<Slot, SlotDecision>>({
    "Slot A": {},
    "Slot B": { approvedCourseId: "c2" }, // demo: only one approved in Slot B
    "Slot C": {},
    "Slot D": {},
  });

  // UI selection for current slot
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    const d = decisions[slot];
    setSelectedCourseId(d.pendingCourseId ?? d.approvedCourseId ?? "");
  }, [slot, decisions]);

  function statusForCourse(courseId: string): CourseStatus {
    const d = decisions[slot];
    if (d.approvedCourseId === courseId) return "APPROVED";
    if (d.pendingCourseId === courseId) return "PENDING";
    if (d.approvedCourseId || d.pendingCourseId) return "REJECTED"; // ✅ all others rejected when one is approved/pending
    return "NONE";
  }

  function selectCourse(courseId: string) {
    setSelectedCourseId(courseId);

    // Selecting a course in a slot makes it the ONLY pending choice (replaces any approved)
    setDecisions((prev) => ({
      ...prev,
      [slot]: {
        approvedCourseId: undefined,
        pendingCourseId: courseId,
      },
    }));
  }

  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);

  async function sendForApproval() {
    if (!selectedCourseId) {
      setFlash({ type: "warn", msg: "Please select a course to send for approval." });
      window.setTimeout(() => setFlash(null), 2200);
      return;
    }

    setSubmitting(true);
    setFlash(null);

    await new Promise((r) => setTimeout(r, 900));

    // ensure only one pending in that slot
    setDecisions((prev) => ({
      ...prev,
      [slot]: {
        approvedCourseId: undefined,
        pendingCourseId: selectedCourseId,
      },
    }));

    setSubmitting(false);
    setFlash({ type: "ok", msg: "Sent for approval successfully." });
    window.setTimeout(() => setFlash(null), 2200);
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Page title */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[28px] leading-none font-light text-slate-700 dark:text-slate-100">
            Enrollment
          </div>
          <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            Register No:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{reg}</span>
          </div>
        </div>

        {flash && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-[13px] font-medium ring-1",
              flash.type === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
                : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-200 dark:ring-amber-900/40"
            )}
          >
            {flash.msg}
          </div>
        )}
      </div>

      {/* Top controls */}
      <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-[13px] font-medium text-rose-500">Select Slot</div>

            <div className="w-full sm:w-[520px]">
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as Slot)}
                className={cn(
                  "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                  "bg-white dark:bg-slate-950",
                  "px-3 py-2.5 text-[13px]",
                  "text-slate-900 dark:text-slate-100",
                  "shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40"
                )}
              >
                <option>Slot A</option>
                <option>Slot B</option>
                <option>Slot C</option>
                <option>Slot D</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Note:</span>
            <StatusLegendPill label="Approved" tone="green" />
            <StatusLegendPill label="Pending for Approval" tone="amber" />
            <StatusLegendPill label="Rejected" tone="red" />
          </div>
        </div>
      </div>

      {/* Course Details */}
      <CollapsibleSection title="Course Details" defaultOpen>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 p-3 md:p-4">
          <div
            className={cn(
              "hidden md:grid grid-cols-5 gap-3",
              "rounded-xl border border-slate-200 dark:border-slate-800",
              "bg-slate-100/70 dark:bg-slate-900/60",
              "px-3 py-2.5"
            )}
          >
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Select Course</div>
            <div />
            <div />
            <div />
            <div />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {courses.map((c) => {
              const st = statusForCourse(c.id);
              return (
                <CourseCell
                  key={c.id}
                  course={c}
                  status={st}
                  selected={selectedCourseId === c.id}
                  onSelect={() => selectCourse(c.id)}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={sendForApproval}
            disabled={submitting}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "rounded-xl px-5 py-2.5",
              "text-[13px] font-semibold text-white",
              "bg-teal-600 hover:bg-teal-700",
              "shadow-sm hover:shadow-md transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <CheckIcon size={16} />
            {submitting ? "Sending..." : "Send for Approval"}
          </button>
        </div>

        <div className="mt-3 text-center text-[12px] text-slate-500 dark:text-slate-400">
          Selected Slot: <span className="font-semibold text-slate-700 dark:text-slate-200">{slot}</span>
        </div>
      </CollapsibleSection>
    </div>
  );
}
