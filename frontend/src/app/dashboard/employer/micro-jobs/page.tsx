"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getMicroJobsForEmployer, formatDate, formatPeso, isSubscriptionActive, timeAgo } from "@/lib/helpers";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORIES } from "@/lib/constants";

interface MicroJobFormState {
  title: string;
  category: string;
  description: string;
  deliverable: string;
  pay: string;
  estimatedTime: string;
  skillsRequired: string;
  expiresAt: string;
  minYearsOfExperience: string;
  minProfileCompleteness: string;
}

const EMPTY_FORM: MicroJobFormState = {
  title: "",
  category: CATEGORIES[0],
  description: "",
  deliverable: "",
  pay: "500",
  estimatedTime: "1 day",
  skillsRequired: "",
  expiresAt: "",
  minYearsOfExperience: "",
  minProfileCompleteness: "",
};

export default function EmployerMicroJobs() {
  const { db, settings, currentUser, postMicroJob, closeMicroJob } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MicroJobFormState>(EMPTY_FORM);

  if (!currentUser) return null;

  const myMicroJobs = getMicroJobsForEmployer(db, currentUser.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const isSubscribed = isSubscriptionActive(currentUser);

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser) return;
    postMicroJob(currentUser.id, {
      ...form,
      pay: Number(form.pay),
      skillsRequired: form.skillsRequired
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      minYearsOfExperience: form.minYearsOfExperience ? Number(form.minYearsOfExperience) : undefined,
      minProfileCompleteness: form.minProfileCompleteness ? Number(form.minProfileCompleteness) : undefined,
    });
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Trial Tasks"
        description="Post a small, paid task. Great performers can be upgraded instantly — no separate hiring process."
        actions={
          <Button onClick={() => setOpen(true)} disabled={!isSubscribed} title={!isSubscribed ? "Requires an active subscription" : undefined}>
            Post a Trial Task
          </Button>
        }
      />

      <Card className={`mb-6 ${isSubscribed ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}`}>
        {isSubscribed ? (
          <p className="text-sm text-emerald-800">
            ✓ Your <span className="font-semibold capitalize">{currentUser.subscriptionPlan}</span> plan lets you post
            unlimited Trial Tasks. StratPH holds each task&apos;s pay in escrow and releases it to the jobseeker once
            you approve their work.
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            An active subscription is required to post Trial Tasks.{" "}
            <Link href="/pricing" className="font-medium underline">
              Subscribe on the Pricing page →
            </Link>
          </p>
        )}
      </Card>

      {myMicroJobs.length === 0 ? (
        <EmptyState
          title="You haven't posted a Trial Task yet"
          description="Turn a real task into a paid work trial and see who delivers."
          action={
            <Button onClick={() => setOpen(true)} disabled={!isSubscribed}>
              Post your first Trial Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {myMicroJobs.map((mj) => {
            const submitted = mj.applicants.filter((a) => a.status === "submitted").length;
            return (
              <Card key={mj.id} className="transition-shadow hover:shadow-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <Link href={`/dashboard/employer/micro-jobs/${mj.id}`} className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="indigo">{mj.category}</Badge>
                      {mj.moderation === "pending" ? <Badge tone="amber">Pending review</Badge> : null}
                      {submitted > 0 ? <Badge tone="rose">{submitted} to review</Badge> : null}
                      {mj.minYearsOfExperience !== null ? (
                        <Badge tone="zinc">Requires {mj.minYearsOfExperience}+ yrs exp</Badge>
                      ) : null}
                      {mj.minProfileCompleteness !== null ? (
                        <Badge tone="zinc">Requires {mj.minProfileCompleteness}%+ profile</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{mj.title}</p>
                    <p className="text-xs text-zinc-400">
                      {formatPeso(mj.pay)} held in escrow · {mj.applicants.length} applicant
                      {mj.applicants.length === 1 ? "" : "s"} · posted {timeAgo(mj.createdAt)}
                      {mj.expiresAt ? ` · closes ${formatDate(mj.expiresAt)}` : ""}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={mj.status} />
                    {mj.status === "open" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm("Close this Trial Task? Jobseekers won't be able to apply anymore.")) {
                            closeMicroJob(mj.id);
                          }
                        }}
                      >
                        Close
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a Trial Task" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Fix one broken checkout button"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label="Estimated time"
              placeholder="e.g. 4 hours"
              value={form.estimatedTime}
              onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Task description"
            rows={3}
            placeholder="Describe exactly what needs to be done…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <Textarea
            label="What should they submit?"
            rows={2}
            placeholder="e.g. Link to the deployed fix + a short screen recording"
            value={form.deliverable}
            onChange={(e) => setForm({ ...form, deliverable: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Pay (₱300–₱3,000)"
              type="number"
              min={300}
              max={3000}
              step={50}
              value={form.pay}
              onChange={(e) => setForm({ ...form, pay: e.target.value })}
              hint="StratPH holds this amount in escrow and releases it to the jobseeker once you approve their work."
              required
            />
            <Input
              label="Skills required (comma-separated)"
              placeholder="React, CSS"
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            />
          </div>
          <Input
            label="Applications close on (optional)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            hint="Leave blank to keep this Trial Task open until you close it manually."
          />
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="mb-3 text-sm font-medium text-zinc-700">Who can apply? (optional restrictions)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minimum years of experience"
                type="number"
                min={0}
                max={60}
                placeholder="e.g. 2"
                value={form.minYearsOfExperience}
                onChange={(e) => setForm({ ...form, minYearsOfExperience: e.target.value })}
              />
              <Input
                label="Minimum profile completeness %"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 70"
                value={form.minProfileCompleteness}
                onChange={(e) => setForm({ ...form, minProfileCompleteness: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            {settings?.microJobAutoApprove
              ? "New postings go live immediately for jobseekers to see."
              : "New postings go through a quick admin review before appearing to jobseekers."}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Post Trial Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
