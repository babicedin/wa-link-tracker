"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LinkWithStats } from "@/lib/db";
import LinkForm from "./LinkForm";

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

export default function AdminDashboard({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const [links, setLinks] = useState<LinkWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LinkWithStats | null>(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        setLinks(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}" and all its click data?`)) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) loadLinks();
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditing(null);
    loadLinks();
  }

  const totalToday = links.reduce((s, l) => s + l.clicks_today, 0);
  const totalAll = links.reduce((s, l) => s + l.clicks_all, 0);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              WA Click Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Track WhatsApp link clicks
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
            <p className="text-sm text-slate-500">Links</p>
            <p className="text-2xl font-semibold text-slate-900">{links.length}</p>
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
            + Create link
          </button>
        )}

        {(showForm || editing) && (
          <LinkForm
            link={editing ?? undefined}
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
                  <th className="px-4 py-3 font-medium text-slate-600">Name</th>
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
                ) : links.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No links yet. Create your first link to get a tracking URL.
                    </td>
                  </tr>
                ) : (
                  links.map((item) => {
                    const trackingUrl = `${baseUrl}/go/${item.slug}`;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400">/{item.slug}</div>
                          {item.active === 0 && (
                            <span className="text-xs text-amber-600">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{item.clicks_today}</td>
                        <td className="px-4 py-3 tabular-nums">{item.clicks_week}</td>
                        <td className="px-4 py-3 tabular-nums">{item.clicks_month}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {item.clicks_all}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <code className="text-xs text-slate-500 break-all">
                              {trackingUrl}
                            </code>
                            <CopyButton text={trackingUrl} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/analytics/${item.id}`}
                              className="text-xs text-blue-700 hover:underline"
                            >
                              Analytics
                            </Link>
                            <button
                              onClick={() => {
                                setEditing(item);
                                setShowForm(false);
                              }}
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
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
