"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import {
  getApplicationsForJobseeker,
  getActivityForJobseeker,
  getOffersForJobseeker,
  getCompletedMicroJobsCount,
  formatPeso,
  timeAgo,
} from "@/lib/helpers";
import { OFFER_STATUSES } from "@/lib/types";
import type { JobseekerAnalytics } from "@/lib/types";
import { Button, Card, PageHeader, StatCard, EmptyState } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function JobseekerOverview() {
  const { db, currentUser } = useApp();
  const [analytics, setAnalytics] = useState<JobseekerAnalytics | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    apiFetch<JobseekerAnalytics>("/me/analytics").then((res) => {
      if (!cancelled) setAnalytics(res);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

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
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/talent/${currentUser.id}` : "";

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your profile link:", profileUrl);
    }
  }

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

      <Card className="mb-6 border-indigo-100 bg-indigo-50/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900">
                Your profile is {analytics ? `${analytics.profileCompleteness}%` : "…"} complete
              </p>
              <Link href="/profile" className="text-xs font-medium text-indigo-600 hover:underline">
                Update profile →
              </Link>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${analytics?.profileCompleteness ?? 0}%` }}
              />
            </div>
            {analytics?.suggestions[0] ? (
              <p className="mt-2 text-xs text-zinc-500">💡 {analytics.suggestions[0]}</p>
            ) : analytics ? (
              <p className="mt-2 text-xs text-emerald-600">Looking great — clients will notice.</p>
            ) : null}
            {analytics && analytics.badges.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analytics.badges.map((b) => (
                  <span
                    key={b.id}
                    title={b.description}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={copyProfileLink} disabled={!profileUrl}>
              {copied ? "Copied!" : "Copy profile link"}
            </Button>
            <Link href={`/talent/${currentUser.id}`} target="_blank">
              <Button size="sm">View profile</Button>
            </Link>
          </div>
        </div>
      </Card>

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
