"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  getApplicationsForJobseeker,
  getActivityForJobseeker,
  getOffersForJobseeker,
  getCompletedMicroJobsCount,
  formatPeso,
  timeAgo,
} from "@/lib/helpers";
import { OFFER_STATUSES } from "@/lib/types";
import { Button, Card, PageHeader, StatCard, EmptyState } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function JobseekerOverview() {
  const { db, currentUser } = useApp();
  if (!currentUser) return null;

  const applications = getApplicationsForJobseeker(db, currentUser.id);
  const activity = getActivityForJobseeker(db, currentUser.id).slice(0, 5);
  const pendingOffers = getOffersForJobseeker(db, currentUser.id).filter(
    (o) => o.status === OFFER_STATUSES.PENDING,
  );
  const completed = getCompletedMicroJobsCount(db, currentUser.id);
  const profileViews = currentUser.profileViews ?? 0;
  const openMicroJobs = db.microJobs.filter(
    (mj) => mj.status === "open" && mj.moderation === "approved",
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Jobseeker"
        title={`Welcome back, ${currentUser.name.split(" ")[0]}`}
        description="Trial Tasks are short, paid work trials — deliver great work and an employer can upgrade you instantly."
        actions={
          <Link href="/dashboard/jobseeker/micro-jobs">
            <Button>Browse Trial Tasks</Button>
          </Link>
        }
      />

      {pendingOffers.length > 0 ? (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                🎉 You have {pendingOffers.length} upgrade offer{pendingOffers.length > 1 ? "s" : ""}{" "}
                waiting
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                An employer wants to move you from a Trial Task into ongoing work.
              </p>
            </div>
            <Link href="/dashboard/jobseeker/offers">
              <Button size="sm">Review offers</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Trial Tasks completed" value={completed} tone="indigo" />
        <StatCard label="Profile views" value={profileViews} tone="emerald" hint="See Analytics for more" />
        <StatCard label="Active applications" value={applications.length} tone="amber" />
        <StatCard label="Open Trial Tasks" value={openMicroJobs} hint="Available right now" tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Your applications</h2>
            <Link href="/dashboard/jobseeker/micro-jobs" className="text-xs font-medium text-indigo-600">
              View all Trial Tasks
            </Link>
          </div>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Apply to a Trial Task to start building your track record."
              action={
                <Link href="/dashboard/jobseeker/micro-jobs">
                  <Button size="sm">Find a Trial Task</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {applications.map(({ microJob, applicant }) => (
                <li key={microJob.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{microJob.title}</p>
                    <p className="text-xs text-zinc-400">{formatPeso(microJob.pay)} · {timeAgo(applicant.appliedAt)}</p>
                  </div>
                  <StatusBadge status={applicant.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-400">Nothing yet — completed Trial Tasks show up here.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-zinc-800">{a.title}</p>
                  <p className="text-xs text-zinc-400">{timeAgo(a.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
