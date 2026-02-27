import csv
import json
from datetime import timedelta
from pathlib import Path
from statistics import mean, median
from time import perf_counter

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

from apps.surveys.models import SurveyResponse


DEFAULT_ENDPOINTS = [
    "/api/dashboard/summary/",
    "/api/dashboard/recent/",
    "/api/analytics/summary/",
    "/api/responses/?page=1&page_size=20",
    "/api/responses/export/csv/",
]

LOAD_TEST_ENDPOINTS = [
    "/api/dashboard/summary/",
    "/api/dashboard/recent/",
    "/api/analytics/summary/",
    "/api/analytics/summary/?start_date={start_90d}&end_date={today}",
    "/api/responses/?page=1&page_size=100&ordering=-submitted_at",
    "/api/responses/?page=1&page_size=100&period=this_month",
    "/api/responses/export/csv/?period=this_month",
]


def calculate_percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]

    sorted_values = sorted(values)
    position = (len(sorted_values) - 1) * percentile
    lower_idx = int(position)
    upper_idx = min(lower_idx + 1, len(sorted_values) - 1)
    weight = position - lower_idx
    return sorted_values[lower_idx] * (1 - weight) + sorted_values[upper_idx] * weight


class BaseCommandWithHelpers(BaseCommand):
    @staticmethod
    def parse_header_float(value: str | None) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def format_optional(value: float | None, decimals: int) -> str:
        if value is None:
            return "n/a"
        return f"{value:.{decimals}f}"


