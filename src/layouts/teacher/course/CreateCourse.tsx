// src/layouts/teacher/course/CreateCourse.tsx
import React, { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  EyeIcon,
  SaveIcon,
  XIcon,
  LayersIcon,
  BookOpenIcon,
  HashIcon,
  LayoutGridIcon,
} from "lucide-react";

type Option = { value: string; label: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-slate-500 dark:text-slate-400">{children}</div>;
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className={cn(
        "w-full h-11 rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "transition"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-11 rounded-xl px-3 pr-10 text-sm",
          "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
          "ring-1 ring-slate-200 dark:ring-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
          "transition"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

function Button({
  tone = "primary",
  children,
  onClick,
  type = "button",
  disabled,
}: {
  tone?: "primary" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
    "text-sm font-semibold transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    disabled && "opacity-60 cursor-not-allowed"
  );

  const styles =
    tone === "primary"
      ? cn(
          "text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
          "shadow-sm shadow-teal-600/20",
          "focus-visible:ring-teal-400/60 dark:focus-visible:ring-teal-300/60"
        )
      : tone === "danger"
      ? cn(
          "text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
          "shadow-sm shadow-rose-600/20",
          "focus-visible:ring-rose-400/60 dark:focus-visible:ring-rose-300/60"
        )
      : cn(
          "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
          "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800",
          "focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-700/60"
        );

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, styles)}>
      {children}
    </button>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      <div className="rounded-2xl bg-slate-900 text-white shadow-xl px-4 py-3 ring-1 ring-white/10 min-w-[280px]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Done</div>
            <div className="text-xs text-white/75 mt-0.5">{msg}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-white/10 grid place-items-center transition"
            aria-label="Close toast"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateCourse() {
  // ---- options (demo; wire to API later) ----
  const typeOptions: Option[] = useMemo(
    () => [
      { value: "CONTACT", label: "Contact Course" },
      { value: "NON_CONTACT", label: "Non-Contact Course" },
      { value: "LAB", label: "Lab / Practical" },
    ],
    []
  );

  const subjectCategoryOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "PROGRAM_CORE", label: "Program Core" },
      { value: "PROGRAM_ELECTIVE", label: "Program Elective" },
      { value: "UNIVERSITY_CORE", label: "University Core" },
      { value: "UNIVERSITY_ELECTIVE", label: "University Elective" },
    ],
    []
  );

  const courseCategoryOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "THEORY", label: "Theory" },
      { value: "LAB", label: "Lab" },
      { value: "PROJECT", label: "Project" },
      { value: "MANDATORY", label: "Mandatory" },
    ],
    []
  );

  const slotOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "SLOT_A", label: "Slot A" },
      { value: "SLOT_B", label: "Slot B" },
      { value: "SLOT_C", label: "Slot C" },
    ],
    []
  );

  const prerequisiteOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "ECA01", label: "ECA01 — Basics of Electronics" },
      { value: "MTH01", label: "MTH01 — Engineering Mathematics" },
      { value: "PHY01", label: "PHY01 — Engineering Physics" },
    ],
    []
  );

  // ---- form state ----
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("CONTACT");
  const [subjectCategory, setSubjectCategory] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [prereq, setPrereq] = useState("");
  const [slot, setSlot] = useState("");
  const [maxSlotCount, setMaxSlotCount] = useState("30");

  const [toast, setToast] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Course Code is required.";
    if (!name.trim()) e.name = "Course Name is required.";
    if (!subjectCategory) e.subjectCategory = "Select Subject Category.";
    if (!courseCategory) e.courseCategory = "Select Course Category.";
    if (!slot) e.slot = "Select Slot.";
    const n = Number(maxSlotCount);
    if (!Number.isFinite(n) || n <= 0) e.maxSlotCount = "Max Slot Count must be a positive number.";
    return e;
  }, [code, name, subjectCategory, courseCategory, slot, maxSlotCount]);

  const isValid = Object.keys(errors).length === 0;

  const onViewSubject = () => alert("View Subject Category mapping (wire to API later).");
  const onViewCourse = () => alert("Navigate to View Course page (wire to route later).");

  const onClear = () => {
    setCode("");
    setName("");
    setType("CONTACT");
    setSubjectCategory("");
    setCourseCategory("");
    setPrereq("");
    setSlot("");
    setMaxSlotCount("30");
    setToast("Form cleared.");
    window.setTimeout(() => setToast(null), 2200);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      alert(Object.values(errors)[0] || "Please fix errors.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      subjectCategory,
      courseCategory,
      prereq: prereq || null,
      slot,
      maxSlotCount: Number(maxSlotCount),
    };

    // replace with API call
    // eslint-disable-next-line no-console
    console.log("[CreateCourse] submit:", payload);

    setToast("Course saved successfully (demo).");
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="w-full relative">
      {/* page container (same dashboard feel) */}
      <div className="w-full p-4 md:p-6 space-y-4">
        {/* top line */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
              Create Course
            </div>
            <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              Define course metadata, slot and categories.
            </div>
          </div>

          <Button tone="primary" onClick={onViewCourse}>
            <EyeIcon size={16} />
            View Course
          </Button>
        </div>

        {/* surface */}
        <div
          className={cn(
            "rounded-2xl p-4 md:p-5",
            "bg-gradient-to-b from-slate-50 to-slate-100/60",
            "dark:from-slate-950/40 dark:to-slate-950/10",
            "border border-slate-200/70 dark:border-slate-800",
            "shadow-sm"
          )}
        >
          <form onSubmit={onSave} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <HashIcon size={14} className="text-slate-400" />
                      Code
                    </span>
                  </Label>
                  <Input value={code} onChange={setCode} placeholder="Course Code" />
                  {errors.code ? <Hint>{errors.code}</Hint> : <Hint>Example: ECA03, MMA1088</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-8">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <BookOpenIcon size={14} className="text-slate-400" />
                      Course Name
                    </span>
                  </Label>
                  <Input value={name} onChange={setName} placeholder="Course Name" />
                  {errors.name ? <Hint>{errors.name}</Hint> : <Hint>Displayed to students & faculty.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <LayersIcon size={14} className="text-slate-400" />
                      Type
                    </span>
                  </Label>
                  <Select value={type} onChange={setType} options={typeOptions} />
                  <Hint>Choose delivery type.</Hint>
                </FieldShell>
              </div>

              <div className="lg:col-span-5">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <LayoutGridIcon size={14} className="text-slate-400" />
                      Subject Category
                    </span>
                  </Label>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={subjectCategory}
                        onChange={setSubjectCategory}
                        options={subjectCategoryOptions}
                      />
                    </div>
                    <Button tone="ghost" onClick={onViewSubject}>
                      <EyeIcon size={16} />
                      View
                    </Button>
                  </div>

                  {errors.subjectCategory ? <Hint>{errors.subjectCategory}</Hint> : <Hint>Maps to graduation status.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-3">
                <FieldShell>
                  <Label>Course Category</Label>
                  <Select value={courseCategory} onChange={setCourseCategory} options={courseCategoryOptions} />
                  {errors.courseCategory ? <Hint>{errors.courseCategory}</Hint> : <Hint>Theory / Lab / Project.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Prerequisite Course</Label>
                  <Select value={prereq} onChange={setPrereq} options={prerequisiteOptions} />
                  <Hint>Optional.</Hint>
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Slot</Label>
                  <Select value={slot} onChange={setSlot} options={slotOptions} />
                  {errors.slot ? <Hint>{errors.slot}</Hint> : <Hint>Assign timetable slot.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Max Slot Count</Label>
                  <Input
                    value={maxSlotCount}
                    onChange={(v) => setMaxSlotCount(v.replace(/[^\d]/g, ""))}
                    placeholder="30"
                    inputMode="numeric"
                  />
                  {errors.maxSlotCount ? <Hint>{errors.maxSlotCount}</Hint> : <Hint>Maximum students allowed in this slot.</Hint>}
                </FieldShell>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="submit" tone="primary" disabled={!isValid}>
                <SaveIcon size={16} />
                Save
              </Button>
              <Button tone="ghost" onClick={onClear}>
                Clear
              </Button>
            </div>
          </form>
        </div>

        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
