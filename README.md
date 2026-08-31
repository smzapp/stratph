# StratPH

A Philippine job platform built around two ideas that don't exist together anywhere else:

1. **Micro Jobs before full-time** — instead of `Apply → Interview → Reject`, employers post a
   small, paid task (₱300–₱3,000: convert a PDF to Excel, fix one React component, edit one
   video, answer 20 support emails...) as a paid audition. If the jobseeker delivers, the
   employer can instantly upgrade them to part-time, contract, or full-time — no separate
   hiring process.
2. **Reverse Hiring** — employers stop chasing resumes and instead search real, verified
   activity, e.g. *"React developer who deployed AWS in the last 30 days."* Jobseekers become
   discoverable through what they've actually done on the platform, not what they claim on a CV.

## Repo structure

This is a two-package repo (not a workspace-linked monorepo — each package manages its own
dependencies):

```
stratph/
├── backend/    NestJS + TypeORM API
└── frontend/   Next.js (App Router) UI
```

### `frontend/`

A working UI prototype covering all three dashboards, driven by mock data held in
`localStorage` (no backend calls yet):

- **Jobseeker dashboard** — browse/apply to micro jobs, submit deliverables, track application
  status, manage skills & discoverability, review and accept upgrade offers.
- **Employer dashboard** — post micro jobs, review submissions, approve/reject, send upgrade
  offers, search candidates by skill + recent activity (Reverse Hiring), post traditional job
  listings.
- **Super Admin dashboard** — platform stats, user management (verify employers, suspend
  accounts), micro-job moderation queue, escrow-style payments ledger.

See [frontend/AGENTS.md](frontend/AGENTS.md) for a note on this project's Next.js version.

### `backend/`

A NestJS + TypeORM starter. API endpoints, entities, and auth are not implemented yet — the
frontend currently runs entirely on mock data.

## Getting started

Requires [pnpm](https://pnpm.io/).

```bash
# Frontend (UI prototype)
cd frontend
pnpm install
pnpm dev        # http://localhost:3000

# Backend (API scaffold)
cd backend
pnpm install
pnpm run start:dev
```

### Demo accounts (frontend)

The login page has one-click buttons for these, or enter them manually:

| Role         | Email                  | Password   |
|--------------|------------------------|------------|
| Super Admin  | `admin@test.com`       | `test1234` |
| Employer     | `employer@test.com`    | `test1234` |
| Jobseeker    | `jobseeker@test.com`   | `test1234` |

Data resets by clearing your browser's local storage for `localhost:3000`.

## Status

- [x] UI for all three dashboards, Micro Jobs flow, and Reverse Hiring search (mock data)
- [ ] NestJS API + TypeORM entities (users, micro jobs, applications, offers, activity, payments)
- [ ] Real authentication
- [ ] Wire frontend to the API
