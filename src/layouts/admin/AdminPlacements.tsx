// src/layouts/admin/AdminPlacements.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type DriveStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
type AppStatus = "APPLIED" | "SHORTLISTED" | "INELIGIBLE" | "SELECTED" | "REJECTED";

type Company = {
  id: string;
  name: string;
  industry: string;
  location: string;
  ctcLpa: number;
  role: string;
  createdAt: string; // dd/mm/yyyy
};

type Criteria = {
  minCgpa: number;
  maxBacklogs: number;
  allowedBranches: string[];
  minAttendancePct: number;
  noDueRequired: boolean;
};

type Drive = {
  id: string;
  companyId: string;
  title: string;
  driveDate: string; // yyyy-mm-dd
  slotStart: string; // HH:mm
  slotEnd: string; // HH:mm
  venue: string; // e.g., "B-201"
  criteria: Criteria;
  status: DriveStatus;
  createdAt: string; // dd/mm/yyyy
};

type StudentProfile = {
  id: string;
  regNo: string;
  name: string;
  branch: string;
  year: string;
  cgpa: number;
  backlogs: number;
  attendancePct: number;
  noDue: boolean;
};

type DriveApplication = {
  id: string;
  driveId: string;
  studentId: string;
  status: AppStatus;
  reason?: string;
  updatedAt: string; // dd/mm/yyyy HH:mm
};

type InterviewSlot = {
  id: string;
  driveId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
  capacity: number;
};

type SlotAssignment = {
  id: string;
  slotId: string;
  applicationId: string;
  tokenNo: number;
};

type Offer = {
  id: string;
  driveId: string;
  studentId: string;
  companyName: string;
  role: string;
  ctcLpa: number;
  offerDate: string; // yyyy-mm-dd
  notes?: string;
};

type RunLog = {
  id: string;
  driveId: string;
  at: string; // dd/mm/yyyy HH:mm
  status: "SUCCESS" | "FAILED";
  message: string;
};

