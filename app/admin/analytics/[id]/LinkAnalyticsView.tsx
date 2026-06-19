"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LinkAnalytics } from "@/lib/db";
import { countryCodeToName } from "@/lib/geo";

export default function LinkAnalyticsView({
  linkId,
  baseUrl,
}: {
  linkId: number;
  baseUrl: string;
}) {
  const [data, setData] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees/${linkId}/analytics`);
        if (!res.ok) {
          setError("Could not load analytics");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Could not load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <p>{error || "Link not found"}</p>
        <Link href="/admin" className="text-emerald-700 hover:underline text-sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const trackingUrl = `${baseUrl}/go/${data.link.slug}`;
  const maxDayClicks = Math.max(...data.by_day.map((d) => d.count), 1);
  const maxCountryClicks = Math.max(...data.by_country.map((c) => c.count), 1);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 mt-2">
            {data.link.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 break-all">{trackingUrl}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Today", value: data.clicks_today },
            { label: "This week", value: data.clicks_week },
            { label: "This month", value: data.clicks_month },
            { label: "All time", value: data.clicks_all },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Clicks by country
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Based on visitor location (available on Vercel production).
          </p>

          {data.by_country.length === 0 ? (
            <p className="text-sm text-slate-500">No clicks recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.by_country.map((item) => {
                const label = countryCodeToName(item.country);
                const pct = (item.count / maxCountryClicks) * 100;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">
                        {label}
                        {item.country && (
                          <span className="text-slate-400 ml-1">
                            ({item.country})
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums font-medium text-slate-900">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Clicks per day
          </h2>
          <p className="text-sm text-slate-500 mb-4">Last 30 days</p>

          {data.by_day.length === 0 ? (
            <p className="text-sm text-slate-500">No clicks in the last 30 days.</p>
          ) : (
            <div className="space-y-2">
              {data.by_day.map((day) => {
                const pct = (day.count / maxDayClicks) * 100;
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">
                      {day.date}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-slate-700 w-8 text-right">
                      {day.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
