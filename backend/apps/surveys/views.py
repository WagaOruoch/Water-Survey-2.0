from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from datetime import datetime, timedelta
from django.db.models import Count, Q
from django.db.models.functions import ExtractHour, TruncDate
from django.http import HttpResponse
from django.utils import timezone
import csv
import hashlib
import json
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


def _cache_version_key(user_id: int) -> str:
    return f"insights_cache_version:user:{user_id}"


def _get_user_cache_version(user_id: int) -> int:
    key = _cache_version_key(user_id)
    version = cache.get(key)
    if version is None:
        cache.set(key, 1, timeout=None)
        return 1

    try:
        return int(version)
    except (TypeError, ValueError):
        cache.set(key, 1, timeout=None)
        return 1


def _bump_user_cache_version(user_id: int) -> None:
    key = _cache_version_key(user_id)
    current_version = _get_user_cache_version(user_id)
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, current_version + 1, timeout=None)


def _build_cache_key(scope: str, user_id: int, params: dict) -> str:
    version = _get_user_cache_version(user_id)
    params_blob = json.dumps(params, sort_keys=True, separators=(",", ":"))
    params_hash = hashlib.sha1(params_blob.encode("utf-8")).hexdigest()
    return f"{scope}:user:{user_id}:v:{version}:h:{params_hash}"


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


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


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

        water_is_treated = request.query_params.get("water_is_treated", "").strip().lower()
        if water_is_treated in ["yes", "no"]:
            responses = responses.filter(water_is_treated=water_is_treated)

        used_for_drinking = request.query_params.get("used_for_drinking", "").strip().lower()
        if used_for_drinking in ["yes", "no"]:
            responses = responses.filter(used_for_drinking=used_for_drinking)

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
            _bump_user_cache_version(request.user.id)
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
        cache_key = _build_cache_key("dashboard-summary", request.user.id, {})
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

        responses = SurveyResponse.objects.filter(submitted_by=request.user)

        summary_counts = responses.aggregate(
            total_surveys=Count("id"),
            surveys_this_month=Count("id", filter=Q(submitted_at__gte=month_start)),
            surveys_this_week=Count("id", filter=Q(submitted_at__gte=week_start)),
            staffed_count=Count("id", filter=Q(is_staffed="yes")),
        )

        total_surveys = summary_counts["total_surveys"]
        surveys_this_month = summary_counts["surveys_this_month"]
        surveys_this_week = summary_counts["surveys_this_week"]
        staffed_count = summary_counts["staffed_count"]
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
        response_payload = serializer.data
        cache.set(cache_key, response_payload, timeout=settings.DASHBOARD_SUMMARY_CACHE_TTL)
        return Response(response_payload)


class DashboardRecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = _build_cache_key("dashboard-recent", request.user.id, {})
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

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
        response_payload = serializer.data
        cache.set(cache_key, response_payload, timeout=settings.DASHBOARD_RECENT_CACHE_TTL)
        return Response(response_payload)


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

        water_is_treated = request.query_params.get("water_is_treated", "").strip().lower()
        if water_is_treated in ["yes", "no"]:
            responses = responses.filter(water_is_treated=water_is_treated)

        used_for_drinking = request.query_params.get("used_for_drinking", "").strip().lower()
        if used_for_drinking in ["yes", "no"]:
            responses = responses.filter(used_for_drinking=used_for_drinking)

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


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        end_date_raw = request.query_params.get("end_date", "").strip()
        start_date_raw = request.query_params.get("start_date", "").strip()
        site_name = request.query_params.get("site_name", "").strip()

        today = timezone.localdate()

        if end_date_raw:
            try:
                end_date = datetime.strptime(end_date_raw, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            end_date = today

        if start_date_raw:
            try:
                start_date = datetime.strptime(start_date_raw, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            start_date = end_date - timedelta(days=29)

        if start_date > end_date:
            return Response(
                {"error": "start_date must be less than or equal to end_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = _build_cache_key(
            "analytics-summary",
            request.user.id,
            {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "site_name": site_name,
            },
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        current_start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        current_end_dt = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), datetime.min.time()))

        period_days = (end_date - start_date).days + 1
        previous_end_date = start_date - timedelta(days=1)
        previous_start_date = previous_end_date - timedelta(days=period_days - 1)
        previous_start_dt = timezone.make_aware(datetime.combine(previous_start_date, datetime.min.time()))
        previous_end_dt = timezone.make_aware(datetime.combine(previous_end_date + timedelta(days=1), datetime.min.time()))

        base_queryset = SurveyResponse.objects.filter(submitted_by=request.user)
        if site_name:
            base_queryset = base_queryset.filter(site_name=site_name)

        current_queryset = base_queryset.filter(
            submitted_at__gte=current_start_dt,
            submitted_at__lt=current_end_dt,
        )
        previous_queryset = base_queryset.filter(
            submitted_at__gte=previous_start_dt,
            submitted_at__lt=previous_end_dt,
        )

        current_counts = current_queryset.aggregate(
            total_submissions=Count("id"),
            staffed_denominator=Count("id", filter=Q(is_staffed__in=["yes", "no"])),
            staffed_numerator=Count("id", filter=Q(is_staffed="yes")),
            treated_denominator=Count("id", filter=Q(water_is_treated__in=["yes", "no"])),
            treated_numerator=Count("id", filter=Q(water_is_treated="yes")),
            drinking_denominator=Count("id", filter=Q(used_for_drinking__in=["yes", "no"])),
            drinking_numerator=Count("id", filter=Q(used_for_drinking="yes")),
        )
        previous_counts = previous_queryset.aggregate(previous_submissions=Count("id"))

        total_submissions = current_counts["total_submissions"]
        previous_submissions = previous_counts["previous_submissions"]
        submissions_delta = total_submissions - previous_submissions

        staffed_denominator = current_counts["staffed_denominator"]
        staffed_numerator = current_counts["staffed_numerator"]
        staffed_pct = round((staffed_numerator / staffed_denominator) * 100, 2) if staffed_denominator else 0.0

        treated_denominator = current_counts["treated_denominator"]
        treated_numerator = current_counts["treated_numerator"]
        treated_pct = round((treated_numerator / treated_denominator) * 100, 2) if treated_denominator else 0.0

        drinking_denominator = current_counts["drinking_denominator"]
        drinking_numerator = current_counts["drinking_numerator"]
        drinking_pct = round((drinking_numerator / drinking_denominator) * 100, 2) if drinking_denominator else 0.0

        day_bucket_counts = {
            row["day"]: row["total"]
            for row in (
                current_queryset.annotate(day=TruncDate("submitted_at"))
                .values("day")
                .annotate(total=Count("id"))
                .order_by("day")
            )
        }

        submissions_trend = []
        cursor = start_date
        while cursor <= end_date:
            submissions_trend.append(
                {
                    "date": cursor.isoformat(),
                    "count": int(day_bucket_counts.get(cursor, 0)),
                }
            )
            cursor += timedelta(days=1)

        water_source_distribution = [
            {
                "key": row["water_source_type"],
                "count": row["total"],
            }
            for row in (
                current_queryset.exclude(water_source_type__isnull=True)
                .exclude(water_source_type="")
                .values("water_source_type")
                .annotate(total=Count("id"))
                .order_by("-total", "water_source_type")
            )
        ]

        source_total = sum(item["count"] for item in water_source_distribution)
        for item in water_source_distribution:
            item["percentage"] = round((item["count"] / source_total) * 100, 2) if source_total else 0.0

        site_distribution = [
            {
                "site_name": row["site_name"] or "Unknown",
                "count": row["total"],
            }
            for row in (
                current_queryset.values("site_name")
                .annotate(total=Count("id"))
                .order_by("-total", "site_name")
            )
        ]

        payload = {
            "filters": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "site_name": site_name,
            },
            "kpis": {
                "total_submissions": {
                    "value": total_submissions,
                    "delta": submissions_delta,
                    "previous_value": previous_submissions,
                },
                "staffed_sites_pct": {
                    "value": staffed_pct,
                    "numerator": staffed_numerator,
                    "denominator": staffed_denominator,
                },
                "treated_water_pct": {
                    "value": treated_pct,
                    "numerator": treated_numerator,
                    "denominator": treated_denominator,
                },
            },
            "submissions_trend": submissions_trend,
            "water_source_distribution": water_source_distribution,
            "site_distribution": site_distribution,
            "service_quality": {
                "staffed_pct": staffed_pct,
                "treated_pct": treated_pct,
                "drinking_pct": drinking_pct,
            },
        }

        cache.set(cache_key, payload, timeout=settings.ANALYTICS_SUMMARY_CACHE_TTL)
        return Response(payload)
