from django.urls import path
from .views import SurveyResponseListCreateView, SurveyResponseDetailView

urlpatterns = [
    path("responses/", SurveyResponseListCreateView.as_view(), name="response-list-create"),
    path("responses/<uuid:pk>/", SurveyResponseDetailView.as_view(), name="response-detail"),
]
