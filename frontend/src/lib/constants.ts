// Shared option lists used across posting forms, profile editing, and search filters.

export const CATEGORIES = [
  "Web Development",
  "Data Entry",
  "Video Editing",
  "Customer Support",
  "Writing",
  "Design",
  "Other",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"];

export const REPORT_REASONS: { label: string; value: string }[] = [
  { label: "Scam or fraud", value: "scam" },
  { label: "Did not pay for completed work", value: "non_payment" },
  { label: "Inappropriate behavior", value: "inappropriate" },
  { label: "Other", value: "other" },
];
