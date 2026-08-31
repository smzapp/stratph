"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getApplicationsForJobseeker, getUserById, formatPeso, timeAgo } from "@/lib/helpers";
import { Badge, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

const MIN_PAY_OPTIONS = [
  { label: "Any pay", value: "0" },
  { label: "₱500+", value: "500" },
  { label: "₱1,000+", value: "1000" },
  { label: "₱2,000+", value: "2000" },
];

const TABS = [
  { key: "browse", label: "Browse" },
  { key: "applied", label: "Applied" },
  { key: "submitted", label: "Submitted" },
  { key: "archived", label: "Archived" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BrowseMicroJobs() {
  const { db, currentUser } = useApp();
  const [tab, setTab] = useState<TabKey>("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skill, setSkill] = useState("All");
  const [minPay, setMinPay] = useState("0");

  const categories = useMemo(
    () => ["All", ...new Set(db.microJobs.map((mj) => mj.category))],
    [db.microJobs],
  );
  const skills = useMemo(
    () => ["All", ...new Set(db.microJobs.flatMap((mj) => mj.skillsRequired))],
    [db.microJobs],
  );

  const microJobs = useMemo(() => {
    return db.microJobs
      .filter((mj) => mj.status === "open" && mj.moderation === "approved")
      .filter((mj) => category === "All" || mj.category === category)
      .filter((mj) => skill === "All" || mj.skillsRequired.includes(skill))
      .filter((mj) => mj.pay >= Number(minPay))
      .filter((mj) =>
        query.trim()
          ? (mj.title + mj.description + mj.skillsRequired.join(" "))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.microJobs, category, skill, minPay, query]);

  const myApplications = useMemo(
    () => (currentUser ? getApplicationsForJobseeker(db, currentUser.id) : []),
    [db, currentUser],
  );

  const applied = myApplications.filter(({ applicant }) =>
    ["applied", "in_progress", "approved", "upgraded"].includes(applicant.status),
  );
  const submitted = myApplications.filter(({ applicant }) => applicant.status === "submitted");
  const archived = myApplications.filter(({ applicant }) => applicant.status === "rejected");

  const tabCounts: Record<TabKey, number | null> = {
    browse: null,
    applied: applied.length,
    submitted: submitted.length,
    archived: archived.length,
  };

  if (!currentUser) return null;

  function meetsRequirements(mj: (typeof microJobs)[number]): boolean {
    if (mj.minYearsOfExperience !== null && (currentUser!.yearsOfExperience ?? 0) < mj.minYearsOfExperience) {
      return false;
    }
    return true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Trial Tasks"
        description="Short, paid tasks (₱300–₱3,000). StratPH holds the pay in escrow and releases it once the employer approves your work."
      />

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
            {tabCounts[t.key] !== null ? (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  tab === t.key ? "bg-white/20" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {tabCounts[t.key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <>
          <Card className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Search by skill or keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="sm:max-w-xs"
              />
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:max-w-[200px]">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
            >
              <span>{showAdvanced ? "▾" : "▸"}</span>
              {showAdvanced ? "Hide advanced search" : "Advanced search"}
            </button>

            {showAdvanced ? (
              <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                <Select label="Required skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
                  {skills.map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "Any skill" : s}
                    </option>
                  ))}
                </Select>
                <Select label="Minimum pay" value={minPay} onChange={(e) => setMinPay(e.target.value)}>
                  {MIN_PAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </Card>

          {microJobs.length === 0 ? (
            <EmptyState title="No Trial Tasks match your search" description="Try a different keyword or category." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {microJobs.map((mj) => {
                const employer = getUserById(db, mj.employerId);
                const myApplication = mj.applicants.find((a) => a.jobseekerId === currentUser.id);
                const eligible = meetsRequirements(mj);
                return (
                  <Link key={mj.id} href={`/dashboard/jobseeker/micro-jobs/${mj.id}`}>
                    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <Badge tone="indigo">{mj.category}</Badge>
                        {myApplication ? <StatusBadge status={myApplication.status} /> : null}
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-900">{mj.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{mj.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {mj.skillsRequired.map((s) => (
                          <Badge key={s} tone="zinc">
                            {s}
                          </Badge>
                        ))}
                        {mj.minYearsOfExperience !== null ? (
                          <Badge tone={eligible ? "zinc" : "rose"}>{mj.minYearsOfExperience}+ yrs exp required</Badge>
                        ) : null}
                        {mj.minProfileCompleteness !== null ? (
                          <Badge tone="zinc">{mj.minProfileCompleteness}%+ profile required</Badge>
                        ) : null}
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-4">
                        <div>
                          <p className="text-base font-semibold text-emerald-600">{formatPeso(mj.pay)}</p>
                          <p className="text-xs text-zinc-400">{mj.estimatedTime}</p>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {employer?.companyName} · {timeAgo(mj.createdAt)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {tab !== "browse" ? (
        <ApplicationList
          entries={tab === "applied" ? applied : tab === "submitted" ? submitted : archived}
          db={db}
          emptyTitle={
            tab === "applied"
              ? "No active applications"
              : tab === "submitted"
                ? "Nothing submitted yet"
                : "Nothing archived"
          }
          emptyDescription={
            tab === "applied"
              ? "Apply to a Trial Task from the Browse tab to get started."
              : tab === "submitted"
                ? "Submissions waiting for employer review will show up here."
                : "Trial Tasks you weren't selected for will show up here."
          }
        />
      ) : null}
    </div>
  );
}

function ApplicationList({
  entries,
  db,
  emptyTitle,
  emptyDescription,
}: {
  entries: ReturnType<typeof getApplicationsForJobseeker>;
  db: ReturnType<typeof useApp>["db"];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.applicant.appliedAt).getTime() - new Date(a.applicant.appliedAt).getTime(),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map(({ microJob, applicant }) => {
        const employer = getUserById(db, microJob.employerId);
        return (
          <Link key={microJob.id} href={`/dashboard/jobseeker/micro-jobs/${microJob.id}`}>
            <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <Badge tone="indigo">{microJob.category}</Badge>
                <StatusBadge status={applicant.status} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">{microJob.title}</h3>
              <p className="mt-1 text-xs text-zinc-400">{employer?.companyName}</p>
              <div className="mt-auto flex items-end justify-between pt-4">
                <div>
                  <p className="text-base font-semibold text-emerald-600">{formatPeso(microJob.pay)}</p>
                  <p className="text-xs text-zinc-400">
                    {applicant.status === "approved" || applicant.status === "upgraded"
                      ? "Released to you"
                      : applicant.status === "rejected"
                        ? "Refunded to employer"
                        : "Held in escrow"}
                  </p>
                </div>
                <p className="text-xs text-zinc-400">{timeAgo(applicant.appliedAt)}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
