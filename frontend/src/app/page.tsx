import Link from "next/link";
import { Button, Badge } from "@/components/ui/Primitives";

const MICRO_JOB_TICKETS: { title: string; pay: string; category: string; rotate: string }[] = [
  { title: "Convert a PDF to Excel", pay: "₱800", category: "Data Entry", rotate: "-rotate-2" },
  { title: "Fix one React component", pay: "₱1,500", category: "Web Dev", rotate: "rotate-1" },
  { title: "Edit one 60s reel", pay: "₱1,200", category: "Video", rotate: "-rotate-1" },
  { title: "Answer 20 support emails", pay: "₱600", category: "Support", rotate: "rotate-2" },
];

const AUDIENCES = ["Skilled Professionals", "Fresh Graduates", "Students", "Career Shifters"];

const STEPS: { icon: string; title: string; body: string }[] = [
  { icon: "🎯", title: "Try", body: "Take a small, paid task straight from the job listing — no interview required." },
  { icon: "💪", title: "Prove", body: "Deliver real work. The employer reviews it and pays out either way — the ₱ is yours regardless of the outcome." },
  { icon: "🚀", title: "Hire", body: "Nail it, and the employer can upgrade you to part-time, contract, or full-time on the spot." },
];

const OLD_WAY = [
  "Apply with a resume and hope it gets opened",
  "Wait weeks for an interview slot",
  "Get judged on how well you interview, not how well you work",
  "Get a vague match score with zero explanation",
  "Rejected with no feedback, no pay, no proof of effort",
];

const STRATPH_WAY = [
  "Take a ₱300–₱3,000 paid work trial — today",
  "Get reviewed on real, delivered work",
  "Get paid whether or not you're hired further",
  "See exactly which skills you're missing — not just a percentage",
  "Build a public track record employers can search",
];

