from time import perf_counter

from django.conf import settings
from django.db import connections, reset_queries


class ApiPerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, "API_PROFILING_ENABLED", False):
            return self.get_response(request)

        if not request.path.startswith("/api/"):
            return self.get_response(request)

        should_collect_query_stats = bool(getattr(settings, "DEBUG", False))
        if should_collect_query_stats:
            reset_queries()

        started_at = perf_counter()
        response = self.get_response(request)
        duration_ms = (perf_counter() - started_at) * 1000

        response["X-Response-Time-ms"] = f"{duration_ms:.2f}"

        if should_collect_query_stats:
            db_query_count = 0
            db_time_ms = 0.0

            for connection in connections.all():
                queries = connection.queries
                db_query_count += len(queries)
                for query in queries:
                    try:
                        db_time_ms += float(query.get("time", 0.0)) * 1000
                    except (TypeError, ValueError):
                        continue

            response["X-DB-Query-Count"] = str(db_query_count)
            response["X-DB-Time-ms"] = f"{db_time_ms:.2f}"

        return response
