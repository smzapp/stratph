"use client";

import { useApp } from "@/lib/store";
import { timeAgo } from "@/lib/helpers";
import { ROLES } from "@/lib/types";
import { Avatar, Card, PageHeader, StatCard } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminOverview() {
  const { db } = useApp();

  const jobseekers = db.users.filter((u) => u.role === ROLES.JOBSEEKER);
  const employers = db.users.filter((u) => u.role === ROLES.EMPLOYER).length;
  const totalProfileViews = jobseekers.reduce((sum, u) => sum + (u.profileViews ?? 0), 0);
  const discoverableJobseekers = jobseekers.filter((u) => u.discoverable).length;
  const upgraded = db.microJobs.reduce(
    (sum, mj) => sum + mj.applicants.filter((a) => a.status === "upgraded").length,
    0,
  );
  const totalApplications = db.microJobs.reduce((sum, mj) => sum + mj.applicants.length, 0);
  const conversionRate = totalApplications
    ? Math.round((upgraded / totalApplications) * 100)
    : 0;
  const pendingModeration = db.microJobs.filter((mj) => mj.moderation === "pending").length;

  const recentUsers = [...db.users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div>
      <PageHeader eyebrow="Super Admin" title="Platform overview" description="Health of the marketplace across every feature." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Jobseekers" value={jobseekers.length} tone="indigo" />
        <StatCard label="Employers" value={employers} tone="emerald" />
        <StatCard label="Trial → hire conversion" value={`${conversionRate}%`} hint={`${upgraded} of ${totalApplications} applications`} tone="amber" />
        <StatCard label="Pending moderation" value={pendingModeration} tone="rose" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total profile views" value={totalProfileViews} tone="indigo" hint="Across all jobseeker profiles" />
        <StatCard label="Discoverable jobseekers" value={discoverableJobseekers} tone="amber" hint="Visible in Reverse Hiring search" />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recently joined</h2>
        <ul className="divide-y divide-zinc-100">
          {recentUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar name={u.companyName || u.name} />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{u.companyName || u.name}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={u.status} />
                <span className="text-xs text-zinc-400">{timeAgo(u.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
