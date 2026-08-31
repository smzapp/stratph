"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getUserById, formatPeso, timeAgo } from "@/lib/helpers";
import { Badge, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function BrowseMicroJobs() {
  const { db, currentUser } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set(db.microJobs.map((mj) => mj.category))],
    [db.microJobs],
  );

  const microJobs = useMemo(() => {
    return db.microJobs
      .filter((mj) => mj.status === "open" && mj.moderation === "approved")
      .filter((mj) => category === "All" || mj.category === category)
      .filter((mj) =>
        query.trim()
          ? (mj.title + mj.description + mj.skillsRequired.join(" "))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.microJobs, category, query]);

  if (!currentUser) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Micro Jobs"
        description="Short, paid tasks (₱300–₱3,000). Do great work and the employer can upgrade you to part-time, contract, or full-time."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
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

      {microJobs.length === 0 ? (
        <EmptyState title="No micro jobs match your search" description="Try a different keyword or category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {microJobs.map((mj) => {
            const employer = getUserById(db, mj.employerId);
            const myApplication = mj.applicants.find((a) => a.jobseekerId === currentUser.id);
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
    </div>
  );
}
