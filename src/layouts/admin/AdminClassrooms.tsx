// src/layouts/admin/classrooms/AdminClassrooms.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  SearchIcon,
  Building2Icon,
  DoorOpenIcon,
  UsersIcon,
  Edit3Icon,
  Trash2Icon,
  XIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  FilterIcon,
  RefreshCwIcon,
  SparklesIcon, // ✅ AI symbol
} from "lucide-react";

type RoomType = "LECTURE" | "LAB" | "SEMINAR" | "AUDITORIUM";
type RoomStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

type Classroom = {
  id: string;
  code: string; // e.g., CSE-101
  name: string; // e.g., Smart Classroom 1
  building: string; // e.g., Main Block
  floor: number; // e.g., 3
  capacity: number; // e.g., 60
  type: RoomType;
  status: RoomStatus;
  hasProjector: boolean;
  hasAC: boolean;
  notes?: string;
  updatedAt: string; // ISO
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const LS_KEY = "admin_classrooms_v1";
const LS_AGENT_KEY = "admin_classrooms_agent_last_run_v1";

function isoNow() {
  return new Date().toISOString();
}

function uid(prefix = "room") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeParse<T>(s: string | null, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function fmtDt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// -------------------- Premium Panel --------------------
function Panel({
  title,
  tone = "indigo",
  icon,
  right,
  children,
}: {
  title: string;
  tone?: "teal" | "indigo" | "rose";
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const header =
    tone === "teal"
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600"
      : tone === "indigo"
      ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600"
      : "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500";

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0">
      <div className={cn(header, "px-4 py-3 flex items-center justify-between")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
          {icon}
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// -------------------- UI Bits --------------------
function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1",
        "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
        "dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
        active && "ring-2 ring-indigo-400/70 dark:ring-indigo-300/60"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "transition",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "transition",
        props.className
      )}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm transition text-left",
        "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
      )}
    >
      <span className="inline-flex items-center justify-between w-full">
        <span>{label}</span>
        <span
          className={cn(
            "h-5 w-9 rounded-full border transition relative",
            checked
              ? "bg-indigo-600 border-indigo-600"
              : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
              checked ? "left-[18px]" : "left-0.5"
            )}
          />
        </span>
      </span>
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  leftIcon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99]",
        "bg-slate-900 text-white hover:bg-slate-800",
        "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leftIcon}
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition",
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              aria-label="Close"
            >
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Toast({
  msg,
  tone = "success",
  onClose,
}: {
  msg: string;
  tone?: "success" | "danger";
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[95]">
      <div
        className={cn(
          "rounded-2xl shadow-xl px-4 py-3 ring-1 min-w-[280px]",
          tone === "success"
            ? "bg-indigo-700 text-white ring-white/10"
            : "bg-rose-700 text-white ring-white/10"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
              {tone === "success" ? (
                <CheckCircle2Icon size={16} />
              ) : (
                <AlertTriangleIcon size={16} />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {tone === "success" ? "Done" : "Action Required"}
            </div>
            <div className="text-xs text-white/80 mt-0.5">{msg}</div>
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

// -------------------- Page --------------------
export const AdminClassrooms: React.FC = () => {
  const seed: Classroom[] = useMemo(
    () => [
      {
        id: "room_1",
        code: "CSE-101",
        name: "Smart Classroom 101",
        building: "Main Block",
        floor: 1,
        capacity: 60,
        type: "LECTURE",
        status: "ACTIVE",
        hasProjector: true,
        hasAC: true,
        notes: "Near seminar hall",
        updatedAt: isoNow(),
      },
      {
        id: "room_2",
        code: "CSE-LAB-3",
        name: "Programming Lab 3",
        building: "CSE Block",
        floor: 2,
        capacity: 40,
        type: "LAB",
        status: "ACTIVE",
        hasProjector: false,
        hasAC: true,
        notes: "",
        updatedAt: isoNow(),
      },
      {
        id: "room_3",
        code: "AUD-1",
        name: "Auditorium 1",
        building: "Admin Block",
        floor: 0,
        capacity: 450,
        type: "AUDITORIUM",
        status: "MAINTENANCE",
        hasProjector: true,
        hasAC: true,
        notes: "Sound system upgrade in progress",
        updatedAt: isoNow(),
      },
    ],
    []
  );

  const [rooms, setRooms] = useState<Classroom[]>(() => {
    const stored = safeParse<Classroom[]>(localStorage.getItem(LS_KEY), []);
    return stored.length ? stored : seed;
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(rooms));
  }, [rooms]);

  // ✅ AI agent (demo status)
  const [agentLastRun, setAgentLastRun] = useState<string>(() => {
    const v = localStorage.getItem(LS_AGENT_KEY);
    return v || "";
  });

  const [toast, setToast] = useState<{ msg: string; tone: "success" | "danger" } | null>(
    null
  );

  const runAllocationAgent = () => {
    const t = isoNow();
    localStorage.setItem(LS_AGENT_KEY, t);
    setAgentLastRun(t);
    setToast({
      msg: "Classroom Allocation Agent triggered (demo). In production, this would queue a worker event.",
      tone: "success",
    });
    window.setTimeout(() => setToast(null), 2600);
  };

  // Filters
  const [q, setQ] = useState("");
  const [building, setBuilding] = useState<string>("ALL");
  const [type, setType] = useState<RoomType | "ALL">("ALL");
  const [status, setStatus] = useState<RoomStatus | "ALL">("ALL");
  const [minCap, setMinCap] = useState<number | "">("");
  const [maxCap, setMaxCap] = useState<number | "">("");

  const buildings = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => set.add(r.building));
    return ["ALL", ...Array.from(set).sort()];
  }, [rooms]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rooms.filter((r) => {
      if (building !== "ALL" && r.building !== building) return false;
      if (type !== "ALL" && r.type !== type) return false;
      if (status !== "ALL" && r.status !== status) return false;
      if (minCap !== "" && r.capacity < minCap) return false;
      if (maxCap !== "" && r.capacity > maxCap) return false;

      if (!s) return true;
      return (
        r.code.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.building.toLowerCase().includes(s) ||
        String(r.floor).includes(s) ||
        String(r.capacity).includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s)
      );
    });
  }, [rooms, q, building, type, status, minCap, maxCap]);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm: Omit<Classroom, "id" | "updatedAt"> = {
    code: "",
    name: "",
    building: "Main Block",
    floor: 0,
    capacity: 60,
    type: "LECTURE",
    status: "ACTIVE",
    hasProjector: true,
    hasAC: true,
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (r: Classroom) => {
    setEditId(r.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, updatedAt, ...rest } = r;
    setForm(rest);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const validate = () => {
    if (!form.code.trim()) return "Room Code is required.";
    if (!form.name.trim()) return "Room Name is required.";
    if (!form.building.trim()) return "Building is required.";
    if (!Number.isFinite(form.floor)) return "Floor must be a number.";
    if (!Number.isFinite(form.capacity) || form.capacity <= 0) return "Capacity must be > 0.";
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) {
      setToast({ msg: err, tone: "danger" });
      window.setTimeout(() => setToast(null), 2400);
      return;
    }

    if (editId) {
      setRooms((prev) =>
        prev.map((r) => (r.id === editId ? { ...r, ...form, updatedAt: isoNow() } : r))
      );
      setToast({ msg: `Updated ${form.code} (${form.name})`, tone: "success" });
    } else {
      const next: Classroom = { id: uid("room"), ...form, updatedAt: isoNow() };
      setRooms((prev) => [next, ...prev]);
      setToast({ msg: `Added ${form.code} (${form.name})`, tone: "success" });
    }

    window.setTimeout(() => setToast(null), 2600);
    setFormOpen(false);
  };

  const resetDemo = () => {
    setRooms(seed);
    setToast({ msg: "Reset to demo classrooms.", tone: "success" });
    window.setTimeout(() => setToast(null), 2200);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const r = rooms.find((x) => x.id === deleteId);
    setRooms((prev) => prev.filter((x) => x.id !== deleteId));
    setDeleteId(null);
    setToast({ msg: `Deleted ${r?.code ?? "room"}.`, tone: "success" });
    window.setTimeout(() => setToast(null), 2400);
  };

  const stats = useMemo(() => {
    const total = rooms.length;
    const active = rooms.filter((r) => r.status === "ACTIVE").length;
    const maintenance = rooms.filter((r) => r.status === "MAINTENANCE").length;
    const capacity = rooms.reduce((a, r) => a + r.capacity, 0);
    return { total, active, maintenance, capacity };
  }, [rooms]);

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">
            Classrooms
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Admin console to manage rooms, capacity, availability metadata.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostBtn onClick={runAllocationAgent}>
            <SparklesIcon size={16} />
            Run Allocation Agent
          </GhostBtn>
          <GhostBtn onClick={resetDemo}>
            <RefreshCwIcon size={16} />
            Reset Demo
          </GhostBtn>
          <PrimaryBtn onClick={openAdd} leftIcon={<PlusIcon size={16} />}>
            Add Classroom
          </PrimaryBtn>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Rooms</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.active}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Maintenance</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.maintenance}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Capacity</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.capacity}
          </div>
        </div>

        {/* ✅ Agent card */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">AI Agent</div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200">
              <SparklesIcon size={14} className="text-indigo-500 dark:text-indigo-300" />
              Ready
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Last run:{" "}
            <span className="tabular-nums">
              {agentLastRun ? fmtDt(agentLastRun) : "—"}
            </span>
          </div>

          <button
            type="button"
            onClick={runAllocationAgent}
            className="mt-3 w-full h-9 rounded-xl text-sm font-semibold transition bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Run now
          </button>
        </div>
      </div>

      {/* Filters + Table */}
      <Panel
        title="CLASSROOM DIRECTORY"
        tone="indigo"
        icon={<Building2Icon size={16} className="text-white/95" />}
        right={
          <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
            Showing: {filtered.length}
          </span>
        }
      >
        <div className="space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-4">
              <FieldLabel>Search</FieldLabel>
              <div className="relative mt-1">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search code, name, building, capacity…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Building</FieldLabel>
              <div className="mt-1">
                <Select value={building} onChange={(e) => setBuilding(e.target.value)}>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Type</FieldLabel>
              <div className="mt-1">
                <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="ALL">ALL</option>
                  <option value="LECTURE">LECTURE</option>
                  <option value="LAB">LAB</option>
                  <option value="SEMINAR">SEMINAR</option>
                  <option value="AUDITORIUM">AUDITORIUM</option>
                </Select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Status</FieldLabel>
              <div className="mt-1">
                <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="ALL">ALL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>

            <div className="lg:col-span-1">
              <FieldLabel>Min Cap</FieldLabel>
              <div className="mt-1">
                <Input
                  inputMode="numeric"
                  value={minCap}
                  onChange={(e) =>
                    setMinCap(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <FieldLabel>Max Cap</FieldLabel>
              <div className="mt-1">
                <Input
                  inputMode="numeric"
                  value={maxCap}
                  onChange={(e) =>
                    setMaxCap(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="999"
                />
              </div>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              active={status === "ACTIVE"}
              onClick={() => setStatus(status === "ACTIVE" ? "ALL" : "ACTIVE")}
              icon={<CheckCircle2Icon size={16} />}
            >
              Active
            </Chip>
            <Chip
              active={status === "MAINTENANCE"}
              onClick={() => setStatus(status === "MAINTENANCE" ? "ALL" : "MAINTENANCE")}
              icon={<AlertTriangleIcon size={16} />}
            >
              Maintenance
            </Chip>
            <Chip
              active={type === "LAB"}
              onClick={() => setType(type === "LAB" ? "ALL" : "LAB")}
              icon={<DoorOpenIcon size={16} />}
            >
              Labs
            </Chip>
            <Chip
              active={type === "LECTURE"}
              onClick={() => setType(type === "LECTURE" ? "ALL" : "LECTURE")}
              icon={<UsersIcon size={16} />}
            >
              Lecture
            </Chip>

            <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FilterIcon size={14} />
              Filters apply instantly • stored locally (demo)
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {[
                      "Code",
                      "Room Name",
                      "Building",
                      "Floor",
                      "Type",
                      "Capacity",
                      "Status",
                      "Amenities",
                      "Updated",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        No classrooms found for the current filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={cn(
                          idx % 2 === 0
                            ? "bg-white dark:bg-slate-950"
                            : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25 transition"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {r.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                          {r.name}
                          {r.notes?.trim() ? (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[360px]">
                              {r.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                          {r.building}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">
                          {r.floor}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                          {r.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">
                          {r.capacity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                              r.status === "ACTIVE"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40"
                                : r.status === "MAINTENANCE"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                                : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs",
                                r.hasProjector
                                  ? "text-indigo-700 dark:text-indigo-300"
                                  : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              Projector
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span
                              className={cn(
                                "text-xs",
                                r.hasAC
                                  ? "text-indigo-700 dark:text-indigo-300"
                                  : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              AC
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                          {fmtDt(r.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Edit3Icon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(r.id)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/30 grid place-items-center transition"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2Icon size={16} className="text-rose-600 dark:text-rose-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        title={editId ? "Edit Classroom" : "Add Classroom"}
        subtitle="All fields are stored locally (demo). Wire to API later."
        onClose={closeForm}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Room Code</FieldLabel>
            <div className="mt-1">
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="CSE-101"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Room Name</FieldLabel>
            <div className="mt-1">
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Smart Classroom 101"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Building</FieldLabel>
            <div className="mt-1">
              <Input
                value={form.building}
                onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
                placeholder="Main Block"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Floor</FieldLabel>
            <div className="mt-1">
              <Input
                inputMode="numeric"
                value={form.floor}
                onChange={(e) => setForm((p) => ({ ...p, floor: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Capacity</FieldLabel>
            <div className="mt-1">
              <Input
                inputMode="numeric"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="mt-1">
              <Select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as RoomType }))}
              >
                <option value="LECTURE">LECTURE</option>
                <option value="LAB">LAB</option>
                <option value="SEMINAR">SEMINAR</option>
                <option value="AUDITORIUM">AUDITORIUM</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="mt-1">
              <Select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RoomStatus }))}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Notes (optional)</FieldLabel>
            <div className="mt-1">
              <Input
                value={form.notes ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any helpful notes"
              />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle
              checked={form.hasProjector}
              onChange={(v) => setForm((p) => ({ ...p, hasProjector: v }))}
              label="Projector available"
            />
            <Toggle
              checked={form.hasAC}
              onChange={(v) => setForm((p) => ({ ...p, hasAC: v }))}
              label="AC available"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <GhostBtn onClick={closeForm}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <PrimaryBtn onClick={save} leftIcon={<CheckCircle2Icon size={16} />}>
              Save
            </PrimaryBtn>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteId}
        title="Delete Classroom"
        subtitle="This will remove the room from the local list (demo)."
        onClose={() => setDeleteId(null)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Confirm delete?
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              You can re-add later. For production, wire this to your Admin API.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <GhostBtn onClick={() => setDeleteId(null)}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <button
              type="button"
              onClick={confirmDelete}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2Icon size={16} />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminClassrooms;
