from django.contrib import admin
from .models import SurveyResponse


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):

    # ── List view ────────────────────────────────────────────
    list_display  = ("site_code", "site_name", "is_staffed", "water_source_type", "submitted_at")
    list_filter   = ("submitted_at", "site_name", "is_staffed", "water_source_type")
    search_fields = ("site_code",)
    ordering      = ("-submitted_at",)

    # ── Detail view ──────────────────────────────────────────
    readonly_fields = ("id", "submitted_at")

    fieldsets = (
        ("Submission", {
            "fields": ("id", "submitted_at"),
        }),
        ("Background", {
            "fields": ("site_code", "site_name", "gps_location", "survey_date", "site_photo", "is_staffed"),
        }),
        ("Staff Interview", {
            "fields": (
                "consent", "staff_role", "years_at_site", "months_at_site", "other_staff_count",
                "site_age", "has_dry_season",
                "dry_month_january",   "dry_month_february", "dry_month_march",
                "dry_month_april",     "dry_month_may",      "dry_month_june",
                "dry_month_july",      "dry_month_august",   "dry_month_september",
                "dry_month_october",   "dry_month_november", "dry_month_december",
                "water_delivery_method", "water_delivery_other",
                "knows_water_origin", "water_origin", "water_is_treated",
                "treatment_boil",            "treatment_bleach_chlorine",
                "treatment_cloth",           "treatment_water_filter",
                "treatment_solar",           "treatment_stand_and_settle",
                "treatment_table",           "treatment_other",
                "treatment_idk",
                "water_delivery_frequency",
            ),
        }),
        ("Site Observation", {
            "fields": (
                "water_source_type", "piped_subtype", "well_subtype",
                "spring_subtype", "packaged_subtype", "other_source_subtype",
                "surface_water_type", "used_for_drinking", "water_access_method",
                "shore_dist_lt_1m", "shore_dist_1_2m",
                "shore_dist_gt_2m", "shore_dist_nill",
                "people_count",
            ),
        }),
    )

    # Responses are created via the API only
    def has_add_permission(self, request):
        return False
