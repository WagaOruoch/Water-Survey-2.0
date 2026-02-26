import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex min-h-16 items-center justify-between bg-blue-600 px-6 text-white shadow-sm sm:px-8">
        <div>
          <h1 className="text-xl font-semibold">Survey Corp</h1>
          <p className="text-xs text-blue-100">Survey Operations Platform</p>
        </div>
        <Link
          href="/login"
          className="ui-btn-swap rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Log In
        </Link>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:gap-8 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-blue-100 text-white shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/survey-landing-page.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-blue-950/70 to-blue-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-slate-900/15" />

          <div className="pointer-events-none absolute inset-0 opacity-45">
            <div className="hero-orb hero-orb-a" />
            <div className="hero-orb hero-orb-b" />
            <div className="hero-orb hero-orb-c" />
          </div>

          <div className="relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:py-12">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-blue-50">
                Build · Publish · Analyze
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                One platform to design, run, and scale every survey
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                Survey Corp gives teams a single workspace to create templates, publish forms,
                collect responses, and monitor insights across domains. Water Site Survey is the
                first built-in workflow, with customizable survey creation designed into the roadmap.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-blue-100">
                {[
                  "Create templates",
                  "Publish links",
                  "Track responses",
                  "Analyze trends",
                  "AI-assisted drafting (roadmap)",
                ].map((pill) => (
                  <span key={pill} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1">
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="ui-btn-swap inline-flex items-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-blue-700"
                >
                  Launch Survey Workspace
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Existing Surveys
                </Link>
              </div>
            </div>

            <div className="relative rounded-xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
              <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-semibold text-blue-100">
                {[
                  "Create",
                  "Customize",
                  "Publish",
                  "Collect",
                  "Analyze",
                ].map((step, index) => (
                  <span
                    key={step}
                    className={`rounded-full border px-2.5 py-1 ${
                      index === 2
                        ? "border-emerald-200/80 bg-emerald-300/25 text-emerald-50"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>

              <div className="space-y-3">
                <div className="hero-float rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs text-blue-100">Template library</p>
                  <p className="mt-1 text-sm font-semibold">Predefined Water Site Survey + future custom surveys</p>
                </div>

                <div className="hero-float-delayed rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs text-blue-100">Survey builder readiness</p>
                  <p className="mt-1 text-sm font-semibold">Question types, sections, publishing, and response pipelines</p>
                </div>

                <div className="hero-float rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs text-blue-100">Decision intelligence</p>
                  <p className="mt-1 text-sm font-semibold">Real-time analytics and AI-assisted survey generation roadmap</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Template-first", "Start from predefined surveys today and add custom survey templates later"],
            ["Publication flow", "Publish survey links and control response intake in one workflow"],
            ["Response ops", "Track activity, audit submissions, and export clean datasets"],
            ["Future AI", "Generate better surveys faster with planned AI-assisted form drafting"],
          ].map(([title, description]) => (
            <article
              key={title}
              className="analytics-card-link rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Ready to build your survey operation hub?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">
                Sign in to access Survey Corp, run the predefined Water Site Survey, and scale toward
                custom multi-domain survey templates from one central platform.
              </p>
            </div>
            <Link
              href="/login"
              className="ui-btn-swap inline-flex w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Continue to Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
