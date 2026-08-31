"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { getMicroJobsForEmployer, getUserById, formatPeso, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from "@/components/ui/Primitives";

export default function EmployerOverview() {
  const { db, currentUser } = useApp();
  if (!currentUser) return null;

  const myMicroJobs = getMicroJobsForEmployer(db, currentUser.id);

  const pendingSubmissions = myMicroJobs.flatMap((mj) =>
    mj.applicants.filter((a) => a.status === "submitted").map((a) => ({ microJob: mj, applicant: a })),
  );

  const spent = db.payments
    .filter((p) => p.employerId === currentUser.id && p.status === "released")
    .reduce((sum, p) => sum + p.amount, 0);

  const openMicroJobs = myMicroJobs.filter((mj) => mj.status === "open").length;
  const upgraded = myMicroJobs.reduce(
    (sum, mj) => sum + mj.applicants.filter((a) => a.status === "upgraded").length,
    0,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Employer"
        title={currentUser.companyName || currentUser.name}
        description="Reduce hiring risk with paid work trials, or search verified activity to reverse-hire."
        actions={
          <>
            <Link href="/dashboard/employer/search">
              <Button variant="outline">Search candidates</Button>
            </Link>
            <Link href="/dashboard/employer/micro-jobs">
              <Button>Post a micro job</Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open micro jobs" value={openMicroJobs} tone="indigo" />
        <StatCard label="Submissions to review" value={pendingSubmissions.length} tone="amber" />
        <StatCard label="Trials upgraded" value={upgraded} tone="emerald" hint="to part-time/contract/full-time" />
        <StatCard label="Total paid out" value={formatPeso(spent)} tone="rose" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Submissions waiting for review</h2>
          <Link href="/dashboard/employer/micro-jobs" className="text-xs font-medium text-indigo-600">
            View all micro jobs
          </Link>
        </div>
        {pendingSubmissions.length === 0 ? (
          <EmptyState title="Nothing to review right now" description="New submissions will show up here." />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {pendingSubmissions.map(({ microJob, applicant }) => {
              const candidate = getUserById(db, applicant.jobseekerId);
              return (
                <li key={`${microJob.id}-${applicant.jobseekerId}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{microJob.title}</p>
                    <p className="text-xs text-zinc-400">
                      {candidate?.name} · submitted {timeAgo(applicant.submission?.submittedAt)}
                    </p>
                  </div>
                  <Link href={`/dashboard/employer/micro-jobs/${microJob.id}`}>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
