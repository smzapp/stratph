"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

type Audience = "seeker" | "employer";

const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(18px,4vw,40px)]";

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#escrow", label: "Escrow" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

const HERO_TICKETS = [
  { meta: "Data entry · 2 hrs", title: "Convert a PDF to Excel", pay: "₱800" },
  { meta: "Web dev · 1 day", title: "Fix one React component", pay: "₱1,500" },
  { meta: "Video · 3 hrs", title: "Edit one 60s reel", pay: "₱1,200" },
];

const SEEKER_TAGS = ["Fresh graduates", "Career shifters", "Students", "Skilled professionals"];
const EMPLOYER_TAGS = ["Startups", "Agencies", "BPOs", "SMEs hiring their first dev"];

const REVERSE_PEOPLE = [
  { initials: "JD", name: "Juan Dela Cruz", skills: "React · Next.js · AWS", verified: "3 tasks verified" },
  { initials: "LT", name: "Liza Tan", skills: "Node.js · AWS · Docker", verified: "5 tasks verified" },
];

const STATS = [
  { value: "₱300–₱3k", label: "per paid work trial" },
  { value: "0", label: "interviews required" },
  { value: "100%", label: "held in escrow until approved" },
  { value: "3", label: "role-based dashboards" },
];

const SEEKER_STEPS = [
  { title: "Try", body: "Pick a small task straight from the listing. No interview, no cover letter. The employer's payment is already funded." },
  { title: "Prove", body: "Deliver the work. On approval the escrowed ₱ goes straight to you — and the task joins your public track record." },
  { title: "Hire", body: "Nail it and the employer can upgrade you to part-time, contract, or full-time on the spot. Paid either way." },
];

const EMPLOYER_STEPS = [
  { title: "Post & fund", body: "Describe one real piece of work and set its fee. StratPH holds the amount in escrow so candidates know it's genuine." },
  { title: "Review real output", body: "Compare delivered work instead of résumés. Approve to release payment, or reject and get the escrow refunded." },
  { title: "Upgrade the winner", body: "Convert a proven performer to part-time, contract, or full-time — with evidence, not a gut call from a 30-minute call." },
];

const ESCROW_STEPS = [
  { title: "Employer funds the task", body: "The fee is held by StratPH — not sent to anyone yet." },
  { title: "Jobseeker delivers", body: "Work is submitted for review. No money changes hands during this step." },
  { title: "Approve — release", body: "Approved work pays out instantly. Rejected work refunds the employer." },
];

const FEATURE_TICKETS = [
  { label: "DATA ENTRY", title: "Convert a PDF to Excel", price: "₱800" },
  { label: "WEB DEV", title: "Fix one React component", price: "₱1,500" },
  { label: "VIDEO", title: "Edit one 60s reel", price: "₱1,200" },
  { label: "SUPPORT", title: "Answer 20 support emails", price: "₱600" },
];

const GAP_SKILLS = ["TypeScript", "CSS Grid", "Git flow"];

