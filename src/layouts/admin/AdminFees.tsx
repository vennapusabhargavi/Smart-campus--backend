// src/layouts/admin/fees/AdminFees.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  SearchIcon,
  ReceiptIcon,
  WalletIcon,
  BadgePercentIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XIcon,
  Trash2Icon,
  Edit3Icon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  BotIcon, // ✅ AI symbol
} from "lucide-react";

type FeeStatus = "CLEAR" | "DUE" | "OVERDUE";
type PaymentStatus = "SUCCESS" | "PENDING" | "FAILED";

type FeeCategory = {
  id: string;
  name: string; // e.g., Tuition, Hostel, Exam, Transport
  description?: string;
  isActive: boolean;
  updatedAt: string;
};

type FeeStructure = {
  id: string;
  categoryId: string;
  program: string; // e.g., CSE / AI&ML
  year: string; // e.g., "1", "2", "3", "4"
  semester: string; // e.g., "1", "2"
  amount: number;
  dueDate: string; // ISO date (YYYY-MM-DD)
  finePerDay: number;
  isActive: boolean;
  updatedAt: string;
};

type StudentFeeAccount = {
  id: string;
  regNo: string;
  studentName: string;
  program: string;
  year: string;
  totalPayable: number;
  paid: number;
  due: number;
  status: FeeStatus;
  updatedAt: string;
};

type Payment = {
  id: string;
  regNo: string;
  studentName: string;
  amount: number;
  method: "ONLINE" | "CASH" | "BANK";
  refNo: string;
  status: PaymentStatus;
  paidOn: string; // ISO
};

