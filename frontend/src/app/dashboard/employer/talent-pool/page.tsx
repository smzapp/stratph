"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { timeAgo } from "@/lib/helpers";
import { Avatar, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { PIPELINE_STAGES } from "@/lib/types";
import type {
  PipelineEntry,
  PipelineStage,
  TalentListMember,
  TalentListSummary,
  TeamInfo,
} from "@/lib/types";

const TABS = [
  { key: "lists", label: "Lists" },
  { key: "pipeline", label: "Pipeline" },
  { key: "team", label: "Team" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STAGE_LABELS: Record<PipelineStage, string> = {
  sourced: "Sourced",
  contacted: "Contacted",
  trial_sent: "Trial Sent",
  hired: "Hired",
  rejected: "Rejected",
};

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export default function TalentPoolPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const {
    currentUser,
    talentLists,
    loadTalentLists,
    createTalentList,
    deleteTalentList,
    removeFromTalentList,
    getTalentListMembers,
    pipeline,
    loadPipeline,
    setPipelineStage,
    removeFromPipeline,
    team,
    loadTeam,
    inviteTeammate,
    removeTeammate,
  } = useApp();

  const [tab, setTab] = useState<TabKey>(isTabKey(initialTab) ? initialTab : "lists");

  useEffect(() => {
    loadTalentLists();
    loadPipeline();
    loadTeam();
  }, [loadTalentLists, loadPipeline, loadTeam]);

  if (!currentUser) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Your growing candidate database"
        title="Talent Pool"
        description="Save candidates into lists, move them through your hiring pipeline, and share it all with your team."
      />

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "lists" ? (
        <ListsTab
          lists={talentLists}
          onCreate={createTalentList}
          onDelete={deleteTalentList}
          onRemoveMember={removeFromTalentList}
          getMembers={getTalentListMembers}
        />
      ) : null}

      {tab === "pipeline" ? (
        <PipelineTab entries={pipeline} onSetStage={setPipelineStage} onRemove={removeFromPipeline} />
      ) : null}

      {tab === "team" ? (
        <TeamTab team={team} currentUserId={currentUser.id} onInvite={inviteTeammate} onRemove={removeTeammate} />
      ) : null}
    </div>
  );
}

