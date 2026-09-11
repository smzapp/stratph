import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity.js';
import { MicroJob } from '../micro-jobs/micro-job.entity.js';
import { Applicant } from '../micro-jobs/applicant.entity.js';
import { Job } from '../jobs/job.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ProfileView } from '../users/profile-view.entity.js';
import { Report } from '../reports/report.entity.js';
import { Recommendation } from '../recommendations/recommendation.entity.js';
import { Follow } from '../follows/follow.entity.js';
import { TalentList } from '../talent/talent-list.entity.js';
import { TalentListMember } from '../talent/talent-list-member.entity.js';
import { CandidatePipelineEntry } from '../talent/candidate-pipeline-entry.entity.js';
import {
  ActivityType,
  ApplicantStatus,
  MicroJobStatus,
  ModerationStatus,
  OfferStatus,
  PipelineStage,
  ReportReason,
  Role,
  SubscriptionPlan,
  UserStatus,
} from '../common/enums.js';

const DEMO_PASSWORD = 'test1234';

const BULK_MICRO_JOB_TEMPLATES: { category: string; title: string; skills: string[] }[] = [
  { category: 'Web Development', title: 'Fix a responsive layout bug on the pricing page', skills: ['React', 'CSS'] },
  { category: 'Web Development', title: 'Add a dark mode toggle to the dashboard', skills: ['React', 'TypeScript'] },
  { category: 'Web Development', title: 'Build a reusable form component library', skills: ['React', 'TypeScript'] },
  { category: 'Web Development', title: 'Optimize bundle size for a Next.js app', skills: ['Next.js', 'Webpack'] },
  { category: 'Web Development', title: 'Set up a CI/CD pipeline with GitHub Actions', skills: ['GitHub Actions', 'Docker'] },
  { category: 'Web Development', title: 'Migrate a class-based React app to hooks', skills: ['React'] },
  { category: 'Web Development', title: 'Add unit tests for the checkout flow', skills: ['Jest', 'React'] },
  { category: 'Web Development', title: 'Integrate Stripe payments into a Next.js site', skills: ['Next.js', 'Stripe'] },
  { category: 'Web Development', title: 'Build a REST API for a mobile app', skills: ['Node.js', 'Express'] },
  { category: 'Web Development', title: 'Set up a PostgreSQL database with migrations', skills: ['PostgreSQL', 'Node.js'] },
  { category: 'Data Entry', title: 'Digitize 200 handwritten inventory records', skills: ['Data Entry', 'Excel'] },
  { category: 'Data Entry', title: 'Clean up a messy customer contact spreadsheet', skills: ['Excel', 'Data Entry'] },
  { category: 'Data Entry', title: 'Build a pivot table report from raw sales data', skills: ['Excel'] },
  { category: 'Data Entry', title: 'Enter 300 product listings into an e-commerce CMS', skills: ['Data Entry'] },
  { category: 'Data Entry', title: 'Convert scanned receipts into a spreadsheet', skills: ['Data Entry', 'Excel'] },
  { category: 'Video Editing', title: 'Edit a 3-minute YouTube tutorial video', skills: ['Premiere Pro'] },
  { category: 'Video Editing', title: 'Add subtitles and captions to 5 short clips', skills: ['Video Editing'] },
  { category: 'Video Editing', title: 'Cut a highlight reel from a 1-hour webinar', skills: ['Premiere Pro'] },
  { category: 'Video Editing', title: 'Color grade a short brand film', skills: ['After Effects'] },
  { category: 'Customer Support', title: 'Handle live chat support for 4 hours', skills: ['Customer Support'] },
  { category: 'Customer Support', title: 'Clear a 30-ticket support backlog', skills: ['Zendesk'] },
  { category: 'Customer Support', title: 'Write canned responses for common FAQs', skills: ['Customer Support'] },
  { category: 'Customer Support', title: 'Triage and tag 100 incoming support emails', skills: ['Email Handling'] },
  { category: 'Writing', title: "Write a 'Getting Started' guide for a SaaS product", skills: ['Writing'] },
  { category: 'Writing', title: 'Draft 5 social media captions for a product launch', skills: ['Writing'] },
  { category: 'Writing', title: 'Proofread and edit a 2,000-word case study', skills: ['Writing'] },
  { category: 'Writing', title: 'Write 3 product descriptions for a Shopify store', skills: ['Writing', 'SEO'] },
  { category: 'Design', title: 'Design a landing page mockup in Figma', skills: ['Figma'] },
  { category: 'Design', title: 'Create a set of 10 app icons', skills: ['Illustrator'] },
  { category: 'Design', title: 'Redesign an email newsletter template', skills: ['Figma'] },
  { category: 'Design', title: 'Design a one-page pitch deck slide', skills: ['Figma'] },
  { category: 'Other', title: 'Research 20 competitor pricing pages', skills: ['Research'] },
  { category: 'Other', title: 'Compile a list of 50 local business leads', skills: ['Research'] },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(MicroJob) private readonly microJobsRepo: Repository<MicroJob>,
    @InjectRepository(Applicant) private readonly applicantsRepo: Repository<Applicant>,
    @InjectRepository(Job) private readonly jobsRepo: Repository<Job>,
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
    @InjectRepository(Offer) private readonly offersRepo: Repository<Offer>,
    @InjectRepository(ProfileView) private readonly profileViewsRepo: Repository<ProfileView>,
    @InjectRepository(Report) private readonly reportsRepo: Repository<Report>,
    @InjectRepository(Recommendation) private readonly recommendationsRepo: Repository<Recommendation>,
    @InjectRepository(Follow) private readonly followsRepo: Repository<Follow>,
    @InjectRepository(TalentList) private readonly talentListsRepo: Repository<TalentList>,
    @InjectRepository(TalentListMember) private readonly talentListMembersRepo: Repository<TalentListMember>,
    @InjectRepository(CandidatePipelineEntry)
    private readonly pipelineRepo: Repository<CandidatePipelineEntry>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.usersRepo.count();
    if (existing > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }
    this.logger.log('Seeding demo data...');
    await this.seed();
    this.logger.log('Seed complete.');
  }

  private async seed(): Promise<void> {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const d = (s: string) => new Date(s);

    await this.usersRepo.save(
      this.usersRepo.create({
        email: 'admin@test.com',
        passwordHash,
        role: Role.ADMIN,
        name: 'Admin',
        status: UserStatus.ACTIVE,
        createdAt: d('2026-01-05T08:00:00Z'),
      }),
    );

    const employer1 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'employer@test.com',
        passwordHash,
        role: Role.EMPLOYER,
        name: 'Marga Santos',
        companyName: 'BrightHive Solutions',
        companyBlurb: 'Remote-first SaaS studio building tools for LGUs.',
        verified: true,
        subscriptionPlan: SubscriptionPlan.PRO,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: UserStatus.ACTIVE,
        createdAt: d('2026-01-10T08:00:00Z'),
      }),
    );

    const employer2 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'hiring@cebutechworks.ph',
        passwordHash,
        role: Role.EMPLOYER,
        name: 'Rafael Uy',
        companyName: 'Cebu TechWorks',
        companyBlurb: 'Outsourced dev + QA teams for AU/US clients.',
        verified: true,
        status: UserStatus.ACTIVE,
        createdAt: d('2026-01-14T08:00:00Z'),
      }),
    );

    const employer3 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'team@mangohealth.io',
        passwordHash,
        role: Role.EMPLOYER,
        name: 'Dana Reyes',
        companyName: 'MangoHealth',
        companyBlurb: 'Telehealth startup, Manila + Singapore.',
        verified: false,
        status: UserStatus.ACTIVE,
        createdAt: d('2026-02-01T08:00:00Z'),
      }),
    );

    const jobseeker1 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'jobseeker@test.com',
        passwordHash,
        role: Role.JOBSEEKER,
        name: 'Juan Dela Cruz',
        headline: 'Frontend Developer • React & Next.js',
        location: 'Quezon City, NCR',
        skills: ['React', 'Next.js', 'Tailwind CSS', 'AWS', 'TypeScript'],
        bio: '3 years building customer dashboards. Learning cloud deploys via trial tasks.',
        discoverable: true,
        category: 'Web Development',
        yearsOfExperience: 3,
        preferredJobType: 'Full-time',
        services: ['Landing page development', 'React component fixes', 'Dashboard UI builds'],
        certifications: ['Meta Front-End Developer (Coursera)'],
        education: [
          {
            id: 'edu-juan-1',
            school: 'Polytechnic University of the Philippines',
            degree: 'BS Information Technology',
            fieldOfStudy: 'Web Development',
            startYear: 2019,
            endYear: 2023,
          },
        ],
        experience: [
          {
            id: 'exp-juan-1',
            company: 'Freelance',
            title: 'Frontend Developer',
            description: 'Built customer-facing dashboards for 3 local SME clients.',
            startDate: '2023-06',
            endDate: null,
            current: true,
          },
        ],
        portfolioLinks: [
          { id: 'link-juan-1', label: 'Portfolio site', url: 'https://juandelacruz.example.com' },
          { id: 'link-juan-2', label: 'GitHub', url: 'https://github.com/example-juan' },
        ],
        languages: ['Filipino', 'English'],
        availability: 'available',
        status: UserStatus.ACTIVE,
        createdAt: d('2026-01-12T08:00:00Z'),
      }),
    );

    const jobseeker2 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'kim.alvarez@example.com',
        passwordHash,
        role: Role.JOBSEEKER,
        name: 'Kim Alvarez',
        headline: 'Virtual Assistant • Customer Support',
        location: 'Davao City',
        skills: ['Customer Support', 'Zendesk', 'Excel', 'Email Handling'],
        bio: 'Ex-BPO team lead, 5 years. Fast, accurate, night-shift ready.',
        discoverable: true,
        category: 'Customer Support',
        yearsOfExperience: 5,
        preferredJobType: 'Part-time',
        status: UserStatus.ACTIVE,
        createdAt: d('2026-01-18T08:00:00Z'),
      }),
    );

    await this.usersRepo.save(
      this.usersRepo.create({
        email: 'paolo.reyes@example.com',
        passwordHash,
        role: Role.JOBSEEKER,
        name: 'Paolo Reyes',
        headline: 'Video Editor • Reels & YouTube',
        location: 'Cebu City',
        skills: ['Premiere Pro', 'After Effects', 'Video Editing'],
        bio: 'Editing short-form content for PH brands for 2 years.',
        discoverable: false,
        category: 'Video Editing',
        yearsOfExperience: 2,
        preferredJobType: 'Freelance',
        status: UserStatus.ACTIVE,
        createdAt: d('2026-02-02T08:00:00Z'),
      }),
    );

    const jobseeker4 = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'liza.tan@example.com',
        passwordHash,
        role: Role.JOBSEEKER,
        name: 'Liza Tan',
        headline: 'Backend Developer • Node & AWS',
        location: 'Pasig, NCR',
        skills: ['Node.js', 'AWS', 'PostgreSQL', 'Docker'],
        bio: 'Deploying side projects to AWS to build a public track record.',
        discoverable: true,
        category: 'Web Development',
        yearsOfExperience: 4,
        preferredJobType: 'Contract',
        status: UserStatus.ACTIVE,
        createdAt: d('2026-02-10T08:00:00Z'),
      }),
    );

    // Micro jobs
    const mj1 = await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer1.id,
        title: 'Fix one broken React date-picker component',
        category: 'Web Development',
        description:
          "Our booking form's date-picker breaks on mobile Safari. Fix the component and submit a PR-style diff.",
        deliverable: 'Link to the fixed component code + a short before/after clip.',
        pay: 1500,
        estimatedTime: '4 hours',
        skillsRequired: ['React', 'CSS'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.APPROVED,
        createdAt: d('2026-08-10T03:00:00Z'),
      }),
    );
    await this.applicantsRepo.save(
      this.applicantsRepo.create({
        microJobId: mj1.id,
        jobseekerId: jobseeker1.id,
        status: ApplicantStatus.APPROVED,
        appliedAt: d('2026-08-11T02:00:00Z'),
        submissionNote:
          'Rewrote the date-picker with a controlled value and fixed the iOS Safari z-index bug.',
        submissionLink: 'https://github.com/example/fix-datepicker/pull/12',
        submittedAt: d('2026-08-11T09:00:00Z'),
        feedback: 'Clean fix, tested it myself on an iPhone. Great work.',
        reviewedAt: d('2026-08-12T01:00:00Z'),
      }),
    );

    const mj2 = await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer1.id,
        title: 'Convert 40-page PDF report into an Excel workbook',
        category: 'Data Entry',
        description:
          'We have a scanned PDF financial report. Need clean, formula-linked Excel tabs (no flattened numbers).',
        deliverable: 'The .xlsx file with a short summary of tabs/formulas.',
        pay: 800,
        estimatedTime: '1 day',
        skillsRequired: ['Excel', 'Data Entry'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.APPROVED,
        createdAt: d('2026-08-20T03:00:00Z'),
      }),
    );
    await this.applicantsRepo.save(
      this.applicantsRepo.create({
        microJobId: mj2.id,
        jobseekerId: jobseeker2.id,
        status: ApplicantStatus.SUBMITTED,
        appliedAt: d('2026-08-21T02:00:00Z'),
        submissionNote:
          'Workbook attached with 4 tabs, formulas linked, flagged 2 unreadable pages for review.',
        submissionLink: 'https://drive.example.com/report.xlsx',
        submittedAt: d('2026-08-22T05:00:00Z'),
      }),
    );

    await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer2.id,
        title: 'Edit one 60-second product reel',
        category: 'Video Editing',
        description: 'Raw clips + a voice-over track are ready. Need captions, jump cuts, and brand outro.',
        deliverable: 'MP4 export + project file link.',
        pay: 1200,
        estimatedTime: '6 hours',
        skillsRequired: ['Video Editing', 'Premiere Pro'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.APPROVED,
        expiresAt: d('2026-08-29T03:00:00Z'),
        createdAt: d('2026-08-24T03:00:00Z'),
      }),
    );

    const mj4 = await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer2.id,
        title: 'Answer 20 customer support emails (backlog clear-out)',
        category: 'Customer Support',
        description:
          'Backlog of 20 tickets in Zendesk about shipping delays. Use our macros, escalate anything unusual.',
        deliverable: '20 tickets marked resolved/escalated with your notes.',
        pay: 600,
        estimatedTime: '3 hours',
        skillsRequired: ['Customer Support', 'Zendesk'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.APPROVED,
        createdAt: d('2026-08-27T03:00:00Z'),
      }),
    );
    await this.applicantsRepo.save(
      this.applicantsRepo.create({
        microJobId: mj4.id,
        jobseekerId: jobseeker2.id,
        status: ApplicantStatus.UPGRADED,
        appliedAt: d('2026-07-01T02:00:00Z'),
        submissionNote: 'Cleared all 20 tickets, flagged 3 for refund policy exceptions.',
        submissionLink: 'https://zendesk.example.com/view/backlog-aug',
        submittedAt: d('2026-07-01T08:00:00Z'),
        feedback: "Fastest turnaround we've had. Bringing her on part-time.",
        reviewedAt: d('2026-07-02T01:00:00Z'),
      }),
    );

    await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer3.id,
        title: "Write one blog post: 'Telehealth in Rural PH'",
        category: 'Writing',
        description: '800-1000 word blog post, SEO-friendly, casual but credible tone.',
        deliverable: 'Google Doc link, ready to publish.',
        pay: 900,
        estimatedTime: '1 day',
        skillsRequired: ['Writing', 'SEO'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.PENDING,
        minProfileCompleteness: 70,
        createdAt: d('2026-08-28T03:00:00Z'),
      }),
    );

    const mj6 = await this.microJobsRepo.save(
      this.microJobsRepo.create({
        employerId: employer1.id,
        title: 'Deploy a small Node API to AWS (ECS or Lambda)',
        category: 'Web Development',
        description:
          'We have a working Node API locally. Need it containerized and deployed to AWS with a health check endpoint live.',
        deliverable: 'Live URL + short writeup of the AWS setup.',
        pay: 3000,
        estimatedTime: '2 days',
        skillsRequired: ['Node.js', 'AWS', 'Docker'],
        status: MicroJobStatus.OPEN,
        moderation: ModerationStatus.APPROVED,
        minYearsOfExperience: 3,
        createdAt: d('2026-08-05T03:00:00Z'),
      }),
    );
    await this.applicantsRepo.save(
      this.applicantsRepo.create({
        microJobId: mj6.id,
        jobseekerId: jobseeker4.id,
        status: ApplicantStatus.APPROVED,
        appliedAt: d('2026-08-06T02:00:00Z'),
        submissionNote: 'Deployed via ECS Fargate behind an ALB, health check green, added CloudWatch alarms.',
        submissionLink: 'https://api.example-demo.com/health',
        submittedAt: d('2026-08-08T10:00:00Z'),
        feedback: 'Exactly what we needed. Want to talk contract work?',
        reviewedAt: d('2026-08-09T02:00:00Z'),
      }),
    );

    // Bulk-seeded, open Trial Tasks — enough volume for the Browse tab's
    // pagination to actually kick in (brings the total to ~100).
    const bulkEmployerIds = [employer1.id, employer2.id, employer3.id];
    const bulkEstimatedTimes = ['2 hours', '3 hours', '4 hours', '1 day', '2 days'];
    const bulkNow = Date.now();
    for (let i = 0; i < 94; i++) {
      const template = BULK_MICRO_JOB_TEMPLATES[i % BULK_MICRO_JOB_TEMPLATES.length];
      const cycle = Math.floor(i / BULK_MICRO_JOB_TEMPLATES.length);
      await this.microJobsRepo.save(
        this.microJobsRepo.create({
          employerId: bulkEmployerIds[i % bulkEmployerIds.length],
          title: cycle > 0 ? `${template.title} (Batch ${cycle + 1})` : template.title,
          category: template.category,
          description: `${template.title}. Clear scope and a fast turnaround — full details shared after you apply.`,
          deliverable: 'A short writeup or link showing the completed work.',
          pay: 300 + ((i * 37) % 2700),
          estimatedTime: bulkEstimatedTimes[i % bulkEstimatedTimes.length],
          skillsRequired: template.skills,
          status: MicroJobStatus.OPEN,
          moderation: ModerationStatus.APPROVED,
          createdAt: new Date(bulkNow - i * 6 * 60 * 60 * 1000),
        }),
      );
    }

    // Demo data for follows / Talent Pool / pipeline so those features have
    // something to show right after a fresh seed, without manual setup.
    await this.followsRepo.save(this.followsRepo.create({ jobseekerId: jobseeker1.id, employerId: employer1.id }));

    const demoList = await this.talentListsRepo.save(
      this.talentListsRepo.create({ ownerTeamId: employer1.id, name: 'Top React Devs', createdBy: employer1.id }),
    );
    await this.talentListMembersRepo.save([
      this.talentListMembersRepo.create({ listId: demoList.id, jobseekerId: jobseeker1.id, addedBy: employer1.id }),
      this.talentListMembersRepo.create({ listId: demoList.id, jobseekerId: jobseeker4.id, addedBy: employer1.id }),
    ]);

    await this.pipelineRepo.save([
      this.pipelineRepo.create({
        ownerTeamId: employer1.id,
        jobseekerId: jobseeker2.id,
        stage: PipelineStage.CONTACTED,
        updatedBy: employer1.id,
      }),
      this.pipelineRepo.create({
        ownerTeamId: employer1.id,
        jobseekerId: jobseeker4.id,
        stage: PipelineStage.TRIAL_SENT,
        updatedBy: employer1.id,
      }),
    ]);

    // Regular job postings
    await this.jobsRepo.save(
      this.jobsRepo.create({
        employerId: employer1.id,
        title: 'Frontend Developer (React)',
        type: 'Full-time',
        location: 'Remote (PH)',
        salaryRange: '₱45,000 - ₱65,000 / month',
        skillsRequired: ['React', 'JavaScript', 'CSS', 'Git'],
        applicants: 12,
        status: 'open',
        moderation: ModerationStatus.APPROVED,
        postedAt: d('2026-08-15T03:00:00Z'),
      }),
    );
    await this.jobsRepo.save(
      this.jobsRepo.create({
        employerId: employer2.id,
        title: 'Customer Support Specialist',
        type: 'Part-time',
        location: 'Cebu / Remote',
        salaryRange: '₱18,000 - ₱25,000 / month',
        skillsRequired: ['Customer Support', 'Zendesk', 'Excel', 'Communication'],
        applicants: 27,
        status: 'open',
        moderation: ModerationStatus.PENDING,
        postedAt: d('2026-08-18T03:00:00Z'),
      }),
    );
    await this.jobsRepo.save(
      this.jobsRepo.create({
        employerId: employer3.id,
        title: 'Backend Engineer (Node.js/AWS)',
        type: 'Full-time',
        location: 'Remote (PH)',
        salaryRange: '₱60,000 - ₱90,000 / month',
        skillsRequired: ['Node.js', 'AWS', 'PostgreSQL', 'Docker', 'TypeScript'],
        applicants: 8,
        status: 'open',
        moderation: ModerationStatus.APPROVED,
        postedAt: d('2026-08-22T03:00:00Z'),
      }),
    );

    // Activity
    await this.activityRepo.save([
      this.activityRepo.create({
        jobseekerId: jobseeker1.id,
        type: ActivityType.MICRO_JOB_COMPLETED,
        skill: 'React',
        title: 'Fixed one React date-picker component',
        date: d('2026-08-12T01:00:00Z'),
      }),
      this.activityRepo.create({
        jobseekerId: jobseeker1.id,
        type: ActivityType.PROFILE_UPDATE,
        skill: 'TypeScript',
        title: 'Added TypeScript to skill list',
        date: d('2026-08-15T01:00:00Z'),
      }),
      this.activityRepo.create({
        jobseekerId: jobseeker4.id,
        type: ActivityType.MICRO_JOB_COMPLETED,
        skill: 'AWS',
        title: 'Deployed a Node API to AWS ECS',
        date: d('2026-08-09T02:00:00Z'),
      }),
      this.activityRepo.create({
        jobseekerId: jobseeker4.id,
        type: ActivityType.SKILL_VERIFIED,
        skill: 'Docker',
        title: 'Verified Docker skill via employer review',
        date: d('2026-08-09T02:05:00Z'),
      }),
      this.activityRepo.create({
        jobseekerId: jobseeker2.id,
        type: ActivityType.MICRO_JOB_COMPLETED,
        skill: 'Customer Support',
        title: 'Cleared 20-ticket support backlog',
        date: d('2026-07-02T01:00:00Z'),
      }),
      this.activityRepo.create({
        jobseekerId: jobseeker2.id,
        type: ActivityType.UPGRADED,
        skill: 'Customer Support',
        title: 'Upgraded to part-time by Cebu TechWorks',
        date: d('2026-07-02T01:00:00Z'),
      }),
    ]);

    // Offers
    await this.offersRepo.save([
      this.offersRepo.create({
        microJobId: mj4.id,
        employerId: employer2.id,
        jobseekerId: jobseeker2.id,
        offerType: 'Part-time',
        message: 'You cleared the backlog faster than anyone else this month. Want to join us part-time?',
        status: OfferStatus.ACCEPTED,
        createdAt: d('2026-07-02T01:30:00Z'),
      }),
      this.offersRepo.create({
        microJobId: mj6.id,
        employerId: employer1.id,
        jobseekerId: jobseeker4.id,
        offerType: 'Contract',
        message: "Loved the AWS deploy. We have a 3-month contract lined up if you're interested.",
        status: OfferStatus.PENDING,
        createdAt: d('2026-08-09T02:10:00Z'),
      }),
    ]);

    // Profile views — gives the jobseeker analytics page something real to show.
    const now = Date.now();
    const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
    await this.profileViewsRepo.save([
      this.profileViewsRepo.create({ viewedUserId: jobseeker1.id, viewerId: employer1.id, createdAt: daysAgo(1) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker1.id, viewerId: employer2.id, createdAt: daysAgo(3) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker1.id, viewerId: null, createdAt: daysAgo(6) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker1.id, viewerId: employer1.id, createdAt: daysAgo(12) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker1.id, viewerId: null, createdAt: daysAgo(20) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker4.id, viewerId: employer1.id, createdAt: daysAgo(2) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker4.id, viewerId: employer2.id, createdAt: daysAgo(9) }),
      this.profileViewsRepo.create({ viewedUserId: jobseeker2.id, viewerId: employer2.id, createdAt: daysAgo(4) }),
    ]);
    await this.usersRepo.increment({ id: jobseeker1.id }, 'profileViews', 5);
    await this.usersRepo.increment({ id: jobseeker4.id }, 'profileViews', 2);
    await this.usersRepo.increment({ id: jobseeker2.id }, 'profileViews', 1);

    // Reports — gives the admin Reports queue something to review.
    await this.reportsRepo.save(
      this.reportsRepo.create({
        reporterId: jobseeker2.id,
        reportedUserId: employer2.id,
        reason: ReportReason.NON_PAYMENT,
        details: "Completed the customer support backlog task but haven't received payment yet.",
        contextLabel: 'Trial Task: Answer 20 customer support emails (backlog clear-out)',
        createdAt: daysAgo(5),
      }),
    );

    // Recommendations — shows off the profile enrichment feature out of the box.
    await this.recommendationsRepo.save(
      this.recommendationsRepo.create({
        employerId: employer1.id,
        jobseekerId: jobseeker1.id,
        message: 'Juan fixed a tricky date-picker bug for us fast and communicated clearly the whole way. Would hire again.',
        createdAt: daysAgo(11),
      }),
    );

    this.logger.log(`Seeded admin login: admin@test.com / ${DEMO_PASSWORD}`);
  }
}
