from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AnalyticsSummaryView,
    DashboardRecentActivityView,
    DashboardSummaryView,
    GoogleAuthView,
    HealthCheckView,
    SurveyResponseExportCsvView,
    SurveyResponseDetailView,
    SurveyResponseListCreateView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("analytics/summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("responses/", SurveyResponseListCreateView.as_view(), name="response-list-create"),
    path("responses/<uuid:pk>/", SurveyResponseDetailView.as_view(), name="response-detail"),
    path("responses/export/csv/", SurveyResponseExportCsvView.as_view(), name="response-export-csv"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/recent/", DashboardRecentActivityView.as_view(), name="dashboard-recent"),
]
