from django.urls import path, include
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.conf import settings as django_settings
from .views import ExamViewSet, QuestionViewSet, ReviewViewSet, save_exam_attempt, get_user_attempts, get_attempt_detail
from .models import Exam, Question, CachedLecturePlan, PinnedPlan, CachedChatResponse
from .serializers import ExamSerializer, QuestionSerializer
from .assistant import SyllabusAssistantService
import json
import random
import hashlib
import re

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'reviews', ReviewViewSet, basename='review')

@api_view(['GET'])
def exams_by_type(request, exam_type):
    """Get exams by type - custom view to handle URL path parameter"""
    exams = Exam.objects.filter(exam_type=exam_type, is_active=True).annotate(
        questions_count=Count('questions')
    )
    serializer = ExamSerializer(exams, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def exam_random_questions(request, pk):
    """Get random questions for an exam - custom view to ensure routing works"""
    exam = get_object_or_404(Exam, pk=pk)
    all_questions = exam.questions.all()
    limit = int(request.GET.get('limit', 50))
    
    total_available = all_questions.count()
    
    if total_available == 0:
        return Response({
            'error': 'No questions available for this exam',
            'suggestion': 'Generate questions first using /api/exams/{id}/generate-questions/',
            'exam_id': exam.id,
            'exam_name': exam.name
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get up to 100 random questions from the pool
    pool_size = min(100, total_available)
    
    # Get random pool of questions
    question_ids = list(all_questions.values_list('id', flat=True))
    random_ids = random.sample(question_ids, min(pool_size, len(question_ids)))
    pool_questions = Question.objects.filter(id__in=random_ids)
    
    # Select limit questions from the pool (randomly)
    if pool_questions.count() > limit:
        final_ids = random.sample(list(pool_questions.values_list('id', flat=True)), limit)
        questions = Question.objects.filter(id__in=final_ids).order_by('?')
    else:
        # If pool is smaller than limit, return all from pool
        questions = pool_questions.order_by('?')
    
    serializer = QuestionSerializer(questions, many=True)
    return Response({
        'questions': serializer.data,
        'count': questions.count(),
        'pool_size': pool_size,
        'total_available': total_available
    })


@api_view(['POST'])
def syllabus_assistant(request):
    """Return syllabus-specific lecture plan — served from DB cache when available."""
    syllabus = request.data.get('syllabus', '')
    force_refresh = request.data.get('force_refresh', False)

    try:
        # Serve from cache unless caller requests a refresh
        if not force_refresh:
            cached = CachedLecturePlan.objects.filter(syllabus=syllabus).first()
            if cached and not cached.is_stale():
                return Response(cached.to_dict())

        # Cache miss or stale — call the AI
        service = SyllabusAssistantService()
        data = service.generate_lecture_plan(syllabus)

        # Persist/update the cache
        CachedLecturePlan.objects.update_or_create(
            syllabus=syllabus,
            defaults={
                "syllabus_label": data.get("syllabus_label", ""),
                "overview": data.get("overview", ""),
                "lectures": data.get("lectures", []),
                "provider": data.get("provider", ""),
            },
        )
        return Response(data)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST', 'DELETE'])
def pinned_plan(request):
    """Save, retrieve, or delete a user's pinned lecture plan."""
    user_uid = (
        request.query_params.get('user_uid') or request.data.get('user_uid', '')
    )
    if not user_uid:
        return Response({'error': 'user_uid is required'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        syllabus = request.query_params.get('syllabus', '')
        qs = PinnedPlan.objects.filter(user_uid=user_uid)
        if syllabus:
            qs = qs.filter(syllabus=syllabus)
        plans = [
            {
                'syllabus': p.syllabus,
                'lecture_plan': p.lecture_plan,
                'chat_messages': p.chat_messages,
                'pinned_at': p.pinned_at.isoformat(),
            }
            for p in qs
        ]
        return Response({'plans': plans})

    if request.method == 'POST':
        syllabus = request.data.get('syllabus', '')
        lecture_plan = request.data.get('lecture_plan', {})
        chat_messages = request.data.get('chat_messages', [])
        if not syllabus or not lecture_plan:
            return Response({'error': 'syllabus and lecture_plan are required'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = PinnedPlan.objects.update_or_create(
            user_uid=user_uid,
            syllabus=syllabus,
            defaults={'lecture_plan': lecture_plan, 'chat_messages': chat_messages},
        )
        return Response({'status': 'pinned', 'created': created})

    if request.method == 'DELETE':
        syllabus = request.data.get('syllabus', '')
        qs = PinnedPlan.objects.filter(user_uid=user_uid)
        if syllabus:
            qs = qs.filter(syllabus=syllabus)
        deleted, _ = qs.delete()
        return Response({'status': 'unpinned', 'deleted': deleted})


@api_view(['POST'])
def syllabus_assistant_chat(request):
    """Chat endpoint with multi-turn memory for syllabus-specific guidance."""
    syllabus = request.data.get('syllabus', '')
    message = request.data.get('message', '')
    lectures = request.data.get('lectures', [])
    history = request.data.get('history', [])
    try:
        service = SyllabusAssistantService()
        data = service.chat_about_syllabus(syllabus, message, lectures, history)
        return Response(data)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _chat_cache_key(syllabus: str, message: str) -> str:
    """Stable MD5 hash used as the DB lookup key for a (syllabus, question) pair."""
    normalized = re.sub(r'\s+', ' ', message.lower().strip())
    raw = f"{syllabus}:{normalized}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()


@csrf_exempt
def syllabus_assistant_chat_stream(request):
    """Streaming SSE chat endpoint — text arrives token-by-token.

    Cache behaviour:
    - Standalone questions (history length ≤ 1) are looked up in CachedChatResponse
      before hitting the AI.  A cache hit streams instantly and increments hit_count.
    - On a cache miss the response is streamed from DeepSeek and saved to the DB
      so future users with the same question get an instant answer.
    - Questions that are part of an ongoing conversation (history > 1) bypass the
      cache because their answers depend on prior context.
    """
    # Handle CORS preflight
    origin = request.META.get('HTTP_ORIGIN', '')
    if request.method == 'OPTIONS':
        resp = JsonResponse({})
        resp['Access-Control-Allow-Origin'] = origin
        resp['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp['Access-Control-Allow-Headers'] = 'Content-Type'
        resp['Access-Control-Allow-Credentials'] = 'true'
        return resp

    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    syllabus = body.get('syllabus', '')
    message = body.get('message', '')
    lectures = body.get('lectures', [])
    history = body.get('history', [])

    # Only cache standalone questions (first turn or after just the greeting)
    is_cacheable = len(history) <= 1
    q_hash = _chat_cache_key(syllabus, message) if is_cacheable else None

    service = SyllabusAssistantService()

    def generate():
        # ── Cache HIT: serve stored response instantly ────────────────────────
        if is_cacheable and q_hash:
            try:
                cached = CachedChatResponse.objects.filter(
                    syllabus=syllabus, question_hash=q_hash
                ).first()
                if cached and not cached.is_stale():
                    CachedChatResponse.objects.filter(pk=cached.pk).update(
                        hit_count=cached.hit_count + 1
                    )
                    yield f"data: {json.dumps({'delta': cached.response_text})}\n\n"
                    yield f"data: {json.dumps({'done': True, 'provider': 'cache'})}\n\n"
                    return
            except Exception:
                pass  # Cache lookup failed — fall through to AI

        # ── Cache MISS: stream from AI and save result ────────────────────────
        accumulated = []
        final_provider = 'deepseek'
        try:
            for chunk in service.stream_chat_about_syllabus(syllabus, message, lectures, history):
                yield chunk
                if is_cacheable and q_hash and chunk.startswith('data: '):
                    try:
                        data = json.loads(chunk[6:])
                        if 'delta' in data:
                            accumulated.append(data['delta'])
                        elif data.get('done'):
                            final_provider = data.get('provider', 'deepseek')
                    except (json.JSONDecodeError, Exception):
                        pass
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        # Persist to cache after the stream completes (only for on-topic responses)
        if is_cacheable and q_hash and accumulated:
            full_response = ''.join(accumulated)
            try:
                CachedChatResponse.objects.update_or_create(
                    syllabus=syllabus,
                    question_hash=q_hash,
                    defaults={
                        'question_text': message,
                        'response_text': full_response,
                        'provider': final_provider,
                    },
                )
            except Exception:
                pass  # Cache write failure is non-fatal

    response = StreamingHttpResponse(generate(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    response['Access-Control-Allow-Origin'] = origin
    response['Access-Control-Allow-Credentials'] = 'true'
    return response


urlpatterns = [
    # Custom URL patterns (must come before router to take precedence)
    path('exams/by-type/<str:exam_type>/', exams_by_type, name='exam-by-type'),
    path('exams/<int:pk>/random-questions/', exam_random_questions, name='exam-random-questions'),
    path('assistant/syllabus-lectures/', syllabus_assistant, name='syllabus-assistant'),
    path('assistant/chat/', syllabus_assistant_chat, name='syllabus-assistant-chat'),
    path('assistant/chat/stream/', syllabus_assistant_chat_stream, name='syllabus-assistant-chat-stream'),
    path('assistant/pin/', pinned_plan, name='assistant-pin'),
    # Exam attempt history
    path('attempts/', save_exam_attempt, name='save-exam-attempt'),
    path('attempts/history/', get_user_attempts, name='get-user-attempts'),
    path('attempts/<int:attempt_id>/', get_attempt_detail, name='get-attempt-detail'),
    path('', include(router.urls)),
]


