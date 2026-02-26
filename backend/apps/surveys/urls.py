from django.urls import path
from .views import (
    AnalyticsSummaryView,
    DashboardRecentActivityView,
    DashboardSummaryView,
    GoogleAuthView,
    SurveyResponseExportCsvView,
    SurveyResponseDetailView,
    SurveyResponseListCreateView,
)

urlpatterns = [
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("analytics/summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("responses/", SurveyResponseListCreateView.as_view(), name="response-list-create"),
    path("responses/<uuid:pk>/", SurveyResponseDetailView.as_view(), name="response-detail"),
    path("responses/export/csv/", SurveyResponseExportCsvView.as_view(), name="response-export-csv"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/recent/", DashboardRecentActivityView.as_view(), name="dashboard-recent"),
]
