from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from exams.models import Exam

from .models import AnalyticsExamEvent, AnalyticsSession

EXAM_TYPE_LABELS = dict(Exam.EXAM_TYPE_CHOICES)


def _normalize_device(raw: str) -> str:
    if raw in ("mobile", "tablet", "desktop", "unknown"):
        return raw
    return "unknown"


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_session(request):
    """Register or refresh a client session (called once per tab session)."""
    session_key = (request.data.get("session_key") or "").strip()
    device_category = _normalize_device((request.data.get("device_category") or "").strip().lower())

    if not session_key or len(session_key) > 64:
        return Response(
            {"error": "session_key is required (max 64 chars)"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if device_category == "unknown" and request.data.get("device_category"):
        device_category = _normalize_device(request.data.get("device_category", ""))

    AnalyticsSession.objects.get_or_create(
        session_key=session_key,
        defaults={"device_category": device_category},
    )
    return Response({"ok": True})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def record_event(request):
    """Record exam_start or exam_complete for a session."""
    session_key = (request.data.get("session_key") or "").strip()
    exam_type = (request.data.get("exam_type") or "").strip()
    event_type = (request.data.get("event_type") or "").strip()
    score_percent = request.data.get("score_percent")

    if not session_key or not exam_type or not event_type:
        return Response(
            {"error": "session_key, exam_type, and event_type are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if event_type not in (
        AnalyticsExamEvent.EVENT_EXAM_START,
        AnalyticsExamEvent.EVENT_EXAM_COMPLETE,
    ):
        return Response(
            {"error": "event_type must be exam_start or exam_complete"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        session = AnalyticsSession.objects.get(session_key=session_key)
    except AnalyticsSession.DoesNotExist:
        return Response(
            {"error": "Unknown session; call register_session first"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    score_val = None
    if event_type == AnalyticsExamEvent.EVENT_EXAM_COMPLETE:
        if score_percent is None:
            return Response(
                {"error": "score_percent is required for exam_complete"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            score_val = float(score_percent)
        except (TypeError, ValueError):
            return Response(
                {"error": "score_percent must be a number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    AnalyticsExamEvent.objects.create(
        session=session,
        exam_type=exam_type,
        event_type=event_type,
        score_percent=score_val,
    )
    return Response({"ok": True})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def dashboard(request):
    """Aggregated metrics for the analytics UI (poll for near real-time updates)."""
    today = timezone.localdate()
    sessions_today = AnalyticsSession.objects.filter(created_at__date=today).count()
    total_sessions = AnalyticsSession.objects.count()

    completions_qs = AnalyticsExamEvent.objects.filter(
        event_type=AnalyticsExamEvent.EVENT_EXAM_COMPLETE
    )
    exam_completions = completions_qs.count()
    avg_row = completions_qs.aggregate(avg=Avg("score_percent"))
    average_score = round(avg_row["avg"] or 0, 1)

    starts_map = {
        row["exam_type"]: row["c"]
        for row in AnalyticsExamEvent.objects.filter(
            event_type=AnalyticsExamEvent.EVENT_EXAM_START
        )
        .values("exam_type")
        .annotate(c=Count("id"))
    }
    completes_map = {
        row["exam_type"]: row["c"]
        for row in completions_qs.values("exam_type").annotate(c=Count("id"))
    }

    exam_type_performance = []
    seen = set(starts_map.keys()) | set(completes_map.keys())
    for et, label in Exam.EXAM_TYPE_CHOICES:
        exam_type_performance.append(
            {
                "exam_type": et,
                "name": label,
                "sessions": starts_map.get(et, 0),
                "completions": completes_map.get(et, 0),
            }
        )
        seen.discard(et)
    for et in sorted(seen):
        exam_type_performance.append(
            {
                "exam_type": et,
                "name": EXAM_TYPE_LABELS.get(et, et.replace("_", " ").title()),
                "sessions": starts_map.get(et, 0),
                "completions": completes_map.get(et, 0),
            }
        )

    popular_exam_type = "solutions_architect"
    if starts_map:
        popular_exam_type = max(starts_map, key=lambda k: starts_map[k])
    popular_exam_label = EXAM_TYPE_LABELS.get(
        popular_exam_type, popular_exam_type.replace("_", " ").title()
    )

    device_rows = (
        AnalyticsSession.objects.values("device_category")
        .annotate(count=Count("id"))
        .order_by()
    )
    device_breakdown = {
        "mobile": 0,
        "tablet": 0,
        "desktop": 0,
        "unknown": 0,
    }
    for row in device_rows:
        cat = _normalize_device(row["device_category"])
        device_breakdown[cat] = device_breakdown.get(cat, 0) + row["count"]

    return Response(
        {
            "sessions_today": sessions_today,
            "total_sessions": total_sessions,
            "exam_completions": exam_completions,
            "average_score_percent": average_score,
            "exam_type_performance": exam_type_performance,
            "device_breakdown": device_breakdown,
            "popular_exam_type": popular_exam_type,
            "popular_exam_label": popular_exam_label,
            "updated_at": timezone.now().isoformat(),
        }
    )
