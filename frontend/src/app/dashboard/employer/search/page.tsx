"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  getActivityForJobseeker,
  getCompletedMicroJobsCount,
  getLastActiveDate,
  daysSince,
  timeAgo,
} from "@/lib/helpers";
import { ROLES } from "@/lib/types";
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";

const RECENCY_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Active in last 7 days", value: "7" },
  { label: "Active in last 30 days", value: "30" },
  { label: "Active in last 90 days", value: "90" },
];

export default function ReverseHiringSearch() {
  const { db } = useApp();
  const [query, setQuery] = useState("");
  const [recency, setRecency] = useState("any");
  const [activeSkill, setActiveSkill] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const candidates = useMemo(
    () => db.users.filter((u) => u.role === ROLES.JOBSEEKER && u.discoverable),
    [db.users],
  );

  const allSkills = useMemo(
    () => ["All", ...new Set(candidates.flatMap((c) => c.skills || []))],
    [candidates],
  );

  const results = useMemo(() => {
    return candidates
      .map((c) => {
        const activity = getActivityForJobseeker(db, c.id);
        const lastActive = getLastActiveDate(db, c.id);
        return { candidate: c, activity, lastActive, completed: getCompletedMicroJobsCount(db, c.id) };
      })
      .filter(({ candidate }) => (activeSkill === "All" ? true : (candidate.skills || []).includes(activeSkill)))
      .filter(({ lastActive }) => {
        if (recency === "any") return true;
        if (!lastActive) return false;
        return daysSince(lastActive) <= Number(recency);
      })
      .filter(({ candidate }) =>
        query.trim()
          ? (candidate.name + candidate.headline + (candidate.skills || []).join(" "))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return bTime - aTime;
      });
  }, [candidates, db, activeSkill, recency, query]);

  const selected = results.find((r) => r.candidate.id === selectedId);

  return (
    <div>
      <PageHeader
        eyebrow="Reverse Hiring"
        title="Search candidates by activity"
        description={'e.g. "React developer who deployed AWS in the last 30 days" — search real, verified activity instead of resumes.'}
      />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Search by name, skill, or headline…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={activeSkill} onChange={(e) => setActiveSkill(e.target.value)}>
            {allSkills.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All skills" : s}
              </option>
            ))}
          </Select>
          <Select value={recency} onChange={(e) => setRecency(e.target.value)}>
            {RECENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <p className="mb-3 text-xs text-zinc-400">
        {results.length} discoverable candidate{results.length === 1 ? "" : "s"} match
      </p>

      {results.length === 0 ? (
        <EmptyState title="No candidates match these filters" description="Try broadening the skill or recency filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map(({ candidate, completed, lastActive }) => (
            <Card key={candidate.id} className="flex flex-col">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={candidate.name} />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{candidate.name}</p>
                  <p className="text-xs text-zinc-400">{candidate.headline}</p>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                {(candidate.skills || []).map((s) => (
                  <Badge key={s} tone={activeSkill === s ? "indigo" : "zinc"}>
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mb-4 flex items-center gap-3 text-xs text-zinc-500">
                <span>⚡ {completed} micro job{completed === 1 ? "" : "s"} completed</span>
                <span>· active {lastActive ? timeAgo(lastActive) : "a while ago"}</span>
              </div>
              <Button size="sm" variant="outline" className="mt-auto" onClick={() => setSelectedId(candidate.id)}>
                View activity
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.candidate.name} wide>
        {selected ? (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={selected.candidate.name} size={12} />
              <div>
                <p className="text-sm font-semibold text-zinc-900">{selected.candidate.headline}</p>
                <p className="text-xs text-zinc-400">{selected.candidate.location}</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-zinc-600">{selected.candidate.bio}</p>
            <div className="mb-4 flex flex-wrap gap-1">
              {(selected.candidate.skills || []).map((s) => (
                <Badge key={s} tone="indigo">
                  {s}
                </Badge>
              ))}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Verified activity</h3>
            {selected.activity.length === 0 ? (
              <p className="text-sm text-zinc-400">No activity recorded yet.</p>
            ) : (
              <ul className="mb-5 space-y-2 border-l border-zinc-200 pl-4">
                {selected.activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="text-zinc-800">{a.title}</p>
                    <p className="text-xs text-zinc-400">{timeAgo(a.date)}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Button size="sm">Invite to a micro job</Button>
              <Button size="sm" variant="outline">
                Contact
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
