# Generated migration for ImageField and staff_role_other

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveys', '0003_rename_columns'),
    ]

    operations = [
        migrations.AlterField(
            model_name='surveyresponse',
            name='site_photo',
            field=models.ImageField(blank=True, null=True, upload_to='survey_photos/'),
        ),
        migrations.AddField(
            model_name='surveyresponse',
            name='staff_role_other',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
