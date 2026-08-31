"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getUserById, formatPeso, timeAgo } from "@/lib/helpers";
import { APPLICANT_STATUSES } from "@/lib/types";
import { Avatar, Badge, Button, Card, Select, Textarea } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { OfferType } from "@/lib/types";

const UPGRADE_TYPES: OfferType[] = ["Part-time", "Contract", "Full-time"];

export default function EmployerMicroJobDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, reviewSubmission, upgradeCandidate } = useApp();
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [offerType, setOfferType] = useState<OfferType>(UPGRADE_TYPES[0]);
  const [offerMessage, setOfferMessage] = useState("");

  const microJob = db.microJobs.find((mj) => mj.id === id);

  if (!microJob) {
    return (
      <Card>
        <p className="text-sm text-zinc-500">Trial task not found.</p>
        <Link href="/dashboard/employer/micro-jobs" className="mt-3 inline-block text-sm text-indigo-600">
          ← Back to trial tasks
        </Link>
      </Card>
    );
  }

  function openUpgrade(jobseekerId: string) {
    setUpgradeTarget(jobseekerId);
    setOfferType(UPGRADE_TYPES[0]);
    setOfferMessage("Great work on the trial task — want to keep going with us?");
  }

  function confirmUpgrade() {
    if (!upgradeTarget || !microJob) return;
    upgradeCandidate(microJob.id, upgradeTarget, offerType, offerMessage);
    setUpgradeTarget(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.back()} className="mb-4 text-sm text-zinc-500 hover:text-zinc-700">
        ← Back
      </button>

      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge tone="indigo">{microJob.category}</Badge>
            <h1 className="mt-2 text-lg font-semibold text-zinc-900">{microJob.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {formatPeso(microJob.pay)} held in escrow · {microJob.estimatedTime}
            </p>
          </div>
          <StatusBadge status={microJob.status} />
        </div>
        <p className="mt-4 text-sm text-zinc-600">{microJob.description}</p>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-zinc-900">
        Applicants ({microJob.applicants.length})
      </h2>

      {microJob.applicants.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-400">No applicants yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {microJob.applicants.map((applicant) => {
            const candidate = getUserById(db, applicant.jobseekerId);
            const draftKey = applicant.jobseekerId;
            return (
              <Card key={applicant.jobseekerId}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={candidate?.name} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{candidate?.name}</p>
                      <p className="text-xs text-zinc-400">{candidate?.headline}</p>
                    </div>
                  </div>
                  <StatusBadge status={applicant.status} />
                </div>

                {applicant.submission ? (
                  <div className="mb-3 rounded-lg bg-zinc-50 p-3 text-sm">
                    <p className="text-zinc-700">{applicant.submission.note}</p>
                    {applicant.submission.link ? (
                      <a
                        href={applicant.submission.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block break-all text-indigo-600 underline"
                      >
                        {applicant.submission.link}
                      </a>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-400">
                      Submitted {timeAgo(applicant.submission.submittedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-zinc-400">Applied {timeAgo(applicant.appliedAt)}. Waiting on their submission.</p>
                )}

                {applicant.feedback ? (
                  <p className="mb-3 text-sm italic text-zinc-500">{`Your feedback: "${applicant.feedback}"`}</p>
                ) : null}

                {applicant.status === APPLICANT_STATUSES.SUBMITTED ? (
                  <div className="space-y-2 border-t border-zinc-100 pt-3">
                    <Textarea
                      rows={2}
                      placeholder="Optional feedback for the candidate…"
                      value={feedbackDrafts[draftKey] || ""}
                      onChange={(e) =>
                        setFeedbackDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          reviewSubmission(
                            microJob.id,
                            applicant.jobseekerId,
                            APPLICANT_STATUSES.APPROVED,
                            feedbackDrafts[draftKey] || "",
                          )
                        }
                      >
                        Approve &amp; release {formatPeso(microJob.pay)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewSubmission(
                            microJob.id,
                            applicant.jobseekerId,
                            APPLICANT_STATUSES.REJECTED,
                            feedbackDrafts[draftKey] || "",
                          )
                        }
                      >
                        Not a fit
                      </Button>
                    </div>
                  </div>
                ) : null}

                {applicant.status === APPLICANT_STATUSES.APPROVED ? (
                  <div className="border-t border-zinc-100 pt-3">
                    <Button size="sm" onClick={() => openUpgrade(applicant.jobseekerId)}>
                      Upgrade to part-time / contract / full-time
                    </Button>
                  </div>
                ) : null}

                {applicant.status === APPLICANT_STATUSES.UPGRADED ? (
                  <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                    Upgrade offer sent. Waiting for their response.
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!upgradeTarget} onClose={() => setUpgradeTarget(null)} title="Send an upgrade offer">
        <div className="space-y-4">
          <Select label="Upgrade to" value={offerType} onChange={(e) => setOfferType(e.target.value)}>
            {UPGRADE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Textarea
            label="Message"
            rows={3}
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUpgradeTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade}>Send offer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
