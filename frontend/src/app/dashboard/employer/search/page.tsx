"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  getActivityForJobseeker,
  getCompletedMicroJobsCount,
  getLastActiveDate,
  daysSince,
  isSubscriptionActive,
  timeAgo,
} from "@/lib/helpers";
import { ROLES } from "@/lib/types";
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { CATEGORIES, JOB_TYPES } from "@/lib/constants";

const RECENCY_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Active in last 7 days", value: "7" },
  { label: "Active in last 30 days", value: "30" },
  { label: "Active in last 90 days", value: "90" },
];

const MIN_EXPERIENCE_OPTIONS = [
  { label: "Any experience", value: "0" },
  { label: "1+ years", value: "1" },
  { label: "3+ years", value: "3" },
  { label: "5+ years", value: "5" },
];

export default function ReverseHiringSearch() {
  const { db, currentUser, recordProfileView, inviteToMicroJob, contactJobseeker } = useApp();
  const [query, setQuery] = useState("");
  const [recency, setRecency] = useState("any");
  const [activeSkill, setActiveSkill] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState("All");
  const [minExperience, setMinExperience] = useState("0");
  const [jobType, setJobType] = useState("All");
  const [inviteJobId, setInviteJobId] = useState("");
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [contactedIds, setContactedIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [contacting, setContacting] = useState(false);

  const isSubscribed = isSubscriptionActive(currentUser);
  const myOpenMicroJobs = useMemo(
    () => (currentUser ? db.microJobs.filter((mj) => mj.employerId === currentUser.id && mj.status === "open") : []),
    [db.microJobs, currentUser],
  );

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
      .filter(({ candidate }) => (category === "All" ? true : candidate.category === category))
      .filter(({ candidate }) => (jobType === "All" ? true : candidate.preferredJobType === jobType))
      .filter(({ candidate }) => (candidate.yearsOfExperience ?? 0) >= Number(minExperience))
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
  }, [candidates, db, activeSkill, recency, category, jobType, minExperience, query]);

  const selected = results.find((r) => r.candidate.id === selectedId);

  function openCandidate(id: string) {
    setSelectedId(id);
    setInviteJobId("");
    recordProfileView(id);
  }

  async function handleInvite(jobseekerId: string) {
    if (!inviteJobId) return;
    setInviting(true);
    const ok = await inviteToMicroJob(inviteJobId, jobseekerId);
    setInviting(false);
    if (ok) setInvitedIds((prev) => [...prev, jobseekerId]);
  }

  async function handleContact(jobseekerId: string) {
    const message = window.prompt("Message to this candidate:");
    if (!message || !message.trim()) return;
    setContacting(true);
    const ok = await contactJobseeker(jobseekerId, message.trim());
    setContacting(false);
    if (ok) setContactedIds((prev) => [...prev, jobseekerId]);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reverse Hiring"
        title="Search skilled profiles"
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

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
        >
          <span>{showAdvanced ? "▾" : "▸"}</span>
          {showAdvanced ? "Hide advanced search" : "Advanced search"}
        </button>

        {showAdvanced ? (
          <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3">
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              label="Minimum experience"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            >
              {MIN_EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select label="Preferred job type" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="All">Any job type</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </Card>

      <p className="mb-3 text-xs text-zinc-400">
        {results.length} discoverable candidate{results.length === 1 ? "" : "s"} match
      </p>

      {results.length === 0 ? (
        <EmptyState title="No candidates match these filters" description="Try broadening the skill, category, or recency filter." />
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
              <div className="mb-2 flex flex-wrap gap-1 text-xs text-zinc-500">
                {candidate.category ? <Badge tone="sky">{candidate.category}</Badge> : null}
                {candidate.yearsOfExperience !== undefined && candidate.yearsOfExperience !== null ? (
                  <Badge tone="zinc">{candidate.yearsOfExperience} yrs exp</Badge>
                ) : null}
                {candidate.preferredJobType ? <Badge tone="zinc">{candidate.preferredJobType}</Badge> : null}
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                {(candidate.skills || []).map((s) => (
                  <Badge key={s} tone={activeSkill === s ? "indigo" : "zinc"}>
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mb-4 flex items-center gap-3 text-xs text-zinc-500">
                <span>⚡ {completed} trial task{completed === 1 ? "" : "s"} completed</span>
                <span>· active {lastActive ? timeAgo(lastActive) : "a while ago"}</span>
              </div>
              <Button size="sm" variant="outline" className="mt-auto" onClick={() => openCandidate(candidate.id)}>
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
            <div className="mb-3 flex flex-wrap gap-1">
              {selected.candidate.category ? <Badge tone="sky">{selected.candidate.category}</Badge> : null}
              {selected.candidate.yearsOfExperience !== undefined && selected.candidate.yearsOfExperience !== null ? (
                <Badge tone="zinc">{selected.candidate.yearsOfExperience} years experience</Badge>
              ) : null}
              {selected.candidate.preferredJobType ? (
                <Badge tone="zinc">Prefers {selected.candidate.preferredJobType}</Badge>
              ) : null}
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
            {!isSubscribed ? (
              <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Inviting and contacting candidates requires an active subscription.{" "}
                <Link href="/pricing" className="font-medium underline">
                  View plans →
                </Link>
              </p>
            ) : null}

            {isSubscribed && myOpenMicroJobs.length > 0 ? (
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <Select
                  value={inviteJobId}
                  onChange={(e) => setInviteJobId(e.target.value)}
                  className="sm:max-w-xs"
                >
                  <option value="">Choose a Trial Task…</option>
                  {myOpenMicroJobs.map((mj) => (
                    <option key={mj.id} value={mj.id}>
                      {mj.title}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={
                  !isSubscribed ||
                  myOpenMicroJobs.length === 0 ||
                  !inviteJobId ||
                  inviting ||
                  invitedIds.includes(selected.candidate.id)
                }
                title={!isSubscribed ? "Requires an active subscription" : undefined}
                onClick={() => handleInvite(selected.candidate.id)}
              >
                {invitedIds.includes(selected.candidate.id)
                  ? "Invited ✓"
                  : inviting
                    ? "Inviting…"
                    : "Invite to a Trial Task"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!isSubscribed || contacting || contactedIds.includes(selected.candidate.id)}
                title={!isSubscribed ? "Requires an active subscription" : undefined}
                onClick={() => handleContact(selected.candidate.id)}
              >
                {contactedIds.includes(selected.candidate.id)
                  ? "Message sent ✓"
                  : contacting
                    ? "Sending…"
                    : "Contact"}
              </Button>
            </div>
            {isSubscribed && myOpenMicroJobs.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-400">
                Post an open Trial Task to be able to invite this candidate.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
