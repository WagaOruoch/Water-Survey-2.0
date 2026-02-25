from django.conf import settings
import cloudinary.uploader
from rest_framework import serializers
from .models import SurveyResponse


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)

# ──────────────────────────────────────────────────────────────
# Multi-select option lists — must match XLSForm choices exactly
# ──────────────────────────────────────────────────────────────
MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]
TREATMENT_MAP = {
    "boil":             "treatment_boil",
    "bleach_chlorine":  "treatment_bleach_chlorine",
    "cloth":            "treatment_cloth",
    "water_filter":     "treatment_water_filter",
    "solar":            "treatment_solar",
    "stand_and_settle": "treatment_stand_and_settle",
    "treatment_table":  "treatment_table",
    "other":            "treatment_other",
    "idk":              "treatment_idk",
}
DISTANCES = [
    "less_than_1_mtr", "one_to_two_mtr", "more_than_two_mtr", "nill",
]

# Fields that must always be present
REQUIRED_FIELDS = ["site_code", "site_name", "is_staffed"]


class SurveyResponseSerializer(serializers.ModelSerializer):
    """
    Accepts a flat payload from the frontend.
    Multi-select fields (dry_months, treatment_methods, shore_distances) are
    received as arrays and expanded to individual boolean columns on save.
    On read, individual boolean columns are returned directly.
    """

    # Write-only array inputs for multi-select fields
    site_photo        = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, write_only=True,
    )
    site_photo_url    = serializers.CharField(source="site_photo", read_only=True)
    submitted_by_email = serializers.EmailField(source="submitted_by.email", read_only=True)
    dry_months         = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True, write_only=True,
    )
    treatment_methods  = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True, write_only=True,
    )
    shore_distances    = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True, write_only=True,
    )

    class Meta:
        model  = SurveyResponse
        fields = [
            "id", "submitted_at",
            "submitted_by_email",
            # Background
            "site_code", "site_name", "gps_location", "survey_date", "site_photo", "site_photo_url", "is_staffed",
            # Staff Interview — scalar fields
            "consent", "staff_role", "staff_role_other", "years_at_site", "months_at_site", "other_staff_count",
            "site_age", "has_dry_season",
            # Dry months — write as array, read as booleans
            "dry_months",
            "dry_month_january",   "dry_month_february", "dry_month_march",
            "dry_month_april",     "dry_month_may",      "dry_month_june",
            "dry_month_july",      "dry_month_august",   "dry_month_september",
            "dry_month_october",   "dry_month_november", "dry_month_december",
            # Delivery + origin + treatment scalar
            "water_delivery_method", "water_delivery_other",
            "knows_water_origin", "water_origin", "water_is_treated",
            # Treatment methods — write as array, read as booleans
            "treatment_methods",
            "treatment_boil",            "treatment_bleach_chlorine",
            "treatment_cloth",           "treatment_water_filter",
            "treatment_solar",           "treatment_stand_and_settle",
            "treatment_table",           "treatment_other",
            "treatment_idk",
            "water_delivery_frequency",
            # Site Observation — scalar fields
            "water_source_type", "piped_subtype", "well_subtype",
            "spring_subtype", "packaged_subtype", "other_source_subtype",
            "surface_water_type", "used_for_drinking", "water_access_method",
            # Shore distances — write as array, read as booleans
            "shore_distances",
            "shore_dist_lt_1m", "shore_dist_1_2m",
            "shore_dist_gt_2m", "shore_dist_nill",
            "people_count",
        ]
        read_only_fields = ["id", "submitted_at"]

    def validate(self, attrs):
        site_photo = attrs.get("site_photo")

        if (
            site_photo
            and isinstance(site_photo, str)
            and site_photo.startswith("data:image")
            and not settings.CLOUDINARY_ENABLED
        ):
            raise serializers.ValidationError(
                {
                    "site_photo": (
                        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, "
                        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend .env."
                    )
                }
            )

        missing = [f for f in REQUIRED_FIELDS if not attrs.get(f)]
        if missing:
            raise serializers.ValidationError(
                {field: "This field is required." for field in missing}
            )
        return attrs

    def create(self, validated_data):
        site_photo_data = validated_data.pop("site_photo", None)
        months     = validated_data.pop("dry_months",        None)
        treatments = validated_data.pop("treatment_methods", None)
        distances  = validated_data.pop("shore_distances",   None)

        if site_photo_data and isinstance(site_photo_data, str):
            if site_photo_data.startswith("data:image"):
                try:
                    upload_result = cloudinary.uploader.upload(
                        site_photo_data,
                        folder="water-survey/site-photos",
                        resource_type="image",
                    )
                    validated_data["site_photo"] = (
                        upload_result.get("secure_url") or upload_result.get("url")
                    )
                except Exception:
                    validated_data["site_photo"] = None
            elif site_photo_data.startswith("http://") or site_photo_data.startswith("https://"):
                validated_data["site_photo"] = site_photo_data

        # Expand arrays → boolean columns
        # NULL  = question was hidden (field absent from payload)
        # True  = option was selected
        # False = option was not selected (question was visible)
        for m in MONTHS:
            validated_data[f"dry_month_{m}"] = (
                m in months if months is not None else None
            )
        for option, col in TREATMENT_MAP.items():
            validated_data[col] = (
                option in treatments if treatments is not None else None
            )

        dist_map = {
            "less_than_1_mtr":   "shore_dist_lt_1m",
            "one_to_two_mtr":    "shore_dist_1_2m",
            "more_than_two_mtr": "shore_dist_gt_2m",
            "nill":              "shore_dist_nill",
        }
        for d, col in dist_map.items():
            validated_data[col] = (
                d in distances if distances is not None else None
            )

        return SurveyResponse.objects.create(**validated_data)
