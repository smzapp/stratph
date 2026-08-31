"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { getUserById, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";

export default function BrowseJobs() {
  const { db } = useApp();
  const [applied, setApplied] = useState([]);

  const jobs = db.jobs.filter((j) => j.status === "open");

  return (
    <div>
      <PageHeader
        title="Job Postings"
        description="Traditional full-time and part-time roles, alongside the micro jobs marketplace."
      />

      {jobs.length === 0 ? (
        <EmptyState title="No open roles right now" />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const employer = getUserById(db, job.employerId);
            const isApplied = applied.includes(job.id);
            return (
              <Card key={job.id} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="sky">{job.type}</Badge>
                    <span className="text-xs text-zinc-400">Posted {timeAgo(job.postedAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                  <p className="text-sm text-zinc-500">
                    {employer?.companyName} · {job.location} · {job.salaryRange}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isApplied ? "secondary" : "primary"}
                  disabled={isApplied}
                  onClick={() => setApplied((prev) => [...prev, job.id])}
                >
                  {isApplied ? "Applied ✓" : "Apply"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