function ListsTab({
  lists,
  onCreate,
  onDelete,
  onRemoveMember,
  getMembers,
}: {
  lists: TalentListSummary[];
  onCreate: (name: string) => Promise<TalentListSummary | null>;
  onDelete: (listId: string) => Promise<boolean>;
  onRemoveMember: (listId: string, jobseekerId: string) => Promise<boolean>;
  getMembers: (listId: string) => Promise<TalentListMember[]>;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [members, setMembers] = useState<TalentListMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const openList = lists.find((l) => l.id === openListId) || null;

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    const ok = await onCreate(newName.trim());
    setSubmitting(false);
    if (ok) {
      setNewName("");
      setCreating(false);
    }
  }

  async function openMembers(listId: string) {
    setOpenListId(listId);
    setLoadingMembers(true);
    setMembers(await getMembers(listId));
    setLoadingMembers(false);
  }

  async function handleRemoveMember(jobseekerId: string) {
    if (!openListId) return;
    const ok = await onRemoveMember(openListId, jobseekerId);
    if (ok) setMembers((prev) => prev.filter((m) => m.jobseekerId !== jobseekerId));
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          + New list
        </Button>
      </div>

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description='Save candidates from Reverse Hiring search into named lists — like "React Devs — Q1 Hiring" — so you can find them again later.'
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="flex flex-col">
              <p className="text-sm font-semibold text-zinc-900">{list.name}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {list.memberCount} candidate{list.memberCount === 1 ? "" : "s"} · created {timeAgo(list.createdAt)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openMembers(list.id)}>
                  View candidates
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Delete the list "${list.name}"? This can't be undone.`)) {
                      onDelete(list.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New list">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="List name"
            placeholder="e.g. React Devs — Q1 Hiring"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newName.trim() || submitting}>
              {submitting ? "Creating…" : "Create list"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!openList} onClose={() => setOpenListId(null)} title={openList?.name} wide>
        {loadingMembers ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-zinc-400">No candidates saved to this list yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {members.map((m) => (
              <li key={m.jobseekerId} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{m.name}</p>
                  <p className="truncate text-xs text-zinc-400">{m.headline || "No headline"}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.jobseekerId)}
                  className="shrink-0 text-xs font-medium text-rose-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

function PipelineTab({
  entries,
  onSetStage,
  onRemove,
}: {
  entries: PipelineEntry[];
  onSetStage: (jobseekerId: string, stage: PipelineStage) => Promise<boolean>;
  onRemove: (jobseekerId: string) => Promise<boolean>;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No candidates in your pipeline yet"
        description='Add a candidate from Reverse Hiring search with "Add to pipeline" to start tracking them through Sourced → Contacted → Trial Sent → Hired.'
      />
    );
  }

  return (
    <div className="grid gap-4 overflow-x-auto pb-2 sm:grid-cols-2 xl:grid-cols-5">
      {PIPELINE_STAGES.map((stage) => {
        const stageEntries = entries.filter((e) => e.stage === stage);
        return (
          <div key={stage} className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{STAGE_LABELS[stage]}</p>
              <span className="rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-500">{stageEntries.length}</span>
            </div>
            <div className="space-y-2">
              {stageEntries.map((entry) => (
                <Card key={entry.jobseekerId} className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar name={entry.name} size={7} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{entry.name}</p>
                      <p className="truncate text-xs text-zinc-400">{entry.headline || "No headline"}</p>
                    </div>
                  </div>
                  <Select
                    value={entry.stage}
                    onChange={(e) => onSetStage(entry.jobseekerId, e.target.value as PipelineStage)}
                    className="mb-2 text-xs"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => onRemove(entry.jobseekerId)}
                    className="text-xs font-medium text-zinc-400 hover:text-rose-500 hover:underline"
                  >
                    Remove from pipeline
                  </button>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamTab({
  team,
  currentUserId,
  onInvite,
  onRemove,
}: {
  team: TeamInfo | null;
  currentUserId: string;
  onInvite: (email: string) => Promise<boolean>;
  onRemove: (teammateId: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isOwner = team?.members.find((m) => m.id === currentUserId)?.isOwner ?? false;

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setSent(false);
    const ok = await onInvite(email.trim());
    setSending(false);
    if (ok) {
      setEmail("");
      setSent(true);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Team members</h2>
        {!team || team.members.length === 0 ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {team.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {m.name} {m.isOwner ? <span className="text-xs font-normal text-indigo-600">(Owner)</span> : null}
                  </p>
                  <p className="truncate text-xs text-zinc-400">{m.email}</p>
                </div>
                {isOwner && !m.isOwner ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${m.name} from your team?`)) onRemove(m.id);
                    }}
                    className="shrink-0 text-xs font-medium text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {team && team.pendingInvites.length > 0 ? (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Pending invites</p>
            <ul className="space-y-2">
              {team.pendingInvites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between text-sm text-zinc-600">
                  <span className="truncate">{inv.email}</span>
                  <span className="shrink-0 text-xs text-zinc-400">expires {timeAgo(inv.expiresAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-zinc-900">Invite a teammate</h2>
        <p className="mb-4 text-sm text-zinc-500">
          They&apos;ll get an email to create their own login — once they join, they share the same Talent
          Pool lists and pipeline as you.
        </p>
        <form onSubmit={handleInvite} className="space-y-3">
          <Input
            label="Work email"
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
            required
          />
          <Button type="submit" disabled={!email.trim() || sending}>
            {sending ? "Sending invite…" : "Send invite"}
          </Button>
          {sent ? <p className="text-sm text-emerald-600">Invite sent!</p> : null}
        </form>
      </Card>
    </div>
  );
}
