"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getMicroJobsForEmployer, formatPeso, timeAgo } from "@/lib/helpers";
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

const CATEGORIES = [
  "Web Development",
  "Data Entry",
  "Video Editing",
  "Customer Support",
  "Writing",
  "Design",
  "Other",
];

const EMPTY_FORM = {
  title: "",
  category: CATEGORIES[0],
  description: "",
  deliverable: "",
  pay: 500,
  estimatedTime: "1 day",
  skillsRequired: "",
};

export default function EmployerMicroJobs() {
  const { db, currentUser, postMicroJob } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const myMicroJobs = getMicroJobsForEmployer(db, currentUser.id).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  function handleCreate(e) {
    e.preventDefault();
    postMicroJob(currentUser.id, {
      ...form,
      pay: Number(form.pay),
      skillsRequired: form.skillsRequired
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Micro Jobs"
        description="Post a small, paid task. Great performers can be upgraded instantly — no separate hiring process."
        actions={<Button onClick={() => setOpen(true)}>Post a micro job</Button>}
      />

      {myMicroJobs.length === 0 ? (
        <EmptyState
          title="You haven't posted a micro job yet"
          description="Turn a real task into a paid audition and see who delivers."
          action={<Button onClick={() => setOpen(true)}>Post your first micro job</Button>}
        />
      ) : (
        <div className="space-y-4">
          {myMicroJobs.map((mj) => {
            const submitted = mj.applicants.filter((a) => a.status === "submitted").length;
            return (
              <Link key={mj.id} href={`/dashboard/employer/micro-jobs/${mj.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <Badge tone="indigo">{mj.category}</Badge>
                        {mj.moderation === "pending" ? (
                          <Badge tone="amber">Pending review</Badge>
                        ) : null}
                        {submitted > 0 ? <Badge tone="rose">{submitted} to review</Badge> : null}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">{mj.title}</p>
                      <p className="text-xs text-zinc-400">
                        {formatPeso(mj.pay)} · {mj.applicants.length} applicant
                        {mj.applicants.length === 1 ? "" : "s"} · posted {timeAgo(mj.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={mj.status} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a micro job" wide>
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
              required
            />
            <Input
              label="Skills required (comma-separated)"
              placeholder="React, CSS"
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            />
          </div>
          <p className="text-xs text-zinc-400">
            New postings go through a quick admin review before appearing to jobseekers.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Post micro job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
