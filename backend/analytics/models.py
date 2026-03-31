from django.db import models


class AnalyticsSession(models.Model):
    """One row per browser session (client-generated key in sessionStorage)."""

    session_key = models.CharField(max_length=64, unique=True, db_index=True)
    device_category = models.CharField(
        max_length=20,
        help_text="mobile, tablet, desktop, or unknown",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.session_key[:8]}… ({self.device_category})"


class AnalyticsExamEvent(models.Model):
    """Exam start / complete events for aggregate analytics."""

    EVENT_EXAM_START = "exam_start"
    EVENT_EXAM_COMPLETE = "exam_complete"

    session = models.ForeignKey(
        AnalyticsSession,
        on_delete=models.CASCADE,
        related_name="exam_events",
    )
    exam_type = models.CharField(max_length=64)
    event_type = models.CharField(max_length=32)
    score_percent = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["exam_type", "event_type", "created_at"]),
        ]

    def __str__(self):
        return f"{self.exam_type} {self.event_type} @ {self.created_at}"
