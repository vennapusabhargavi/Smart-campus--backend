import React, { useMemo, useState } from "react";
import {
  Building2Icon,
  BriefcaseIcon,
  BadgeCheckIcon,
  XCircleIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  BotIcon,
  RefreshCwIcon,
  GraduationCapIcon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
} from "lucide-react";

type EligibilityStatus = "SHORTLISTED" | "INELIGIBLE" | "APPLIED";

type IneligibleReasonCode = "CGPA" | "BACKLOGS" | "ATTENDANCE" | "NO_DUE";

type AgentRunRef = {
  runId: string; // e.g., RUN-PLA-0012
  ranAtIso: string;
  agent: "PlacementAgent";
};

type Drive = {
  id: string; // e.g., DRV-001
  companyName: string;
  role: string;
  packageLpa: number;
  location: string;
  driveDate: string; // dd/mm/yyyy
  criteria: {
    minCgpa: number;
    maxBacklogs: number;
    minAttendance: number; // percent
    requireNoDue: boolean;
  };
};

type StudentProfile = {
  regNo: string;
  name: string;
  program: string;
  year: string;
  cgpa: number;
  backlogs: number;
  attendance: number; // percent
  noDueClear: boolean;
};

type Application = {
  id: string;
  driveId: string;
  appliedOn: string; // dd/mm/yyyy
  status: EligibilityStatus;
  reasons: Array<{ code: IneligibleReasonCode; message: string }>;
  agentRun?: AgentRunRef;
};

