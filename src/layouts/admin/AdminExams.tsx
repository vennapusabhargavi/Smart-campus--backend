// src/layouts/admin/AdminExams.tsx
import React, { useEffect, useMemo, useState } from "react";

type SessionStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED";

type ExamSession = {
  id: string;
  title: string;
  term: string; // e.g., "AY 2025–26 • Odd Sem"
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  status: SessionStatus;
  createdAt: string; // dd/mm/yyyy
};

type ExamSubject = {
  id: string;
  sessionId: string;
  courseCode: string;
  courseName: string;
  examDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  batch: string; // e.g., "CSE A"
  semester: string; // e.g., "Sem 5"
  status: "PLANNED" | "PUBLISHED";
};

type EligibilityRow = {
  id: string;
  sessionId: string;
  regNo: string;
  name: string;
  attendancePct: number;
  feeStatus: "CLEAR" | "PENDING";
  eligible: boolean;
  reason: string;
};

type HallTicketItem = {
  courseCode: string;
  courseName: string;
  examDate: string;
  startTime: string;
  room: string;
  seat: string;
};

type HallTicket = {
  id: string;
  sessionId: string;
  regNo: string;
  name: string;
  issuedAt: string; // dd/mm/yyyy
  items: HallTicketItem[];
};

type AgentRun = {
  id: string;
  sessionId: string;
  requestedAt: string; // dd/mm/yyyy HH:mm
  status: "SUCCESS" | "FAILED";
  message: string;
  agent?: "Examination Agent"; // ✅ for UI (AI badge)
};

