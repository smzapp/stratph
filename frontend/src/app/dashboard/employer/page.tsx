"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate, getMicroJobsForEmployer, getUserById, isSubscriptionActive, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from "@/components/ui/Primitives";

export default function EmployerOverview() {
  const { db, currentUser } = useApp();
  if (!currentUser) return null;

  const myMicroJobs = getMicroJobsForEmployer(db, currentUser.id);

  const pendingSubmissions = myMicroJobs.flatMap((mj) =>
    mj.applicants.filter((a) => a.status === "submitted").map((a) => ({ microJob: mj, applicant: a })),
  );

  const candidatesEngaged = new Set(myMicroJobs.flatMap((mj) => mj.applicants.map((a) => a.jobseekerId)))
    .size;

  const openMicroJobs = myMicroJobs.filter((mj) => mj.status === "open").length;
  const upgraded = myMicroJobs.reduce(
    (sum, mj) => sum + mj.applicants.filter((a) => a.status === "upgraded").length,
    0,
  );

  const isSubscribed = isSubscriptionActive(currentUser);

  return (
    <div>
      <Card className={`mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isSubscribed ? "border-indigo-200 bg-indigo-50/50" : ""}`}>
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {isSubscribed ? (
              <>
                You&apos;re on the <span className="capitalize text-indigo-600">{currentUser.subscriptionPlan}</span> plan
              </>
            ) : (
              "You're on the Free plan"
            )}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">
            {isSubscribed
              ? `Job postings auto-approve until ${formatDate(currentUser.subscriptionExpiresAt!)}.`
              : "Job postings are reviewed by a Super Admin before going live."}
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="outline">
            {isSubscribed ? "Manage plan" : "View plans"}
          </Button>
        </Link>
      </Card>

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
              <Button>Post a Trial Task</Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open trial tasks" value={openMicroJobs} tone="indigo" />
        <StatCard label="Submissions to review" value={pendingSubmissions.length} tone="amber" />
        <StatCard label="Trials upgraded" value={upgraded} tone="emerald" hint="to part-time/contract/full-time" />
        <StatCard label="Candidates engaged" value={candidatesEngaged} tone="rose" hint="Unique jobseekers who applied" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Submissions waiting for review</h2>
          <Link href="/dashboard/employer/micro-jobs" className="text-xs font-medium text-indigo-600">
            View all trial tasks
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
