
# Reference
https://chatgpt.com/c/6a95187d-163c-83ec-8745-a561b674464c

# StratPH

A Philippine job platform built around three ideas that don't exist together anywhere else:

1. **Micro Jobs before full-time** — instead of `Apply → Interview → Reject`, employers post a
   small, paid work trial (₱300–₱3,000: convert a PDF to Excel, fix one React component, edit
   one video, answer 20 support emails...). If the jobseeker delivers, the employer can instantly
   upgrade them to part-time, contract, or full-time — no separate hiring process.
2. **Reverse Hiring** — employers stop chasing resumes and instead search real, verified
   activity, e.g. *"React developer who deployed AWS in the last 30 days."* Jobseekers become
   discoverable through what they've actually done on the platform, not what they claim on a CV.
3. **AI Career Gap Analyzer** — instead of a vague "You match 60%," jobseekers see exactly which
   skills they're missing for a role, each linked to a micro job that lets them prove it.

## Repo structure

This is a two-package repo (not a workspace-linked monorepo — each package manages its own
dependencies):

```
stratph/
├── backend/    NestJS + TypeORM (SQLite) API
└── frontend/   Next.js (App Router) UI, in TypeScript
```

### `backend/`

A real NestJS + TypeORM API backed by SQLite (file-based, zero setup). Covers:

- **Auth** — JWT-based login, separate registration for jobseekers and employers, forgot/reset
  password (the reset token is returned directly in the API response since no mail server is
  configured — clearly labeled as a demo shortcut in the UI), and self-service account
  deactivation.
- **Roles** — `superadmin` / `employer` / `jobseeker`, enforced server-side per endpoint via a
  `RolesGuard` (e.g. only employers can post micro jobs or review submissions; only admins can
  moderate, verify employers, or suspend accounts).
- **Micro job moderation** — a platform setting (`microJobAutoApprove`) that Super Admin can
  toggle: new micro jobs either go live immediately or stay pending for admin approval.
- **Users** — paginated, filterable admin listing (`GET /users?page=&limit=&role=&q=`), plus
  verify/suspend/reactivate actions.
- A `GET /bootstrap` endpoint returns a single role-agnostic snapshot (users, micro jobs, jobs,
  activity, offers, payments) that the frontend renders from — read access mirrors the original
  prototype's trust model (everything visible to any authenticated user), while all *writes* are
  the part that's actually role-restricted.
- Demo data is seeded automatically on first run (same accounts as below).

### `frontend/`

All three dashboards, now wired to the real API instead of mock data:

- **Jobseeker dashboard** — browse/apply to micro jobs, submit deliverables, run the AI Gap
  Analyzer against open roles, manage skills & discoverability, review/accept upgrade offers.
- **Employer dashboard** — post micro jobs, review submissions, approve/reject, send upgrade
  offers, search candidates by skill + recent activity (Reverse Hiring), post traditional job
  listings.
- **Super Admin dashboard** — platform stats, paginated user management (verify employers,
  suspend/reactivate accounts), micro-job moderation queue with the auto-approve toggle,
  escrow-style payments ledger.
- **Account** — `/register/jobseeker` and `/register/employer`, `/forgot-password` +
  `/reset-password`, and a shared `/profile` page (edit details, deactivate account). Logout and
  the profile link live in a dropdown at the top right of every dashboard.

See [frontend/AGENTS.md](frontend/AGENTS.md) for a note on this project's Next.js version.

## Getting started

Requires [pnpm](https://pnpm.io/).

```bash
# Backend (API) — http://localhost:3001/api
cd backend
pnpm install
pnpm run start:dev

# Frontend (UI) — http://localhost:3000
cd frontend
pnpm install
pnpm dev
```

The frontend reads the API URL from `frontend/.env.local` (`NEXT_PUBLIC_API_URL`, defaults to
`http://localhost:3001/api`). The backend creates `backend/stratph.sqlite` on first run and seeds
it automatically — delete that file to reset all data.

Backend environment variables (all optional, sensible dev defaults provided):

| Variable          | Default                   | Purpose                              |
|-------------------|----------------------------|---------------------------------------|
| `PORT`            | `3001`                     | API port                              |
| `DATABASE_PATH`   | `stratph.sqlite`           | SQLite file location                  |
| `JWT_SECRET`      | `stratph-dev-secret-change-me` | JWT signing secret                |
| `FRONTEND_ORIGIN` | `http://localhost:3000`    | Allowed CORS origin(s), comma-separated |

### Demo accounts

The login page has one-click buttons for these, or enter them manually:

| Role         | Email                  | Password   |
|--------------|------------------------|------------|
| Super Admin  | `admin@test.com`       | `test1234` |
| Employer     | `employer@test.com`    | `test1234` |
| Jobseeker    | `jobseeker@test.com`   | `test1234` |

New accounts can also be created via `/register/jobseeker` or `/register/employer`.

## Status

- [x] NestJS API + TypeORM entities (users, micro jobs, applications, offers, activity, payments,
      platform settings, password reset tokens)
- [x] JWT authentication with role-based route guards
- [x] Registration, password reset, and account deactivation
- [x] Paginated admin user management
- [x] Micro job moderation with an auto-approve/needs-approval platform setting
- [x] Frontend wired to the real API (mock `localStorage` data layer removed)
- [ ] File uploads for micro-job deliverables (currently a link + note)
- [ ] Real email delivery for password reset (currently returned directly for demo purposes)
