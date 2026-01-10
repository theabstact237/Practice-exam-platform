from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.shortcuts import get_object_or_404
from .views import ExamViewSet, QuestionViewSet, ReviewViewSet
from .models import Exam, Question
from .serializers import ExamSerializer, QuestionSerializer
import random

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

urlpatterns = [
    # Custom URL patterns (must come before router to take precedence)
    path('exams/by-type/<str:exam_type>/', exams_by_type, name='exam-by-type'),
    path('exams/<int:pk>/random-questions/', exam_random_questions, name='exam-random-questions'),
    path('', include(router.urls)),
]


