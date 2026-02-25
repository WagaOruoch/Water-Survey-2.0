import uuid
from django.db import models


class SurveyResponse(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    # ── Background ───────────────────────────────────────────
    site_code    = models.IntegerField(null=True, blank=True)
    site_name    = models.CharField(max_length=50,  null=True, blank=True)
    gps_location = models.CharField(max_length=100, null=True, blank=True)
    survey_date  = models.DateField(null=True, blank=True)
    site_photo   = models.CharField(max_length=255, null=True, blank=True)
    is_staffed   = models.CharField(max_length=3,   null=True, blank=True)

    # ── Staff Interview ──────────────────────────────────────
    consent           = models.CharField(max_length=3,   null=True, blank=True)
    staff_role        = models.CharField(max_length=50,  null=True, blank=True)
    years_at_site     = models.IntegerField(null=True, blank=True)
    months_at_site    = models.IntegerField(null=True, blank=True)
    other_staff_count = models.IntegerField(null=True, blank=True)
    site_age          = models.CharField(max_length=50,  null=True, blank=True)
    has_dry_season    = models.CharField(max_length=3,   null=True, blank=True)

    # Dry months — one boolean column per month
    dry_month_january   = models.BooleanField(null=True, blank=True)
    dry_month_february  = models.BooleanField(null=True, blank=True)
    dry_month_march     = models.BooleanField(null=True, blank=True)
    dry_month_april     = models.BooleanField(null=True, blank=True)
    dry_month_may       = models.BooleanField(null=True, blank=True)
    dry_month_june      = models.BooleanField(null=True, blank=True)
    dry_month_july      = models.BooleanField(null=True, blank=True)
    dry_month_august    = models.BooleanField(null=True, blank=True)
    dry_month_september = models.BooleanField(null=True, blank=True)
    dry_month_october   = models.BooleanField(null=True, blank=True)
    dry_month_november  = models.BooleanField(null=True, blank=True)
    dry_month_december  = models.BooleanField(null=True, blank=True)

    water_delivery_method    = models.CharField(max_length=20,  null=True, blank=True)
    water_delivery_other     = models.CharField(max_length=200, null=True, blank=True)
    knows_water_origin       = models.CharField(max_length=3,   null=True, blank=True)
    water_origin             = models.CharField(max_length=200, null=True, blank=True)
    water_is_treated         = models.CharField(max_length=3,   null=True, blank=True)

    # Treatment methods — one boolean column per method
    treatment_boil            = models.BooleanField(null=True, blank=True)
    treatment_bleach_chlorine = models.BooleanField(null=True, blank=True)
    treatment_cloth           = models.BooleanField(null=True, blank=True)
    treatment_water_filter    = models.BooleanField(null=True, blank=True)
    treatment_solar           = models.BooleanField(null=True, blank=True)
    treatment_stand_and_settle = models.BooleanField(null=True, blank=True)
    treatment_table           = models.BooleanField(null=True, blank=True)
    treatment_other           = models.BooleanField(null=True, blank=True)
    treatment_idk             = models.BooleanField(null=True, blank=True)

    water_delivery_frequency = models.CharField(max_length=200, null=True, blank=True)

    # ── Site Observation ─────────────────────────────────────
    water_source_type    = models.CharField(max_length=30, null=True, blank=True)
    piped_subtype        = models.CharField(max_length=5,  null=True, blank=True)
    well_subtype         = models.CharField(max_length=5,  null=True, blank=True)
    spring_subtype       = models.CharField(max_length=5,  null=True, blank=True)
    packaged_subtype     = models.CharField(max_length=5,  null=True, blank=True)
    other_source_subtype = models.CharField(max_length=20, null=True, blank=True)
    surface_water_type   = models.CharField(max_length=20, null=True, blank=True)
    used_for_drinking    = models.CharField(max_length=3,  null=True, blank=True)
    water_access_method  = models.CharField(max_length=20, null=True, blank=True)

    # Shore distances — one boolean column per option
    shore_dist_lt_1m  = models.BooleanField(null=True, blank=True)
    shore_dist_1_2m   = models.BooleanField(null=True, blank=True)
    shore_dist_gt_2m  = models.BooleanField(null=True, blank=True)
    shore_dist_nill   = models.BooleanField(null=True, blank=True)

    people_count = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        db_table = "survey_responses"

    def __str__(self):
        return f"Response {self.id} — Site {self.site_code or 'unknown'} ({self.submitted_at:%Y-%m-%d})"