const K = {
  sessions: "admin_exams_sessions_v1",
  subjects: "admin_exams_subjects_v1",
  eligibility: "admin_exams_eligibility_v1",
  tickets: "admin_exams_tickets_v1",
  runs: "admin_exams_runs_v1",
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
function inRange(date: string, start: string, end: string) {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return d >= s && d <= e;
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

// Minimal “demo roster” (replace with API later if needed)
const DEMO_STUDENTS: Array<{ regNo: string; name: string }> = [
  { regNo: "192213001", name: "M. ABINAYA" },
  { regNo: "192213024", name: "CHILAKAPATI ASHER" },
  { regNo: "192214001", name: "ADITHYAN SV" },
  { regNo: "192213025", name: "AKASH S" },
  { regNo: "192219005", name: "ALLOCIES JOHN BRITTO" },
  { regNo: "192219001", name: "AYSHA FARHA R" },
  { regNo: "192213026", name: "CHEJARLA CHAKRADHAR" },
  { regNo: "192213024", name: "DEVI G" },
];

type TabKey = "sessions" | "subjects" | "eligibility" | "tickets" | "runs";

export const AdminExams: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("sessions");
  const [q, setQ] = useState("");

  const [sessions, setSessions] = useState<ExamSession[]>(() =>
    load<ExamSession[]>(K.sessions, [
      {
        id: "sess_demo_1",
        title: "Nov/Dec 2025 – End Semester",
        term: "AY 2025–26 • Odd Sem",
        startDate: "2025-11-20",
        endDate: "2025-12-20",
        status: "DRAFT",
        createdAt: ddmmyyyy(),
      },
    ])
  );

  const [subjects, setSubjects] = useState<ExamSubject[]>(() =>
    load<ExamSubject[]>(K.subjects, [
      {
        id: "sub_demo_1",
        sessionId: "sess_demo_1",
        courseCode: "CSA1524",
        courseName: "Cloud Computing and Big Data Analytics",
        examDate: "2025-12-05",
        startTime: "09:30",
        endTime: "12:30",
        batch: "CSE A",
        semester: "Sem 5",
        status: "PLANNED",
      },
      {
        id: "sub_demo_2",
        sessionId: "sess_demo_1",
        courseCode: "ACA27",
        courseName: "Food Packaging Technology",
        examDate: "2025-12-10",
        startTime: "13:30",
        endTime: "16:30",
        batch: "FT A",
        semester: "Sem 5",
        status: "PLANNED",
      },
    ])
  );

  const [eligibility, setEligibility] = useState<EligibilityRow[]>(() =>
    load<EligibilityRow[]>(K.eligibility, [])
  );
  const [tickets, setTickets] = useState<HallTicket[]>(() =>
    load<HallTicket[]>(K.tickets, [])
  );
  const [runs, setRuns] = useState<AgentRun[]>(() => load<AgentRun[]>(K.runs, []));

  const [toast, setToast] = useState<string | null>(null);
  const toastMsg = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const first = sessions[0]?.id;
    return first ?? "";
  });

  useEffect(() => save(K.sessions, sessions), [sessions]);
  useEffect(() => save(K.subjects, subjects), [subjects]);
  useEffect(() => save(K.eligibility, eligibility), [eligibility]);
  useEffect(() => save(K.tickets, tickets), [tickets]);
  useEffect(() => save(K.runs, runs), [runs]);

  useEffect(() => {
    if (!selectedSessionId && sessions[0]?.id) setSelectedSessionId(sessions[0].id);
  }, [sessions, selectedSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  const sessionSubjects = useMemo(
    () => subjects.filter((s) => s.sessionId === selectedSessionId),
    [subjects, selectedSessionId]
  );
  const sessionEligibility = useMemo(
    () => eligibility.filter((e) => e.sessionId === selectedSessionId),
    [eligibility, selectedSessionId]
  );
  const sessionTickets = useMemo(
    () => tickets.filter((t) => t.sessionId === selectedSessionId),
    [tickets, selectedSessionId]
  );
  const sessionRuns = useMemo(
    () => runs.filter((r) => r.sessionId === selectedSessionId),
    [runs, selectedSessionId]
  );

  const lastRun = useMemo(() => sessionRuns[0] ?? null, [sessionRuns]);

  const kpis = useMemo(() => {
    const totalSessions = sessions.length;
    const planned = subjects.filter((s) => s.status === "PLANNED").length;
    const published = subjects.filter((s) => s.status === "PUBLISHED").length;

    const elig = activeSession ? sessionEligibility.filter((e) => e.eligible).length : 0;
    const issued = activeSession ? sessionTickets.length : 0;

    return { totalSessions, planned, published, elig, issued };
  }, [sessions.length, subjects, activeSession, sessionEligibility, sessionTickets]);

  // ---------- create session ----------
  const [newTitle, setNewTitle] = useState("");
  const [newTerm, setNewTerm] = useState("AY 2025–26 • Odd Sem");
  const [newStart, setNewStart] = useState("2025-11-20");
  const [newEnd, setNewEnd] = useState("2025-12-20");

  const addSession = () => {
    const title = newTitle.trim();
    if (!title) return toastMsg("Enter session title.");
    if (!newStart || !newEnd) return toastMsg("Select start/end date.");
    if (new Date(newEnd).getTime() < new Date(newStart).getTime())
      return toastMsg("End date must be after start date.");

    const row: ExamSession = {
      id: uid("sess"),
      title,
      term: newTerm.trim() || "—",
      startDate: newStart,
      endDate: newEnd,
      status: "DRAFT",
      createdAt: ddmmyyyy(),
    };
    const next = [row, ...sessions];
    setSessions(next);
    setSelectedSessionId(row.id);
    setNewTitle("");
    toastMsg("Session created.");
  };

  // ---------- add subject ----------
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subDate, setSubDate] = useState("2025-12-05");
  const [subStart, setSubStart] = useState("09:30");
  const [subEnd, setSubEnd] = useState("12:30");
  const [subBatch, setSubBatch] = useState("CSE A");
  const [subSem, setSubSem] = useState("Sem 5");

  const addSubject = () => {
    if (!activeSession) return toastMsg("Create/select a session first.");
    if (!subCode.trim() || !subName.trim()) return toastMsg("Enter course code & name.");

    if (!inRange(subDate, activeSession.startDate, activeSession.endDate))
      return toastMsg("Exam date must be within session start/end.");

    const row: ExamSubject = {
      id: uid("sub"),
      sessionId: activeSession.id,
      courseCode: subCode.trim().toUpperCase(),
      courseName: subName.trim(),
      examDate: subDate,
      startTime: subStart,
      endTime: subEnd,
      batch: subBatch.trim() || "—",
      semester: subSem.trim() || "—",
      status: "PLANNED",
    };
    setSubjects([row, ...subjects]);
    setTab("subjects");
    setSubCode("");
    setSubName("");
    toastMsg("Subject added.");
  };

  const publishAll = () => {
    if (!activeSession) return toastMsg("Select a session.");
    const next = subjects.map((s) =>
      s.sessionId === activeSession.id ? { ...s, status: "PUBLISHED" as const } : s
    );
    setSubjects(next);
    toastMsg("Published subjects for this session.");
  };

  // ---------- Run agent (demo) ----------
  const [running, setRunning] = useState(false);

  const runSession = async () => {
    if (!activeSession) return toastMsg("Select a session.");
    if (sessionSubjects.length === 0) return toastMsg("Add subjects before running.");

    setRunning(true);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, status: "RUNNING" } : s))
    );

    try {
      // Small delay to feel “processing”
      await new Promise((r) => setTimeout(r, 450));

      // DEMO: compute eligibility (attendance + fee)
      const eligibleRows: EligibilityRow[] = DEMO_STUDENTS.map((st) => {
        const attendancePct = 60 + Math.floor(Math.random() * 41); // 60..100
        const feeStatus: "CLEAR" | "PENDING" = Math.random() > 0.2 ? "CLEAR" : "PENDING";
        const eligible = attendancePct >= 75 && feeStatus === "CLEAR";

        let reason = "Eligible";
        if (attendancePct < 75 && feeStatus !== "CLEAR") reason = "Low attendance & fee pending";
        else if (attendancePct < 75) reason = "Low attendance";
        else if (feeStatus !== "CLEAR") reason = "Fee pending";

        return {
          id: uid("elg"),
          sessionId: activeSession.id,
          regNo: st.regNo,
          name: st.name,
          attendancePct,
          feeStatus,
          eligible,
          reason,
        };
      });

      // DEMO: create hall tickets for eligible
      const rooms = ["B-201", "B-202", "B-203", "C-101", "C-102"];
      const eligibleOnly = eligibleRows.filter((e) => e.eligible);

      const ticketRows: HallTicket[] = eligibleOnly.map((e, idx) => {
        const items: HallTicketItem[] = sessionSubjects.map((sub, j) => ({
          courseCode: sub.courseCode,
          courseName: sub.courseName,
          examDate: sub.examDate,
          startTime: sub.startTime,
          room: rooms[(idx + j) % rooms.length],
          seat: `S-${pad2(((idx + j) % 40) + 1)}`,
        }));

        return {
          id: uid("ht"),
          sessionId: activeSession.id,
          regNo: e.regNo,
          name: e.name,
          issuedAt: ddmmyyyy(),
          items,
        };
      });

      // merge + overwrite current session data (clean old)
      setEligibility((prev) => [
        ...prev.filter((p) => p.sessionId !== activeSession.id),
        ...eligibleRows,
      ]);
      setTickets((prev) => [
        ...prev.filter((p) => p.sessionId !== activeSession.id),
        ...ticketRows,
      ]);

      // set session status to scheduled (demo)
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, status: "SCHEDULED" } : s))
      );

      setRuns((prev) => [
        {
          id: uid("run"),
          sessionId: activeSession.id,
          requestedAt: ddmmyyyy_hhmm(),
          status: "SUCCESS",
          agent: "Examination Agent",
          message: `Run completed: Eligible ${eligibleOnly.length}/${eligibleRows.length}, Hall tickets issued ${ticketRows.length}.`,
        },
        ...prev,
      ]);

      toastMsg("Run completed (demo).");
      setTab("eligibility");
    } catch (e) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, status: "DRAFT" } : s))
      );
      setRuns((prev) => [
        {
          id: uid("run"),
          sessionId: activeSession.id,
          requestedAt: ddmmyyyy_hhmm(),
          status: "FAILED",
          agent: "Examination Agent",
          message: "Run failed. Please try again.",
        },
        ...prev,
      ]);
      toastMsg("Run failed.");
    } finally {
      setRunning(false);
    }
  };

  // ---------- filtering (basic) ----------
  const subjectFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionSubjects;
    return sessionSubjects.filter((x) =>
      `${x.courseCode} ${x.courseName} ${x.examDate} ${x.batch} ${x.semester}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, sessionSubjects]);

  const eligibilityFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionEligibility;
    return sessionEligibility.filter((x) =>
      `${x.regNo} ${x.name} ${x.feeStatus} ${x.attendancePct} ${x.reason}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, sessionEligibility]);

  const ticketFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionTickets;
    return sessionTickets.filter((x) => `${x.regNo} ${x.name}`.toLowerCase().includes(s));
  }, [q, sessionTickets]);

  const sessionFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessions;
    return sessions.filter((x) =>
      `${x.title} ${x.term} ${x.status} ${x.startDate} ${x.endDate}`.toLowerCase().includes(s)
    );
  }, [q, sessions]);

  // ---------- UI atoms ----------
  const AIBadge = ({ label = "AI" }: { label?: string }) => (
    <span
      className={clsx(
        "inline-flex items-center justify-center",
        "px-2 py-0.5 rounded-lg text-[11px] font-extrabold tracking-wide",
        "border border-indigo-200 bg-indigo-50 text-indigo-700",
        "dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
      )}
      title="AI Agent"
    >
      {label}
    </span>
  );

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

  const PrimaryBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      className={clsx(
        "h-10 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white",
        "hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
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
        "active:scale-[0.99] transition shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
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

  const StatusPill = ({ status }: { status: SessionStatus }) => {
    const cls =
      status === "DRAFT"
        ? "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        : status === "SCHEDULED"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
        : status === "RUNNING"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
    return <span className={clsx("text-xs px-2 py-1 rounded-lg border font-semibold", cls)}>{status}</span>;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Examinations</h1>
            <AIBadge label="AI" />
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Create exam sessions, plan subjects, compute eligibility and generate hall tickets.
          </div>

          {lastRun && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Last agent run:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{lastRun.requestedAt}</span>{" "}
              •{" "}
              <span
                className={clsx(
                  "font-semibold",
                  lastRun.status === "SUCCESS"
                    ? "text-indigo-700 dark:text-indigo-200"
                    : "text-amber-800 dark:text-amber-200"
                )}
              >
                {lastRun.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="min-w-[260px]">
            {sessions.length === 0 ? (
              <option value="">No sessions</option>
            ) : (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))
            )}
          </Select>

          <PrimaryBtn type="button" onClick={runSession} disabled={!activeSession || running}>
            <span className="inline-flex items-center gap-2">
              <AIBadge label="AI" />
              {running ? "Running..." : "Run Session"}
            </span>
          </PrimaryBtn>

          <GhostBtn
            type="button"
            onClick={() =>
              downloadJson(`exams_export_${Date.now()}.json`, { sessions, subjects, eligibility, tickets, runs })
            }
          >
            Export
          </GhostBtn>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Sessions", value: kpis.totalSessions },
          { label: "Planned Subjects", value: kpis.planned },
          { label: "Published Subjects", value: kpis.published },
          { label: "Eligible", value: kpis.elig },
          { label: "Hall Tickets", value: kpis.issued },
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

      {/* Main Panel */}
      <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <TabBtn k="sessions">Sessions</TabBtn>
            <TabBtn k="subjects">Subjects</TabBtn>
            <TabBtn k="eligibility">Eligibility</TabBtn>
            <TabBtn k="tickets">Hall Tickets</TabBtn>
            <TabBtn k="runs">Runs</TabBtn>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600 dark:text-slate-300">Search:</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to filter..." className="w-full sm:w-[320px]" />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* SESSIONS */}
          {tab === "sessions" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Create */}
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Create Session</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Use this for end-sem / internal / supplementary sessions.
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Title</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Nov/Dec 2025 – End Semester" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Term</Label>
                      <Input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="AY 2025–26 • Odd Sem" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Start date</div>
                        <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">End date</div>
                        <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={addSession}>Create</PrimaryBtn>
                      <GhostBtn type="button" onClick={() => { setNewTitle(""); toastMsg("Cleared."); }}>Clear</GhostBtn>
                    </div>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">Session</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">Term</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">Dates</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No sessions</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create a session to begin.</div>
                          </td>
                        </tr>
                      ) : (
                        sessionFiltered.map((s) => (
                          <tr
                            key={s.id}
                            className={clsx(
                              "border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition",
                              s.id === selectedSessionId && "bg-indigo-50/40 dark:bg-indigo-500/10"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{s.title}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Created: {s.createdAt}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.term}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{s.startDate} → {s.endDate}</td>
                            <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSessionId(s.id)}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Select
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSessions((prev) => prev.filter((x) => x.id !== s.id));
                                    setSubjects((prev) => prev.filter((x) => x.sessionId !== s.id));
                                    setEligibility((prev) => prev.filter((x) => x.sessionId !== s.id));
                                    setTickets((prev) => prev.filter((x) => x.sessionId !== s.id));
                                    setRuns((prev) => prev.filter((x) => x.sessionId !== s.id));
                                    toastMsg("Deleted session and related data.");
                                  }}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {activeSession && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Active session:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{activeSession.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBJECTS */}
          {tab === "subjects" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Add Subject</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Plan exam slots inside selected session date range.
                  </div>

                  {!activeSession ? (
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">Create/select a session first.</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Course code</Label>
                          <Input value={subCode} onChange={(e) => setSubCode(e.target.value)} placeholder="e.g., CSA1524" />
                        </div>
                        <div>
                          <Label>Exam date</Label>
                          <Input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label>Course name</Label>
                        <Input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Enter course title" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Start time</Label>
                          <Input type="time" value={subStart} onChange={(e) => setSubStart(e.target.value)} />
                        </div>
                        <div>
                          <Label>End time</Label>
                          <Input type="time" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Batch</Label>
                          <Input value={subBatch} onChange={(e) => setSubBatch(e.target.value)} />
                        </div>
                        <div>
                          <Label>Semester</Label>
                          <Input value={subSem} onChange={(e) => setSubSem(e.target.value)} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <PrimaryBtn type="button" onClick={addSubject}>Add</PrimaryBtn>
                        <GhostBtn type="button" onClick={publishAll}>Publish All</GhostBtn>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Course</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">Title</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">Slot</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Batch / Sem</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No subjects for this session</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add subject slots on the left.</div>
                          </td>
                        </tr>
                      ) : (
                        subjectFiltered.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.courseCode}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.courseName}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                              {s.examDate} • {s.startTime}–{s.endTime}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.batch} • {s.semester}</td>
                            <td className="px-4 py-3">
                              <span
                                className={clsx(
                                  "text-xs px-2 py-1 rounded-lg border font-semibold",
                                  s.status === "PUBLISHED"
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                )}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => { setSubjects((prev) => prev.filter((x) => x.id !== s.id)); toastMsg("Deleted subject."); }}
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

                {activeSession && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Tip: Click <span className="font-semibold">Run Session</span> to compute eligibility + generate hall tickets (demo).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ELIGIBILITY */}
          {tab === "eligibility" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Eligibility</div>
                    <AIBadge label="AI" />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Rule: Attendance ≥ 75% and Fee = CLEAR (demo logic).
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`eligibility_${Date.now()}.json`, sessionEligibility)}>
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
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Attendance %</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Fee</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Eligible</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibilityFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No eligibility data</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Click <span className="font-semibold">Run Session</span>.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      eligibilityFiltered.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-900 dark:text-white tabular-nums font-semibold">{e.regNo}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{e.name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{e.attendancePct}</td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                e.feeStatus === "CLEAR"
                                  ? "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                              )}
                            >
                              {e.feeStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                e.eligible
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              )}
                            >
                              {e.eligible ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{e.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HALL TICKETS */}
          {tab === "tickets" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Hall Tickets</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Generated for eligible students (demo).</div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`hall_tickets_${Date.now()}.json`, sessionTickets)}>
                    Download
                  </GhostBtn>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Ticket list */}
                <div className="lg:col-span-5">
                  <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/40">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Student</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Issued</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketFiltered.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center">
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No hall tickets</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Run session to generate.</div>
                            </td>
                          </tr>
                        ) : (
                          ticketFiltered.map((t) => (
                            <tr
                              key={t.id}
                              className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{t.regNo}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{t.name}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{t.issuedAt}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Preview (first ticket)</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Plug this into a PDF generator later if needed.</div>

                    {sessionTickets.length === 0 ? (
                      <div className="mt-4 text-sm text-slate-700 dark:text-slate-200">No ticket available.</div>
                    ) : (
                      <div className="mt-4">
                        {(() => {
                          const t = sessionTickets[0];
                          return (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Hall Ticket</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {activeSession?.title ?? "Session"} • Issued: {t.issuedAt}
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Registration No</div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{t.regNo}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Student</div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</div>
                                  </div>
                                </div>

                                <div className="mt-4 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                                      <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Course</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Title</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Date/Time</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Room</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Seat</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {t.items.map((it, i) => (
                                        <tr key={`${it.courseCode}_${i}`} className="border-b border-slate-200/70 dark:border-slate-800/70">
                                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{it.courseCode}</td>
                                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{it.courseName}</td>
                                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">{it.examDate} • {it.startTime}</td>
                                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">{it.room}</td>
                                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">{it.seat}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <PrimaryBtn type="button" onClick={() => downloadJson(`hall_ticket_${t.regNo}_${Date.now()}.json`, t)}>
                                    Download Ticket
                                  </PrimaryBtn>
                                  <GhostBtn type="button" onClick={() => toastMsg("Wire to PDF later (demo).")}>Print (demo)</GhostBtn>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RUNS */}
          {tab === "runs" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Agent Runs</div>
                    <AIBadge label="AI" />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Operational log for “Run Session” actions.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`exam_runs_${Date.now()}.json`, sessionRuns)}>
                    Download
                  </GhostBtn>
                  <GhostBtn
                    type="button"
                    onClick={() => {
                      setRuns((prev) => prev.filter((r) => r.sessionId !== selectedSessionId));
                      toastMsg("Cleared logs for this session.");
                    }}
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
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">Agent</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[420px]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRuns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No runs yet</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Click <span className="font-semibold">Run Session</span>.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sessionRuns.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{r.requestedAt}</td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-2">
                              <AIBadge label="AI" />
                              <span className="text-slate-700 dark:text-slate-200 font-semibold">{r.agent ?? "Examination Agent"}</span>
                            </div>
                          </td>
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
