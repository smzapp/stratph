"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { getSkillGap } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, PageHeader, Select } from "@/components/ui/Primitives";

export default function GapAnalyzer() {
  const { db, currentUser } = useApp();
  const searchParams = useSearchParams();

  const openJobs = useMemo(() => db.jobs.filter((j) => j.status === "open"), [db.jobs]);
  const preselected = searchParams.get("job");
  const [jobId, setJobId] = useState(preselected || openJobs[0]?.id || "");

  if (!currentUser) return null;

  const mySkills = currentUser.skills || [];
  const targetJob = db.jobs.find((j) => j.id === jobId) || openJobs[0];
  const gap = targetJob ? getSkillGap(mySkills, targetJob.skillsRequired) : null;

  function findMicroJobFor(skill: string) {
    return db.microJobs.find(
      (mj) =>
        mj.status === "open" &&
        mj.moderation === "approved" &&
        mj.skillsRequired.some((s) => s.toLowerCase() === skill.toLowerCase()),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI Career Gap Analyzer"
        title="Know exactly what's missing — not just your match score"
        description={'Other platforms stop at "You match 60%." We tell you precisely which skills stand between you and the role.'}
      />

      {!targetJob ? (
        <EmptyState title="No job postings to analyze yet" description="Check back once employers post full-time or part-time roles." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <p className="mb-3 text-sm font-semibold text-zinc-900">Analyze my fit for</p>
            <Select value={targetJob.id} onChange={(e) => setJobId(e.target.value)}>
              {openJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
            <div className="mt-4 space-y-1 text-sm text-zinc-500">
              <p>{targetJob.type} · {targetJob.location}</p>
              <p>{targetJob.salaryRange}</p>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {gap ? (
              <>
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                    <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
                      <path
                        className="text-zinc-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-600"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${gap.percent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="text-lg font-semibold text-zinc-900">{gap.percent}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{targetJob.title}</p>
                    {gap.missing.length === 0 ? (
                      <p className="mt-1 text-sm text-emerald-600">
                        You already have every skill this role asks for.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-600">
                        You&apos;re missing only{" "}
                        <span className="font-semibold text-zinc-900">
                          these {gap.missing.length} skill{gap.missing.length === 1 ? "" : "s"}
                        </span>
                        .
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      You already have
                    </p>
                    {gap.matched.length === 0 ? (
                      <p className="text-sm text-zinc-400">None yet — every required skill is a gap for now.</p>
                    ) : (
                      <ul className="space-y-2">
                        {gap.matched.map((s) => (
                          <li key={s} className="flex items-center gap-2 text-sm text-zinc-700">
                            <span className="text-emerald-500">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
                      Missing
                    </p>
                    {gap.missing.length === 0 ? (
                      <p className="text-sm text-zinc-400">Nothing missing. Go ahead and apply.</p>
                    ) : (
                      <ul className="space-y-3">
                        {gap.missing.map((s) => {
                          const microJob = findMicroJobFor(s);
                          return (
                            <li key={s}>
                              <div className="flex items-center gap-2 text-sm text-zinc-700">
                                <span className="text-rose-500">✕</span> {s}
                              </div>
                              {microJob ? (
                                <Link
                                  href={`/dashboard/jobseeker/micro-jobs/${microJob.id}`}
                                  className="ml-6 mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                >
                                  ⚡ Prove it: {microJob.title}
                                </Link>
                              ) : (
                                <p className="ml-6 mt-1 text-xs text-zinc-400">
                                  No micro job for this skill yet — add it to your profile once you&apos;ve
                                  practiced it.
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                  <Badge tone="indigo">Required</Badge>
                  {targetJob.skillsRequired.map((s) => (
                    <Badge key={s} tone={gap.matched.includes(s) ? "emerald" : "rose"}>
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4">
                  <Link href="/dashboard/jobseeker/activity">
                    <Button size="sm" variant="outline">
                      Update my skills
                    </Button>
                  </Link>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