type AgentRunStatus = "COMPLETED" | "RUNNING" | "FAILED";
type AgentRun = {
  id: string;
  agent: "FinanceAgent";
  status: AgentRunStatus;
  title: string;
  details: string;
  ranAt: string; // ISO
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const LS_KEY = "admin_fees_v2"; // ✅ bump key because store shape changed
const AGENT_LAST_RUN_KEY = "admin_fees_agent_last_run_day_v1";

function isoNow() {
  return new Date().toISOString();
}
function uid(prefix: string) {
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
function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

// -------------------- Premium Panel --------------------
function Panel({
  title,
  tone = "teal",
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
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600"
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
  return <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{children}</div>;
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

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">{title}</div>
              {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>}
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
          tone === "success" ? "bg-emerald-700 text-white ring-white/10" : "bg-rose-700 text-white ring-white/10"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
              {tone === "success" ? <CheckCircle2Icon size={16} /> : <AlertTriangleIcon size={16} />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{tone === "success" ? "Saved" : "Action Required"}</div>
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

// --------------- CSV Export (demo) ---------------
function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- Page --------------------
export const AdminFees: React.FC = () => {
  // ---- demo seed data (replace with API later) ----
  const seedCategories: FeeCategory[] = useMemo(
    () => [
      { id: "cat_1", name: "Tuition", description: "Semester tuition fees", isActive: true, updatedAt: isoNow() },
      { id: "cat_2", name: "Exam", description: "Exam application fees", isActive: true, updatedAt: isoNow() },
      { id: "cat_3", name: "Hostel", description: "Hostel & mess fees", isActive: true, updatedAt: isoNow() },
      { id: "cat_4", name: "Transport", description: "Bus/transport fees", isActive: false, updatedAt: isoNow() },
    ],
    []
  );

  const seedStructures: FeeStructure[] = useMemo(
    () => [
      {
        id: "fs_1",
        categoryId: "cat_1",
        program: "CSE",
        year: "1",
        semester: "1",
        amount: 65000,
        dueDate: "2025-06-20",
        finePerDay: 50,
        isActive: true,
        updatedAt: isoNow(),
      },
      {
        id: "fs_2",
        categoryId: "cat_2",
        program: "CSE",
        year: "1",
        semester: "1",
        amount: 1500,
        dueDate: "2025-07-05",
        finePerDay: 0,
        isActive: true,
        updatedAt: isoNow(),
      },
      {
        id: "fs_3",
        categoryId: "cat_3",
        program: "AI&ML",
        year: "2",
        semester: "3",
        amount: 42000,
        dueDate: "2025-06-25",
        finePerDay: 30,
        isActive: true,
        updatedAt: isoNow(),
      },
    ],
    []
  );

  const seedAccounts: StudentFeeAccount[] = useMemo(
    () => [
      {
        id: "acc_1",
        regNo: "192325021",
        studentName: "STUDENT A",
        program: "CSE",
        year: "1",
        totalPayable: 66500,
        paid: 66500,
        due: 0,
        status: "CLEAR",
        updatedAt: isoNow(),
      },
      {
        id: "acc_2",
        regNo: "192372052",
        studentName: "STUDENT B",
        program: "CSE",
        year: "1",
        totalPayable: 66500,
        paid: 35000,
        due: 31500,
        status: "DUE",
        updatedAt: isoNow(),
      },
      {
        id: "acc_3",
        regNo: "192372044",
        studentName: "STUDENT C",
        program: "AI&ML",
        year: "2",
        totalPayable: 42000,
        paid: 0,
        due: 42000,
        status: "OVERDUE",
        updatedAt: isoNow(),
      },
    ],
    []
  );

  const seedPayments: Payment[] = useMemo(
    () => [
      {
        id: "pay_1",
        regNo: "192325021",
        studentName: "STUDENT A",
        amount: 66500,
        method: "ONLINE",
        refNo: "TXN-9A2K31",
        status: "SUCCESS",
        paidOn: isoNow(),
      },
      {
        id: "pay_2",
        regNo: "192372052",
        studentName: "STUDENT B",
        amount: 35000,
        method: "BANK",
        refNo: "NEFT-2025-1122",
        status: "SUCCESS",
        paidOn: isoNow(),
      },
      {
        id: "pay_3",
        regNo: "192372044",
        studentName: "STUDENT C",
        amount: 42000,
        method: "ONLINE",
        refNo: "TXN-FAIL-2X8",
        status: "FAILED",
        paidOn: isoNow(),
      },
    ],
    []
  );

  type Store = {
    categories: FeeCategory[];
    structures: FeeStructure[];
    accounts: StudentFeeAccount[];
    payments: Payment[];
    agentRuns: AgentRun[];
    lastAgentRunAt?: string; // ISO
  };

  const [store, setStore] = useState<Store>(() => {
    const saved = safeParse<Store>(localStorage.getItem(LS_KEY), null as any);
    if (saved && saved.categories && saved.structures && saved.accounts && saved.payments) {
      return {
        ...saved,
        agentRuns: Array.isArray((saved as any).agentRuns) ? (saved as any).agentRuns : [],
        lastAgentRunAt: (saved as any).lastAgentRunAt ?? undefined,
      };
    }
    return {
      categories: seedCategories,
      structures: seedStructures,
      accounts: seedAccounts,
      payments: seedPayments,
      agentRuns: [],
      lastAgentRunAt: undefined,
    };
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  }, [store]);

  type Tab = "Overview" | "Categories" | "Structures" | "Student Accounts" | "Payments";
  const [tab, setTab] = useState<Tab>("Overview");

  const categoriesById = useMemo(() => {
    const m = new Map<string, FeeCategory>();
    store.categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [store.categories]);

  // ---------- Toast ----------
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "danger" } | null>(null);
  const showToast = (msg: string, tone: "success" | "danger" = "success") => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  // ---------- Reset ----------
  const resetDemo = () => {
    const next: Store = {
      categories: seedCategories,
      structures: seedStructures,
      accounts: seedAccounts,
      payments: seedPayments,
      agentRuns: [],
      lastAgentRunAt: undefined,
    };
    setStore(next);
    showToast("Reset to demo fee data.");
  };

  // ---------- Filters ----------
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const baseSearch = q.trim().toLowerCase();

  // ---------- Category form ----------
  const catEmpty: Omit<FeeCategory, "id" | "updatedAt"> = { name: "", description: "", isActive: true };
  const [catForm, setCatForm] = useState(catEmpty);

  // ---------- Structure form ----------
  const fsEmpty: Omit<FeeStructure, "id" | "updatedAt"> = {
    categoryId: store.categories[0]?.id ?? "cat_1",
    program: "CSE",
    year: "1",
    semester: "1",
    amount: 0,
    dueDate: "2025-07-01",
    finePerDay: 0,
    isActive: true,
  };
  const [fsForm, setFsForm] = useState(fsEmpty);

  useEffect(() => {
    if (!store.categories.some((c) => c.id === fsForm.categoryId)) {
      setFsForm((p) => ({ ...p, categoryId: store.categories[0]?.id ?? p.categoryId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.categories]);

  // ---------- Payment form ----------
  const payEmpty: Omit<Payment, "id"> = {
    regNo: "",
    studentName: "",
    amount: 0,
    method: "ONLINE",
    refNo: "",
    status: "SUCCESS",
    paidOn: isoNow(),
  };
  const [payForm, setPayForm] = useState(payEmpty);

  // ---------- Modal state ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<"CATEGORY" | "STRUCTURE" | "PAYMENT">("CATEGORY");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<{ kind: "CATEGORY" | "STRUCTURE" | "PAYMENT"; id: string } | null>(null);

  // ---------- Open handlers ----------
  const openAddCategory = () => {
    setModalKind("CATEGORY");
    setEditId(null);
    setCatForm(catEmpty);
    setModalOpen(true);
  };
  const openEditCategory = (c: FeeCategory) => {
    setModalKind("CATEGORY");
    setEditId(c.id);
    setCatForm({ name: c.name, description: c.description ?? "", isActive: c.isActive });
    setModalOpen(true);
  };

  const openAddStructure = () => {
    setModalKind("STRUCTURE");
    setEditId(null);
    setFsForm({
      ...fsEmpty,
      categoryId: store.categories[0]?.id ?? fsEmpty.categoryId,
    });
    setModalOpen(true);
  };
  const openEditStructure = (s: FeeStructure) => {
    setModalKind("STRUCTURE");
    setEditId(s.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, updatedAt, ...rest } = s;
    setFsForm(rest);
    setModalOpen(true);
  };

  const openAddPayment = () => {
    setModalKind("PAYMENT");
    setEditId(null);
    setPayForm({ ...payEmpty, paidOn: isoNow() });
    setModalOpen(true);
  };
  const openEditPayment = (p: Payment) => {
    setModalKind("PAYMENT");
    setEditId(p.id);
    setPayForm({ ...p });
    setModalOpen(true);
  };

  // ---------- Save handlers ----------
  const closeModal = () => setModalOpen(false);

  const saveCategory = () => {
    if (!catForm.name.trim()) return showToast("Category name is required.", "danger");

    if (editId) {
      setStore((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === editId ? { ...c, ...catForm, updatedAt: isoNow() } : c)),
      }));
      showToast(`Updated category: ${catForm.name}`);
    } else {
      const next: FeeCategory = { id: uid("cat"), ...catForm, updatedAt: isoNow() };
      setStore((prev) => ({ ...prev, categories: [next, ...prev.categories] }));
      showToast(`Added category: ${catForm.name}`);
    }
    setModalOpen(false);
  };

  const saveStructure = () => {
    if (!fsForm.categoryId) return showToast("Category is required.", "danger");
    if (!fsForm.program.trim()) return showToast("Program is required.", "danger");
    if (!fsForm.year.trim()) return showToast("Year is required.", "danger");
    if (!fsForm.semester.trim()) return showToast("Semester is required.", "danger");
    if (!Number.isFinite(fsForm.amount) || fsForm.amount < 0) return showToast("Amount must be >= 0.", "danger");
    if (!fsForm.dueDate.trim()) return showToast("Due Date is required.", "danger");
    if (!Number.isFinite(fsForm.finePerDay) || fsForm.finePerDay < 0) return showToast("Fine/day must be >= 0.", "danger");

    if (editId) {
      setStore((prev) => ({
        ...prev,
        structures: prev.structures.map((s) => (s.id === editId ? { ...s, ...fsForm, updatedAt: isoNow() } : s)),
      }));
      showToast("Updated fee structure.");
    } else {
      const next: FeeStructure = { id: uid("fs"), ...fsForm, updatedAt: isoNow() };
      setStore((prev) => ({ ...prev, structures: [next, ...prev.structures] }));
      showToast("Added fee structure.");
    }
    setModalOpen(false);
  };

  // ✅ Fine policy is applied deterministically (no “suggested”, actually executed by agent)
  const recomputeAccount = (acc: StudentFeeAccount, allStructures: FeeStructure[]) => {
    const relevant = allStructures.filter((s) => s.isActive && s.program === acc.program && s.year === acc.year);

    const baseTotal = relevant.reduce((a, s) => a + s.amount, 0);
    const paid = Math.min(acc.paid, baseTotal);
    const baseDue = Math.max(0, baseTotal - paid);

    const now = new Date();
    const isOverdue = relevant.some((s) => new Date(s.dueDate + "T23:59:59") < now);

    // Fine applies only when there is unpaid amount
    let fine = 0;
    if (baseDue > 0) {
      for (const s of relevant) {
        if (!s.finePerDay || s.finePerDay <= 0) continue;
        const dueEnd = new Date(s.dueDate + "T23:59:59");
        if (dueEnd < now) {
          const daysLate = Math.floor((now.getTime() - dueEnd.getTime()) / 86400000);
          fine += Math.max(0, daysLate) * s.finePerDay;
        }
      }
    }

    const totalPayable = baseTotal + fine;
    const due = Math.max(0, totalPayable - paid);

    let status: FeeStatus = "CLEAR";
    if (due > 0) status = isOverdue ? "OVERDUE" : "DUE";

    return { ...acc, totalPayable, paid, due, status, updatedAt: isoNow() };
  };

  const savePayment = () => {
    if (!payForm.regNo.trim()) return showToast("Reg No is required.", "danger");
    if (!payForm.studentName.trim()) return showToast("Student Name is required.", "danger");
    if (!Number.isFinite(payForm.amount) || payForm.amount <= 0) return showToast("Amount must be > 0.", "danger");
    if (!payForm.refNo.trim()) return showToast("Reference No is required.", "danger");
    if (!payForm.paidOn.trim()) return showToast("Paid On is required.", "danger");

    if (editId) {
      setStore((prev) => {
        const nextPayments = prev.payments.map((p) => (p.id === editId ? { ...payForm, id: editId } : p));

        let nextAccounts = prev.accounts;
        if (payForm.status === "SUCCESS") {
          const idx = nextAccounts.findIndex((a) => a.regNo === payForm.regNo);
          if (idx >= 0) {
            const acc = nextAccounts[idx];
            const updated = recomputeAccount({ ...acc, paid: acc.paid + payForm.amount }, prev.structures);
            nextAccounts = [...nextAccounts.slice(0, idx), updated, ...nextAccounts.slice(idx + 1)];
          }
        }

        return { ...prev, payments: nextPayments, accounts: nextAccounts };
      });
      showToast("Updated payment.");
    } else {
      const next: Payment = { id: uid("pay"), ...payForm };
      setStore((prev) => {
        let nextAccounts = prev.accounts;

        if (next.status === "SUCCESS") {
          const idx = nextAccounts.findIndex((a) => a.regNo === next.regNo);
          if (idx >= 0) {
            const acc = nextAccounts[idx];
            const updated = recomputeAccount({ ...acc, paid: acc.paid + next.amount }, prev.structures);
            nextAccounts = [...nextAccounts.slice(0, idx), updated, ...nextAccounts.slice(idx + 1)];
          } else {
            const created: StudentFeeAccount = recomputeAccount(
              {
                id: uid("acc"),
                regNo: next.regNo,
                studentName: next.studentName,
                program: "CSE",
                year: "1",
                totalPayable: 0,
                paid: next.amount,
                due: 0,
                status: "CLEAR",
                updatedAt: isoNow(),
              },
              prev.structures
            );
            nextAccounts = [created, ...nextAccounts];
          }
        }

        return { ...prev, payments: [next, ...prev.payments], accounts: nextAccounts };
      });
      showToast("Recorded payment.");
    }

    setModalOpen(false);
  };

  const saveModal = () => {
    if (modalKind === "CATEGORY") return saveCategory();
    if (modalKind === "STRUCTURE") return saveStructure();
    return savePayment();
  };

  // ---------- Delete ----------
  const confirmDelete = () => {
    if (!deleteId) return;
    const { kind, id } = deleteId;

    if (kind === "CATEGORY") {
      const usedBy = store.structures.some((s) => s.categoryId === id);
      if (usedBy) {
        showToast("Cannot delete: Category is used by a Fee Structure.", "danger");
        setDeleteId(null);
        return;
      }
      setStore((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== id) }));
      showToast("Deleted category.");
    }

    if (kind === "STRUCTURE") {
      setStore((p) => ({ ...p, structures: p.structures.filter((s) => s.id !== id) }));
      showToast("Deleted structure.");
    }

    if (kind === "PAYMENT") {
      setStore((p) => ({ ...p, payments: p.payments.filter((x) => x.id !== id) }));
      showToast("Deleted payment.");
    }

    setDeleteId(null);
  };

  // ---------- Recalc ----------
  const recalcAllAccounts = () => {
    setStore((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => recomputeAccount(a, prev.structures)),
    }));
    showToast("Recalculated student fee accounts.");
  };

  // ---------- Finance Agent (automation) ----------
  const runFinanceAgent = () => {
    setStore((prev) => {
      const nextAccounts = prev.accounts.map((a) => recomputeAccount(a, prev.structures));
      const now = new Date();

      const overdueCount = nextAccounts.filter((a) => a.status === "OVERDUE").length;
      const activePastDue = prev.structures.filter((s) => s.isActive && new Date(s.dueDate + "T23:59:59") < now);
      const inactiveCats = prev.categories.filter((c) => !c.isActive).map((c) => c.name);

      const pushRun = (title: string, details: string, status: AgentRunStatus = "COMPLETED"): AgentRun => ({
        id: uid("run"),
        agent: "FinanceAgent",
        status,
        title,
        details,
        ranAt: isoNow(),
      });

      const runs: AgentRun[] = [
        pushRun(
          "Reminders dispatched for OVERDUE accounts",
          overdueCount > 0
            ? `Queued reminders for ${overdueCount} overdue account(s) via Notifications service (demo log).`
            : "No overdue accounts found — nothing to notify."
        ),
        pushRun(
          "Fine policy applied where applicable",
          "Recalculated accounts and applied late fines deterministically using structure due dates and fine/day (only when unpaid dues exist)."
        ),
        pushRun(
          "Due dates reviewed for active structures",
          activePastDue.length > 0
            ? `Flagged ${activePastDue.length} active structure(s) with past due dates for schedule review (demo log).`
            : "No active structures past due date."
        ),
        pushRun(
          "Inactive categories audited",
          inactiveCats.length > 0 ? `Inactive categories: ${inactiveCats.join(", ")}.` : "No inactive categories."
        ),
      ];

      const latestAt = runs[0]?.ranAt ?? isoNow();

      return {
        ...prev,
        accounts: nextAccounts,
        agentRuns: [...runs, ...(prev.agentRuns ?? [])].slice(0, 24),
        lastAgentRunAt: latestAt,
      };
    });

    showToast("Finance Agent completed automated reconciliation.");
  };

  // Auto-run once per day (demo behavior)
  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(AGENT_LAST_RUN_KEY);
    if (last !== day) {
      localStorage.setItem(AGENT_LAST_RUN_KEY, day);
      runFinanceAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Derived lists ----------
  const filteredCategories = useMemo(() => {
    return store.categories
      .filter((c) => (!onlyActive ? true : c.isActive))
      .filter((c) => {
        if (!baseSearch) return true;
        return c.name.toLowerCase().includes(baseSearch) || (c.description ?? "").toLowerCase().includes(baseSearch);
      });
  }, [store.categories, baseSearch, onlyActive]);

  const filteredStructures = useMemo(() => {
    return store.structures
      .filter((s) => (!onlyActive ? true : s.isActive))
      .filter((s) => {
        if (!baseSearch) return true;
        const cat = categoriesById.get(s.categoryId)?.name ?? "";
        return (
          s.program.toLowerCase().includes(baseSearch) ||
          s.year.toLowerCase().includes(baseSearch) ||
          s.semester.toLowerCase().includes(baseSearch) ||
          String(s.amount).includes(baseSearch) ||
          s.dueDate.toLowerCase().includes(baseSearch) ||
          cat.toLowerCase().includes(baseSearch)
        );
      });
  }, [store.structures, baseSearch, onlyActive, categoriesById]);

  const filteredAccounts = useMemo(() => {
    return store.accounts.filter((a) => {
      if (!baseSearch) return true;
      return (
        a.regNo.toLowerCase().includes(baseSearch) ||
        a.studentName.toLowerCase().includes(baseSearch) ||
        a.program.toLowerCase().includes(baseSearch) ||
        a.year.toLowerCase().includes(baseSearch) ||
        a.status.toLowerCase().includes(baseSearch)
      );
    });
  }, [store.accounts, baseSearch]);

  const filteredPayments = useMemo(() => {
    return store.payments.filter((p) => {
      if (!baseSearch) return true;
      return (
        p.regNo.toLowerCase().includes(baseSearch) ||
        p.studentName.toLowerCase().includes(baseSearch) ||
        p.method.toLowerCase().includes(baseSearch) ||
        p.refNo.toLowerCase().includes(baseSearch) ||
        p.status.toLowerCase().includes(baseSearch)
      );
    });
  }, [store.payments, baseSearch]);

  // ---------- Overview KPIs ----------
  const kpi = useMemo(() => {
    const totalStudents = store.accounts.length;
    const totalPayable = store.accounts.reduce((a, x) => a + x.totalPayable, 0);
    const totalPaid = store.accounts.reduce((a, x) => a + x.paid, 0);
    const totalDue = store.accounts.reduce((a, x) => a + x.due, 0);
    const overdue = store.accounts.filter((a) => a.status === "OVERDUE").length;
    const due = store.accounts.filter((a) => a.status === "DUE").length;
    return { totalStudents, totalPayable, totalPaid, totalDue, overdue, due };
  }, [store.accounts]);

  // ---------- Status Pill ----------
  function StatusPill({ status }: { status: FeeStatus | PaymentStatus }) {
    const base = "inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border";
    const cls =
      status === "CLEAR" || status === "SUCCESS"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
        : status === "DUE" || status === "PENDING"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/35 dark:text-rose-200 dark:border-rose-900/40";
    return <span className={cn(base, cls)}>{status}</span>;
  }

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">Fees & Finance</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Admin fee setup, student accounts, payments and reconciliation (demo-ready, local storage).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostBtn onClick={resetDemo}>
            <RefreshCwIcon size={16} />
            Reset Demo
          </GhostBtn>

          {tab === "Categories" && (
            <PrimaryBtn onClick={openAddCategory} leftIcon={<PlusIcon size={16} />}>
              Add Category
            </PrimaryBtn>
          )}

          {tab === "Structures" && (
            <PrimaryBtn onClick={openAddStructure} leftIcon={<PlusIcon size={16} />}>
              Add Structure
            </PrimaryBtn>
          )}

          {tab === "Payments" && (
            <PrimaryBtn onClick={openAddPayment} leftIcon={<PlusIcon size={16} />}>
              Record Payment
            </PrimaryBtn>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Students</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{kpi.totalStudents}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Payable</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">₹{fmtMoney(kpi.totalPayable)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Paid</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">₹{fmtMoney(kpi.totalPaid)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Due</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">₹{fmtMoney(kpi.totalDue)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Overdue</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{kpi.overdue}</div>
        </div>
      </div>

      {/* Tabs + global search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={tab === "Overview"} onClick={() => setTab("Overview")} icon={<WalletIcon size={16} />}>
            Overview
          </Chip>
          <Chip active={tab === "Categories"} onClick={() => setTab("Categories")} icon={<BadgePercentIcon size={16} />}>
            Fee Categories
          </Chip>
          <Chip active={tab === "Structures"} onClick={() => setTab("Structures")} icon={<ReceiptIcon size={16} />}>
            Fee Structures
          </Chip>
          <Chip active={tab === "Student Accounts"} onClick={() => setTab("Student Accounts")} icon={<WalletIcon size={16} />}>
            Student Accounts
          </Chip>
          <Chip active={tab === "Payments"} onClick={() => setTab("Payments")} icon={<ReceiptIcon size={16} />}>
            Payments
          </Chip>
        </div>

        <div className="lg:ml-auto flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
              <FilterIcon size={14} />
              Active only
            </div>
            <button
              type="button"
              onClick={() => setOnlyActive((v) => !v)}
              className={cn(
                "h-10 px-3 rounded-xl text-sm font-semibold border transition",
                onlyActive
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
              )}
            >
              {onlyActive ? "ON" : "OFF"}
            </button>
          </div>

          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in current tab…" className="pl-9 w-[260px]" />
          </div>

          {tab === "Student Accounts" && (
            <PrimaryBtn onClick={recalcAllAccounts} leftIcon={<RefreshCwIcon size={16} />}>
              Recalc Accounts
            </PrimaryBtn>
          )}

          {tab !== "Overview" && (
            <GhostBtn
              onClick={() => {
                if (tab === "Categories") {
                  downloadCsv(
                    "fee_categories.csv",
                    filteredCategories.map((c) => ({
                      name: c.name,
                      description: c.description ?? "",
                      active: c.isActive ? "YES" : "NO",
                      updated_at: c.updatedAt,
                    }))
                  );
                  return;
                }
                if (tab === "Structures") {
                  downloadCsv(
                    "fee_structures.csv",
                    filteredStructures.map((s) => ({
                      category: categoriesById.get(s.categoryId)?.name ?? "",
                      program: s.program,
                      year: s.year,
                      semester: s.semester,
                      amount: s.amount,
                      due_date: s.dueDate,
                      fine_per_day: s.finePerDay,
                      active: s.isActive ? "YES" : "NO",
                      updated_at: s.updatedAt,
                    }))
                  );
                  return;
                }
                if (tab === "Student Accounts") {
                  downloadCsv(
                    "student_fee_accounts.csv",
                    filteredAccounts.map((a) => ({
                      reg_no: a.regNo,
                      student: a.studentName,
                      program: a.program,
                      year: a.year,
                      total_payable: a.totalPayable,
                      paid: a.paid,
                      due: a.due,
                      status: a.status,
                      updated_at: a.updatedAt,
                    }))
                  );
                  return;
                }
                if (tab === "Payments") {
                  downloadCsv(
                    "payments.csv",
                    filteredPayments.map((p) => ({
                      reg_no: p.regNo,
                      student: p.studentName,
                      amount: p.amount,
                      method: p.method,
                      ref_no: p.refNo,
                      status: p.status,
                      paid_on: p.paidOn,
                    }))
                  );
                }
              }}
            >
              <DownloadIcon size={16} />
              Export CSV
            </GhostBtn>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {tab === "Overview" && (
        <Panel
          title="FINANCE SNAPSHOT"
          tone="indigo"
          icon={<WalletIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Updated: {fmtDt(isoNow())}
            </span>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Structures summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Active Fee Structures</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Program/year based mapping (demo). In production: map by student batch, category, scholarship, etc.
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[640px] w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                      {["Category", "Program", "Year", "Sem", "Amount", "Due Date", "Active"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {store.structures
                      .slice()
                      .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
                      .slice(0, 6)
                      .map((s, idx) => (
                        <tr
                          key={s.id}
                          className={cn(
                            idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                            "border-b border-slate-200/70 dark:border-slate-800/70"
                          )}
                        >
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100">{categoriesById.get(s.categoryId)?.name ?? "—"}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100">{s.program}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.year}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.semester}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(s.amount)}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.dueDate}</td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                                s.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                              )}
                            >
                              {s.isActive ? "YES" : "NO"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {store.structures.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                          No structures found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accounts summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Accounts Status</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quick view of CLEAR / DUE / OVERDUE.</div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">CLEAR</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                    {store.accounts.filter((a) => a.status === "CLEAR").length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">DUE</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                    {store.accounts.filter((a) => a.status === "DUE").length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">OVERDUE</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                    {store.accounts.filter((a) => a.status === "OVERDUE").length}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Net Collection</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paid vs Payable snapshot (demo).</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    Paid: <span className="font-semibold tabular-nums">₹{fmtMoney(kpi.totalPaid)}</span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    Payable: <span className="font-semibold tabular-nums">₹{fmtMoney(kpi.totalPayable)}</span>
                  </div>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{
                      width: kpi.totalPayable <= 0 ? "0%" : `${Math.min(100, Math.round((kpi.totalPaid / kpi.totalPayable) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Collection:{" "}
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {kpi.totalPayable <= 0 ? 0 : Math.round((kpi.totalPaid / kpi.totalPayable) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Automation Center (NOT suggested actions) */}
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center bg-slate-50 dark:bg-slate-900/30">
                    <BotIcon size={16} className="text-slate-700 dark:text-slate-200" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Automation Center</div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  FinanceAgent auto-runs reconciliation: reminders, fine policy, due-date review, inactive category audit.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                  Status: ACTIVE
                </span>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                  Last run: {store.lastAgentRunAt ? fmtDt(store.lastAgentRunAt) : "—"}
                </span>
                <GhostBtn onClick={runFinanceAgent}>
                  <RefreshCwIcon size={16} />
                  Run now
                </GhostBtn>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="max-h-[260px] overflow-auto">
                {store.agentRuns.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No agent runs logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {store.agentRuns.slice(0, 10).map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 h-9 w-9 rounded-xl grid place-items-center border",
                            r.status === "COMPLETED"
                              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/35 dark:border-emerald-900/40"
                              : r.status === "RUNNING"
                              ? "bg-amber-50 border-amber-200 dark:bg-amber-950/35 dark:border-amber-900/40"
                              : "bg-rose-50 border-rose-200 dark:bg-rose-950/35 dark:border-rose-900/40"
                          )}
                        >
                          {r.status === "COMPLETED" ? (
                            <CheckCircle2Icon size={16} className="text-emerald-700 dark:text-emerald-200" />
                          ) : r.status === "RUNNING" ? (
                            <RefreshCwIcon size={16} className="text-amber-700 dark:text-amber-200" />
                          ) : (
                            <AlertTriangleIcon size={16} className="text-rose-700 dark:text-rose-200" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.title}</div>
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                              <BotIcon size={14} />
                              {r.agent}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{fmtDt(r.ranAt)}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{r.details}</div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border",
                              r.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                                : r.status === "RUNNING"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/35 dark:text-rose-200 dark:border-rose-900/40"
                            )}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === "Categories" && (
        <Panel
          title="FEE CATEGORIES"
          tone="teal"
          icon={<BadgePercentIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Rows: {filteredCategories.length}
            </span>
          }
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {["Name", "Description", "Active", "Updated", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{c.description || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                              c.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                                : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                            )}
                          >
                            {c.isActive ? "YES" : "NO"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">{fmtDt(c.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCategory(c)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Edit3Icon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId({ kind: "CATEGORY", id: c.id })}
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
        </Panel>
      )}

      {tab === "Structures" && (
        <Panel
          title="FEE STRUCTURES"
          tone="indigo"
          icon={<ReceiptIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Rows: {filteredStructures.length}
            </span>
          }
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1150px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {["Category", "Program", "Year", "Semester", "Amount", "Due Date", "Fine/Day", "Active", "Updated", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStructures.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No structures found.
                      </td>
                    </tr>
                  ) : (
                    filteredStructures.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70"
                        )}
                      >
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{categoriesById.get(s.categoryId)?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{s.program}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.year}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.semester}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(s.amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{s.dueDate}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(s.finePerDay)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                              s.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                                : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                            )}
                          >
                            {s.isActive ? "YES" : "NO"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">{fmtDt(s.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditStructure(s)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Edit3Icon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId({ kind: "STRUCTURE", id: s.id })}
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
        </Panel>
      )}

      {tab === "Student Accounts" && (
        <Panel
          title="STUDENT FEE ACCOUNTS"
          tone="teal"
          icon={<WalletIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Rows: {filteredAccounts.length}
            </span>
          }
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {["Reg No", "Student", "Program", "Year", "Total", "Paid", "Due", "Status", "Updated"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((a, idx) => (
                      <tr
                        key={a.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{a.regNo}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{a.studentName}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{a.program}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{a.year}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(a.totalPayable)}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(a.paid)}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(a.due)}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={a.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">{fmtDt(a.updatedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {tab === "Payments" && (
        <Panel
          title="PAYMENTS"
          tone="indigo"
          icon={<ReceiptIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Rows: {filteredPayments.length}
            </span>
          }
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {["Reg No", "Student", "Amount", "Method", "Reference", "Status", "Paid On", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.regNo}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{p.studentName}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">₹{fmtMoney(p.amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{p.method}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{p.refNo}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">{fmtDt(p.paidOn)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditPayment(p)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Edit3Icon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId({ kind: "PAYMENT", id: p.id })}
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
        </Panel>
      )}

      {/* Unified Modal */}
      <Modal
        open={modalOpen}
        title={
          modalKind === "CATEGORY"
            ? editId
              ? "Edit Fee Category"
              : "Add Fee Category"
            : modalKind === "STRUCTURE"
            ? editId
              ? "Edit Fee Structure"
              : "Add Fee Structure"
            : editId
            ? "Edit Payment"
            : "Record Payment"
        }
        subtitle="Demo page: saves to localStorage. Replace with API calls later."
        onClose={closeModal}
      >
        {modalKind === "CATEGORY" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Category Name</FieldLabel>
              <div className="mt-1">
                <Input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tuition" />
              </div>
            </div>

            <div>
              <FieldLabel>Active</FieldLabel>
              <div className="mt-1">
                <Select value={catForm.isActive ? "YES" : "NO"} onChange={(e) => setCatForm((p) => ({ ...p, isActive: e.target.value === "YES" }))}>
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Description (optional)</FieldLabel>
              <div className="mt-1">
                <Input value={catForm.description ?? ""} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} placeholder="Semester tuition fees" />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <GhostBtn onClick={closeModal}>
                <XIcon size={16} />
                Cancel
              </GhostBtn>
              <PrimaryBtn onClick={saveModal} leftIcon={<CheckCircle2Icon size={16} />}>
                Save
              </PrimaryBtn>
            </div>
          </div>
        )}

        {modalKind === "STRUCTURE" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <FieldLabel>Category</FieldLabel>
              <div className="mt-1">
                <Select value={fsForm.categoryId} onChange={(e) => setFsForm((p) => ({ ...p, categoryId: e.target.value }))}>
                  {store.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Program</FieldLabel>
              <div className="mt-1">
                <Input value={fsForm.program} onChange={(e) => setFsForm((p) => ({ ...p, program: e.target.value }))} placeholder="CSE" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Year</FieldLabel>
              <div className="mt-1">
                <Select value={fsForm.year} onChange={(e) => setFsForm((p) => ({ ...p, year: e.target.value }))}>
                  {["1", "2", "3", "4"].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Semester</FieldLabel>
              <div className="mt-1">
                <Select value={fsForm.semester} onChange={(e) => setFsForm((p) => ({ ...p, semester: e.target.value }))}>
                  {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Amount</FieldLabel>
              <div className="mt-1">
                <Input inputMode="numeric" value={fsForm.amount} onChange={(e) => setFsForm((p) => ({ ...p, amount: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Fine / Day</FieldLabel>
              <div className="mt-1">
                <Input inputMode="numeric" value={fsForm.finePerDay} onChange={(e) => setFsForm((p) => ({ ...p, finePerDay: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Due Date</FieldLabel>
              <div className="mt-1">
                <Input type="date" value={fsForm.dueDate} onChange={(e) => setFsForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Active</FieldLabel>
              <div className="mt-1">
                <Select value={fsForm.isActive ? "YES" : "NO"} onChange={(e) => setFsForm((p) => ({ ...p, isActive: e.target.value === "YES" }))}>
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </Select>
              </div>
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
              <GhostBtn onClick={closeModal}>
                <XIcon size={16} />
                Cancel
              </GhostBtn>
              <PrimaryBtn onClick={saveModal} leftIcon={<CheckCircle2Icon size={16} />}>
                Save
              </PrimaryBtn>
            </div>
          </div>
        )}

        {modalKind === "PAYMENT" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <FieldLabel>Reg No</FieldLabel>
              <div className="mt-1">
                <Input value={payForm.regNo} onChange={(e) => setPayForm((p) => ({ ...p, regNo: e.target.value }))} placeholder="1923XXXXX" />
              </div>
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Student Name</FieldLabel>
              <div className="mt-1">
                <Input value={payForm.studentName} onChange={(e) => setPayForm((p) => ({ ...p, studentName: e.target.value }))} placeholder="STUDENT NAME" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Amount</FieldLabel>
              <div className="mt-1">
                <Input inputMode="numeric" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Method</FieldLabel>
              <div className="mt-1">
                <Select value={payForm.method} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value as any }))}>
                  <option value="ONLINE">ONLINE</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK">BANK</option>
                </Select>
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Status</FieldLabel>
              <div className="mt-1">
                <Select value={payForm.status} onChange={(e) => setPayForm((p) => ({ ...p, status: e.target.value as any }))}>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Reference No</FieldLabel>
              <div className="mt-1">
                <Input value={payForm.refNo} onChange={(e) => setPayForm((p) => ({ ...p, refNo: e.target.value }))} placeholder="TXN / NEFT / CASH-REF" />
              </div>
            </div>

            <div className="md:col-span-1">
              <FieldLabel>Paid On</FieldLabel>
              <div className="mt-1">
                <Input
                  type="datetime-local"
                  value={(() => {
                    const d = new Date(payForm.paidOn);
                    if (Number.isNaN(d.getTime())) return "";
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  })()}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    if (!Number.isNaN(d.getTime())) setPayForm((p) => ({ ...p, paidOn: d.toISOString() }));
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
              <GhostBtn onClick={closeModal}>
                <XIcon size={16} />
                Cancel
              </GhostBtn>
              <PrimaryBtn onClick={saveModal} leftIcon={<CheckCircle2Icon size={16} />}>
                Save
              </PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteId}
        title="Confirm Delete"
        subtitle="This will remove the record from local storage (demo)."
        onClose={() => setDeleteId(null)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Are you sure you want to delete?</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">If this is production: validate dependencies and keep audit logs.</div>
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

export default AdminFees;
