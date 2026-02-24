from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("surveys", "0002_flat_columns"),
    ]

    operations = [
        # ── Background ───────────────────────────────────────
        migrations.RenameField("surveyresponse", "B1", "site_code"),
        migrations.RenameField("surveyresponse", "B2", "site_name"),
        migrations.RenameField("surveyresponse", "B3", "gps_location"),
        migrations.RenameField("surveyresponse", "B4", "survey_date"),
        migrations.RenameField("surveyresponse", "B5", "site_photo"),
        migrations.RenameField("surveyresponse", "B6", "is_staffed"),

        # ── Staff Interview ──────────────────────────────────
        migrations.RenameField("surveyresponse", "q_1_1",     "consent"),
        migrations.RenameField("surveyresponse", "q_1_2_1",   "staff_role"),
        migrations.RenameField("surveyresponse", "q_1_2_2_1", "years_at_site"),
        migrations.RenameField("surveyresponse", "q_1_2_2_2", "months_at_site"),
        migrations.RenameField("surveyresponse", "q_1_2_3",   "other_staff_count"),
        migrations.RenameField("surveyresponse", "q_1_3",     "site_age"),
        migrations.RenameField("surveyresponse", "q_1_4",     "has_dry_season"),

        # Dry months
        migrations.RenameField("surveyresponse", "q_1_4_1_january",   "dry_month_january"),
        migrations.RenameField("surveyresponse", "q_1_4_1_february",  "dry_month_february"),
        migrations.RenameField("surveyresponse", "q_1_4_1_march",     "dry_month_march"),
        migrations.RenameField("surveyresponse", "q_1_4_1_april",     "dry_month_april"),
        migrations.RenameField("surveyresponse", "q_1_4_1_may",       "dry_month_may"),
        migrations.RenameField("surveyresponse", "q_1_4_1_june",      "dry_month_june"),
        migrations.RenameField("surveyresponse", "q_1_4_1_july",      "dry_month_july"),
        migrations.RenameField("surveyresponse", "q_1_4_1_august",    "dry_month_august"),
        migrations.RenameField("surveyresponse", "q_1_4_1_september", "dry_month_september"),
        migrations.RenameField("surveyresponse", "q_1_4_1_october",   "dry_month_october"),
        migrations.RenameField("surveyresponse", "q_1_4_1_november",  "dry_month_november"),
        migrations.RenameField("surveyresponse", "q_1_4_1_december",  "dry_month_december"),

        migrations.RenameField("surveyresponse", "q_1_5",   "water_delivery_method"),
        migrations.RenameField("surveyresponse", "q_1_5_a", "water_delivery_other"),
        migrations.RenameField("surveyresponse", "q_1_5_1", "knows_water_origin"),
        migrations.RenameField("surveyresponse", "q_1_5_2", "water_origin"),
        migrations.RenameField("surveyresponse", "q_1_5_3", "water_is_treated"),

        # Treatment methods
        migrations.RenameField("surveyresponse", "q_1_5_3_1_boil",             "treatment_boil"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_bleach_chlorine",  "treatment_bleach_chlorine"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_cloth",            "treatment_cloth"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_water_filter",     "treatment_water_filter"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_solar",            "treatment_solar"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_stand_and_settle", "treatment_stand_and_settle"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_treatment_table",  "treatment_table"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_other",            "treatment_other"),
        migrations.RenameField("surveyresponse", "q_1_5_3_1_idk",              "treatment_idk"),

        migrations.RenameField("surveyresponse", "q_1_5_4", "water_delivery_frequency"),

        # ── Site Observation ─────────────────────────────────
        migrations.RenameField("surveyresponse", "q_2_1",     "water_source_type"),
        migrations.RenameField("surveyresponse", "piped",     "piped_subtype"),
        migrations.RenameField("surveyresponse", "well",      "well_subtype"),
        migrations.RenameField("surveyresponse", "spring",    "spring_subtype"),
        migrations.RenameField("surveyresponse", "packaged",  "packaged_subtype"),
        migrations.RenameField("surveyresponse", "other_srs", "other_source_subtype"),
        migrations.RenameField("surveyresponse", "q_2_1_1",   "surface_water_type"),
        migrations.RenameField("surveyresponse", "q_2_1_2",   "used_for_drinking"),
        migrations.RenameField("surveyresponse", "q_2_1_2_1", "water_access_method"),

        # Shore distances
        migrations.RenameField("surveyresponse", "q_2_1_2_2_less_than_1_mtr",   "shore_dist_lt_1m"),
        migrations.RenameField("surveyresponse", "q_2_1_2_2_one_to_two_mtr",    "shore_dist_1_2m"),
        migrations.RenameField("surveyresponse", "q_2_1_2_2_more_than_two_mtr", "shore_dist_gt_2m"),
        migrations.RenameField("surveyresponse", "q_2_1_2_2_nill",              "shore_dist_nill"),

        migrations.RenameField("surveyresponse", "q_2_3", "people_count"),
    ]
