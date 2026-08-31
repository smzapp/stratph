import type { AppDb, MicroJob, Applicant, ActivityEntry, Offer, User, SkillGap } from "./types";

export function formatPeso(amount: number): string {
  return `₱${Number(amount).toLocaleString("en-PH")}`;
}

export function timeAgo(isoDate?: string | null): string {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getUserById(db: AppDb, id: string): User | null {
  return db.users.find((u) => u.id === id) || null;
}

export function getMicroJobsForEmployer(db: AppDb, employerId: string): MicroJob[] {
  return db.microJobs.filter((mj) => mj.employerId === employerId);
}

export function getApplicationsForJobseeker(
  db: AppDb,
  jobseekerId: string,
): { microJob: MicroJob; applicant: Applicant }[] {
  return db.microJobs
    .map((mj) => {
      const applicant = mj.applicants.find((a) => a.jobseekerId === jobseekerId);
      return applicant ? { microJob: mj, applicant } : null;
    })
    .filter((entry): entry is { microJob: MicroJob; applicant: Applicant } => entry !== null);
}

export function getActivityForJobseeker(db: AppDb, jobseekerId: string): ActivityEntry[] {
  return db.activity
    .filter((a) => a.jobseekerId === jobseekerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getOffersForJobseeker(db: AppDb, jobseekerId: string): Offer[] {
  return db.offers.filter((o) => o.jobseekerId === jobseekerId);
}

export function getOffersForEmployer(db: AppDb, employerId: string): Offer[] {
  return db.offers.filter((o) => o.employerId === employerId);
}

export function getCompletedMicroJobsCount(db: AppDb, jobseekerId: string): number {
  return db.microJobs.filter((mj) =>
    mj.applicants.some(
      (a) =>
        a.jobseekerId === jobseekerId &&
        (a.status === "approved" || a.status === "upgraded"),
    ),
  ).length;
}

export function getLastActiveDate(db: AppDb, jobseekerId: string): string | null {
  const entries = getActivityForJobseeker(db, jobseekerId);
  return entries.length ? entries[0].date : null;
}

export function getSkillGap(userSkills: string[], requiredSkills: string[]): SkillGap {
  const owned = new Set(userSkills.map((s) => s.toLowerCase()));
  const matched = requiredSkills.filter((s) => owned.has(s.toLowerCase()));
  const missing = requiredSkills.filter((s) => !owned.has(s.toLowerCase()));
  const percent = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 100;
  return { matched, missing, percent };
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
