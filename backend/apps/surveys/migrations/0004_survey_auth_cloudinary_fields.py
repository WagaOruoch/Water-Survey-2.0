from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("surveys", "0003_rename_columns"),
    ]

    operations = [
        migrations.AddField(
            model_name="surveyresponse",
            name="staff_role_other",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="surveyresponse",
            name="submitted_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="survey_responses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="surveyresponse",
            name="site_photo",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
