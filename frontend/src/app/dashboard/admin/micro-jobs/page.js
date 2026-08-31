"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { getUserById, formatPeso, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "all", label: "All micro jobs" },
];

export default function AdminMicroJobModeration() {
  const { db, adminModerateMicroJob } = useApp();
  const [tab, setTab] = useState("pending");

  const microJobs = [...db.microJobs]
    .filter((mj) => (tab === "pending" ? mj.moderation === "pending" : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <PageHeader title="Micro Job Moderation" description="New postings need a quick review before jobseekers can see them." />

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

      {microJobs.length === 0 ? (
        <EmptyState title="Nothing here" description="No micro jobs match this filter." />
      ) : (
        <div className="space-y-4">
          {microJobs.map((mj) => {
            const employer = getUserById(db, mj.employerId);
            return (
              <Card key={mj.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="indigo">{mj.category}</Badge>
                      <StatusBadge status={mj.status} />
                      {mj.moderation === "pending" ? <Badge tone="amber">Pending</Badge> : null}
                      {mj.moderation === "approved" ? <Badge tone="emerald">Approved</Badge> : null}
                      {mj.moderation === "rejected" ? <Badge tone="rose">Rejected</Badge> : null}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{mj.title}</p>
                    <p className="mt-1 max-w-xl text-sm text-zinc-500">{mj.description}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {employer?.companyName} · {formatPeso(mj.pay)} · posted {timeAgo(mj.createdAt)}
                    </p>
                  </div>
                  {mj.moderation === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="success" onClick={() => adminModerateMicroJob(mj.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adminModerateMicroJob(mj.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
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
