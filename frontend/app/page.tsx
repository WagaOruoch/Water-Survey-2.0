import SurveyCorpAuthGate from "@/components/auth/SurveyCorpAuthGate";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Survey Corp
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in with Google to access and submit your survey form.
          </p>
        </div>

        <SurveyCorpAuthGate />

      </div>
    </div>
  );
}
