import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex min-h-16 items-center justify-between bg-blue-600 px-8 text-white shadow-sm">
        <h1 className="text-xl font-semibold">Survey Corp</h1>
        <Link
          href="/login"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Log In
        </Link>
      </nav>

      <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
          <h2 className="text-4xl font-bold text-gray-900">Water Site Survey Platform</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            Survey Corp helps field teams collect, review, and manage water site survey
            responses across locations. Start by logging in with Google, then continue to
            dashboard insights and survey operations.
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Proceed to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
