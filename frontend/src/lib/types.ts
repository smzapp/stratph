// Shared domain types for the StratPH UI prototype.

export type Tone = "zinc" | "indigo" | "emerald" | "amber" | "rose" | "sky";

export const ROLES = {
  JOBSEEKER: "jobseeker",
  EMPLOYER: "employer",
  ADMIN: "superadmin",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const MICRO_JOB_STATUSES = {
  OPEN: "open",
  CLOSED: "closed",
} as const;
export type MicroJobStatus = (typeof MICRO_JOB_STATUSES)[keyof typeof MICRO_JOB_STATUSES];

export const APPLICANT_STATUSES = {
  APPLIED: "applied",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  UPGRADED: "upgraded",
} as const;
export type ApplicantStatus = (typeof APPLICANT_STATUSES)[keyof typeof APPLICANT_STATUSES];

export const OFFER_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;
export type OfferStatus = (typeof OFFER_STATUSES)[keyof typeof OFFER_STATUSES];

export type UserStatus = "active" | "suspended";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "released" | "in_escrow";
export type OfferType = "Part-time" | "Contract" | "Full-time" | string;
export type ActivityType = "micro_job_completed" | "profile_update" | "skill_verified" | "upgraded";

// A single, loosely-typed User shape (role-specific fields are optional)
// rather than a discriminated union — the mock DB stores every role in one
// array and most UI reads fields defensively (`user.companyName || user.name`).
export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  status: UserStatus;
  createdAt: string;
  // employer-only
  companyName?: string;
  companyBlurb?: string;
  verified?: boolean;
  // jobseeker-only
  headline?: string;
  location?: string;
  skills?: string[];
  bio?: string;
  discoverable?: boolean;
}

export interface Submission {
  note: string;
  link: string;
  submittedAt: string;
}

export interface Applicant {
  jobseekerId: string;
  status: ApplicantStatus;
  appliedAt: string;
  submission?: Submission;
  feedback?: string;
  reviewedAt?: string;
}

export interface MicroJob {
  id: string;
  employerId: string;
  title: string;
  category: string;
  description: string;
  deliverable: string;
  pay: number;
  estimatedTime: string;
  skillsRequired: string[];
  status: MicroJobStatus;
  createdAt: string;
  moderation: ModerationStatus;
  applicants: Applicant[];
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  type: string;
  location: string;
  salaryRange: string;
  skillsRequired: string[];
  postedAt: string;
  applicants: number;
  status: string;
}

export interface SkillGap {
  matched: string[];
  missing: string[];
  percent: number;
}

export interface ActivityEntry {
  id: string;
  jobseekerId: string;
  type: ActivityType;
  skill: string | null;
  title: string;
  date: string;
}

export interface Offer {
  id: string;
  microJobId: string;
  employerId?: string;
  jobseekerId: string;
  offerType: OfferType;
  message: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  microJobId: string;
  jobseekerId: string;
  employerId: string;
  amount: number;
  status: PaymentStatus;
  date: string;
}

export interface AppDb {
  users: User[];
  microJobs: MicroJob[];
  jobs: Job[];
  activity: ActivityEntry[];
  offers: Offer[];
  payments: Payment[];
}

export interface NewMicroJobInput {
  title: string;
  category: string;
  description: string;
  deliverable: string;
  pay: number;
  estimatedTime: string;
  skillsRequired: string[];
}

export interface NewJobInput {
  title: string;
  type: string;
  location: string;
  salaryRange: string;
  skillsRequired: string[];
}

export interface PlatformSettings {
  id: number;
  microJobAutoApprove: boolean;
}

export interface RegisterJobseekerInput {
  email: string;
  password: string;
  name: string;
  headline?: string;
  location?: string;
  skills?: string[];
}

export interface RegisterEmployerInput {
  email: string;
  password: string;
  name: string;
  companyName: string;
  companyBlurb?: string;
}

export interface LoginResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export interface ProfilePatch {
  name?: string;
  companyName?: string;
  companyBlurb?: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills?: string[];
}

export interface AppContextValue {
  db: AppDb;
  settings: PlatformSettings | null;
  currentUser: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  registerJobseeker: (data: RegisterJobseekerInput) => Promise<LoginResult>;
  registerEmployer: (data: RegisterEmployerInput) => Promise<LoginResult>;
  logout: () => void;
  refresh: () => Promise<void>;
  applyToMicroJob: (microJobId: string, jobseekerId: string) => Promise<void>;
  submitDeliverable: (
    microJobId: string,
    jobseekerId: string,
    submission: { note: string; link: string },
  ) => Promise<void>;
  reviewSubmission: (
    microJobId: string,
    jobseekerId: string,
    decision: ApplicantStatus,
    feedback: string,
  ) => Promise<void>;
  upgradeCandidate: (
    microJobId: string,
    jobseekerId: string,
    offerType: OfferType,
    message: string,
  ) => Promise<void>;
  respondToOffer: (offerId: string, decision: OfferStatus) => Promise<void>;
  postMicroJob: (employerId: string, data: NewMicroJobInput) => Promise<void>;
  postJob: (employerId: string, data: NewJobInput) => Promise<void>;
  toggleDiscoverable: (jobseekerId: string) => Promise<void>;
  updateJobseekerSkills: (jobseekerId: string, skills: string[]) => Promise<void>;
  adminSetUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  adminVerifyEmployer: (employerId: string) => Promise<void>;
  adminModerateMicroJob: (microJobId: string, moderation: ModerationStatus) => Promise<void>;
  updateSettings: (patch: Partial<Pick<PlatformSettings, "microJobAutoApprove">>) => Promise<void>;
  updateMyProfile: (patch: ProfilePatch) => Promise<void>;
  deactivateAccount: () => Promise<void>;
}