export default function Home() {
  const [audience, setAudience] = useState<Audience>("seeker");
  const seeker = audience === "seeker";
  const accent = seeker ? "text-seeker" : "text-employer";
  const accentBg = seeker ? "bg-seeker" : "bg-employer";

  return (
    <div
      id="top"
      className="font-archivo min-h-screen overflow-x-hidden bg-paper text-ink"
      style={{ colorScheme: "light" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-paper-line bg-paper/88 backdrop-blur-md">
        <div className={`${CONTAINER} flex items-center gap-5 py-3.5`}>
          <Link href="#top" className="flex items-center gap-[9px] text-[17px] font-bold tracking-[-0.02em] text-ink">
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-ink font-plex-mono text-[12px] font-medium text-white">
              S
            </span>
            StratPH
          </Link>

          <nav className="ml-[18px] hidden gap-[26px] text-[14.5px] text-ink-soft max-[940px]:hidden md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-1 rounded-full border border-paper-line bg-paper-chip p-[3px]">
            <button
              type="button"
              onClick={() => setAudience("seeker")}
              className={`rounded-full px-3.5 py-[7px] font-archivo text-[13px] font-semibold transition-colors ${
                seeker ? "bg-white text-ink shadow-[0_1px_3px_oklch(0.3_0.02_265/0.18)]" : "bg-transparent text-ink-soft"
              }`}
            >
              Jobseekers
            </button>
            <button
              type="button"
              onClick={() => setAudience("employer")}
              className={`rounded-full px-3.5 py-[7px] font-archivo text-[13px] font-semibold transition-colors ${
                !seeker ? "bg-white text-ink shadow-[0_1px_3px_oklch(0.3_0.02_265/0.18)]" : "bg-transparent text-ink-soft"
              }`}
            >
              Employers
            </button>
          </div>

          <Link
            href="/login"
            className="max-[560px]:hidden rounded-lg border border-paper-line-faint px-4 py-2 text-[14px] font-semibold text-ink"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className={CONTAINER}>
        {/* Hero */}
        <section className="pt-[clamp(48px,7vw,88px)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-center gap-[clamp(36px,5vw,64px)]">
            <div>
              {seeker ? (
                <span className="inline-flex items-center gap-2 rounded-[6px] bg-seeker-tint px-[11px] py-[6px] font-plex-mono text-[11.5px] uppercase tracking-[0.08em] text-seeker">
                  For jobseekers
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-[6px] bg-employer-tint px-[11px] py-[6px] font-plex-mono text-[11.5px] uppercase tracking-[0.08em] text-employer">
                  For employers
                </span>
              )}

              <h1 className="mt-5 text-balance text-[clamp(38px,6.2vw,68px)] font-bold leading-[0.98] tracking-[-0.035em]">
                {seeker ? (
                  <>
                    Get paid to prove it.
                    <br />
                    <span className="text-seeker">Skip the interview.</span>
                  </>
                ) : (
                  <>
                    See the work
                    <br />
                    <span className="text-employer">before you hire.</span>
                  </>
                )}
              </h1>

              <p className="mt-[22px] max-w-[46ch] text-pretty text-[clamp(16px,1.4vw,18.5px)] leading-[1.55] text-ink-soft">
                {seeker
                  ? "Take a small paid task — ₱300 to ₱3,000 — straight from the listing. Deliver it, get paid from escrow, and turn it into a real job. No resume roulette, no unpaid take-homes."
                  : "Post a small paid Trial Task instead of a job ad. Review real, delivered work from real candidates — then upgrade the best one to part-time, contract, or full-time in one click."}
              </p>

              <div className="mt-[30px] flex flex-wrap gap-3">
                <Link
                  href={seeker ? "/register/jobseeker" : "/register/employer"}
                  className={`rounded-[10px] px-6 py-3.5 text-[15.5px] font-semibold text-white ${accentBg}`}
                >
                  {seeker ? "Browse Trial Tasks" : "Post a Trial Task"}
                </Link>
                <a
                  href={seeker ? "#how" : "#pricing"}
                  className="rounded-[10px] border border-paper-line-faint bg-white px-6 py-3.5 text-[15.5px] font-semibold text-ink"
                >
                  {seeker ? "See how it works" : "See pricing"}
                </a>
              </div>

              <div className="mt-[26px] flex flex-wrap gap-2 text-[12.5px] text-ink-softer">
                {(seeker ? SEEKER_TAGS : EMPLOYER_TAGS).map((tag) => (
                  <span key={tag} className="rounded-full border border-paper-line-soft px-[11px] py-[5px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {seeker ? (
                <div className="rounded-[14px] border border-paper-line bg-white p-[18px] shadow-[0_18px_40px_-28px_oklch(0.3_0.05_265/0.5)]">
                  <p className="font-plex-mono text-[10.5px] uppercase tracking-[0.09em] text-ink-faint">
                    Open Trial Tasks near you
                  </p>
                  <div className="mt-[14px] grid gap-[10px]">
                    {HERO_TICKETS.map((t) => (
                      <div key={t.title} className="flex items-center gap-[14px] rounded-[10px] border border-paper-line-soft p-[13px]">
                        <div className="min-w-0 flex-1">
                          <div className="font-plex-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{t.meta}</div>
                          <div className="mt-1 text-[15px] font-semibold">{t.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[17px] font-bold">{t.pay}</div>
                          <div className="text-[10.5px] text-verified-2">funded</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[14px] border border-paper-line bg-white p-[18px] shadow-[0_18px_40px_-28px_oklch(0.3_0.05_265/0.5)]">
                  <p className="font-plex-mono text-[10.5px] uppercase tracking-[0.09em] text-ink-faint">
                    Reverse hiring search
                  </p>
                  <div className="mt-3 rounded-[9px] border border-paper-line-soft bg-paper-chip-2 px-[13px] py-[11px] font-plex-mono text-[12.5px] leading-[1.5] text-ink/90">
                    React developer who deployed AWS in the last 30 days
                  </div>
                  <div className="mt-[14px] grid gap-[10px]">
                    {REVERSE_PEOPLE.map((p) => (
                      <div key={p.name} className="flex items-center gap-3 rounded-[10px] border border-paper-line-soft p-3">
                        <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[oklch(0.93_0.03_275)] text-[12px] font-semibold text-[oklch(0.4_0.15_275)]">
                          {p.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-semibold">{p.name}</div>
                          <div className="font-plex-mono text-[11.5px] text-ink-faint">{p.skills}</div>
                        </div>
                        <div className="whitespace-nowrap rounded-[6px] bg-verified-tint px-2 py-1 text-[10.5px] text-verified">
                          {p.verified}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[11.5px] leading-[1.5] text-ink-faint">
                    Candidates surface because of what they shipped — not because they applied.
                  </div>
                </div>
              )}

              <div className="flex items-center gap-[14px] rounded-[14px] bg-ink px-[18px] py-4 text-white">
                <div className="font-plex-mono text-[11px] leading-[1.5] tracking-[0.06em] opacity-85">
                  {seeker
                    ? "Every task is paid into escrow before you start. Approved work releases the same day."
                    : "Your task budget sits in escrow. Approve the work to release it — reject it and you get it back."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-[clamp(44px,6vw,72px)] grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-6 border-y border-paper-line py-[26px]">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-[clamp(24px,2.6vw,30px)] font-bold tracking-[-0.03em]">{s.value}</div>
              <div className="mt-1 text-[12.5px] text-ink-softer">{s.label}</div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="how" className="pt-[clamp(56px,8vw,100px)]">
          <div className="max-w-[620px]">
            <p className="font-plex-mono text-[11.5px] uppercase tracking-[0.09em] text-ink-faint">How it works</p>
            <h2 className="mt-3 text-[clamp(28px,3.8vw,42px)] font-bold leading-[1.05] tracking-[-0.03em]">
              Try → Prove → Hire, replacing apply → interview → reject.
            </h2>
          </div>

          <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
            {(seeker ? SEEKER_STEPS : EMPLOYER_STEPS).map((step, i) => (
              <div key={step.title} className="rounded-[14px] border border-paper-line bg-white p-6">
                <div className={`font-plex-mono text-[30px] font-medium leading-none ${accent}`}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-4 text-[19px] font-bold tracking-[-0.02em]">{step.title}</div>
                <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Escrow */}
        <section id="escrow" className="pt-[clamp(56px,8vw,100px)]">
          <div className="rounded-[20px] bg-navy p-[clamp(28px,4vw,52px)] text-white">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-[clamp(24px,4vw,56px)]">
              <div>
                <p className="font-plex-mono text-[11.5px] uppercase tracking-[0.09em] text-navy-accent">
                  Escrow protected
                </p>
                <h2 className="mt-3 text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.08] tracking-[-0.03em]">
                  Money moves only when the work is approved.
                </h2>
                <p className="mt-4 max-w-[44ch] text-[15.5px] leading-[1.6] text-navy-fg-soft">
                  One mechanism protects both sides: jobseekers never work for free, employers never pay for work
                  they didn&apos;t get.
                </p>
              </div>

              <div className="grid gap-0">
                {ESCROW_STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    className={`relative ml-[9px] flex gap-4 pl-6 ${
                      i < ESCROW_STEPS.length - 1 ? "border-l border-navy-line-2 pb-5" : ""
                    }`}
                  >
                    <div className="absolute -left-[5px] top-1 h-[9px] w-[9px] rounded-full bg-navy-accent" />
                    <div>
                      <div className="text-[16px] font-semibold">{step.title}</div>
                      <div className="mt-1 text-[14px] leading-[1.55] text-navy-fg-soft">{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-navy-line pt-[18px] font-plex-mono text-[11px] tracking-[0.04em] text-navy-fg-softer">
              Demo prototype — escrow is simulated within StratPH for illustration. No real funds move.
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pt-[clamp(56px,8vw,100px)]">
          <div className="max-w-[640px]">
            <p className="font-plex-mono text-[11.5px] uppercase tracking-[0.09em] text-ink-faint">
              Three things that don&apos;t exist together anywhere else
            </p>
            <h2 className="mt-3 text-[clamp(28px,3.8vw,42px)] font-bold leading-[1.05] tracking-[-0.03em]">
              Built for both sides of the hire.
            </h2>
          </div>

          {/* 01 Trial Tasks */}
          <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(28px,4vw,56px)] border-b border-paper-line pb-12">
            <div>
              <p className="font-plex-mono text-[11px] tracking-[0.08em] text-ink-faint">01 — TRIAL TASKS</p>
              <h3 className="mt-2.5 text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.15] tracking-[-0.025em]">
                Real work before full-time
              </h3>
              <p className="mt-3 max-w-[46ch] text-[15.5px] leading-[1.6] text-ink-soft">
                Convert a PDF. Fix one component. Answer 20 support emails. Small, paid tasks that show what someone
                can actually do.
              </p>
              <div className="mt-5 grid gap-[10px]">
                <Bullet color="text-seeker">
                  <strong className="font-semibold">Jobseekers:</strong> paid experience even if you&apos;re not hired.
                </Bullet>
                <Bullet color="text-employer">
                  <strong className="font-semibold">Employers:</strong> evidence for a fraction of a bad-hire&apos;s cost.
                </Bullet>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
              {FEATURE_TICKETS.map((t) => (
                <div key={t.title} className="rounded-[12px] border border-paper-line bg-white p-[15px]">
                  <div className="font-plex-mono text-[9.5px] tracking-[0.08em] text-ink-faint">{t.label}</div>
                  <div className="mt-1.5 text-[14px] font-semibold leading-[1.3]">{t.title}</div>
                  <div className="mt-2.5 text-[16px] font-bold">{t.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 02 Reverse hiring */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(28px,4vw,56px)] border-b border-paper-line py-12">
            <div className="rounded-[14px] border border-paper-line bg-white p-5">
              <p className="font-plex-mono text-[10px] tracking-[0.08em] text-ink-faint">EMPLOYER SEARCH</p>
              <div className="mt-3 break-words rounded-[9px] border border-paper-line-soft bg-paper-chip-2 p-3 font-plex-mono text-[12.5px] leading-[1.6] text-ink/90">
                skill:React AND activity:AWS AND active:&lt;30d
              </div>
              <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-softer">
                Ranked by verified, delivered work — not by who applied fastest.
              </p>
            </div>
            <div>
              <p className="font-plex-mono text-[11px] tracking-[0.08em] text-ink-faint">02 — REVERSE HIRING</p>
              <h3 className="mt-2.5 text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.15] tracking-[-0.025em]">
                Found by doing, not applying
              </h3>
              <p className="mt-3 max-w-[46ch] text-[15.5px] leading-[1.6] text-ink-soft">
                Employers search for proven activity and get real people with verified track records. The more you
                do on StratPH, the more discoverable you become.
              </p>
              <div className="mt-5 grid gap-[10px]">
                <Bullet color="text-seeker">
                  <strong className="font-semibold">Jobseekers:</strong> you control your discoverability.
                </Bullet>
                <Bullet color="text-employer">
                  <strong className="font-semibold">Employers:</strong> skip the résumé pile entirely.
                </Bullet>
              </div>
            </div>
          </div>

          {/* 03 AI Career Gap Analyzer */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(28px,4vw,56px)] pt-12">
            <div>
              <p className="font-plex-mono text-[11px] tracking-[0.08em] text-ink-faint">03 — AI CAREER GAP ANALYZER</p>
              <h3 className="mt-2.5 text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.15] tracking-[-0.025em]">
                Know exactly what&apos;s missing
              </h3>
              <p className="mt-3 max-w-[46ch] text-[15.5px] leading-[1.6] text-ink-soft">
                Not a vague match percentage. A ranked list of the precise skills between you and the role — each one
                linked to a Trial Task that proves it.
              </p>
              <div className="mt-5 grid gap-[10px]">
                <Bullet color="text-seeker">
                  <strong className="font-semibold">Jobseekers:</strong> one click from a gap to the task that closes it.
                </Bullet>
                <Bullet color="text-employer">
                  <strong className="font-semibold">Employers:</strong> a talent pool that closes its own gaps.
                </Bullet>
              </div>
            </div>
            <div className="rounded-[14px] border border-paper-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-plex-mono text-[10px] tracking-[0.08em] text-ink-faint">GAP REPORT</p>
                <span className="rounded-[6px] bg-match-tint px-[9px] py-1 text-[11px] font-semibold text-match-fg">
                  75% match
                </span>
              </div>
              <div className="mt-3 text-[17px] font-bold tracking-[-0.02em]">Frontend Developer (React)</div>
              <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-paper-chip">
                <div className="h-full w-[75%] bg-match" />
              </div>
              <p className="mt-[18px] font-plex-mono text-[10px] tracking-[0.08em] text-ink-faint">
                MISSING ONLY THESE 3 SKILLS
              </p>
              <div className="mt-2.5 flex flex-wrap gap-[7px]">
                {GAP_SKILLS.map((skill) => (
                  <span key={skill} className="rounded-[7px] bg-gap-tint px-2.5 py-1.5 text-[12.5px] text-gap-fg">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mt-3.5 text-[13px] leading-[1.5] text-verified-3">
                React already verified via a completed Trial Task.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pt-[clamp(56px,8vw,100px)]">
          <div className="max-w-[620px]">
            <p className="font-plex-mono text-[11.5px] uppercase tracking-[0.09em] text-ink-faint">Pricing</p>
            <h2 className="mt-3 text-[clamp(28px,3.8vw,42px)] font-bold leading-[1.05] tracking-[-0.03em]">
              Free to prove yourself. Paid to hire.
            </h2>
          </div>

          <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[14px]">
            <div className="rounded-[16px] border border-paper-line bg-white p-7">
              <p className="font-plex-mono text-[11px] tracking-[0.08em] text-seeker">JOBSEEKERS</p>
              <div className="mt-2.5 text-[34px] font-bold tracking-[-0.03em]">Free</div>
              <p className="mt-2 mb-5 text-[14.5px] leading-[1.6] text-ink-soft">
                Browse and take Trial Tasks, keep 100% of approved task pay, build a searchable track record, and run
                gap reports.
              </p>
              <Link
                href="/register/jobseeker"
                className="inline-block rounded-[9px] bg-seeker px-5 py-3 text-[15px] font-semibold text-white"
              >
                Create a free profile
              </Link>
            </div>
            <div className="rounded-[16px] border border-paper-line bg-white p-7">
              <p className="font-plex-mono text-[11px] tracking-[0.08em] text-employer">EMPLOYERS</p>
              <div className="mt-2.5 text-[34px] font-bold tracking-[-0.03em]">
                Subscription<span className="text-[15px] font-normal text-ink-softer"> + task fees</span>
              </div>
              <p className="mt-2 mb-5 text-[14.5px] leading-[1.6] text-ink-soft">
                Post and fund unlimited Trial Tasks, search verified talent, and convert to full-time with no
                placement fee. Task pay goes entirely to the worker.
              </p>
              <Link
                href="/register/employer"
                className="inline-block rounded-[9px] bg-employer px-5 py-3 text-[15px] font-semibold text-white"
              >
                Start hiring
              </Link>
            </div>
          </div>
          <p className="mt-[14px] text-[12.5px] text-ink-softer">
            Subscriptions keep the marketplace and its escrow trustworthy — and keep jobseekers free of fees.
          </p>
        </section>

        {/* Final CTA */}
        <section className="pt-[clamp(56px,8vw,100px)] pb-[clamp(48px,7vw,90px)]">
          <div className="rounded-[20px] bg-navy px-[clamp(24px,5vw,60px)] py-[clamp(36px,6vw,72px)] text-center text-white">
            <h2 className="text-balance text-[clamp(30px,4.6vw,52px)] font-bold leading-[1.03] tracking-[-0.035em]">
              Stop guessing. Start proving.
            </h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-navy-fg-soft">
              Try the demo with a jobseeker, employer, or admin account and see the whole loop end to end.
            </p>
            <div className="mt-[30px] flex flex-wrap justify-center gap-3">
              <Link
                href="/register/jobseeker"
                className="rounded-[10px] bg-white px-6 py-3.5 text-[15.5px] font-semibold text-ink"
              >
                I&apos;m looking for work
              </Link>
              <Link
                href="/register/employer"
                className="rounded-[10px] border border-navy-line-2 px-6 py-3.5 text-[15.5px] font-semibold text-white"
              >
                I&apos;m hiring
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-line">
        <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-4 py-8 text-[12.5px] text-ink-softer`}>
          <div>StratPH — UI prototype. Subscriptions and escrow are simulated for demonstration; no real funds move.</div>
          <div className="flex gap-[18px]">
            <a href="#how" className="text-ink-softer">How it works</a>
            <a href="#pricing" className="text-ink-softer">Pricing</a>
            <Link href="/login" className="text-ink-softer">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Bullet({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-[10px]">
      <span className={`text-[13px] ${color}`}>◆</span>
      <span className="text-[14.5px] text-ink/90">{children}</span>
    </div>
  );
}
