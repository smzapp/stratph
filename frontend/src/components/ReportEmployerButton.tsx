"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "@/lib/store";
import { Button, Select, Textarea } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { REPORT_REASONS } from "@/lib/constants";
import type { ReportReason } from "@/lib/types";

export function ReportEmployerButton({
  employerId,
  employerName,
  contextLabel,
  className,
}: {
  employerId: string;
  employerName?: string;
  contextLabel?: string;
  className?: string;
}) {
  const { reportUser } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("scam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setReason("scam");
    setDetails("");
    setSubmitted(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await reportUser(employerId, reason, details.trim() || undefined, contextLabel);
    setSubmitting(false);
    if (ok) setSubmitted(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs font-medium text-rose-500 hover:text-rose-600 hover:underline ${className ?? ""}`}
      >
        ⚠️ Report
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={`Report ${employerName || "employer"}`}
      >
        {submitted ? (
          <div>
            <p className="text-sm text-emerald-600">
              Thanks — your report has been sent to our Super Admin team for review.
            </p>
            <Button
              className="mt-4"
              size="sm"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Textarea
              label="Details (optional)"
              rows={3}
              placeholder="What happened?"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit report"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
