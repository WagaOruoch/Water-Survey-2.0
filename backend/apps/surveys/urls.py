from django.urls import path
from .views import (
    DashboardRecentActivityView,
    DashboardSummaryView,
    GoogleAuthView,
    SurveyResponseExportCsvView,
    SurveyResponseDetailView,
    SurveyResponseListCreateView,
)

urlpatterns = [
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("responses/", SurveyResponseListCreateView.as_view(), name="response-list-create"),
    path("responses/<uuid:pk>/", SurveyResponseDetailView.as_view(), name="response-detail"),
    path("responses/export/csv/", SurveyResponseExportCsvView.as_view(), name="response-export-csv"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/recent/", DashboardRecentActivityView.as_view(), name="dashboard-recent"),
]
