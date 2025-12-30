// ViewCourse.tsx
import React, { useMemo, useState } from "react";
import {
  PlusIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  PencilIcon,
} from "lucide-react";

type TabKey = "running" | "completed" | "rejected";

type CourseRow = {
  sno: number;
  code: string;
  courseName: string;
  type: string;
  subjectCategory: string;
  courseCategory: string;
  prerequisite: string;
  slot: string;

  // available: filled / total
  availableFilled: number;
  availableTotal: number;

  principal: string; // e.g. "Approved - 12/10/2025"
  createdOn: string; // mm/dd/yyyy

  attendance: "Closed" | "Open";
  noDue: "Launched" | "Not Launched";
  isRunning: "Running" | "Closed";

  edit: "NA" | "Edit";
  isOpenToAll: boolean;

  // list status
  status: TabKey; // running | completed | rejected
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition",
        active
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-900/50"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
        )}
      />
      {label}
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800 align-top",
        className
      )}
    >
      {children}
    </td>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "success" | "danger" | "warn" | "neutral" | "info";
  children: React.ReactNode;
}) {
  const map = {
    success:
      "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/25",
    danger: "bg-rose-600 text-white shadow-sm ring-1 ring-rose-500/25",
    warn: "bg-amber-500 text-white shadow-sm ring-1 ring-amber-400/25",
    info: "bg-sky-600 text-white shadow-sm ring-1 ring-sky-500/25",
    neutral:
      "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-200/10 dark:ring-white/10",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function MiniChip({
  tone,
  children,
}: {
  tone: "red" | "teal" | "slate";
  children: React.ReactNode;
}) {
  const map = {
    red: "bg-rose-600 text-white",
    teal: "bg-teal-600 text-white",
    slate:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function CreateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl",
        "text-[13px] font-semibold text-white",
        "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
        "shadow-sm hover:shadow-md transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
      )}
    >
      <PlusIcon size={16} />
      Create Course
    </button>
  );
}

