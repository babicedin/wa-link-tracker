"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeWithStats } from "@/lib/db";
import EmployeeForm from "./EmployeeForm";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

export default function AdminDashboard({
  baseUrl,
}: {
  baseUrl: string;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeWithStats | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        setEmployees(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name} and all their click data?`)) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) loadEmployees();
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditing(null);
    loadEmployees();
  }

  const totalToday = employees.reduce((s, e) => s + e.clicks_today, 0);
  const totalAll = employees.reduce((s, e) => s + e.clicks_all, 0);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              WA Click Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Track WhatsApp link clicks per employee
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Employees</p>
            <p className="text-2xl font-semibold text-slate-900">
              {employees.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Clicks today</p>
            <p className="text-2xl font-semibold text-slate-900">{totalToday}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Clicks all time</p>
            <p className="text-2xl font-semibold text-slate-900">{totalAll}</p>
          </div>
        </div>

        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
          >
            + Add employee
          </button>
        )}

        {(showForm || editing) && (
          <EmployeeForm
            employee={editing ?? undefined}
            onSaved={handleFormSaved}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Today</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Week</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Month</th>
                  <th className="px-4 py-3 font-medium text-slate-600">All time</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Link</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No employees yet. Add your first employee to get a tracking link.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const link = `${baseUrl}/go/${emp.slug}`;
                    return (
                      <tr
                        key={emp.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-400">/{emp.slug}</div>
                          {emp.active === 0 && (
                            <span className="text-xs text-amber-600">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{emp.clicks_today}</td>
                        <td className="px-4 py-3 tabular-nums">{emp.clicks_week}</td>
                        <td className="px-4 py-3 tabular-nums">{emp.clicks_month}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {emp.clicks_all}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <code className="text-xs text-slate-500 break-all">{link}</code>
                            <CopyButton text={link} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditing(emp);
                                setShowForm(false);
                              }}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id, emp.name)}
                              className="text-xs text-red-600 hover:underline"
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
        </div>
      </main>
    </div>
  );
}
