# Generated manually for analytics app

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AnalyticsSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("session_key", models.CharField(db_index=True, max_length=64, unique=True)),
                (
                    "device_category",
                    models.CharField(
                        help_text="mobile, tablet, desktop, or unknown",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="AnalyticsExamEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("exam_type", models.CharField(max_length=64)),
                ("event_type", models.CharField(max_length=32)),
                ("score_percent", models.FloatField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="exam_events",
                        to="analytics.analyticssession",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="analyticssession",
            index=models.Index(fields=["created_at"], name="analytics_a_created_e4e7c8_idx"),
        ),
        migrations.AddIndex(
            model_name="analyticsexamevent",
            index=models.Index(
                fields=["exam_type", "event_type", "created_at"],
                name="analytics_a_exam_ty_idx",
            ),
        ),
    ]
