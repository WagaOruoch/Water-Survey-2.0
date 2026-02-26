from django.conf import settings
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.db.models import Count
from django.db.models.functions import ExtractHour
from django.http import HttpResponse
from django.utils import timezone
import csv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SurveyResponse
from .serializers import (
    DashboardRecentActivityItemSerializer,
    DashboardSummarySerializer,
    GoogleAuthSerializer,
    SurveyResponseSerializer,
)


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

        site_name = request.query_params.get("site_name", "").strip()
        if site_name:
            responses = responses.filter(site_name=site_name)

        is_staffed = request.query_params.get("is_staffed", "").strip().lower()
        if is_staffed in ["yes", "no"]:
            responses = responses.filter(is_staffed=is_staffed)

        water_source_type = request.query_params.get("water_source_type", "").strip()
        if water_source_type:
            responses = responses.filter(water_source_type=water_source_type)

        submitted_after = request.query_params.get("submitted_after", "").strip()
        if submitted_after:
            try:
                after_date = datetime.strptime(submitted_after, "%Y-%m-%d").date()
                responses = responses.filter(submitted_at__date__gte=after_date)
            except ValueError:
                return Response(
                    {"error": "Invalid submitted_after date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        submitted_before = request.query_params.get("submitted_before", "").strip()
        if submitted_before:
            try:
                before_date = datetime.strptime(submitted_before, "%Y-%m-%d").date()
                responses = responses.filter(submitted_at__date__lte=before_date)
            except ValueError:
                return Response(
                    {"error": "Invalid submitted_before date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        period = request.query_params.get("period", "").strip().lower()
        now = timezone.now()
        if period == "this_week":
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            responses = responses.filter(submitted_at__gte=week_start)
        elif period == "this_month":
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            responses = responses.filter(submitted_at__gte=month_start)

        ordering = request.query_params.get("ordering", "-submitted_at").strip()
        allowed_ordering = {
            "submitted_at",
            "-submitted_at",
            "site_code",
            "-site_code",
            "site_name",
            "-site_name",
        }
        if ordering not in allowed_ordering:
            ordering = "-submitted_at"
        responses = responses.order_by(ordering)

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1

        try:
            page_size = int(request.query_params.get("page_size", 10))
            if page_size < 1:
                page_size = 10
            page_size = min(page_size, 100)
        except ValueError:
            page_size = 10

        total = responses.count()
        total_pages = max((total + page_size - 1) // page_size, 1)
        if page > total_pages:
            page = total_pages

        start = (page - 1) * page_size
        end = start + page_size

        paged_responses = responses[start:end]
        serializer = SurveyResponseSerializer(paged_responses, many=True)

        return Response(
            {
                "items": serializer.data,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
            }
        )

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


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

        responses = SurveyResponse.objects.filter(submitted_by=request.user)

        total_surveys = responses.count()
        surveys_this_month = responses.filter(submitted_at__gte=month_start).count()
        surveys_this_week = responses.filter(submitted_at__gte=week_start).count()

        staffed_count = responses.filter(is_staffed="yes").count()
        staffing_rate = round((staffed_count / total_surveys) * 100, 2) if total_surveys else 0.0

        top_source_row = (
            responses.exclude(water_source_type__isnull=True)
            .exclude(water_source_type="")
            .values("water_source_type")
            .annotate(total=Count("id"))
            .order_by("-total")
            .first()
        )

        source_labels = {
            "piped": "Piped",
            "well": "Well",
            "spring": "Spring",
            "packaged": "Packaged",
            "other_sources": "Other sources",
        }
        top_water_source = ""
        if top_source_row:
            source_key = top_source_row.get("water_source_type")
            top_water_source = source_labels.get(source_key, source_key or "")

        peak_hour_row = (
            responses.annotate(hour=ExtractHour("submitted_at"))
            .exclude(hour__isnull=True)
            .values("hour")
            .annotate(total=Count("id"))
            .order_by("-total", "hour")
            .first()
        )
        peak_survey_time = ""
        if peak_hour_row:
            peak_hour = int(peak_hour_row["hour"])
            start_label = datetime(2000, 1, 1, peak_hour).strftime("%I%p").lstrip("0")
            end_label = datetime(2000, 1, 1, (peak_hour + 1) % 24).strftime("%I%p").lstrip("0")
            peak_survey_time = f"{start_label} - {end_label}"

        payload = {
            "total_surveys": total_surveys,
            "surveys_this_month": surveys_this_month,
            "surveys_this_week": surveys_this_week,
            "staffing_rate": staffing_rate,
            "top_water_source": top_water_source,
            "peak_survey_time": peak_survey_time,
        }
        serializer = DashboardSummarySerializer(payload)
        return Response(serializer.data)


class DashboardRecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        responses = SurveyResponse.objects.filter(submitted_by=request.user)[:5]
        payload = [
            {
                "id": response.id,
                "site_code": response.site_code,
                "location": response.site_name,
                "submitted_at": response.submitted_at,
                "is_staffed": response.is_staffed,
            }
            for response in responses
        ]
        serializer = DashboardRecentActivityItemSerializer(payload, many=True)
        return Response(serializer.data)


class SurveyResponseExportCsvView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        responses = SurveyResponse.objects.filter(submitted_by=request.user).order_by("-submitted_at")

        site_name = request.query_params.get("site_name", "").strip()
        if site_name:
            responses = responses.filter(site_name=site_name)

        is_staffed = request.query_params.get("is_staffed", "").strip().lower()
        if is_staffed in ["yes", "no"]:
            responses = responses.filter(is_staffed=is_staffed)

        water_source_type = request.query_params.get("water_source_type", "").strip()
        if water_source_type:
            responses = responses.filter(water_source_type=water_source_type)

        submitted_after = request.query_params.get("submitted_after", "").strip()
        if submitted_after:
            try:
                after_date = datetime.strptime(submitted_after, "%Y-%m-%d").date()
                responses = responses.filter(submitted_at__date__gte=after_date)
            except ValueError:
                return Response(
                    {"error": "Invalid submitted_after date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        submitted_before = request.query_params.get("submitted_before", "").strip()
        if submitted_before:
            try:
                before_date = datetime.strptime(submitted_before, "%Y-%m-%d").date()
                responses = responses.filter(submitted_at__date__lte=before_date)
            except ValueError:
                return Response(
                    {"error": "Invalid submitted_before date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        period = request.query_params.get("period", "").strip().lower()
        now = timezone.now()
        if period == "this_week":
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            responses = responses.filter(submitted_at__gte=week_start)
        elif period == "this_month":
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            responses = responses.filter(submitted_at__gte=month_start)

        serializer = SurveyResponseSerializer(responses, many=True)
        rows = serializer.data

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="survey_responses.csv"'

        writer = csv.writer(response)
        if not rows:
            writer.writerow(["No data"])
            return response

        headers = list(rows[0].keys())
        writer.writerow(headers)

        for row in rows:
            writer.writerow([row.get(header, "") for header in headers])

        return response
