"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { Card, PageHeader, StatCard } from "@/components/ui/Primitives";
import type { JobseekerAnalytics } from "@/lib/types";

export default function JobseekerAnalyticsPage() {
  const { currentUser } = useApp();
  const [analytics, setAnalytics] = useState<JobseekerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiFetch<JobseekerAnalytics>("/me/analytics")
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="How clients see you"
        description="Track your visibility and get concrete ways to get connected with more clients."
      />

      {loading || !analytics ? (
        <p className="text-sm text-zinc-400">Loading your analytics…</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total profile views" value={analytics.profileViews.total} tone="indigo" />
            <StatCard label="Views (last 7 days)" value={analytics.profileViews.last7Days} tone="emerald" />
            <StatCard label="Views (last 30 days)" value={analytics.profileViews.last30Days} tone="amber" />
            <StatCard label="Trial Tasks completed" value={analytics.completedTrials} tone="rose" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Profile completeness</h2>
              <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${analytics.profileCompleteness}%` }}
                />
              </div>
              <p className="text-2xl font-semibold text-indigo-600">{analytics.profileCompleteness}%</p>
              <p className="mt-1 text-xs text-zinc-400">
                A complete profile shows up more often in employer search.
              </p>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Engagement so far</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xl font-semibold text-zinc-900">{analytics.offersReceived}</p>
                  <p className="text-xs text-zinc-400">Upgrade offers received</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-zinc-900">{analytics.activityCount}</p>
                  <p className="text-xs text-zinc-400">Activity entries logged</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-zinc-900">{analytics.completedTrials}</p>
                  <p className="text-xs text-zinc-400">Verified Trial Tasks</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Badges</h2>
            {analytics.badges.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Complete Trial Tasks, add certifications, and fill out your profile to start earning badges.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.badges.map((b) => (
                  <span
                    key={b.id}
                    title={b.description}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                  >
                    <span>{b.icon}</span> {b.label}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-zinc-900">Ways to get connected with clients faster</h2>
            <p className="mb-4 text-sm text-zinc-500">
              Suggestions based on your current profile and activity.
            </p>
            {analytics.suggestions.length === 0 ? (
              <p className="text-sm text-emerald-600">
                Your profile looks great — keep completing Trial Tasks to stay visible.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {analytics.suggestions.map((s) => (
                  <li key={s} className="flex gap-2.5 text-sm text-zinc-700">
                    <span className="mt-0.5 text-amber-500">💡</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
