export enum Role {
  JOBSEEKER = 'jobseeker',
  EMPLOYER = 'employer',
  ADMIN = 'superadmin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum MicroJobStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApplicantStatus {
  APPLIED = 'applied',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UPGRADED = 'upgraded',
}

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum PaymentStatus {
  RELEASED = 'released',
  IN_ESCROW = 'in_escrow',
}

export enum ActivityType {
  MICRO_JOB_COMPLETED = 'micro_job_completed',
  PROFILE_UPDATE = 'profile_update',
  SKILL_VERIFIED = 'skill_verified',
  UPGRADED = 'upgraded',
}
