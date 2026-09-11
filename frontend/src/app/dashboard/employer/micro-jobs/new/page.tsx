"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { formatPeso, isSubscriptionActive } from "@/lib/helpers";
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from "@/components/ui/Primitives";
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

const TIPS = [
  {
    icon: "⏱️",
    title: "Keep it small",
    body: "2 hours to 3 days is the sweet spot. Small, finishable tasks get more applicants and faster submissions.",
  },
  {
    icon: "🎯",
    title: "Be specific",
    body: "“Fix the checkout bug on mobile Safari” beats “fix some bugs.” Vague briefs get vague work.",
  },
  {
    icon: "📎",
    title: "Name the deliverable",
    body: "Say exactly what you want back — a link, a file, a screen recording — so submissions are easy to judge.",
  },
  {
    icon: "💰",
    title: "Price it fairly",
    body: "Match the pay to the time and skill required. Fair pay attracts stronger candidates.",
  },
  {
    icon: "🔒",
    title: "Escrow protected",
    body: "Your payment is held by StratPH the moment you post. It only releases to the jobseeker once you approve their work.",
  },
];

export default function NewMicroJobPage() {
  const router = useRouter();
  const { settings, currentUser, postMicroJob } = useApp();
  const [form, setForm] = useState<MicroJobFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const isSubscribed = isSubscriptionActive(currentUser);
  const skillsPreview = form.skillsRequired
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || submitting) return;
    setSubmitting(true);
    await postMicroJob(currentUser.id, {
      ...form,
      pay: Number(form.pay),
      skillsRequired: skillsPreview,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      minYearsOfExperience: form.minYearsOfExperience ? Number(form.minYearsOfExperience) : undefined,
      minProfileCompleteness: form.minProfileCompleteness ? Number(form.minProfileCompleteness) : undefined,
    });
    setSubmitting(false);
    router.push("/dashboard/employer/micro-jobs");
  }

  return (
    <div>
      <Link
        href="/dashboard/employer/micro-jobs"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Trial Tasks
      </Link>

      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Post a Trial Task"
        description="Describe one small, real piece of work. StratPH holds the pay in escrow until you approve the submission."
      />

      {!isSubscribed ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <p className="text-sm text-amber-800">
            An active subscription is required to post Trial Tasks.{" "}
            <Link href="/pricing" className="font-medium underline">
              Subscribe on the Pricing page →
            </Link>
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreate} className="space-y-6 lg:col-span-2">
            <Card>
              <p className="mb-4 text-sm font-semibold text-zinc-900">The basics</p>
              <div className="space-y-4">
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
              </div>
            </Card>

            <Card>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">The task</p>
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-400"
                  title="Coming soon: we'll draft this for you based on the skills you require below."
                >
                  ✨ Auto-generate <Badge tone="indigo" className="!px-1.5 !py-0 !text-[10px]">Soon</Badge>
                </span>
              </div>
              <div className="space-y-4">
                <Textarea
                  label="Task description"
                  rows={5}
                  placeholder="Describe exactly what needs to be done…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
                <Textarea
                  label="What should they submit?"
                  rows={3}
                  placeholder="e.g. Link to the deployed fix + a short screen recording"
                  value={form.deliverable}
                  onChange={(e) => setForm({ ...form, deliverable: e.target.value })}
                  required
                />
              </div>
            </Card>

            <Card>
              <p className="mb-4 text-sm font-semibold text-zinc-900">Pay &amp; skills</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Pay (₱300–₱3,000)"
                  type="number"
                  min={300}
                  max={3000}
                  step={50}
                  value={form.pay}
                  onChange={(e) => setForm({ ...form, pay: e.target.value })}
                  hint="Held in escrow and released to the jobseeker once you approve their work."
                  required
                />
                <Input
                  label="Skills required (comma-separated)"
                  placeholder="React, CSS"
                  value={form.skillsRequired}
                  onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                  hint="These will power auto-generated descriptions once that feature ships."
                />
              </div>
            </Card>

            <Card>
              <p className="mb-1 text-sm font-semibold text-zinc-900">Who can apply?</p>
              <p className="mb-4 text-xs text-zinc-400">Optional restrictions — leave blank to let anyone apply.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Applications close on"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  hint="Leave blank to close manually."
                />
                <Input
                  label="Min. years of experience"
                  type="number"
                  min={0}
                  max={60}
                  placeholder="e.g. 2"
                  value={form.minYearsOfExperience}
                  onChange={(e) => setForm({ ...form, minYearsOfExperience: e.target.value })}
                />
                <Input
                  label="Min. profile completeness %"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 70"
                  value={form.minProfileCompleteness}
                  onChange={(e) => setForm({ ...form, minProfileCompleteness: e.target.value })}
                />
              </div>
            </Card>

            <p className="text-xs text-zinc-400">
              {settings?.microJobAutoApprove
                ? "New postings go live immediately for jobseekers to see."
                : "New postings go through a quick admin review before appearing to jobseekers."}
            </p>

            <div className="flex justify-end gap-2">
              <Link href="/dashboard/employer/micro-jobs">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting…" : "Post Trial Task"}
              </Button>
            </div>
          </form>

          <div className="space-y-6">
            <Card className="border-indigo-200 bg-indigo-50/40">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">Preview</p>
              <p className="mb-3 text-xs text-zinc-500">How this looks to jobseekers</p>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <Badge tone="indigo">{form.category}</Badge>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {form.title || "Your Trial Task title"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{form.estimatedTime || "Estimated time"}</p>
                {skillsPreview.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skillsPreview.map((s) => (
                      <Badge key={s} tone="zinc">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-lg font-bold text-zinc-900">
                  {formatPeso(Number(form.pay) || 0)}
                  <span className="ml-1 text-xs font-normal text-zinc-400">held in escrow</span>
                </p>
              </div>
            </Card>

            <Card>
              <p className="mb-4 text-sm font-semibold text-zinc-900">Tips for a great Trial Task</p>
              <ul className="space-y-4">
                {TIPS.map((tip) => (
                  <li key={tip.title} className="flex gap-3">
                    <span className="text-lg leading-none">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{tip.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{tip.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
