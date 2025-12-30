import React, { useMemo, useState } from "react";

type Role = "STUDENT" | "TEACHER";

type AccountRow = {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  regNo?: string;   // student
  empId?: string;   // teacher
  department?: string;
  createdAt: string; // dd/mm/yyyy
};

const STORAGE_KEY = "admin_accounts_v1";

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function ddmmyyyy(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function randomPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function loadRows(): AccountRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccountRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRows(rows: AccountRow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export default function AdminAccounts() {
  const [tab, setTab] = useState<"create" | "view">("create");

  const [rows, setRows] = useState<AccountRow[]>(() => loadRows());

  // form
  const [role, setRole] = useState<Role>("STUDENT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState("");
  const [empId, setEmpId] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [sendCredentials, setSendCredentials] = useState(true); // demo toggle

  // view
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.role} ${r.fullName} ${r.email} ${r.regNo ?? ""} ${r.empId ?? ""} ${r.department ?? ""} ${r.createdAt}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, rows]);

  const clear = () => {
    setFullName("");
    setEmail("");
    setRegNo("");
    setEmpId("");
    setDepartment("");
    setPassword("");
    setSendCredentials(true);
  };

  const createAccount = () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (!name) return showToast("Please enter full name.");
    if (!mail || !isEmail(mail)) return showToast("Please enter a valid email.");
    if (!password || password.trim().length < 6)
      return showToast("Password must be at least 6 characters.");

    if (role === "STUDENT" && !regNo.trim())
      return showToast("Please enter Student Reg No.");
    if (role === "TEACHER" && !empId.trim())
      return showToast("Please enter Teacher Emp ID.");

    const exists = rows.some((r) => r.email.toLowerCase() === mail);
    if (exists) return showToast("This email already exists.");

    const newRow: AccountRow = {
      id: `acc_${Date.now()}`,
      role,
      fullName: name,
      email: mail,
      regNo: role === "STUDENT" ? regNo.trim() : undefined,
      empId: role === "TEACHER" ? empId.trim() : undefined,
      department: department.trim() || undefined,
      createdAt: ddmmyyyy(),
    };

    const next = [newRow, ...rows];
    setRows(next);
    saveRows(next);

    // Demo “send credentials”
    if (sendCredentials) {
      // In real app: call backend/email service.
      showToast("Account created. Credentials queued (demo).");
    } else {
      showToast("Account created.");
    }

    clear();
    setTab("view");
  };

  const deleteRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    saveRows(next);
    showToast("Deleted.");
  };

  const exportCsv = () => {
    const header = [
      "role",
      "fullName",
      "email",
      "regNo",
      "empId",
      "department",
      "createdAt",
    ];
    const body = rows.map((r) => [
      r.role,
      r.fullName,
      r.email,
      r.regNo ?? "",
      r.empId ?? "",
      r.department ?? "",
      r.createdAt,
    ]);

    const csv =
      header.join(",") +
      "\n" +
      body
        .map((line) =>
          line
            .map((v) => `"${String(v).replaceAll(`"`, `""`)}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Accounts
          </h1>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Create Student and Teacher accounts (demo end-to-end).
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm
                       dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* tabs */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("create")}
              className={clsx(
                "h-10 px-4 text-sm font-semibold transition",
                tab === "create"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setTab("view")}
              className={clsx(
                "h-10 px-4 text-sm font-semibold transition border-l border-slate-200 dark:border-slate-800",
                tab === "view"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              View Accounts
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {tab === "create" ? (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Role */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Account Type
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("STUDENT")}
                        className={clsx(
                          "h-10 px-4 rounded-xl text-sm font-semibold border shadow-sm transition",
                          role === "STUDENT"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                        )}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("TEACHER")}
                        className={clsx(
                          "h-10 px-4 rounded-xl text-sm font-semibold border shadow-sm transition",
                          role === "TEACHER"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                        )}
                      >
                        Teacher
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full name */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Full Name
                    </div>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Email
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="name@college.edu"
                    />
                  </div>
                </div>

                {/* RegNo / EmpId */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {role === "STUDENT" ? "Reg No" : "Emp ID"}
                    </div>
                    <input
                      value={role === "STUDENT" ? regNo : empId}
                      onChange={(e) =>
                        role === "STUDENT"
                          ? setRegNo(e.target.value)
                          : setEmpId(e.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder={role === "STUDENT" ? "e.g., 192123012" : "e.g., EMP-1042"}
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Department
                    </div>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="e.g., CSE / ECE / MBA"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                      Password
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setPassword(randomPassword(10))}
                          className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm
                                     dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Auto-generate
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={sendCredentials}
                          onChange={(e) => setSendCredentials(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                        />
                        Send credentials to email (demo)
                      </label>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        In production, connect this to your backend mail service.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-12 pt-2">
                  <div className="sm:pl-[180px] flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={createAccount}
                      className="h-10 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-[0.99]
                                 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // VIEW
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Accounts List
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Stored in localStorage (demo end-to-end).
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Search:
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name / email / regno / empid..."
                    className="h-10 w-full sm:w-[320px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">
                        RegNo / EmpID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            No accounts found
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Create accounts from the Create tab.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "text-xs px-2 py-1 rounded-lg border",
                                r.role === "STUDENT"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              )}
                            >
                              {r.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                            {r.fullName}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                            {r.email}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                            {r.regNo ?? r.empId ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {r.department ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                            {r.createdAt}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => deleteRow(r.id)}
                              className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                         dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm active:scale-[0.99]"
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

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold">{filtered.length}</span>{" "}
                of <span className="font-semibold">{rows.length}</span> account(s).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
