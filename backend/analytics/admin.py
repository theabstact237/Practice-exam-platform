from django.contrib import admin

from .models import AnalyticsExamEvent, AnalyticsSession


@admin.register(AnalyticsSession)
class AnalyticsSessionAdmin(admin.ModelAdmin):
    list_display = ("session_key", "device_category", "created_at")
    list_filter = ("device_category",)
    search_fields = ("session_key",)


@admin.register(AnalyticsExamEvent)
class AnalyticsExamEventAdmin(admin.ModelAdmin):
    list_display = ("exam_type", "event_type", "score_percent", "created_at", "session")
    list_filter = ("event_type", "exam_type")
