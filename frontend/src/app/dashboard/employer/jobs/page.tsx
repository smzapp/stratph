"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "@/lib/store";
import { timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";

interface JobFormState {
  title: string;
  type: string;
  location: string;
  salaryRange: string;
  skillsRequired: string;
}

const EMPTY_FORM: JobFormState = {
  title: "",
  type: "Full-time",
  location: "",
  salaryRange: "",
  skillsRequired: "",
};

export default function EmployerJobPostings() {
  const { db, currentUser, postJob } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);

  if (!currentUser) return null;

  const myJobs = db.jobs
    .filter((j) => j.employerId === currentUser.id)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser) return;
    postJob(currentUser.id, {
      ...form,
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
        title="Job Postings"
        description="Traditional full-time and part-time roles, for candidates who'd rather apply directly."
        actions={<Button onClick={() => setOpen(true)}>Post a job</Button>}
      />

      {myJobs.length === 0 ? (
        <EmptyState title="No job postings yet" action={<Button onClick={() => setOpen(true)}>Post your first job</Button>} />
      ) : (
        <div className="space-y-4">
          {myJobs.map((job) => (
            <Card key={job.id} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone="sky">{job.type}</Badge>
                  <span className="text-xs text-zinc-400">Posted {timeAgo(job.postedAt)}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                <p className="text-sm text-zinc-500">
                  {job.location} · {job.salaryRange}
                </p>
                {job.skillsRequired.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.skillsRequired.map((s) => (
                      <Badge key={s} tone="zinc">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-zinc-500">{job.applicants} applicants</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a job">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
          </Select>
          <Input
            label="Location"
            placeholder="e.g. Remote (PH)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <Input
            label="Salary range"
            placeholder="e.g. ₱30,000 - ₱45,000 / month"
            value={form.salaryRange}
            onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
            required
          />
          <Input
            label="Skills required (comma-separated)"
            placeholder="React, JavaScript, CSS, Git"
            hint="Powers the AI Career Gap Analyzer for jobseekers."
            value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Post job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