class Command(BaseCommandWithHelpers):
    help = "Benchmark API endpoint latency and rank the slowest endpoints."

    def add_arguments(self, parser):
        parser.add_argument(
            "--preset",
            type=str,
            choices=["smoke", "load"],
            default="smoke",
            help="Built-in endpoint suite. Used when --endpoint is not supplied.",
        )
        parser.add_argument(
            "--endpoint",
            action="append",
            dest="endpoints",
            help="Endpoint to test (repeat for multiple). Example: --endpoint /api/analytics/summary/?start_date=2026-01-01&end_date=2026-01-30",
        )
        parser.add_argument(
            "--runs",
            type=int,
            default=10,
            help="Number of measured requests per endpoint.",
        )
        parser.add_argument(
            "--warmup",
            type=int,
            default=2,
            help="Warm-up requests per endpoint (not measured).",
        )
        parser.add_argument(
            "--email",
            type=str,
            default="",
            help="User email to impersonate. Defaults to first available user.",
        )
        parser.add_argument(
            "--fail-on-error",
            action="store_true",
            help="Stop if any endpoint responds with HTTP >= 400.",
        )
        parser.add_argument(
            "--output-json",
            type=str,
            default="",
            help="Write benchmark results to a JSON file.",
        )
        parser.add_argument(
            "--output-csv",
            type=str,
            default="",
            help="Write benchmark results to a CSV file.",
        )

    def resolve_endpoints(self, preset: str, explicit_endpoints: list[str] | None, user) -> list[str]:
        if explicit_endpoints:
            return explicit_endpoints

        if preset == "smoke":
            return list(DEFAULT_ENDPOINTS)

        today = timezone.localdate()
        start_90d = today - timedelta(days=89)

        first_site = (
            SurveyResponse.objects.filter(submitted_by=user)
            .exclude(site_name__isnull=True)
            .exclude(site_name="")
            .values_list("site_name", flat=True)
            .first()
        )

        endpoints = []
        for endpoint in LOAD_TEST_ENDPOINTS:
            filled = endpoint.format(
                today=today.isoformat(),
                start_90d=start_90d.isoformat(),
            )
            endpoints.append(filled)

        if first_site:
            endpoints.append(f"/api/analytics/summary/?site_name={first_site}")
            endpoints.append(f"/api/responses/?page=1&page_size=100&site_name={first_site}")

        return endpoints

    def write_json_report(self, output_path: str, payload: dict):
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def write_csv_report(self, output_path: str, summaries: list[dict]):
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        with path.open("w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(
                [
                    "endpoint",
                    "avg_ms",
                    "p95_ms",
                    "median_ms",
                    "min_ms",
                    "max_ms",
                    "statuses",
                    "errors",
                    "avg_response_header_ms",
                    "avg_db_queries",
                    "avg_db_ms",
                ]
            )
            for row in summaries:
                writer.writerow(
                    [
                        row["endpoint"],
                        f"{row['avg_ms']:.2f}",
                        f"{row['p95_ms']:.2f}",
                        f"{row['med_ms']:.2f}",
                        f"{row['min_ms']:.2f}",
                        f"{row['max_ms']:.2f}",
                        ",".join(str(code) for code in row["statuses"]),
                        row["errors"],
                        self.format_optional(row["avg_header_ms"], 2),
                        self.format_optional(row["avg_db_queries"], 1),
                        self.format_optional(row["avg_db_ms"], 2),
                    ]
                )

    def handle(self, *args, **options):
        runs = options["runs"]
        warmup = options["warmup"]
        preset = options["preset"]
        fail_on_error = options["fail_on_error"]
        output_json = options["output_json"].strip()
        output_csv = options["output_csv"].strip()

        if runs < 1:
            raise CommandError("--runs must be >= 1")
        if warmup < 0:
            raise CommandError("--warmup must be >= 0")

        user_model = get_user_model()
        email = options["email"].strip()
        if email:
            user = user_model.objects.filter(email=email).first()
            if not user:
                raise CommandError(f"No user found with email '{email}'.")
        else:
            user = user_model.objects.order_by("id").first()
            if not user:
                raise CommandError(
                    "No users found. Create a user or pass --email to an existing account."
                )

        endpoints = self.resolve_endpoints(
            preset=preset,
            explicit_endpoints=options["endpoints"],
            user=user,
        )

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = Client(
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
            HTTP_HOST="localhost",
        )

        self.stdout.write(self.style.NOTICE("API benchmark started"))
        self.stdout.write(f"User: {getattr(user, 'email', None) or user.username}")
        self.stdout.write(f"Preset: {preset}")
        self.stdout.write(f"Runs per endpoint: {runs}, warmup: {warmup}")
        self.stdout.write(f"Endpoints to test: {len(endpoints)}\n")

        summaries = []

        for endpoint in endpoints:
            timings_ms: list[float] = []
            response_times_from_headers: list[float] = []
            db_query_counts: list[float] = []
            db_times_ms: list[float] = []
            statuses: list[int] = []

            for _ in range(warmup):
                client.get(endpoint)

            for _ in range(runs):
                started_at = perf_counter()
                response = client.get(endpoint)
                elapsed_ms = (perf_counter() - started_at) * 1000

                timings_ms.append(elapsed_ms)
                statuses.append(response.status_code)

                header_response_ms = self.parse_header_float(response.headers.get("X-Response-Time-ms"))
                if header_response_ms is not None:
                    response_times_from_headers.append(header_response_ms)

                header_db_query_count = self.parse_header_float(response.headers.get("X-DB-Query-Count"))
                if header_db_query_count is not None:
                    db_query_counts.append(header_db_query_count)

                header_db_ms = self.parse_header_float(response.headers.get("X-DB-Time-ms"))
                if header_db_ms is not None:
                    db_times_ms.append(header_db_ms)

                if fail_on_error and response.status_code >= 400:
                    raise CommandError(
                        f"Endpoint {endpoint} returned {response.status_code}."
                    )

            avg_ms = mean(timings_ms)
            med_ms = median(timings_ms)
            p95_ms = calculate_percentile(timings_ms, 0.95)
            min_ms = min(timings_ms)
            max_ms = max(timings_ms)

            error_count = sum(1 for status in statuses if status >= 400)
            status_set = sorted(set(statuses))

            avg_header_ms = mean(response_times_from_headers) if response_times_from_headers else None
            avg_db_queries = mean(db_query_counts) if db_query_counts else None
            avg_db_ms = mean(db_times_ms) if db_times_ms else None

            summaries.append(
                {
                    "endpoint": endpoint,
                    "avg_ms": avg_ms,
                    "med_ms": med_ms,
                    "p95_ms": p95_ms,
                    "min_ms": min_ms,
                    "max_ms": max_ms,
                    "statuses": status_set,
                    "errors": error_count,
                    "avg_header_ms": avg_header_ms,
                    "avg_db_queries": avg_db_queries,
                    "avg_db_ms": avg_db_ms,
                }
            )

        summaries.sort(key=lambda item: item["avg_ms"], reverse=True)

        self.stdout.write(self.style.NOTICE("Results (slowest first)"))
        self.stdout.write(
            "endpoint | avg_ms | p95_ms | median_ms | min_ms | max_ms | statuses | errors | avg_db_queries | avg_db_ms"
        )
        self.stdout.write("-" * 140)

        for row in summaries:
            db_queries = self.format_optional(row["avg_db_queries"], 1)
            db_ms = self.format_optional(row["avg_db_ms"], 2)
            statuses = ",".join(str(code) for code in row["statuses"])
            self.stdout.write(
                f"{row['endpoint']} | "
                f"{row['avg_ms']:.2f} | {row['p95_ms']:.2f} | {row['med_ms']:.2f} | "
                f"{row['min_ms']:.2f} | {row['max_ms']:.2f} | {statuses} | {row['errors']} | "
                f"{db_queries} | {db_ms}"
            )

        if output_json:
            payload = {
                "meta": {
                    "user": getattr(user, "email", None) or user.username,
                    "preset": preset,
                    "runs": runs,
                    "warmup": warmup,
                    "endpoint_count": len(endpoints),
                    "generated_at": timezone.now().isoformat(),
                },
                "results": summaries,
            }
            self.write_json_report(output_json, payload)
            self.stdout.write(f"\nSaved JSON report: {output_json}")

        if output_csv:
            self.write_csv_report(output_csv, summaries)
            self.stdout.write(f"Saved CSV report: {output_csv}")

        self.stdout.write("\nTip: enable API_PROFILING_ENABLED=true to include X-DB-Query-Count and X-DB-Time-ms headers.")