function Pagination({
  page,
  pages,
  onPrev,
  onNext,
  onPage,
}: {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const btnBase =
    "h-10 w-10 grid place-items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl">
      <button type="button" className={btnBase} onClick={onPrev} aria-label="Prev">
        <ChevronLeftIcon size={16} />
      </button>

      <button
        type="button"
        className={cn(
          btnBase,
          "w-12",
          "bg-slate-50 dark:bg-slate-800/50 font-semibold"
        )}
        onClick={() => onPage(page)}
        aria-label="Current page"
      >
        {page}
      </button>

      <button type="button" className={btnBase} onClick={onNext} aria-label="Next">
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

export default function ViewCourse() {
  // ----- demo rows (wire to API later) -----
  const rows: CourseRow[] = useMemo(
    () => [
      {
        sno: 1,
        code: "SPIC411",
        courseName: "Core Project",
        type: "Contact Course",
        subjectCategory: "Core Project",
        courseCategory: "University Core",
        prerequisite: "-",
        slot: "Slot K",
        availableFilled: 50,
        availableTotal: 50,
        principal: "Approved - 12/10/2025",
        createdOn: "11/22/2025",
        attendance: "Closed",
        noDue: "Launched",
        isRunning: "Closed",
        edit: "NA",
        isOpenToAll: true,
        status: "running",
      },
      {
        sno: 2,
        code: "MMA1135",
        courseName: "Mentor Mentee Meeting",
        type: "Contact Course",
        subjectCategory: "Student Mentoring",
        courseCategory: "University Elective",
        prerequisite: "-",
        slot: "Slot E",
        availableFilled: 20,
        availableTotal: 4,
        principal: "Approved - 02/07/2025",
        createdOn: "02/06/2025",
        attendance: "Open",
        noDue: "Launched",
        isRunning: "Running",
        edit: "NA",
        isOpenToAll: true,
        status: "running",
      },
      {
        sno: 3,
        code: "CSA6416",
        courseName: "Google Cloud Certification for Devops",
        type: "Contact Course",
        subjectCategory: "Google Cloud Certification",
        courseCategory: "Program Elective",
        prerequisite: "-",
        slot: "Slot P",
        availableFilled: 40,
        availableTotal: 14,
        principal: "Approved - 01/07/2025",
        createdOn: "01/06/2025",
        attendance: "Closed",
        noDue: "Launched",
        isRunning: "Closed",
        edit: "NA",
        isOpenToAll: true,
        status: "running",
      },
      // completed demo
      {
        sno: 4,
        code: "ECA031",
        courseName: "Signals and Systems",
        type: "Contact Course",
        subjectCategory: "Program Core",
        courseCategory: "University Core",
        prerequisite: "-",
        slot: "Slot A",
        availableFilled: 12,
        availableTotal: 60,
        principal: "Approved - 12/01/2025",
        createdOn: "12/01/2025",
        attendance: "Closed",
        noDue: "Not Launched",
        isRunning: "Closed",
        edit: "NA",
        isOpenToAll: false,
        status: "completed",
      },
      // rejected demo
      {
        sno: 5,
        code: "ECA151",
        courseName: "Transmission Lines and Waveguides",
        type: "Contact Course",
        subjectCategory: "Program Core",
        courseCategory: "Program Core",
        prerequisite: "-",
        slot: "Slot C",
        availableFilled: 0,
        availableTotal: 50,
        principal: "Rejected - 10/11/2025",
        createdOn: "10/10/2025",
        attendance: "Closed",
        noDue: "Not Launched",
        isRunning: "Closed",
        edit: "NA",
        isOpenToAll: false,
        status: "rejected",
      },
    ],
    []
  );

  const [tab, setTab] = useState<TabKey>("running");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => r.status === tab)
      .filter((r) => {
        if (!needle) return true;
        return (
          r.code.toLowerCase().includes(needle) ||
          r.courseName.toLowerCase().includes(needle) ||
          r.subjectCategory.toLowerCase().includes(needle) ||
          r.courseCategory.toLowerCase().includes(needle) ||
          r.slot.toLowerCase().includes(needle)
        );
      });
  }, [rows, tab, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  // reset page when tab/search/pageSize changes
  React.useEffect(() => {
    setPage(1);
  }, [tab, q, pageSize]);

  const startIndex = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filtered.length);

  const tabLabel =
    tab === "running"
      ? "Running / Approved"
      : tab === "completed"
      ? "Completed"
      : "Rejected";

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      <PageTitle
        title="View Course"
        right={<CreateButton onClick={() => alert("Create Course (wire to route/API).")} />}
      />

      {/* tabs row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton
            active={tab === "running"}
            label="Running / Approved"
            onClick={() => setTab("running")}
          />
          <TabButton
            active={tab === "completed"}
            label="Completed"
            onClick={() => setTab("completed")}
          />
          <TabButton
            active={tab === "rejected"}
            label="Rejected"
            onClick={() => setTab("rejected")}
          />
        </div>

        {/* controls */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                {tabLabel}
              </div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Manage courses — search, review status, and edit settings.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-600 dark:text-slate-300">
                  Show
                </span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={cn(
                      "h-10 rounded-xl px-3 pr-9 text-[13px]",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                      "border border-slate-300/80 dark:border-slate-700",
                      "shadow-inner",
                      "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                      "transition"
                    )}
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                <span className="text-[13px] text-slate-600 dark:text-slate-300">
                  records
                </span>
              </div>

              <div className="relative">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className={cn(
                    "h-10 w-full sm:w-[280px] rounded-xl pl-9 pr-3 text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-300/80 dark:border-slate-700",
                    "shadow-inner",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                    "transition"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* table */}
      <TableShell>
        <table className="min-w-[1500px] w-full border-collapse">
          <thead>
            <tr>
              <Th>Sno</Th>
              <Th>Code</Th>
              <Th>Course Name</Th>
              <Th>Type</Th>
              <Th>Subject Category</Th>
              <Th>Course Category</Th>
              <Th>Prerequisite</Th>
              <Th>Slot</Th>
              <Th>Available</Th>
              <Th>Principal</Th>
              <Th>Created On</Th>
              <Th>Attendance</Th>
              <Th>No Due</Th>
              <Th>IsRunning</Th>
              <Th>Edit</Th>
              <Th>Is Open To All</Th>
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <Td className="py-12 text-center text-slate-500 dark:text-slate-400" colSpan={16 as any}>
                  No records found.
                </Td>
              </tr>
            ) : (
              paged.map((r, idx) => (
                <tr
                  key={`${r.sno}-${r.code}`}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="tabular-nums">{r.sno}</Td>

                  <Td className="font-semibold text-slate-900 dark:text-white">
                    <div className="inline-flex items-center gap-2">
                      <CheckCircle2Icon size={16} className="text-emerald-500" />
                      {r.code}
                    </div>
                  </Td>

                  <Td className="text-slate-900 dark:text-white">
                    <div className="font-semibold">{r.courseName}</div>
                  </Td>

                  <Td>{r.type}</Td>
                  <Td>{r.subjectCategory}</Td>
                  <Td>{r.courseCategory}</Td>
                  <Td>{r.prerequisite}</Td>
                  <Td>{r.slot}</Td>

                  <Td>
                    <div className="inline-flex items-center gap-2">
                      <MiniChip tone="red">{r.availableFilled}</MiniChip>
                      <span className="text-slate-400">/</span>
                      <MiniChip tone="teal">{r.availableTotal}</MiniChip>
                    </div>
                  </Td>

                  <Td className="text-slate-600 dark:text-slate-300">
                    {r.principal}
                  </Td>

                  <Td className="tabular-nums">{r.createdOn}</Td>

                  <Td>
                    {r.attendance === "Closed" ? (
                      <Pill tone="danger">Closed</Pill>
                    ) : (
                      <Pill tone="success">Open</Pill>
                    )}
                  </Td>

                  <Td>
                    {r.noDue === "Launched" ? (
                      <Pill tone="danger">Launched</Pill>
                    ) : (
                      <Pill tone="neutral">Not Launched</Pill>
                    )}
                  </Td>

                  <Td>
                    {r.isRunning === "Running" ? (
                      <Pill tone="success">Running</Pill>
                    ) : (
                      <Pill tone="danger">Closed</Pill>
                    )}
                  </Td>

                  <Td>
                    {r.edit === "NA" ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        NA
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-[12px] font-semibold"
                        onClick={() => alert(`Edit ${r.code} (wire to route/API).`)}
                      >
                        <PencilIcon size={14} />
                        Edit
                      </button>
                    )}
                  </Td>

                  <Td>
                    {r.isOpenToAll ? (
                      <Pill tone="danger">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2Icon size={14} />
                          Is Open to All
                        </span>
                      </Pill>
                    ) : (
                      <Pill tone="neutral">
                        <span className="inline-flex items-center gap-2">
                          <XCircleIcon size={14} />
                          Restricted
                        </span>
                      </Pill>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-[13px] text-slate-600 dark:text-slate-300">
          Showing{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {startIndex}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {endIndex}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {filtered.length}
          </span>{" "}
          entries
        </div>

        <Pagination
          page={safePage}
          pages={pages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pages, p + 1))}
          onPage={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
