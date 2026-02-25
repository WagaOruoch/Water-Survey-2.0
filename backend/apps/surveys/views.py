from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SurveyResponse
from .serializers import GoogleAuthSerializer, SurveyResponseSerializer


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response(
                {"error": "GOOGLE_OAUTH_CLIENT_ID is not configured on backend."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        token = serializer.validated_data["id_token"]

        try:
            payload = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except Exception:
            return Response(
                {"error": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = payload.get("email")
        if not email:
            return Response(
                {"error": "Google account has no email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=email,
            defaults={
                "email": email,
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
            },
        )

        if not created:
            changed = False
            if user.email != email:
                user.email = email
                changed = True
            first_name = payload.get("given_name", "")
            last_name = payload.get("family_name", "")
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                changed = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                changed = True
            if changed:
                user.save(update_fields=["email", "first_name", "last_name"])

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                },
            },
            status=status.HTTP_200_OK,
        )


class SurveyResponseListCreateView(APIView):
    """
    GET  /api/responses/  — list all submitted responses
    POST /api/responses/  — submit a new survey response
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        responses = SurveyResponse.objects.filter(submitted_by=request.user)
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SurveyResponseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(submitted_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SurveyResponseDetailView(APIView):
    """
    GET /api/responses/<id>/  — retrieve a single response by UUID
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            response = SurveyResponse.objects.get(pk=pk, submitted_by=request.user)
        except SurveyResponse.DoesNotExist:
            return Response(
                {"error": "Response not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = SurveyResponseSerializer(response)
        return Response(serializer.data)
