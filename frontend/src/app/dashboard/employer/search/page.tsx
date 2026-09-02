"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui/Primitives";
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

type ComposerMode = "invite" | "recommend" | null;

function TrialTaskCombobox({
  options,
  value,
  onChange,
}: {
  options: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);
  const filtered = (
    query.trim() ? options.filter((o) => o.title.toLowerCase().includes(query.trim().toLowerCase())) : options
  ).slice(0, 20);

  if (selected && !open) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2">
        <span className="truncate text-sm text-zinc-800">{selected.title}</span>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          className="shrink-0 text-xs font-medium text-indigo-600 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder={`Search ${options.length} open Trial Task${options.length === 1 ? "" : "s"} by title…`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-400">No matching Trial Tasks.</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full truncate px-3 py-2 text-left text-sm text-zinc-700 hover:bg-indigo-50"
              >
                {o.title}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ReverseHiringSearch() {
  const router = useRouter();
  const { db, currentUser, recordProfileView, inviteToMicroJob, startConversation, addRecommendation } = useApp();
  const [query, setQuery] = useState("");
  const [recency, setRecency] = useState("any");
  const [activeSkill, setActiveSkill] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState("All");
  const [minExperience, setMinExperience] = useState("0");
  const [jobType, setJobType] = useState("All");

  const [composer, setComposer] = useState<ComposerMode>(null);
  const [inviteJobId, setInviteJobId] = useState("");
  const [recommendMessage, setRecommendMessage] = useState("");
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [recommending, setRecommending] = useState(false);

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
    resetComposer();
    recordProfileView(id);
  }

  function closeModal() {
    setSelectedId(null);
    resetComposer();
  }

  function resetComposer() {
    setComposer(null);
    setInviteJobId("");
    setRecommendMessage("");
  }

  async function handleInvite(jobseekerId: string) {
    if (!inviteJobId) return;
    setInviting(true);
    const ok = await inviteToMicroJob(inviteJobId, jobseekerId);
    setInviting(false);
    if (ok) {
      setInvitedIds((prev) => [...prev, jobseekerId]);
      resetComposer();
    }
  }

  async function handleMessage(jobseekerId: string) {
    setMessaging(true);
    const conversationId = await startConversation(jobseekerId);
    setMessaging(false);
    if (conversationId) {
      router.push(`/dashboard/employer/messages?with=${conversationId}`);
    }
  }

  async function handleRecommend(jobseekerId: string) {
    if (!recommendMessage.trim()) return;
    setRecommending(true);
    const ok = await addRecommendation(jobseekerId, recommendMessage.trim());
    setRecommending(false);
    if (ok) {
      setRecommendedIds((prev) => [...prev, jobseekerId]);
      resetComposer();
    }
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
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span>⚡ {completed} trial task{completed === 1 ? "" : "s"} completed</span>
                <span>· active {lastActive ? timeAgo(lastActive) : "a while ago"}</span>
                {db.recommendations.some((r) => r.jobseekerId === candidate.id) ? (
                  <span className="text-indigo-600">
                    · 💬 {db.recommendations.filter((r) => r.jobseekerId === candidate.id).length} recommended
                  </span>
                ) : null}
              </div>
              <Button size="sm" variant="outline" className="mt-auto" onClick={() => openCandidate(candidate.id)}>
                View activity
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={closeModal} title={selected?.candidate.name} wide>
        {selected ? (
          <div>
            <div className="sticky top-0 z-10 -mx-6 mb-4 border-b border-zinc-100 bg-white px-6 pb-4">
              {composer === null ? (
                <div className="space-y-2">
                  {!isSubscribed ? (
                    <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                      Inviting and messaging candidates requires an active subscription.{" "}
                      <Link href="/pricing" className="font-medium underline">
                        View plans →
                      </Link>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={
                        !isSubscribed || myOpenMicroJobs.length === 0 || invitedIds.includes(selected.candidate.id)
                      }
                      title={!isSubscribed ? "Requires an active subscription" : undefined}
                      onClick={() => setComposer("invite")}
                    >
                      {invitedIds.includes(selected.candidate.id) ? "Invited ✓" : "Invite to a Trial Task"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      disabled={!isSubscribed || messaging}
                      title={!isSubscribed ? "Requires an active subscription" : undefined}
                      onClick={() => handleMessage(selected.candidate.id)}
                    >
                      {messaging ? "Opening…" : "Message"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={() => setComposer("recommend")}
                    >
                      {recommendedIds.includes(selected.candidate.id) ? "Recommended ✓" : "Recommend"}
                    </Button>
                  </div>
                  {isSubscribed && myOpenMicroJobs.length === 0 ? (
                    <p className="text-xs text-zinc-400">Post an open Trial Task to be able to invite this candidate.</p>
                  ) : null}
                </div>
              ) : composer === "invite" ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500">Choose a Trial Task to invite this candidate to</p>
                  <TrialTaskCombobox options={myOpenMicroJobs} value={inviteJobId} onChange={setInviteJobId} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button size="sm" variant="outline" onClick={resetComposer}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!inviteJobId || inviting} onClick={() => handleInvite(selected.candidate.id)}>
                      {inviting ? "Inviting…" : "Send invite"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    autoFocus
                    placeholder="Write a short recommendation for this candidate…"
                    value={recommendMessage}
                    onChange={(e) => setRecommendMessage(e.target.value)}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button size="sm" variant="outline" onClick={resetComposer}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!recommendMessage.trim() || recommending}
                      onClick={() => handleRecommend(selected.candidate.id)}
                    >
                      {recommending ? "Sending…" : "Send recommendation"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
              {(selected.candidate.services || []).map((s) => (
                <Badge key={s} tone="emerald">
                  {s}
                </Badge>
              ))}
            </div>

            {(selected.candidate.experience || []).length > 0 ? (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">Experience</h3>
                <ul className="space-y-2">
                  {(selected.candidate.experience || []).map((exp) => (
                    <li key={exp.id} className="text-sm text-zinc-700">
                      <span className="font-medium">{exp.title}</span> · {exp.company}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(selected.candidate.education || []).length > 0 ? (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">Education</h3>
                <ul className="space-y-2">
                  {(selected.candidate.education || []).map((ed) => (
                    <li key={ed.id} className="text-sm text-zinc-700">
                      {ed.degree} · {ed.school}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(() => {
              const candidateRecs = db.recommendations.filter((r) => r.jobseekerId === selected.candidate.id);
              return candidateRecs.length > 0 ? (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                    Recommendations ({candidateRecs.length})
                  </h3>
                  <ul className="space-y-2">
                    {candidateRecs.map((r) => (
                      <li key={r.id} className="rounded-lg bg-indigo-50/60 p-2.5 text-sm italic text-zinc-700">
                        &ldquo;{r.message}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}

            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Verified activity</h3>
            {selected.activity.length === 0 ? (
              <p className="text-sm text-zinc-400">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-2 border-l border-zinc-200 pl-4">
                {selected.activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="text-zinc-800">{a.title}</p>
                    <p className="text-xs text-zinc-400">{timeAgo(a.date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
