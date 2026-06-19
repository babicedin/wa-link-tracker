"use client";

import { FormEvent, useState } from "react";
import type { LinkWithStats } from "@/lib/db";
import { normalizeSlug } from "@/lib/slug";

type Props = {
  link?: LinkWithStats;
  onSaved: () => void;
  onCancel: () => void;
};

export default function LinkForm({ link, onSaved, onCancel }: Props) {
  const [name, setName] = useState(link?.name ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    link?.whatsapp_number ?? ""
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    link?.whatsapp_message ?? ""
  );
  const [active, setActive] = useState(link?.active !== 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewSlug = link?.slug ?? (normalizeSlug(name) || "your-name");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name,
      whatsapp_number: whatsappNumber,
      whatsapp_message: whatsappMessage,
      active,
    };

    try {
      const url = link ? `/api/employees/${link.id}` : "/api/employees";
      const method = link ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save link");
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
        {link ? "Edit link" : "Create link"}
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
          <p className="text-xs text-slate-400 mt-1">
            URL slug: /{previewSlug}
            {!link && " (auto-generated from name)"}
          </p>
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
        <div className="sm:col-span-2">
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

      {link && (
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
          {loading ? "Saving..." : link ? "Save changes" : "Create link"}
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