const DASHBOARDS: { icon: string; title: string; body: string; tone: "indigo" | "emerald" | "amber" }[] = [
  { icon: "🧑‍💻", title: "Jobseeker", body: "Browse micro jobs, close your skill gaps, submit work, and track upgrade offers.", tone: "indigo" },
  { icon: "🏢", title: "Employer", body: "Post paid work trials, review submissions, upgrade top performers, and search verified talent.", tone: "emerald" },
  { icon: "🛡️", title: "Super Admin", body: "Moderate postings, verify employers, and watch trial-to-hire conversion across the platform.", tone: "amber" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              SP
            </div>
            <span className="text-sm font-semibold text-zinc-900">StratPH</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-500 sm:flex">
            <a href="#how-it-works" className="hover:text-zinc-900">How it works</a>
            <a href="#features" className="hover:text-zinc-900">Features</a>
            <a href="#dashboards" className="hover:text-zinc-900">Dashboards</a>
          </nav>
          <Link href="/login">
            <Button variant="outline" size="sm">Log in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200 via-sky-100 to-amber-100 opacity-60 blur-3xl"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-20">
          <div>
            <Badge tone="indigo">For every stage of your career</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
              Not another job board.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Show your skills. Get hired.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-500">
              StratPH replaces{" "}
              <span className="text-zinc-400 line-through decoration-2">
                Apply → Interview → Reject
              </span>{" "}
              with <span className="font-semibold text-zinc-800">Try → Prove → Hire</span> — paid
              work trials that let you show real, hands-on skills, an AI tool that tells you
              exactly what to learn next, and a search engine that finds you by what
              you&apos;ve actually done.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register/jobseeker">
                <Button size="lg" className="w-full sm:w-auto">
                  I&apos;m looking for work
                </Button>
              </Link>
              <Link href="/register/employer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  I&apos;m hiring
                </Button>
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <Badge key={a} tone="zinc">
                  {a}
                </Badge>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-zinc-100 pt-6">
              <div>
                <p className="text-2xl font-semibold text-zinc-900">₱300–₱3k</p>
                <p className="text-xs text-zinc-400">per paid work trial</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">0</p>
                <p className="text-xs text-zinc-400">interviews required</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">3</p>
                <p className="text-xs text-zinc-400">role-based dashboards</p>
              </div>
            </div>
          </div>

          {/* Reverse Hiring search mock */}
          <div className="relative">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-indigo-100">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Reverse Hiring search
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
                <span className="text-zinc-400">🔎</span>
                <span>React developer who deployed AWS in the last 30 days</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Juan Dela Cruz</p>
                      <p className="text-xs text-zinc-500">React · Next.js · AWS</p>
                    </div>
                  </div>
                  <Badge tone="emerald">active 16d ago</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 opacity-70">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                      LT
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Liza Tan</p>
                      <p className="text-xs text-zinc-500">Node.js · AWS · Docker</p>
                    </div>
                  </div>
                  <Badge tone="zinc">active 22d ago</Badge>
                </div>
              </div>
            </div>

            {/* Scattered micro-job tickets */}
            <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2">
              {MICRO_JOB_TICKETS.slice(0, 2).map((t) => (
                <TicketCard key={t.title} ticket={t} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Old way vs StratPH */}
      <section className="border-y border-zinc-100 bg-zinc-50/60 py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 text-center">
            <Badge tone="rose">The old way is broken</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Hiring shouldn&apos;t be a guessing game
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Apply → Interview → Reject
              </p>
              <ul className="space-y-3">
                {OLD_WAY.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-zinc-500">
                    <span className="mt-0.5 text-zinc-300">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Try → Prove → Hire
              </p>
              <ul className="space-y-3">
                {STRATPH_WAY.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-zinc-700">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 text-center">
            <Badge tone="indigo">How it works</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl">
              A paid work trial, not a guessing game
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-2xl">
                    {step.icon}
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Step {i + 1}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-500">{step.body}</p>
                </div>
                {i < STEPS.length - 1 ? (
                  <span className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-xl text-zinc-300 sm:block">
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Killer features */}
      <section id="features" className="border-t border-zinc-100 bg-zinc-50/60 py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 text-center">
            <Badge tone="amber">Three features that don&apos;t exist together anywhere else</Badge>
          </div>

          <div className="mb-16 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <Badge tone="indigo">Killer feature 01</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-900">
                Micro Jobs — a paid work trial before full-time
              </h3>
              <p className="mt-3 text-zinc-600">
                Convert a PDF to Excel. Fix one React component. Edit one video. Answer 20
                customer emails. Small, paid tasks that let employers see real work before
                committing — and instantly upgrade a great performer to part-time, contract, or
                full-time.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2"><span className="text-indigo-500">✓</span> Juniors and fresh graduates get real, paid experience</li>
                <li className="flex gap-2"><span className="text-indigo-500">✓</span> Employers reduce hiring risk</li>
                <li className="flex gap-2"><span className="text-indigo-500">✓</span> Every trial can convert instantly</li>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MICRO_JOB_TICKETS.map((t) => (
                <TicketCard key={t.title} ticket={t} />
              ))}
            </div>
          </div>

          <div className="mb-16 grid items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Employer search
              </p>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-700">
                skill:React AND activity:AWS AND active:&lt;30d
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Candidates surface because of what they shipped — not because they applied.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <Badge tone="emerald">Killer feature 02</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-900">
                Reverse Hiring — candidates find you by doing, not applying
              </h3>
              <p className="mt-3 text-zinc-600">
                Employers search &ldquo;React developer who deployed AWS in the last 30
                days&rdquo; and get real people with verified activity — not just resumes. The
                more you do on StratPH, the more discoverable you become.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Activity, not adjectives, decides visibility</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Jobseekers control their discoverability</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Employers skip the resume pile entirely</li>
              </ul>
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <Badge tone="amber">Killer feature 03</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-900">
                AI Career Gap Analyzer — know exactly what&apos;s missing
              </h3>
              <p className="mt-3 text-zinc-600">
                Other platforms tell you a vague match score and leave you guessing why you
                weren&apos;t picked. StratPH tells you precisely which skills stand between you
                and the role — and links each gap straight to a micro job that lets you prove it.
              </p>
              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-zinc-400 line-through decoration-2">&ldquo;You match 60%.&rdquo;</p>
                <p className="mt-1 font-medium text-zinc-800">
                  &ldquo;You&apos;re missing only these 3 skills.&rdquo;
                </p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2"><span className="text-amber-500">✓</span> No more vague match percentages</li>
                <li className="flex gap-2"><span className="text-amber-500">✓</span> A clear, ranked list of missing skills</li>
                <li className="flex gap-2"><span className="text-amber-500">✓</span> One click from a missing skill to a micro job that builds it</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Gap report</p>
                <Badge tone="amber">25% match</Badge>
              </div>
              <p className="mb-2 text-sm font-semibold text-zinc-900">Frontend Developer (React)</p>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: "25%" }} />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Missing only these 3 skills
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                <Badge tone="rose">JavaScript</Badge>
                <Badge tone="rose">CSS</Badge>
                <Badge tone="rose">Git</Badge>
              </div>
              <p className="text-xs text-emerald-600">✓ React already verified via a completed micro job</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboards */}
      <section id="dashboards" className="py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 text-center">
            <Badge tone="zinc">One platform, three roles</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Purpose-built dashboards for every side of the marketplace
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {DASHBOARDS.map((d) => (
              <div key={d.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-2xl">
                  {d.icon}
                </div>
                <Badge tone={d.tone}>{d.title}</Badge>
                <p className="mt-3 text-sm text-zinc-600">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden bg-zinc-900 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-500 to-amber-400 opacity-30 blur-3xl"
        />
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Stop guessing. Start proving.
          </h2>
          <p className="mt-3 text-zinc-400">
            Log in with a demo account and try the jobseeker, employer, and admin dashboards.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg">Try the demo</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        StratPH — UI prototype. No live payments or accounts are processed.
      </footer>
    </div>
  );
}

function TicketCard({
  ticket,
}: {
  ticket: { title: string; pay: string; category: string; rotate: string };
}) {
  return (
    <div
      className={`relative rounded-xl border border-dashed border-zinc-300 bg-white p-4 shadow-sm transition-transform hover:rotate-0 hover:shadow-md ${ticket.rotate}`}
    >
      <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white ring-1 ring-inset ring-zinc-200" />
      <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white ring-1 ring-inset ring-zinc-200" />
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{ticket.category}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{ticket.title}</p>
      <p className="mt-2 text-lg font-bold text-emerald-600">{ticket.pay}</p>
    </div>
  );
}
