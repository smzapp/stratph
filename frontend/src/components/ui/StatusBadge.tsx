import { Badge } from "@/components/ui/Primitives";
import type { Tone } from "@/lib/types";

const MAP: Record<string, { tone: Tone; label: string }> = {
  applied: { tone: "zinc", label: "Applied" },
  in_progress: { tone: "sky", label: "In progress" },
  submitted: { tone: "amber", label: "Submitted" },
  approved: { tone: "emerald", label: "Approved" },
  rejected: { tone: "rose", label: "Not selected" },
  upgraded: { tone: "indigo", label: "Upgraded" },
  pending: { tone: "amber", label: "Pending" },
  accepted: { tone: "emerald", label: "Accepted" },
  declined: { tone: "rose", label: "Declined" },
  open: { tone: "emerald", label: "Open" },
  closed: { tone: "zinc", label: "Closed" },
  active: { tone: "emerald", label: "Active" },
  suspended: { tone: "rose", label: "Suspended" },
  released: { tone: "emerald", label: "Released" },
  in_escrow: { tone: "amber", label: "In escrow" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = MAP[status] || { tone: "zinc" as Tone, label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
