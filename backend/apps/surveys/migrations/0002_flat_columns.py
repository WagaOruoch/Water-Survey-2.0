from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("surveys", "0001_initial"),
    ]

    operations = [
        # Drop the old JSONB blob
        migrations.RemoveField(
            model_name="surveyresponse",
            name="data",
        ),

        # ── Background ───────────────────────────────────────
        migrations.AddField(model_name="surveyresponse", name="B1",
            field=models.IntegerField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="B2",
            field=models.CharField(blank=True, max_length=50, null=True)),
        migrations.AddField(model_name="surveyresponse", name="B3",
            field=models.CharField(blank=True, max_length=100, null=True)),
        migrations.AddField(model_name="surveyresponse", name="B4",
            field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="B5",
            field=models.CharField(blank=True, max_length=255, null=True)),
        migrations.AddField(model_name="surveyresponse", name="B6",
            field=models.CharField(blank=True, max_length=3, null=True)),

        # ── Staff Interview ──────────────────────────────────
        migrations.AddField(model_name="surveyresponse", name="q_1_1",
            field=models.CharField(blank=True, max_length=3, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_2_1",
            field=models.CharField(blank=True, max_length=50, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_2_2_1",
            field=models.IntegerField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_2_2_2",
            field=models.IntegerField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_2_3",
            field=models.IntegerField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_3",
            field=models.CharField(blank=True, max_length=50, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4",
            field=models.CharField(blank=True, max_length=3, null=True)),

        # q_1_4_1 months
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_january",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_february",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_march",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_april",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_may",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_june",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_july",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_august",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_september",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_october",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_november",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_4_1_december",
            field=models.BooleanField(blank=True, null=True)),

        migrations.AddField(model_name="surveyresponse", name="q_1_5",
            field=models.CharField(blank=True, max_length=20, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_a",
            field=models.CharField(blank=True, max_length=200, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_1",
            field=models.CharField(blank=True, max_length=3, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_2",
            field=models.CharField(blank=True, max_length=200, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3",
            field=models.CharField(blank=True, max_length=3, null=True)),

        # q_1_5_3_1 treatment methods
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_boil",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_bleach_chlorine",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_cloth",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_water_filter",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_solar",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_stand_and_settle",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_treatment_table",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_other",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_1_5_3_1_idk",
            field=models.BooleanField(blank=True, null=True)),

        migrations.AddField(model_name="surveyresponse", name="q_1_5_4",
            field=models.CharField(blank=True, max_length=200, null=True)),

        # ── Site Observation ─────────────────────────────────
        migrations.AddField(model_name="surveyresponse", name="q_2_1",
            field=models.CharField(blank=True, max_length=30, null=True)),
        migrations.AddField(model_name="surveyresponse", name="piped",
            field=models.CharField(blank=True, max_length=5, null=True)),
        migrations.AddField(model_name="surveyresponse", name="well",
            field=models.CharField(blank=True, max_length=5, null=True)),
        migrations.AddField(model_name="surveyresponse", name="spring",
            field=models.CharField(blank=True, max_length=5, null=True)),
        migrations.AddField(model_name="surveyresponse", name="packaged",
            field=models.CharField(blank=True, max_length=5, null=True)),
        migrations.AddField(model_name="surveyresponse", name="other_srs",
            field=models.CharField(blank=True, max_length=20, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_1",
            field=models.CharField(blank=True, max_length=20, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2",
            field=models.CharField(blank=True, max_length=3, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2_1",
            field=models.CharField(blank=True, max_length=20, null=True)),

        # q_2_1_2_2 shore distance
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2_2_less_than_1_mtr",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2_2_one_to_two_mtr",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2_2_more_than_two_mtr",
            field=models.BooleanField(blank=True, null=True)),
        migrations.AddField(model_name="surveyresponse", name="q_2_1_2_2_nill",
            field=models.BooleanField(blank=True, null=True)),

        migrations.AddField(model_name="surveyresponse", name="q_2_3",
            field=models.IntegerField(blank=True, null=True)),
    ]
