"use client";

import { useApp } from "@/lib/store";
import { getOffersForJobseeker, getUserById, formatDate } from "@/lib/helpers";
import { OFFER_STATUSES } from "@/lib/mockData";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function JobseekerOffers() {
  const { db, currentUser, respondToOffer } = useApp();
  const offers = getOffersForJobseeker(db, currentUser.id).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Try → Prove → Hire"
        title="Upgrade Offers"
        description="When an employer likes your micro-job work, they can upgrade you straight into ongoing work — no separate interview needed."
      />

      {offers.length === 0 ? (
        <EmptyState
          title="No offers yet"
          description="Do great work on a micro job and employers may offer to upgrade you to part-time, contract, or full-time."
        />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const employer = getUserById(db, offer.employerId);
            const microJob = db.microJobs.find((mj) => mj.id === offer.microJobId);
            return (
              <Card key={offer.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge tone="indigo">{offer.offerType}</Badge>
                      <StatusBadge status={offer.status} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{employer?.companyName}</p>
                    <p className="mt-1 text-sm text-zinc-600">{`"${offer.message}"`}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      Based on: {microJob?.title} · {formatDate(offer.createdAt)}
                    </p>
                  </div>
                  {offer.status === OFFER_STATUSES.PENDING ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => respondToOffer(offer.id, OFFER_STATUSES.ACCEPTED)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToOffer(offer.id, OFFER_STATUSES.DECLINED)}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
