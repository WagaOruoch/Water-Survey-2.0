from django.urls import path
from .views import GoogleAuthView, SurveyResponseListCreateView, SurveyResponseDetailView

urlpatterns = [
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("responses/", SurveyResponseListCreateView.as_view(), name="response-list-create"),
    path("responses/<uuid:pk>/", SurveyResponseDetailView.as_view(), name="response-detail"),
]