const K = {
  companies: "admin_place_companies_v1",
  drives: "admin_place_drives_v1",
  students: "admin_place_students_v1",
  apps: "admin_place_apps_v1",
  slots: "admin_place_slots_v1",
  assigns: "admin_place_assigns_v1",
  offers: "admin_place_offers_v1",
  runs: "admin_place_runs_v1",
};

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ddmmyyyy(d = new Date()) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function ddmmyyyy_hhmm(d = new Date()) {
  return `${ddmmyyyy(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseDdmmyyyyHhmmToEpoch(s?: string): number {
  // expects "dd/mm/yyyy HH:mm"
  if (!s) return 0;
  const [datePart, timePart] = s.split(" ");
  if (!datePart) return 0;
  const [dd, mm, yyyy] = datePart.split("/").map((x) => Number(x));
  const [hh, min] = (timePart ?? "00:00").split(":").map((x) => Number(x));
  if (!dd || !mm || !yyyy) return 0;
  const dt = new Date(yyyy, mm - 1, dd, hh || 0, min || 0, 0, 0);
  const t = dt.getTime();
  return Number.isFinite(t) ? t : 0;
}

// ---------- DEMO DATA (dummy only) ----------
const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: "st_1",
    regNo: "REG0001",
    name: "STUDENT ONE",
    branch: "CSE",
    year: "III",
    cgpa: 8.2,
    backlogs: 0,
    attendancePct: 86,
    noDue: true,
  },
  {
    id: "st_2",
    regNo: "REG0002",
    name: "STUDENT TWO",
    branch: "FT",
    year: "III",
    cgpa: 7.4,
    backlogs: 1,
    attendancePct: 78,
    noDue: true,
  },
  {
    id: "st_3",
    regNo: "REG0003",
    name: "STUDENT THREE",
    branch: "CSE",
    year: "III",
    cgpa: 6.8,
    backlogs: 0,
    attendancePct: 72,
    noDue: false,
  },
  {
    id: "st_4",
    regNo: "REG0004",
    name: "STUDENT FOUR",
    branch: "ECE",
    year: "III",
    cgpa: 8.9,
    backlogs: 0,
    attendancePct: 92,
    noDue: true,
  },
];

function makeDefaultCompanies(): Company[] {
  return [
    {
      id: "co_demo_1",
      name: "Aster Labs",
      industry: "Software",
      location: "Chennai",
      ctcLpa: 8.5,
      role: "Software Engineer Intern",
      createdAt: ddmmyyyy(),
    },
    {
      id: "co_demo_2",
      name: "BluePeak Foods",
      industry: "Food Tech",
      location: "Bengaluru",
      ctcLpa: 6.0,
      role: "Quality Analyst",
      createdAt: ddmmyyyy(),
    },
  ];
}
function makeDefaultDrives(companies: Company[]): Drive[] {
  const coId = companies[0]?.id ?? "co_demo_1";
  return [
    {
      id: "dr_demo_1",
      companyId: coId,
      title: `${companies.find((c) => c.id === coId)?.name ?? "Company"} • Campus Drive`,
      driveDate: "2025-12-29",
      slotStart: "10:00",
      slotEnd: "16:00",
      venue: "Main Seminar Hall",
      criteria: {
        minCgpa: 7.0,
        maxBacklogs: 0,
        allowedBranches: ["CSE", "ECE"],
        minAttendancePct: 75,
        noDueRequired: true,
      },
      status: "DRAFT",
      createdAt: ddmmyyyy(),
    },
  ];
}

type TabKey = "companies" | "drives" | "applications" | "slots" | "offers" | "runs";

export const AdminPlacements: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("drives");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const toastMsg = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  const [companies, setCompanies] = useState<Company[]>(() =>
    load<Company[]>(K.companies, makeDefaultCompanies())
  );
  const [students, setStudents] = useState<StudentProfile[]>(() =>
    load<StudentProfile[]>(K.students, DEMO_STUDENTS)
  );
  const [drives, setDrives] = useState<Drive[]>(() =>
    load<Drive[]>(K.drives, makeDefaultDrives(load<Company[]>(K.companies, makeDefaultCompanies())))
  );
  const [applications, setApplications] = useState<DriveApplication[]>(() =>
    load<DriveApplication[]>(K.apps, [])
  );
  const [slots, setSlots] = useState<InterviewSlot[]>(() => load<InterviewSlot[]>(K.slots, []));
  const [assignments, setAssignments] = useState<SlotAssignment[]>(() =>
    load<SlotAssignment[]>(K.assigns, [])
  );
  const [offers, setOffers] = useState<Offer[]>(() => load<Offer[]>(K.offers, []));
  const [runs, setRuns] = useState<RunLog[]>(() => load<RunLog[]>(K.runs, []));

  useEffect(() => save(K.companies, companies), [companies]);
  useEffect(() => save(K.students, students), [students]);
  useEffect(() => save(K.drives, drives), [drives]);
  useEffect(() => save(K.apps, applications), [applications]);
  useEffect(() => save(K.slots, slots), [slots]);
  useEffect(() => save(K.assigns, assignments), [assignments]);
  useEffect(() => save(K.offers, offers), [offers]);
  useEffect(() => save(K.runs, runs), [runs]);

  const [selectedDriveId, setSelectedDriveId] = useState<string>(() => drives[0]?.id ?? "");
  useEffect(() => {
    if (!selectedDriveId && drives[0]?.id) setSelectedDriveId(drives[0].id);
  }, [drives, selectedDriveId]);

  const activeDrive = useMemo(
    () => drives.find((d) => d.id === selectedDriveId) ?? null,
    [drives, selectedDriveId]
  );
  const activeCompany = useMemo(() => {
    if (!activeDrive) return null;
    return companies.find((c) => c.id === activeDrive.companyId) ?? null;
  }, [activeDrive, companies]);

  const driveApps = useMemo(
    () => applications.filter((a) => a.driveId === selectedDriveId),
    [applications, selectedDriveId]
  );
  const driveSlots = useMemo(() => slots.filter((s) => s.driveId === selectedDriveId), [
    slots,
    selectedDriveId,
  ]);
  const orderedDriveSlots = useMemo(() => {
    return driveSlots
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.room.localeCompare(b.room));
  }, [driveSlots]);

  const driveAssignments = useMemo(() => {
    const slotIds = new Set(driveSlots.map((s) => s.id));
    return assignments.filter((a) => slotIds.has(a.slotId));
  }, [assignments, driveSlots]);

  const driveOffers = useMemo(() => offers.filter((o) => o.driveId === selectedDriveId), [
    offers,
    selectedDriveId,
  ]);
  const driveRuns = useMemo(() => runs.filter((r) => r.driveId === selectedDriveId), [
    runs,
    selectedDriveId,
  ]);

  const kpis = useMemo(() => {
    const totalDrives = drives.length;
    const published = drives.filter((d) => d.status === "PUBLISHED").length;
    const applied = driveApps.filter((a) => a.status === "APPLIED").length;
    const shortlisted = driveApps.filter((a) => a.status === "SHORTLISTED").length;
    const ineligible = driveApps.filter((a) => a.status === "INELIGIBLE").length;
    const selected = driveApps.filter((a) => a.status === "SELECTED").length;
    return { totalDrives, published, applied, shortlisted, ineligible, selected };
  }, [drives, driveApps]);

  // ---------- UI atoms ----------
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</div>
  );
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={clsx(
        "h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        "px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
        props.className
      )}
    />
  );
  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
      {...props}
      className={clsx(
        "h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        "px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
        props.className
      )}
    />
  );
  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className={clsx(
        "min-h-[90px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        "px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
        props.className
      )}
    />
  );
  const PrimaryBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      className={clsx(
        "h-10 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white",
        "hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
  const GhostBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      className={clsx(
        "h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        "active:scale-[0.99] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
  const TabBtn = ({ k, children }: { k: TabKey; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => setTab(k)}
      className={clsx(
        "h-10 px-4 text-sm font-semibold transition",
        tab === k
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );

  const StatusPill = ({ status }: { status: DriveStatus }) => {
    const cls =
      status === "DRAFT"
        ? "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        : status === "PUBLISHED"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    return <span className={clsx("text-xs px-2 py-1 rounded-lg border font-semibold", cls)}>{status}</span>;
  };

  // ---------- IMPORT / RESET ----------
  const importRef = useRef<HTMLInputElement | null>(null);

  const doImport = async (file: File) => {
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);

      const nextCompanies = Array.isArray(data.companies) ? (data.companies as Company[]) : null;
      const nextDrives = Array.isArray(data.drives) ? (data.drives as Drive[]) : null;
      const nextStudents = Array.isArray(data.students) ? (data.students as StudentProfile[]) : null;
      const nextApps = Array.isArray(data.applications) ? (data.applications as DriveApplication[]) : null;
      const nextSlots = Array.isArray(data.slots) ? (data.slots as InterviewSlot[]) : null;
      const nextAssigns = Array.isArray(data.assignments) ? (data.assignments as SlotAssignment[]) : null;
      const nextOffers = Array.isArray(data.offers) ? (data.offers as Offer[]) : null;
      const nextRuns = Array.isArray(data.runs) ? (data.runs as RunLog[]) : null;

      if (!nextCompanies || !nextDrives || !nextStudents) {
        toastMsg("Import failed: JSON missing companies/drives/students.");
        return;
      }

      setCompanies(nextCompanies);
      setDrives(nextDrives);
      setStudents(nextStudents);
      setApplications(nextApps ?? []);
      setSlots(nextSlots ?? []);
      setAssignments(nextAssigns ?? []);
      setOffers(nextOffers ?? []);
      setRuns(nextRuns ?? []);
      setSelectedDriveId(nextDrives[0]?.id ?? "");
      setTab("drives");
      toastMsg("Imported successfully.");
    } catch {
      toastMsg("Import failed: invalid JSON file.");
    }
  };

  const resetDemo = () => {
    const nextCompanies = makeDefaultCompanies();
    const nextStudents = DEMO_STUDENTS.slice();
    const nextDrives = makeDefaultDrives(nextCompanies);

    setCompanies(nextCompanies);
    setStudents(nextStudents);
    setDrives(nextDrives);
    setApplications([]);
    setSlots([]);
    setAssignments([]);
    setOffers([]);
    setRuns([]);
    setSelectedDriveId(nextDrives[0]?.id ?? "");
    setTab("drives");
    setQ("");
    toastMsg("Demo data reset.");
  };

  // ---------- COMPANY create ----------
  const [coName, setCoName] = useState("");
  const [coIndustry, setCoIndustry] = useState("Software");
  const [coLoc, setCoLoc] = useState("Chennai");
  const [coCtc, setCoCtc] = useState("8.0");
  const [coRole, setCoRole] = useState("Software Engineer");

  const addCompany = () => {
    const name = coName.trim();
    if (!name) return toastMsg("Enter company name.");
    const ctc = Number(coCtc);
    if (!Number.isFinite(ctc) || ctc <= 0) return toastMsg("Enter valid CTC (LPA).");

    const row: Company = {
      id: uid("co"),
      name,
      industry: coIndustry.trim() || "—",
      location: coLoc.trim() || "—",
      ctcLpa: Math.round(ctc * 100) / 100,
      role: coRole.trim() || "—",
      createdAt: ddmmyyyy(),
    };
    setCompanies([row, ...companies]);
    setCoName("");
    toastMsg("Company created.");
    setTab("companies");
  };

  // ---------- DRIVE create ----------
  const [driveCompanyId, setDriveCompanyId] = useState<string>(() => companies[0]?.id ?? "");
  useEffect(() => {
    if (!driveCompanyId && companies[0]?.id) setDriveCompanyId(companies[0].id);
  }, [companies, driveCompanyId]);

  const [driveTitle, setDriveTitle] = useState("Campus Drive");
  const [driveDate, setDriveDate] = useState("2025-12-29");
  const [driveStart, setDriveStart] = useState("10:00");
  const [driveEnd, setDriveEnd] = useState("16:00");
  const [driveVenue, setDriveVenue] = useState("Main Seminar Hall");

  const [minCgpa, setMinCgpa] = useState("7.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [branches, setBranches] = useState("CSE,ECE");
  const [minAtt, setMinAtt] = useState("75");
  const [noDueRequired, setNoDueRequired] = useState(true);

  const addDrive = () => {
    if (!driveCompanyId) return toastMsg("Create/select a company first.");
    const cMinCgpa = Number(minCgpa);
    const cMaxBacklogs = Number(maxBacklogs);
    const cMinAtt = Number(minAtt);

    if (!Number.isFinite(cMinCgpa) || cMinCgpa < 0 || cMinCgpa > 10) return toastMsg("Min CGPA should be 0–10.");
    if (!Number.isFinite(cMaxBacklogs) || cMaxBacklogs < 0) return toastMsg("Max backlogs must be ≥ 0.");
    if (!Number.isFinite(cMinAtt) || cMinAtt < 0 || cMinAtt > 100) return toastMsg("Min attendance should be 0–100.");
    if (!driveDate) return toastMsg("Choose drive date.");

    const company = companies.find((c) => c.id === driveCompanyId);
    const row: Drive = {
      id: uid("dr"),
      companyId: driveCompanyId,
      title: `${company?.name ?? "Company"} • ${driveTitle.trim() || "Drive"}`,
      driveDate,
      slotStart: driveStart,
      slotEnd: driveEnd,
      venue: driveVenue.trim() || "—",
      criteria: {
        minCgpa: Math.round(cMinCgpa * 100) / 100,
        maxBacklogs: Math.floor(cMaxBacklogs),
        allowedBranches: branches
          .split(",")
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean),
        minAttendancePct: Math.floor(cMinAtt),
        noDueRequired,
      },
      status: "DRAFT",
      createdAt: ddmmyyyy(),
    };

    setDrives([row, ...drives]);
    setSelectedDriveId(row.id);
    toastMsg("Drive created.");
    setTab("drives");
  };

  const publishDrive = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    setDrives((prev) => prev.map((d) => (d.id === activeDrive.id ? { ...d, status: "PUBLISHED" } : d)));
    toastMsg("Drive published.");
  };

  const closeDrive = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    setDrives((prev) => prev.map((d) => (d.id === activeDrive.id ? { ...d, status: "CLOSED" } : d)));
    toastMsg("Drive closed.");
  };

  // ---------- APPLY (demo) ----------
  const seedApplications = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    const existing = new Set(driveApps.map((a) => a.studentId));
    const next: DriveApplication[] = [];

    for (const st of students) {
      if (existing.has(st.id)) continue;
      next.push({
        id: uid("app"),
        driveId: activeDrive.id,
        studentId: st.id,
        status: "APPLIED",
        updatedAt: ddmmyyyy_hhmm(),
      });
    }

    if (next.length === 0) return toastMsg("All demo students already applied.");
    setApplications((prev) => [...next, ...prev]);
    toastMsg(`Added ${next.length} demo applications.`);
    setTab("applications");
  };

  // ---------- SHORTLIST (demo logic) ----------
  const runShortlist = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    if (driveApps.length === 0) return toastMsg("No applications for this drive.");

    const cr = activeDrive.criteria;

    const updated = applications.map((a) => {
      if (a.driveId !== activeDrive.id) return a;

      const st = students.find((s) => s.id === a.studentId);
      if (!st) return a;

      const reasons: string[] = [];
      if (st.cgpa < cr.minCgpa) reasons.push(`CGPA < ${cr.minCgpa}`);
      if (st.backlogs > cr.maxBacklogs) reasons.push(`Backlogs > ${cr.maxBacklogs}`);
      if (st.attendancePct < cr.minAttendancePct) reasons.push(`Attendance < ${cr.minAttendancePct}%`);
      if (cr.noDueRequired && !st.noDue) reasons.push("No Due required");
      if (cr.allowedBranches.length > 0 && !cr.allowedBranches.includes(st.branch.toUpperCase())) reasons.push("Branch not eligible");

      const ok = reasons.length === 0;
      return {
        ...a,
        status: ok ? "SHORTLISTED" : "INELIGIBLE",
        reason: ok ? "Eligible as per criteria" : reasons.join(" • "),
        updatedAt: ddmmyyyy_hhmm(),
      };
    });

    setApplications(updated);

    const shortCount = updated.filter((x) => x.driveId === activeDrive.id && x.status === "SHORTLISTED").length;
    const inelCount = updated.filter((x) => x.driveId === activeDrive.id && x.status === "INELIGIBLE").length;

    setRuns((prev) => [
      {
        id: uid("run"),
        driveId: activeDrive.id,
        at: ddmmyyyy_hhmm(),
        status: "SUCCESS",
        message: `Shortlist completed: ${shortCount} shortlisted, ${inelCount} ineligible.`,
      },
      ...prev,
    ]);

    toastMsg("Shortlist run completed (demo).");
    setTab("applications");
  };

  // ---------- CREATE INTERVIEW SLOTS + AUTO ASSIGN ----------
  const [slotRoom, setSlotRoom] = useState("B-201");
  const [slotStart, setSlotStart] = useState("10:00");
  const [slotEnd, setSlotEnd] = useState("10:15");
  const [slotCapacity, setSlotCapacity] = useState("10");

  const addSlot = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    const cap = Number(slotCapacity);
    if (!Number.isFinite(cap) || cap <= 0) return toastMsg("Capacity must be > 0.");
    if (!slotStart || !slotEnd) return toastMsg("Enter start/end time.");

    const row: InterviewSlot = {
      id: uid("slot"),
      driveId: activeDrive.id,
      startTime: slotStart,
      endTime: slotEnd,
      room: slotRoom.trim() || "—",
      capacity: Math.floor(cap),
    };
    setSlots((prev) => [row, ...prev]);
    toastMsg("Slot created.");
    setTab("slots");
  };

  const autoAssign = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    if (orderedDriveSlots.length === 0) return toastMsg("Create slots first.");

    const shortlist = driveApps
      .filter((a) => a.status === "SHORTLISTED")
      .slice()
      .sort((a, b) => parseDdmmyyyyHhmmToEpoch(a.updatedAt) - parseDdmmyyyyHhmmToEpoch(b.updatedAt));

    if (shortlist.length === 0) return toastMsg("No shortlisted candidates.");

    // Clear current assignments for this drive
    const slotIds = new Set(orderedDriveSlots.map((s) => s.id));
    const remainingAssignments = assignments.filter((a) => !slotIds.has(a.slotId));
    const newAssignments: SlotAssignment[] = [];

    let i = 0;
    for (const slot of orderedDriveSlots) {
      for (let k = 1; k <= slot.capacity; k++) {
        if (i >= shortlist.length) break;
        newAssignments.push({
          id: uid("as"),
          slotId: slot.id,
          applicationId: shortlist[i].id,
          tokenNo: k,
        });
        i++;
      }
      if (i >= shortlist.length) break;
    }

    setAssignments([...newAssignments, ...remainingAssignments]);

    setRuns((prev) => [
      {
        id: uid("run"),
        driveId: activeDrive.id,
        at: ddmmyyyy_hhmm(),
        status: "SUCCESS",
        message: `Auto slot assignment: assigned ${newAssignments.length}/${shortlist.length} shortlisted.`,
      },
      ...prev,
    ]);

    toastMsg("Auto-assigned slots (demo).");
    setTab("slots");
  };

  // ---------- OFFERS ----------
  const [offerRegNo, setOfferRegNo] = useState("");
  const [offerRole, setOfferRole] = useState("");
  const [offerCtc, setOfferCtc] = useState("8.5");
  const [offerDate, setOfferDate] = useState("2025-12-27");
  const [offerNotes, setOfferNotes] = useState("");

  const createOffer = () => {
    if (!activeDrive) return toastMsg("Select a drive.");
    const st = students.find((s) => s.regNo === offerRegNo.trim());
    if (!st) return toastMsg("Student RegNo not found.");
    const ctc = Number(offerCtc);
    if (!Number.isFinite(ctc) || ctc <= 0) return toastMsg("Enter valid CTC (LPA).");

    const companyName = activeCompany?.name ?? "Company";
    const role = (offerRole.trim() || activeCompany?.role || "Role").trim();

    const row: Offer = {
      id: uid("of"),
      driveId: activeDrive.id,
      studentId: st.id,
      companyName,
      role,
      ctcLpa: Math.round(ctc * 100) / 100,
      offerDate,
      notes: offerNotes.trim() || undefined,
    };

    setOffers((prev) => [row, ...prev]);

    // Update application status to SELECTED if exists; otherwise create a record
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.driveId === activeDrive.id && a.studentId === st.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          status: "SELECTED",
          updatedAt: ddmmyyyy_hhmm(),
          reason: "Offer created",
        };
        return next;
      }
      return [
        {
          id: uid("app"),
          driveId: activeDrive.id,
          studentId: st.id,
          status: "SELECTED",
          updatedAt: ddmmyyyy_hhmm(),
          reason: "Offer created (no prior application record)",
        },
        ...prev,
      ];
    });

    toastMsg("Offer saved.");
    setOfferRegNo("");
    setOfferRole("");
    setOfferNotes("");
    setTab("offers");
  };

  // ---------- FILTERS ----------
  const driveFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return drives;
    return drives.filter((d) => {
      const comp = companies.find((c) => c.id === d.companyId)?.name ?? "";
      return `${d.title} ${comp} ${d.driveDate} ${d.status} ${d.venue}`.toLowerCase().includes(s);
    });
  }, [q, drives, companies]);

  const appsFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return driveApps;
    return driveApps.filter((a) => {
      const st = students.find((x) => x.id === a.studentId);
      return `${st?.regNo ?? ""} ${st?.name ?? ""} ${st?.branch ?? ""} ${a.status} ${a.reason ?? ""}`
        .toLowerCase()
        .includes(s);
    });
  }, [q, driveApps, students]);

  const slotsFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orderedDriveSlots;
    return orderedDriveSlots.filter((x) =>
      `${x.room} ${x.startTime} ${x.endTime} ${x.capacity}`.toLowerCase().includes(s)
    );
  }, [q, orderedDriveSlots]);

  const offersFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return driveOffers;
    return driveOffers.filter((o) => {
      const st = students.find((x) => x.id === o.studentId);
      return `${st?.regNo ?? ""} ${st?.name ?? ""} ${o.companyName} ${o.role} ${o.ctcLpa} ${o.offerDate}`
        .toLowerCase()
        .includes(s);
    });
  }, [q, driveOffers, students]);

  // ---------- helper lookups ----------
  const studentById = useMemo(() => {
    const m = new Map<string, StudentProfile>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const companyById = useMemo(() => {
    const m = new Map<string, Company>();
    for (const c of companies) m.set(c.id, c);
    return m;
  }, [companies]);

  const appById = useMemo(() => {
    const m = new Map<string, DriveApplication>();
    for (const a of applications) m.set(a.id, a);
    return m;
  }, [applications]);

  const slotById = useMemo(() => {
    const m = new Map<string, InterviewSlot>();
    for (const s of slots) m.set(s.id, s);
    return m;
  }, [slots]);

  // ---------- layout ----------
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Placements</h1>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Company drives, criteria-based shortlisting, interview slots and offers.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedDriveId} onChange={(e) => setSelectedDriveId(e.target.value)} className="min-w-[260px]">
            {drives.length === 0 ? (
              <option value="">No drives</option>
            ) : (
              drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))
            )}
          </Select>

          <PrimaryBtn type="button" onClick={runShortlist} disabled={!activeDrive}>
            Run Shortlist
          </PrimaryBtn>

          <GhostBtn
            type="button"
            onClick={() =>
              downloadJson(`placements_export_${Date.now()}.json`, {
                companies,
                drives,
                students,
                applications,
                slots,
                assignments,
                offers,
                runs,
              })
            }
          >
            Export
          </GhostBtn>

          <GhostBtn type="button" onClick={() => importRef.current?.click()}>
            Import
          </GhostBtn>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void doImport(f);
            }}
          />

          <GhostBtn type="button" onClick={resetDemo}>
            Reset Demo
          </GhostBtn>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Drives", value: kpis.totalDrives },
          { label: "Published", value: kpis.published },
          { label: "Applied", value: kpis.applied },
          { label: "Shortlisted", value: kpis.shortlisted },
          { label: "Ineligible", value: kpis.ineligible },
          { label: "Selected", value: kpis.selected },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-4"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Tabs + Search */}
        <div className="px-4 sm:px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <TabBtn k="drives">Drives</TabBtn>
            <TabBtn k="companies">Companies</TabBtn>
            <TabBtn k="applications">Applications</TabBtn>
            <TabBtn k="slots">Interview Slots</TabBtn>
            <TabBtn k="offers">Offers</TabBtn>
            <TabBtn k="runs">Runs</TabBtn>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600 dark:text-slate-300">Search:</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to filter..." className="w-full sm:w-[320px]" />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* DRIVES */}
          {tab === "drives" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* create drive */}
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Create Drive</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Create a drive + criteria. Then publish and shortlist.
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Company</Label>
                      <Select value={driveCompanyId} onChange={(e) => setDriveCompanyId(e.target.value)}>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Drive title</Label>
                      <Input value={driveTitle} onChange={(e) => setDriveTitle(e.target.value)} placeholder="Campus Drive" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} />
                      </div>
                      <div>
                        <Label>Venue</Label>
                        <Input value={driveVenue} onChange={(e) => setDriveVenue(e.target.value)} placeholder="Main Seminar Hall" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Start</Label>
                        <Input type="time" value={driveStart} onChange={(e) => setDriveStart(e.target.value)} />
                      </div>
                      <div>
                        <Label>End</Label>
                        <Input type="time" value={driveEnd} onChange={(e) => setDriveEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Eligibility criteria</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Min CGPA</Label>
                        <Input value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
                      </div>
                      <div>
                        <Label>Max backlogs</Label>
                        <Input value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Min attendance %</Label>
                        <Input value={minAtt} onChange={(e) => setMinAtt(e.target.value)} />
                      </div>
                      <div>
                        <Label>Allowed branches</Label>
                        <Input value={branches} onChange={(e) => setBranches(e.target.value)} placeholder="CSE,ECE,FT" />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={noDueRequired}
                        onChange={(e) => setNoDueRequired(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                      />
                      No Due required
                    </label>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={addDrive}>
                        Create
                      </PrimaryBtn>
                      <GhostBtn type="button" onClick={seedApplications} disabled={!activeDrive}>
                        Add Demo Applications
                      </GhostBtn>
                    </div>

                    {activeDrive && (
                      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Active Drive</div>
                          <StatusPill status={activeDrive.status} />
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          {activeDrive.title} • {activeDrive.driveDate} • {activeDrive.venue}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryBtn type="button" onClick={publishDrive} disabled={activeDrive.status !== "DRAFT"}>
                            Publish
                          </PrimaryBtn>
                          <GhostBtn type="button" onClick={closeDrive} disabled={activeDrive.status === "CLOSED"}>
                            Close
                          </GhostBtn>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* list drives */}
              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                          Drive
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">
                          Date / Time
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {driveFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No drives</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create a drive to begin.</div>
                          </td>
                        </tr>
                      ) : (
                        driveFiltered.map((d) => {
                          const comp = companyById.get(d.companyId);
                          const isSelected = d.id === selectedDriveId;
                          return (
                            <tr
                              key={d.id}
                              className={clsx(
                                "border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition",
                                isSelected && "bg-indigo-50/40 dark:bg-indigo-500/10"
                              )}
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900 dark:text-white">{d.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Venue: {d.venue}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{comp?.name ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                {d.driveDate} • {d.slotStart}–{d.slotEnd}
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill status={d.status} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDriveId(d.id)}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                               dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                  >
                                    Select
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDrives((prev) => prev.filter((x) => x.id !== d.id));
                                      setApplications((prev) => prev.filter((x) => x.driveId !== d.id));
                                      setSlots((prev) => prev.filter((x) => x.driveId !== d.id));

                                      const deletedSlotIds = new Set(slots.filter((s) => s.driveId === d.id).map((s) => s.id));
                                      setAssignments((prev) => prev.filter((a) => !deletedSlotIds.has(a.slotId)));

                                      setOffers((prev) => prev.filter((o) => o.driveId !== d.id));
                                      setRuns((prev) => prev.filter((r) => r.driveId !== d.id));
                                      toastMsg("Drive deleted.");
                                    }}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                               dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {activeDrive && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Active:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{activeDrive.title}</span> • Criteria: CGPA ≥{" "}
                    {activeDrive.criteria.minCgpa}, Backlogs ≤ {activeDrive.criteria.maxBacklogs}, Attendance ≥{" "}
                    {activeDrive.criteria.minAttendancePct}% {activeDrive.criteria.noDueRequired ? "• No Due" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPANIES */}
          {tab === "companies" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Add Company</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage companies and default roles/CTC.</div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <Label>Company name</Label>
                      <Input value={coName} onChange={(e) => setCoName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Industry</Label>
                        <Input value={coIndustry} onChange={(e) => setCoIndustry(e.target.value)} />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={coLoc} onChange={(e) => setCoLoc(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>CTC (LPA)</Label>
                        <Input value={coCtc} onChange={(e) => setCoCtc(e.target.value)} />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input value={coRole} onChange={(e) => setCoRole(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={addCompany}>
                        Save
                      </PrimaryBtn>
                      <GhostBtn type="button" onClick={() => toastMsg("Tip: Select company in Drive tab.")}>
                        Tip
                      </GhostBtn>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Company</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Industry</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Location</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">CTC</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[200px]">Default Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No companies</div>
                          </td>
                        </tr>
                      ) : (
                        companies.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Created: {c.createdAt}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{c.industry}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{c.location}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{c.ctcLpa.toFixed(1)} LPA</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{c.role}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (drives.some((d) => d.companyId === c.id)) return toastMsg("Cannot delete: company used in a drive.");
                                  setCompanies((prev) => prev.filter((x) => x.id !== c.id));
                                  toastMsg("Company deleted.");
                                }}
                                className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                           dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS */}
          {tab === "applications" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Applications</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Add demo applications, then run shortlist to mark Eligible/Ineligible.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={seedApplications} disabled={!activeDrive}>
                    Add Demo Applications
                  </GhostBtn>
                  <PrimaryBtn type="button" onClick={runShortlist} disabled={!activeDrive}>
                    Run Shortlist
                  </PrimaryBtn>
                  <GhostBtn type="button" onClick={() => downloadJson(`applications_${Date.now()}.json`, driveApps)}>
                    Download
                  </GhostBtn>
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Student</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Branch</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Metrics</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[320px]">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appsFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No applications</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Click <span className="font-semibold">Add Demo Applications</span>.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      appsFiltered
                        .slice()
                        .sort((a, b) => (studentById.get(a.studentId)?.regNo ?? "").localeCompare(studentById.get(b.studentId)?.regNo ?? ""))
                        .map((a) => {
                          const st = studentById.get(a.studentId);
                          return (
                            <tr
                              key={a.id}
                              className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{st?.regNo ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{st?.name ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{st?.branch ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                <span className="tabular-nums">
                                  CGPA {st?.cgpa ?? "—"} • Backlogs {st?.backlogs ?? "—"} • Att {st?.attendancePct ?? "—"}% • NoDue{" "}
                                  {st ? (st.noDue ? "Yes" : "No") : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={clsx(
                                    "text-xs px-2 py-1 rounded-lg border font-semibold",
                                    a.status === "SHORTLISTED"
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                      : a.status === "INELIGIBLE"
                                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                                      : a.status === "SELECTED"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                      : a.status === "REJECTED"
                                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                      : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                  )}
                                >
                                  {a.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                {a.reason ?? "—"}
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Updated: {a.updatedAt}</div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLOTS */}
          {tab === "slots" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* create slot */}
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Interview Slots</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create slots and auto-assign shortlisted candidates.</div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Room</Label>
                        <Input value={slotRoom} onChange={(e) => setSlotRoom(e.target.value)} />
                      </div>
                      <div>
                        <Label>Capacity</Label>
                        <Input value={slotCapacity} onChange={(e) => setSlotCapacity(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Start</Label>
                        <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                      </div>
                      <div>
                        <Label>End</Label>
                        <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={addSlot} disabled={!activeDrive}>
                        Add Slot
                      </PrimaryBtn>
                      <GhostBtn type="button" onClick={autoAssign} disabled={!activeDrive}>
                        Auto Assign
                      </GhostBtn>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tip: Run shortlist first → then auto-assign to slots.</div>
                  </div>
                </div>

                {/* assignment preview */}
                <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Assignment Preview</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shows the first few assigned tokens (if any).</div>

                  {driveAssignments.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">No assignments yet.</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {driveAssignments
                        .slice()
                        .sort((a, b) => a.tokenNo - b.tokenNo)
                        .slice(0, 6)
                        .map((a) => {
                          const app = appById.get(a.applicationId);
                          const st = app ? studentById.get(app.studentId) : undefined;
                          const slot = slotById.get(a.slotId);
                          return (
                            <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Token {a.tokenNo}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  {slot?.room} • {slot?.startTime}-{slot?.endTime}
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                {st?.regNo} • {st?.name}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* slots list */}
              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">Room</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">Time</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Capacity</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[240px]">Assigned</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotsFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No slots</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create interview slots on the left.</div>
                          </td>
                        </tr>
                      ) : (
                        slotsFiltered.map((s) => {
                          const assignedHere = driveAssignments.filter((a) => a.slotId === s.id);
                          const count = assignedHere.length;
                          return (
                            <tr
                              key={s.id}
                              className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.room}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                {s.startTime}-{s.endTime}
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{s.capacity}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                {count}/{s.capacity} assigned
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSlots((prev) => prev.filter((x) => x.id !== s.id));
                                    setAssignments((prev) => prev.filter((a) => a.slotId !== s.id));
                                    toastMsg("Slot deleted.");
                                  }}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* token list */}
                <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Token List</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Shows all assigned tokens for the selected drive.</div>
                  </div>

                  <table className="w-full text-sm">
                    <thead className="bg-white dark:bg-slate-950/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Token</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">Slot</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[240px]">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driveAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No assignments</div>
                          </td>
                        </tr>
                      ) : (
                        driveAssignments
                          .slice()
                          .sort((a, b) => a.tokenNo - b.tokenNo)
                          .map((a) => {
                            const slot = slotById.get(a.slotId);
                            const app = appById.get(a.applicationId);
                            const st = app ? studentById.get(app.studentId) : undefined;
                            return (
                              <tr
                                key={a.id}
                                className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                              >
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{a.tokenNo}</td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                  {slot?.room} • {slot?.startTime}-{slot?.endTime}
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{st?.regNo ?? "—"}</td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{st?.name ?? "—"}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={clsx(
                                      "text-xs px-2 py-1 rounded-lg border font-semibold",
                                      app?.status === "SHORTLISTED"
                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                        : app?.status === "SELECTED"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    )}
                                  >
                                    {app?.status ?? "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>

                  <div className="p-4">
                    <GhostBtn type="button" onClick={() => downloadJson(`token_list_${Date.now()}.json`, driveAssignments)} disabled={driveAssignments.length === 0}>
                      Download Token List
                    </GhostBtn>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OFFERS */}
          {tab === "offers" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* create offer */}
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Create Offer</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Minimal and professional. Links to selected drive.
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <Label>Student RegNo</Label>
                      <Input value={offerRegNo} onChange={(e) => setOfferRegNo(e.target.value)} placeholder="e.g., REG0001" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label>Role</Label>
                        <Input value={offerRole} onChange={(e) => setOfferRole(e.target.value)} placeholder={activeCompany?.role ?? "Role"} />
                      </div>
                      <div>
                        <Label>CTC (LPA)</Label>
                        <Input value={offerCtc} onChange={(e) => setOfferCtc(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <Label>Offer date</Label>
                      <Input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea value={offerNotes} onChange={(e) => setOfferNotes(e.target.value)} />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={createOffer} disabled={!activeDrive}>
                        Save Offer
                      </PrimaryBtn>
                      <GhostBtn
                        type="button"
                        onClick={() => {
                          setOfferRegNo("");
                          setOfferRole("");
                          setOfferNotes("");
                          toastMsg("Cleared.");
                        }}
                      >
                        Clear
                      </GhostBtn>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Tip: Offer will automatically mark application as <b>SELECTED</b>.
                    </div>
                  </div>
                </div>
              </div>

              {/* offers list */}
              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Company / Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">CTC</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offersFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No offers</div>
                          </td>
                        </tr>
                      ) : (
                        offersFiltered.map((o) => {
                          const st = studentById.get(o.studentId);
                          return (
                            <tr
                              key={o.id}
                              className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{st?.regNo ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{st?.name ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                <div className="font-semibold text-slate-900 dark:text-white">{o.companyName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{o.role}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{o.ctcLpa.toFixed(1)} LPA</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{o.offerDate}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOffers((prev) => prev.filter((x) => x.id !== o.id));
                                    toastMsg("Offer deleted.");
                                  }}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3">
                  <GhostBtn type="button" onClick={() => downloadJson(`offers_${Date.now()}.json`, driveOffers)} disabled={driveOffers.length === 0}>
                    Download Offers
                  </GhostBtn>
                </div>
              </div>
            </div>
          )}

          {/* RUNS */}
          {tab === "runs" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Run Logs</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Operational log of shortlisting and slot assignment actions.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`placement_runs_${Date.now()}.json`, driveRuns)}>
                    Download
                  </GhostBtn>
                  <GhostBtn
                    type="button"
                    onClick={() => {
                      setRuns((prev) => prev.filter((r) => r.driveId !== selectedDriveId));
                      toastMsg("Cleared logs for this drive.");
                    }}
                    disabled={!activeDrive}
                  >
                    Clear Logs
                  </GhostBtn>
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[200px]">Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[520px]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driveRuns.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No runs yet</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Run shortlist or auto assign to create logs.</div>
                        </td>
                      </tr>
                    ) : (
                      driveRuns.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{r.at}</td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                r.status === "SUCCESS"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
};
