"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getUserById, formatPeso, formatDate } from "@/lib/helpers";
import { Badge, Button, Card, Textarea, Input } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReportEmployerButton } from "@/components/ReportEmployerButton";

export default function MicroJobDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, currentUser, applyToMicroJob, submitDeliverable } = useApp();
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");

  if (!currentUser) return null;

  const microJob = db.microJobs.find((mj) => mj.id === id);

  if (!microJob) {
    return (
      <Card>
        <p className="text-sm text-zinc-500">This Trial Task could not be found.</p>
        <Link href="/dashboard/jobseeker/micro-jobs" className="mt-3 inline-block text-sm text-indigo-600">
          ← Back to Trial Tasks
        </Link>
      </Card>
    );
  }

  const employer = getUserById(db, microJob.employerId);
  const myApplication = microJob.applicants.find((a) => a.jobseekerId === currentUser.id);

  const meetsExperience =
    microJob.minYearsOfExperience === null || (currentUser.yearsOfExperience ?? 0) >= microJob.minYearsOfExperience;

  function handleApply() {
    applyToMicroJob(microJob!.id, currentUser!.id);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitDeliverable(microJob!.id, currentUser!.id, { note, link });
    setNote("");
    setLink("");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.back()} className="mb-4 text-sm text-zinc-500 hover:text-zinc-700">
        ← Back
      </button>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <Badge tone="indigo">{microJob.category}</Badge>
            <h1 className="mt-2 text-lg font-semibold text-zinc-900">{microJob.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {employer?.companyName} · Posted {formatDate(microJob.createdAt)}
            </p>
            {employer ? (
              <div className="mt-1">
                <ReportEmployerButton
                  employerId={employer.id}
                  employerName={employer.companyName || employer.name}
                  contextLabel={`Trial Task: ${microJob.title}`}
                />
              </div>
            ) : null}
          </div>
          {myApplication ? <StatusBadge status={myApplication.status} /> : null}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-400">Pay (held in escrow)</p>
            <p className="text-sm font-semibold text-emerald-600">{formatPeso(microJob.pay)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Estimated time</p>
            <p className="text-sm font-medium text-zinc-800">{microJob.estimatedTime}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Skills</p>
            <p className="text-sm font-medium text-zinc-800">{microJob.skillsRequired.join(", ")}</p>
          </div>
        </div>

        {microJob.minYearsOfExperience !== null || microJob.minProfileCompleteness !== null ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {microJob.minYearsOfExperience !== null ? (
              <Badge tone={meetsExperience ? "zinc" : "rose"}>
                Requires {microJob.minYearsOfExperience}+ years of experience
              </Badge>
            ) : null}
            {microJob.minProfileCompleteness !== null ? (
              <Badge tone="zinc">Requires {microJob.minProfileCompleteness}%+ profile completeness</Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mb-4">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900">Task</h2>
          <p className="text-sm text-zinc-600">{microJob.description}</p>
        </div>

        <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            What to submit
          </p>
          <p className="mt-1 text-sm text-indigo-900">{microJob.deliverable}</p>
        </div>

        {!myApplication ? (
          <>
            <Button onClick={handleApply} disabled={!meetsExperience}>
              Apply for this Trial Task
            </Button>
            {!meetsExperience ? (
              <p className="mt-2 text-xs text-rose-600">
                You don&apos;t meet the minimum {microJob.minYearsOfExperience} years of experience for this task.
              </p>
            ) : null}
          </>
        ) : myApplication.status === "applied" || myApplication.status === "in_progress" ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-zinc-100 pt-5">
            {myApplication.invited ? (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                ✉️ {employer?.companyName || "This employer"} invited you to this Trial Task.
              </p>
            ) : null}
            <h2 className="text-sm font-semibold text-zinc-900">Submit your work</h2>
            <Input
              label="Link to your work"
              placeholder="https://…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />
            <Textarea
              label="Notes for the employer"
              rows={3}
              placeholder="What you did, anything they should check first…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit">Submit deliverable</Button>
          </form>
        ) : myApplication.status === "submitted" ? (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Submitted — waiting for {employer?.companyName} to review your work. {formatPeso(microJob.pay)} is held
            in escrow until they decide.
          </div>
        ) : myApplication.status === "approved" ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            ✅ Approved! {myApplication.feedback ? `"${myApplication.feedback}" ` : ""}
            {formatPeso(microJob.pay)} has been released to you.
          </div>
        ) : myApplication.status === "upgraded" ? (
          <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
            🎉 This employer sent you an upgrade offer.{" "}
            <Link href="/dashboard/jobseeker/offers" className="font-medium underline">
              View it in Offers
            </Link>
            .
          </div>
        ) : (
          <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
            Not selected this time. {myApplication.feedback ? `"${myApplication.feedback}" ` : ""}
            The {formatPeso(microJob.pay)} held for this task has been returned to the employer.
          </div>
        )}
      </Card>
    </div>
  );
}
