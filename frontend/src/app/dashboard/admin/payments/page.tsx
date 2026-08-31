"use client";

import { useApp } from "@/lib/store";
import { getUserById, formatPeso, formatDate } from "@/lib/helpers";
import { Card, PageHeader, StatCard } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminPayments() {
  const { db } = useApp();
  const payments = [...db.payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const released = payments.filter((p) => p.status === "released").reduce((s, p) => s + p.amount, 0);
  const inEscrow = payments.filter((p) => p.status === "in_escrow").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments" description="Escrow-style ledger for micro job payouts." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Released" value={formatPeso(released)} tone="emerald" />
        <StatCard label="In escrow" value={formatPeso(inEscrow)} tone="amber" />
        <StatCard label="Total transactions" value={payments.length} tone="indigo" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-5 py-3 font-medium">Micro job</th>
              <th className="px-5 py-3 font-medium">Employer</th>
              <th className="px-5 py-3 font-medium">Jobseeker</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payments.map((p) => {
              const microJob = db.microJobs.find((mj) => mj.id === p.microJobId);
              const employer = getUserById(db, p.employerId);
              const jobseeker = getUserById(db, p.jobseekerId);
              return (
                <tr key={p.id}>
                  <td className="px-5 py-3 text-zinc-800">{microJob?.title || "—"}</td>
                  <td className="px-5 py-3 text-zinc-500">{employer?.companyName}</td>
                  <td className="px-5 py-3 text-zinc-500">{jobseeker?.name}</td>
                  <td className="px-5 py-3 font-medium text-zinc-900">{formatPeso(p.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{formatDate(p.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
