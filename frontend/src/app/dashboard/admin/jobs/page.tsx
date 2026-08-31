"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { getUserById, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "all", label: "All job postings" },
];

export default function AdminJobModeration() {
  const { db, adminModerateJob } = useApp();
  const [tab, setTab] = useState("pending");

  const jobs = [...db.jobs]
    .filter((j) => (tab === "pending" ? j.moderation === "pending" : true))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  return (
    <div>
      <PageHeader
        title="Job Posting Moderation"
        description="Employers without an active subscription need a quick review before jobseekers can see their postings."
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

      {jobs.length === 0 ? (
        <EmptyState title="Nothing here" description="No job postings match this filter." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const employer = getUserById(db, job.employerId);
            return (
              <Card key={job.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="sky">{job.type}</Badge>
                      <StatusBadge status={job.moderation} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {job.location} · {job.salaryRange}
                    </p>
                    {job.skillsRequired.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.skillsRequired.map((s) => (
                          <Badge key={s} tone="zinc">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-400">
                      {employer?.companyName} · posted {timeAgo(job.postedAt)}
                    </p>
                  </div>
                  {job.moderation === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="success" onClick={() => adminModerateJob(job.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adminModerateJob(job.id, "rejected")}>
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
