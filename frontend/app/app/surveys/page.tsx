import SurveyForm from "@/components/survey/SurveyForm";

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Water Site Survey Form</h2>
        <p className="mt-1 text-sm text-blue-100/85"></p>
      </div>

      <SurveyForm />
    </div>
  );
}
