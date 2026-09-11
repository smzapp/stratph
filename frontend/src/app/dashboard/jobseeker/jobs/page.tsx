"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getUserById, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { ReportEmployerButton } from "@/components/ReportEmployerButton";
import { FollowEmployerButton } from "@/components/FollowEmployerButton";
import { JOB_TYPES } from "@/lib/constants";

export default function BrowseJobs() {
  const { db } = useApp();
  const [applied, setApplied] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("All");
  const [skill, setSkill] = useState("All");

  const approvedJobs = useMemo(
    () => db.jobs.filter((j) => j.status === "open" && j.moderation === "approved"),
    [db.jobs],
  );

  const locations = useMemo(
    () => ["All", ...new Set(approvedJobs.map((j) => j.location))],
    [approvedJobs],
  );
  const skills = useMemo(
    () => ["All", ...new Set(approvedJobs.flatMap((j) => j.skillsRequired))],
    [approvedJobs],
  );

  const jobs = useMemo(() => {
    return approvedJobs
      .filter((j) => (type === "All" ? true : j.type === type))
      .filter((j) => (location === "All" ? true : j.location === location))
      .filter((j) => (skill === "All" ? true : j.skillsRequired.includes(skill)))
      .filter((j) =>
        query.trim()
          ? (j.title + j.location + j.skillsRequired.join(" ")).toLowerCase().includes(query.toLowerCase())
          : true,
      );
  }, [approvedJobs, type, location, skill, query]);

  return (
    <div>
      <PageHeader
        title="Job Postings"
        description="Traditional full-time and part-time roles, alongside the Trial Tasks marketplace."
      />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Search by title, location, or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All job types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "All locations" : l}
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
          <div className="mt-3 border-t border-zinc-100 pt-4 sm:max-w-xs">
            <Select label="Required skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
              {skills.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "Any skill" : s}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </Card>

      {jobs.length === 0 ? (
        <EmptyState title="No open roles match your search" description="Try a different keyword, type, or skill." />
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
                  {employer ? (
                    <div className="mt-1 flex items-center gap-3">
                      <FollowEmployerButton employerId={employer.id} />
                      <ReportEmployerButton
                        employerId={employer.id}
                        employerName={employer.companyName || employer.name}
                        contextLabel={`Job posting: ${job.title}`}
                      />
                    </div>
                  ) : null}
                  {job.skillsRequired.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skillsRequired.map((s) => (
                        <Badge key={s} tone={skill === s ? "indigo" : "zinc"}>
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/dashboard/jobseeker/gap-analyzer?job=${job.id}`}>
                    <Button size="sm" variant="outline">
                      Check my gap
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={isApplied ? "secondary" : "primary"}
                    disabled={isApplied}
                    onClick={() => setApplied((prev) => [...prev, job.id])}
                  >
                    {isApplied ? "Applied ✓" : "Apply"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
