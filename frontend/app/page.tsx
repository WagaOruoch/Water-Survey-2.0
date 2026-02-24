import SurveyForm from "@/components/survey/SurveyForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Water Site Survey
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete all visible fields. Sections and questions will appear
            based on your responses.
          </p>
        </div>

        {/* Survey form */}
        <SurveyForm />

      </div>
    </div>
  );
}
