"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { getMicroJobsForEmployer, formatDate, formatPeso, isSubscriptionActive, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function EmployerMicroJobs() {
  const { db, currentUser, closeMicroJob } = useApp();

  if (!currentUser) return null;

  const myMicroJobs = getMicroJobsForEmployer(db, currentUser.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const isSubscribed = isSubscriptionActive(currentUser);

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Trial Tasks"
        description="Post a small, paid task. Great performers can be upgraded instantly — no separate hiring process."
        actions={
          <Link
            href="/dashboard/employer/micro-jobs/new"
            title={!isSubscribed ? "Requires an active subscription" : undefined}
          >
            <Button>Post a Trial Task</Button>
          </Link>
        }
      />

      <Card className={`mb-6 ${isSubscribed ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}`}>
        {isSubscribed ? (
          <p className="text-sm text-emerald-800">
            ✓ Your <span className="font-semibold capitalize">{currentUser.subscriptionPlan}</span> plan lets you post
            unlimited Trial Tasks. StratPH holds each task&apos;s pay in escrow and releases it to the jobseeker once
            you approve their work.
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            An active subscription is required to post Trial Tasks.{" "}
            <Link href="/pricing" className="font-medium underline">
              Subscribe on the Pricing page →
            </Link>
          </p>
        )}
      </Card>

      {myMicroJobs.length === 0 ? (
        <EmptyState
          title="You haven't posted a Trial Task yet"
          description="Turn a real task into a paid work trial and see who delivers."
          action={
            <Link href="/dashboard/employer/micro-jobs/new">
              <Button disabled={!isSubscribed}>Post your first Trial Task</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {myMicroJobs.map((mj) => {
            const submitted = mj.applicants.filter((a) => a.status === "submitted").length;
            return (
              <Card key={mj.id} className="transition-shadow hover:shadow-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <Link href={`/dashboard/employer/micro-jobs/${mj.id}`} className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="indigo">{mj.category}</Badge>
                      {mj.moderation === "pending" ? <Badge tone="amber">Pending review</Badge> : null}
                      {submitted > 0 ? <Badge tone="rose">{submitted} to review</Badge> : null}
                      {mj.minYearsOfExperience !== null ? (
                        <Badge tone="zinc">Requires {mj.minYearsOfExperience}+ yrs exp</Badge>
                      ) : null}
                      {mj.minProfileCompleteness !== null ? (
                        <Badge tone="zinc">Requires {mj.minProfileCompleteness}%+ profile</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{mj.title}</p>
                    <p className="text-xs text-zinc-400">
                      {formatPeso(mj.pay)} held in escrow · {mj.applicants.length} applicant
                      {mj.applicants.length === 1 ? "" : "s"} · posted {timeAgo(mj.createdAt)}
                      {mj.expiresAt ? ` · closes ${formatDate(mj.expiresAt)}` : ""}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={mj.status} />
                    {mj.status === "open" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm("Close this Trial Task? Jobseekers won't be able to apply anymore.")) {
                            closeMicroJob(mj.id);
                          }
                        }}
                      >
                        Close
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