type TabKey = "all" | "mine";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40",
    warn:
      "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="text-white text-[13px] font-semibold tracking-wide uppercase">
          {title}
        </div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition rounded-xl",
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-950/50"
      )}
    >
      <span className={cn("opacity-90", active && "text-indigo-600 dark:text-indigo-300")}>
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function fmtDtShort(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function newRunId(prefix: "RUN-PLA", n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

function evaluateEligibility(profile: StudentProfile, drive: Drive) {
  const r: Array<{ code: IneligibleReasonCode; message: string }> = [];

  if (profile.cgpa < drive.criteria.minCgpa) {
    r.push({
      code: "CGPA",
      message: `CGPA mismatch: requires ≥ ${drive.criteria.minCgpa}, yours is ${profile.cgpa.toFixed(2)}.`,
    });
  }
  if (profile.backlogs > drive.criteria.maxBacklogs) {
    r.push({
      code: "BACKLOGS",
      message: `Backlog mismatch: allows ≤ ${drive.criteria.maxBacklogs}, yours is ${profile.backlogs}.`,
    });
  }
  if (profile.attendance < drive.criteria.minAttendance) {
    r.push({
      code: "ATTENDANCE",
      message: `Attendance mismatch: requires ≥ ${drive.criteria.minAttendance}%, yours is ${profile.attendance}%.`,
    });
  }
  if (drive.criteria.requireNoDue && !profile.noDueClear) {
    r.push({
      code: "NO_DUE",
      message: "No-Due mismatch: No-Due is required but your status is NOT clear.",
    });
  }

  return r;
}

export function StudentPlacementDrives() {
  // Demo student profile (replace with API)
  const [profile] = useState<StudentProfile>({
    regNo: "192372052",
    name: "STUDENT B",
    program: "CSE",
    year: "1",
    cgpa: 7.1,
    backlogs: 1,
    attendance: 72,
    noDueClear: false,
  });

  // Demo drives (replace with API)
  const [drives] = useState<Drive[]>([
    {
      id: "DRV-0001",
      companyName: "Example Technologies",
      role: "Software Engineer Intern",
      packageLpa: 6.5,
      location: "Chennai",
      driveDate: "10/01/2026",
      criteria: { minCgpa: 7.0, maxBacklogs: 1, minAttendance: 75, requireNoDue: true },
    },
    {
      id: "DRV-0002",
      companyName: "FinEdge Systems",
      role: "Data Analyst Intern",
      packageLpa: 5.2,
      location: "Bengaluru",
      driveDate: "14/01/2026",
      criteria: { minCgpa: 6.5, maxBacklogs: 2, minAttendance: 70, requireNoDue: false },
    },
    {
      id: "DRV-0003",
      companyName: "CloudNova",
      role: "DevOps Trainee",
      packageLpa: 7.2,
      location: "Hyderabad",
      driveDate: "18/01/2026",
      criteria: { minCgpa: 7.5, maxBacklogs: 0, minAttendance: 80, requireNoDue: true },
    },
  ]);

  // Applications tracked with agent status + reasons
  const [apps, setApps] = useState<Application[]>(() => {
    // seed as APPLIED; then run agent once deterministically
    const seeded: Application[] = drives.map((d, i) => ({
      id: `APP-${String(i + 1).padStart(4, "0")}`,
      driveId: d.id,
      appliedOn: todayDdMmYyyy(),
      status: "APPLIED",
      reasons: [],
    }));

    // initial run
    const run: AgentRunRef = {
      runId: newRunId("RUN-PLA", 1),
      ranAtIso: new Date().toISOString(),
      agent: "PlacementAgent",
    };

    return seeded.map((a) => {
      const drive = drives.find((x) => x.id === a.driveId)!;
      const reasons = evaluateEligibility(profile, drive);
      const status: EligibilityStatus = reasons.length === 0 ? "SHORTLISTED" : "INELIGIBLE";
      return { ...a, reasons, status, agentRun: run };
    });
  });

  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [runCounter, setRunCounter] = useState(1);

  const driveById = useMemo(() => {
    const m = new Map<string, Drive>();
    drives.forEach((d) => m.set(d.id, d));
    return m;
  }, [drives]);

  const lastRun = useMemo(() => {
    const any = apps.find((a) => a.agentRun)?.agentRun;
    // since all are updated together, take max ranAt if present
    const max = apps
      .map((a) => a.agentRun)
      .filter(Boolean)
      .sort((a, b) => (a!.ranAtIso < b!.ranAtIso ? 1 : -1))[0];
    return max ?? any ?? null;
  }, [apps]);

  const filteredAllDrives = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return drives;
    return drives.filter((d) => {
      return (
        d.id.toLowerCase().includes(needle) ||
        d.companyName.toLowerCase().includes(needle) ||
        d.role.toLowerCase().includes(needle) ||
        d.location.toLowerCase().includes(needle) ||
        d.driveDate.toLowerCase().includes(needle)
      );
    });
  }, [drives, q]);

  const filteredMyApps = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = apps.map((a) => ({ a, d: driveById.get(a.driveId)! }));
    if (!needle) return rows;
    return rows.filter(({ a, d }) => {
      return (
        a.id.toLowerCase().includes(needle) ||
        d.companyName.toLowerCase().includes(needle) ||
        d.role.toLowerCase().includes(needle) ||
        a.status.toLowerCase().includes(needle) ||
        (a.agentRun?.runId ?? "").toLowerCase().includes(needle) ||
        a.reasons.some((r) => r.message.toLowerCase().includes(needle))
      );
    });
  }, [apps, driveById, q]);

  const statusChip = (s: EligibilityStatus) => {
    if (s === "SHORTLISTED") return <Chip tone="success">SHORTLISTED</Chip>;
    if (s === "INELIGIBLE") return <Chip tone="danger">INELIGIBLE</Chip>;
    return <Chip tone="info">APPLIED</Chip>;
  };

  // ✅ “Automated by agent” run (for demo; wire to backend later)
  const refreshPlacementAgent = () => {
    const next = runCounter + 1;
    setRunCounter(next);

    const run: AgentRunRef = {
      runId: newRunId("RUN-PLA", next),
      ranAtIso: new Date().toISOString(),
      agent: "PlacementAgent",
    };

    setApps((prev) =>
      prev.map((a) => {
        const drive = driveById.get(a.driveId)!;
        const reasons = evaluateEligibility(profile, drive);
        const status: EligibilityStatus = reasons.length === 0 ? "SHORTLISTED" : "INELIGIBLE";
        return { ...a, status, reasons, agentRun: run };
      })
    );
  };

  const kpi = useMemo(() => {
    const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
    const ineligible = apps.filter((a) => a.status === "INELIGIBLE").length;
    return { total: apps.length, shortlisted, ineligible };
  }, [apps]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Placement Drives
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Shortlisting and eligibility is processed automatically by the Placement Agent.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50 dark:bg-slate-900/35">
                <GraduationCapIcon size={16} className="text-slate-600 dark:text-slate-300" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{profile.name}</span>{" "}
                  • {profile.regNo} • {profile.program} Y{profile.year}
                </div>
              </div>

              <button
                type="button"
                onClick={refreshPlacementAgent}
                className={cn(
                  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
                  "text-sm font-semibold text-white",
                  "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
                  "shadow-sm shadow-indigo-600/20",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-white",
                  "dark:focus:ring-indigo-300/60 dark:focus:ring-offset-slate-950",
                  "transition"
                )}
              >
                <RefreshCwIcon size={16} />
                Refresh Agent Status
              </button>
            </div>
          </div>

          {/* Seg tabs */}
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/35 ring-1 ring-slate-200 dark:ring-slate-800 p-2">
            <SegTab
              active={tab === "all"}
              icon={<BriefcaseIcon size={16} />}
              label="All Drives"
              onClick={() => setTab("all")}
            />
            <SegTab
              active={tab === "mine"}
              icon={<ClipboardCheckIcon size={16} />}
              label="My Applications"
              onClick={() => setTab("mine")}
            />
          </div>

          {/* Search + KPIs */}
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="info">Total Applied: {kpi.total}</Chip>
              <Chip tone="success">Shortlisted: {kpi.shortlisted}</Chip>
              <Chip tone="danger">Ineligible: {kpi.ineligible}</Chip>
            </div>

            <div className="relative w-full lg:w-[420px]">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company / role / status / reason / run id…"
                className={cn(
                  "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                  "ring-1 ring-slate-200 dark:ring-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                  "transition"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Automation panel (NOT “suggested”) */}
      <Panel
        title="PLACEMENT AGENT — AUTOMATION"
        right={
          <span className="text-white/90 text-xs font-semibold inline-flex items-center gap-2">
            <BotIcon size={14} />
            {lastRun ? `Last run: ${lastRun.runId} • ${fmtDtShort(lastRun.ranAtIso)}` : "No runs"}
          </span>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <CheckCircle2Icon size={16} className="text-emerald-600 dark:text-emerald-300" />
              Automated actions executed
            </div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              <li>Eligibility computed for each applied drive (CGPA / backlogs / attendance / no-due).</li>
              <li>SHORTLISTED / INELIGIBLE status updated with machine-readable reason codes.</li>
              <li>Agent run id attached to every status update for traceability.</li>
            </ul>
          </div>

          <div className="lg:col-span-5 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <CalendarDaysIcon size={16} className="text-indigo-600 dark:text-indigo-300" />
              Your current profile gates
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/25 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">CGPA</div>
                <div className="font-semibold text-slate-900 dark:text-slate-50">{profile.cgpa.toFixed(2)}</div>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/25 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Backlogs</div>
                <div className="font-semibold text-slate-900 dark:text-slate-50">{profile.backlogs}</div>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/25 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Attendance</div>
                <div className="font-semibold text-slate-900 dark:text-slate-50">{profile.attendance}%</div>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-900/25 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">No Due</div>
                <div className="font-semibold text-slate-900 dark:text-slate-50">
                  {profile.noDueClear ? "CLEAR" : "NOT CLEAR"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* All drives */}
      {tab === "all" && (
        <Panel
          title="ALL DRIVES"
          right={<div className="text-white/90 text-xs font-semibold">{filteredAllDrives.length} drive(s)</div>}
        >
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="min-w-[1100px]">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Drive", "Company / Role", "Package", "Location", "Drive Date", "Criteria"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAllDrives.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No drives found.
                      </td>
                    </tr>
                  ) : (
                    filteredAllDrives.map((d, idx) => (
                      <tr
                        key={d.id}
                        className={cn(
                          "transition",
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.id}
                        </td>
                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 ring-1 ring-slate-200 dark:ring-slate-800 grid place-items-center">
                              <Building2Icon size={16} className="text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {d.companyName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{d.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          <Chip tone="info">{d.packageLpa.toFixed(1)} LPA</Chip>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.location}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.driveDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex flex-wrap gap-2">
                            <Chip tone="neutral">CGPA ≥ {d.criteria.minCgpa}</Chip>
                            <Chip tone="neutral">Backlogs ≤ {d.criteria.maxBacklogs}</Chip>
                            <Chip tone="neutral">Attendance ≥ {d.criteria.minAttendance}%</Chip>
                            {d.criteria.requireNoDue ? (
                              <Chip tone="warn">No-Due Required</Chip>
                            ) : (
                              <Chip tone="success">No-Due Not Required</Chip>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* My applications */}
      {tab === "mine" && (
        <Panel
          title="MY APPLICATIONS — AGENT STATUS + REASON"
          right={<div className="text-white/90 text-xs font-semibold">{filteredMyApps.length} application(s)</div>}
        >
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="min-w-[1280px]">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Application", "Company / Role", "Applied On", "Agent Status", "Reason (if INELIGIBLE)", "Agent Run"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMyApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredMyApps.map(({ a, d }, idx) => (
                      <tr
                        key={a.id}
                        className={cn(
                          "transition",
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.id}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{d.id}</div>
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{d.companyName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{d.role}</div>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.appliedOn}
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex items-center gap-2">
                            {a.status === "SHORTLISTED" ? (
                              <BadgeCheckIcon size={18} className="text-emerald-600 dark:text-emerald-300" />
                            ) : a.status === "INELIGIBLE" ? (
                              <XCircleIcon size={18} className="text-rose-600 dark:text-rose-300" />
                            ) : (
                              <AlertTriangleIcon size={18} className="text-amber-600 dark:text-amber-300" />
                            )}
                            {statusChip(a.status)}
                          </div>
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.status !== "INELIGIBLE" ? (
                            <span className="text-sm text-slate-400">—</span>
                          ) : (
                            <div className="space-y-1">
                              {a.reasons.map((r, i) => (
                                <div
                                  key={i}
                                  className="text-sm text-slate-800 dark:text-slate-100"
                                >
                                  <Chip tone="danger">{r.code}</Chip>{" "}
                                  <span className="text-slate-700 dark:text-slate-200">{r.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.agentRun ? (
                            <div className="inline-flex items-center gap-2">
                              <Chip tone="info">
                                <span className="inline-flex items-center gap-1">
                                  <BotIcon size={14} />
                                  {a.agentRun.agent}
                                </span>
                              </Chip>
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {a.agentRun.runId}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {fmtDtShort(a.agentRun.ranAtIso)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export default StudentPlacementDrives;
