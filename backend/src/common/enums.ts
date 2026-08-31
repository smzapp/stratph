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
  EXPIRED = 'expired',
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

export enum ActivityType {
  MICRO_JOB_COMPLETED = 'micro_job_completed',
  PROFILE_UPDATE = 'profile_update',
  SKILL_VERIFIED = 'skill_verified',
  UPGRADED = 'upgraded',
}

export enum NotificationType {
  MICRO_JOB_PENDING = 'micro_job_pending',
  MICRO_JOB_APPROVED = 'micro_job_approved',
  MICRO_JOB_REJECTED = 'micro_job_rejected',
  MICRO_JOB_INVITE = 'micro_job_invite',
  JOB_PENDING = 'job_pending',
  JOB_APPROVED = 'job_approved',
  JOB_REJECTED = 'job_rejected',
  SUBMISSION_RECEIVED = 'submission_received',
  SUBMISSION_REVIEWED = 'submission_reviewed',
  OFFER_RECEIVED = 'offer_received',
  OFFER_RESPONDED = 'offer_responded',
  EMPLOYER_VERIFIED = 'employer_verified',
  EMPLOYER_PENDING_VERIFICATION = 'employer_pending_verification',
  SUBSCRIPTION_ACTIVATED = 'subscription_activated',
  CONTACT_MESSAGE = 'contact_message',
  EMPLOYER_REPORTED = 'employer_reported',
}

export enum SubscriptionPlan {
  PRO = 'pro',
  BUSINESS = 'business',
}

export enum ReportReason {
  SCAM = 'scam',
  NON_PAYMENT = 'non_payment',
  INAPPROPRIATE = 'inappropriate',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}
