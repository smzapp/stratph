"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { getUserById, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { REPORT_REASONS } from "@/lib/constants";
import type { Report } from "@/lib/types";

const TABS = [
  { key: "open", label: "Open" },
  { key: "all", label: "All reports" },
];

export default function AdminReports() {
  const { db, adminResolveReport } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Report[]>("/reports");
      setReports(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, [fetchReports]);

  async function handleResolve(id: string) {
    await adminResolveReport(id);
    await fetchReports();
  }

  const visible = reports.filter((r) => (tab === "open" ? r.status === "open" : true));

  return (
    <div>
      <PageHeader
        title="Employer Reports"
        description="Reports submitted by jobseekers about employer conduct."
      />

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && visible.length === 0 ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing here" description="No reports match this filter." />
      ) : (
        <div className="space-y-4">
          {visible.map((r) => {
            const reporter = getUserById(db, r.reporterId);
            const reported = getUserById(db, r.reportedUserId);
            const reasonLabel = REPORT_REASONS.find((rr) => rr.value === r.reason)?.label || r.reason;
            return (
              <Card key={r.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="rose">{reasonLabel}</Badge>
                      {r.status === "open" ? <Badge tone="amber">Open</Badge> : <Badge tone="emerald">Resolved</Badge>}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {reporter?.name || "Unknown jobseeker"} reported {reported?.companyName || reported?.name || "an employer"}
                    </p>
                    {r.contextLabel ? <p className="mt-1 text-xs text-zinc-400">{r.contextLabel}</p> : null}
                    {r.details ? <p className="mt-2 max-w-xl text-sm text-zinc-600">{r.details}</p> : null}
                    <p className="mt-2 text-xs text-zinc-400">{timeAgo(r.createdAt)}</p>
                  </div>
                  {r.status === "open" ? (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(r.id)}>
                      Mark resolved
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
