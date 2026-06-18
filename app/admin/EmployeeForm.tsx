"use client";

import { FormEvent, useState } from "react";
import type { EmployeeWithStats } from "@/lib/db";

type Props = {
  employee?: EmployeeWithStats;
  onSaved: () => void;
  onCancel: () => void;
};

export default function EmployeeForm({ employee, onSaved, onCancel }: Props) {
  const [name, setName] = useState(employee?.name ?? "");
  const [slug, setSlug] = useState(employee?.slug ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    employee?.whatsapp_number ?? ""
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    employee?.whatsapp_message ?? ""
  );
  const [active, setActive] = useState(employee?.active !== 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name,
      slug,
      whatsapp_number: whatsappNumber,
      whatsapp_message: whatsappMessage,
      active,
    };

    try {
      const url = employee
        ? `/api/employees/${employee.id}`
        : "/api/employees";
      const method = employee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save employee");
        return;
      }

      onSaved();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        {employee ? "Edit employee" : "Add employee"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            URL slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ahmed"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            WhatsApp number
          </label>
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="381601234567"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pre-filled message (optional)
          </label>
          <input
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            placeholder="Hi, I'd like to book..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {employee && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Active (link works)
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : employee ? "Save changes" : "Add employee"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
