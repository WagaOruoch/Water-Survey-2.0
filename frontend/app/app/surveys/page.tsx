import SurveyForm from "@/components/survey/SurveyForm";

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Surveys</h2>
        <p className="mt-1 text-sm text-gray-600">Water Site Survey Form</p>
      </div>

      <SurveyForm />
    </div>
  );
}
