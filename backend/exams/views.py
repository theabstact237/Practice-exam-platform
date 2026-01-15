from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.conf import settings
from django.core.cache import cache
import random
import hashlib
from .models import Exam, Question, Answer, Review
from .serializers import ExamSerializer, ExamWithQuestionsSerializer, QuestionSerializer, ReviewSerializer, ReviewCreateSerializer
from .services import QuestionGenerator

# Cache timeout constants (in seconds)
CACHE_TIMEOUT_EXAM_LIST = 300  # 5 minutes
CACHE_TIMEOUT_QUESTIONS = 3600  # 1 hour


class ExamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing exams
    
    list: Get all exams
    retrieve: Get a specific exam
    create: Create a new exam
    update: Update an exam
    destroy: Delete an exam
    """
    queryset = Exam.objects.filter(is_active=True)
    serializer_class = ExamSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'questions':
            return ExamWithQuestionsSerializer
        return ExamSerializer
    
    @action(detail=True, methods=['get'], url_path='questions')
    def questions(self, request, pk=None):
        """
        Get random 50 questions from a pool of 100 questions for a specific exam
        GET /api/exams/{id}/questions/?random=true&limit=50
        
        Query Parameters:
        - random: if true, returns random 50 questions from pool of 100 (default: true)
        - limit: number of questions to return (default: 50)
        
        Performance optimizations:
        - Uses prefetch_related for answers (eliminates N+1 queries)
        - Caches question IDs for faster random selection
        """
        exam = self.get_object()
        
        # Check if random selection is requested (default: true)
        use_random = request.query_params.get('random', 'true').lower() == 'true'
        limit = int(request.query_params.get('limit', 50))
        
        # Try to get question IDs from cache for faster random selection
        cache_key = f'exam_{pk}_question_ids'
        question_ids = cache.get(cache_key)
        
        if question_ids is None:
            # Cache miss - fetch from database
            question_ids = list(exam.questions.values_list('id', flat=True))
            # Cache for 1 hour
            cache.set(cache_key, question_ids, CACHE_TIMEOUT_QUESTIONS)
        
        total_available = len(question_ids)
        
        if total_available == 0:
            return Response({
                'error': 'No questions available for this exam',
                'suggestion': 'Generate questions first using /api/exams/{id}/generate-questions/'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if use_random:
            # Pool size is flexible - use up to 100 for random selection
            pool_size = min(100, total_available)
            
            # Get random pool of question IDs
            random_ids = random.sample(question_ids, min(pool_size, len(question_ids)))
            
            # Select limit questions from the pool
            if len(random_ids) > limit:
                final_ids = random.sample(random_ids, limit)
            else:
                final_ids = random_ids
            
            # Use prefetch_related to load answers in a single query (prevents N+1)
            questions = Question.objects.filter(id__in=final_ids).prefetch_related('answers').order_by('?')
        else:
            # Return all questions (non-random mode) with prefetch
            questions = exam.questions.prefetch_related('answers').all()
        
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='pre-generate')
    def pre_generate_questions(self, request):
        """
        Pre-generate questions when user clicks exam tab
        PRIORITY: Returns existing database questions first, only generates if pool is empty
        POST /api/exams/pre-generate/
        
        Body:
        {
            "exam_type": "solutions_architect",
            "num_questions": 100,  // default: 100
            "use_manus": true,  // defaults to true (Manus API)
            "force_generate": false  // if true, generates even if questions exist
        }
        
        API Priority: Manus > OpenAI (only used if database is empty or force_generate=true)
        """
        exam_type = request.data.get('exam_type')
        if not exam_type:
            return Response({'error': 'exam_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            exam = Exam.objects.get(exam_type=exam_type, is_active=True)
        except Exam.DoesNotExist:
            return Response({'error': f'Exam with type {exam_type} not found'}, status=status.HTTP_404_NOT_FOUND)
        
        num_questions = request.data.get('num_questions', 100)  # Default to 100
        use_manus = request.data.get('use_manus', True)  # Default to Manus API
        force_generate = request.data.get('force_generate', False)  # Force AI generation
        
        # PRIORITY: Check existing questions in database first
        current_count = exam.questions.count()
        
        # If we have enough questions and not forcing generation, return success
        if current_count >= num_questions and not force_generate:
            return Response({
                'success': True,
                'message': f'Using {current_count} existing questions from database. Ready for exam.',
                'exam_id': exam.id,
                'current_count': current_count,
                'created_count': 0,
                'source': 'database'
            }, status=status.HTTP_200_OK)
        
        # If we have some questions but not enough, and not forcing, still use what we have
        if current_count > 0 and not force_generate:
            return Response({
                'success': True,
                'message': f'Using {current_count} existing questions from database. Ready for exam.',
                'exam_id': exam.id,
                'current_count': current_count,
                'created_count': 0,
                'source': 'database'
            }, status=status.HTTP_200_OK)
        
        # Only generate if database is empty OR force_generate is true
        # Map exam type to display name for prompt
        exam_display_names = {
            'solutions_architect': 'solution architect',
            'cloud_practitioner': 'cloud practitioner',
            'developer': 'developer',
            'sysops': 'sysops administrator',
            'security': 'security specialist',
            'data_analytics': 'data analytics',
            'machine_learning': 'machine learning',
            'database': 'database',
            'advanced_networking': 'advanced networking'
        }
        
        exam_display_name = exam_display_names.get(exam_type, exam_type.replace('_', ' '))
        
        # Construct prompt: "generate 100 multiple choice questions for the solution architect"
        prompt = f"generate {num_questions} multiple choice questions for the {exam_display_name}"
        
        try:
            generator = QuestionGenerator()
            # This will automatically fallback to other APIs if one fails
            generated_questions = generator.generate_questions(
                exam_name=exam.name,
                num_questions=num_questions,
                domain=None,
                use_manus=use_manus,
                use_llama=use_llama,
                prompt=prompt  # Pass the prompt
            )
            
            # Save questions to database
            created_count = 0
            for q_data in generated_questions:
                if created_count >= num_questions:
                    break
                
                question_text = q_data.get('question_text') or q_data.get('question', '')
                if not question_text:
                    continue
                
                question = Question.objects.create(
                    exam=exam,
                    question_text=question_text,
                    domain=q_data.get('domain', ''),
                    difficulty=q_data.get('difficulty', 'medium'),
                    explanation=q_data.get('explanation', ''),
                    correct_answer_letter=q_data.get('correct_answer_letter', 'A')
                )
                
                # Create answers
                options = q_data.get('options', [])
                if not options and 'answers' in q_data:
                    options = q_data['answers']
                
                for opt in options[:4]:  # Ensure max 4 options
                    Answer.objects.create(
                        question=question,
                        letter=opt.get('letter', opt.get('text', '')[:1]),
                        text=opt.get('text', opt.get('label', '')),
                        is_correct=(opt.get('letter', opt.get('text', '')[:1]).upper() == 
                                   question.correct_answer_letter.upper())
                    )
                
                created_count += 1
            
            # Invalidate cache for this exam since new questions were added
            if created_count > 0:
                invalidate_exam_cache(exam.id)
            
            return Response({
                'success': True,
                'message': f'Pre-generated {created_count} questions',
                'exam_id': exam.id,
                'current_count': exam.questions.count(),
                'created_count': created_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error pre-generating questions: {str(e)}")
            print(f"Traceback: {error_trace}")
            return Response({
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__,
                'exam_id': exam.id,
                'current_count': current_count
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Pool already has enough questions
            return Response({
                'success': True,
                'message': f'Pool already has {current_count} questions (target: {pool_size}). Ready for exam.',
                'exam_id': exam.id,
                'current_count': current_count,
                'created_count': 0
            }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='generate-questions')
    def generate_questions(self, request, pk=None):
        """
        Generate questions for an exam using AI API
        NOTE: Only use this if you need to ADD more questions to the database.
        For normal exam-taking, use /random-questions/ which serves existing questions.
        
        POST /api/exams/{id}/generate-questions/
        
        Body:
        {
            "num_questions": 100,  // default: 100
            "domain": "EC2",  // optional
            "use_manus": true,  // optional, defaults to Manus API
            "prompt": "generate 100 multiple choice questions for the solution architect"  // optional custom prompt
        }
        
        API Priority: Manus > OpenAI
        """
        exam = get_object_or_404(Exam, pk=pk)
        
        num_questions = request.data.get('num_questions', 100)  # Default to 100
        domain = request.data.get('domain', None)
        use_manus = request.data.get('use_manus', True)  # Default to Manus API
        use_llama = request.data.get('use_llama', False)  # Use Llama (Groq) API
        prompt = request.data.get('prompt', None)  # Optional custom prompt
        
        # Always generate questions when this endpoint is called
        # No pool size checks - always generate fresh questions
        try:
            generator = QuestionGenerator()
            
            # Generate questions using the provided prompt or default
            generated_questions = generator.generate_questions(
                exam_name=exam.name,
                num_questions=num_questions,
                domain=domain,
                use_manus=use_manus,
                use_llama=use_llama,
                prompt=prompt
            )
            
            # Save questions to database
            created_count = 0
            
            for q_data in generated_questions:
                # Check if question already exists (avoid duplicates)
                existing = Question.objects.filter(
                    exam=exam,
                    question_text=q_data.get('question_text', '')
                ).first()
                
                if existing:
                    continue  # Skip if question already exists
                
                question = Question.objects.create(
                    exam=exam,
                    question_text=q_data.get('question_text', ''),
                    domain=q_data.get('domain', ''),
                    explanation=q_data.get('explanation', ''),
                    difficulty=q_data.get('difficulty', 'medium')
                )
                
                # Create answers
                options = q_data.get('options', [])
                correct_letter = q_data.get('correct_answer_letter', '')
                
                for option in options:
                    Answer.objects.create(
                        question=question,
                        letter=option.get('letter', ''),
                        text=option.get('text', ''),
                        is_correct=(option.get('letter', '') == correct_letter)
                    )
                
                created_count += 1
            
            final_count = exam.questions.count()
            
            # Invalidate cache for this exam since new questions were added
            invalidate_exam_cache(exam.id)
            
            # Build response message
            message = f'Generated {created_count} new questions for {exam.name}. Total: {final_count}'
            
            return Response({
                'success': True,
                'message': message,
                'created_count': created_count,
                'requested_count': num_questions,
                'total_questions': final_count
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error generating questions: {str(e)}")
            print(f"Traceback: {error_trace}")
            return Response({
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def by_type(self, request, exam_type=None):
        """
        Get exams by type
        GET /api/exams/by-type/{exam_type}/
        """
        exams = Exam.objects.filter(exam_type=exam_type, is_active=True).annotate(
            questions_count=Count('questions')
        )
        serializer = self.get_serializer(exams, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='random-questions')
    def random_questions(self, request, pk=None):
        """
        Get random 50 questions from a pool of 100 for a specific exam
        This is the main endpoint for exam-taking
        GET /api/exams/{id}/random-questions/?limit=50
        
        Query Parameters:
        - limit: number of questions to return (default: 50)
        
        Performance optimizations:
        - Uses prefetch_related for answers (eliminates N+1 queries)
        - Caches question IDs for faster random selection
        """
        exam = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        
        # Try to get question IDs from cache
        cache_key = f'exam_{pk}_question_ids'
        question_ids = cache.get(cache_key)
        
        if question_ids is None:
            # Cache miss - fetch from database
            question_ids = list(exam.questions.values_list('id', flat=True))
            cache.set(cache_key, question_ids, CACHE_TIMEOUT_QUESTIONS)
        
        total_available = len(question_ids)
        
        if total_available == 0:
            return Response({
                'error': 'No questions available for this exam',
                'suggestion': 'Generate questions first using /api/exams/{id}/generate-questions/',
                'exam_id': exam.id,
                'exam_name': exam.name
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get up to 100 random questions from the pool
        pool_size = min(100, total_available)
        
        # Get random pool of question IDs
        random_ids = random.sample(question_ids, min(pool_size, len(question_ids)))
        
        # Select limit questions from the pool
        if len(random_ids) > limit:
            final_ids = random.sample(random_ids, limit)
        else:
            final_ids = random_ids
        
        # Use prefetch_related to load answers in a single query (prevents N+1)
        questions = Question.objects.filter(id__in=final_ids).prefetch_related('answers').order_by('?')
        
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            'questions': serializer.data,
            'count': questions.count(),
            'pool_size': pool_size,
            'total_available': total_available
        })


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing questions (read-only)
    
    Performance optimizations:
    - Uses prefetch_related for answers
    - Caches filtered results
    """
    queryset = Question.objects.prefetch_related('answers').all()
    serializer_class = QuestionSerializer
    filterset_fields = ['exam', 'domain', 'difficulty']
    
    def list(self, request, *args, **kwargs):
        """Override list to add caching"""
        # Create cache key from query params
        query_string = request.GET.urlencode()
        cache_key = f'questions_list_{hashlib.md5(query_string.encode()).hexdigest()}'
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, CACHE_TIMEOUT_QUESTIONS)
        return response


def invalidate_exam_cache(exam_id):
    """Helper function to invalidate exam-related caches"""
    cache.delete(f'exam_{exam_id}_question_ids')
    # Could also invalidate other related caches here


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user reviews/testimonials
    
    list: Get all approved reviews (for homepage carousel)
    create: Create a new review after exam completion
    retrieve: Get a specific review
    """
    queryset = Review.objects.filter(is_approved=True).select_related('exam')
    serializer_class = ReviewSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        queryset = Review.objects.filter(is_approved=True).select_related('exam')
        
        # Filter by exam if specified
        exam_id = self.request.query_params.get('exam', None)
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        
        # Filter featured first, then by date
        return queryset.order_by('-is_featured', '-created_at')
    
    def list(self, request, *args, **kwargs):
        """
        Get all approved reviews for homepage carousel
        GET /api/reviews/?limit=10&featured=true
        """
        queryset = self.get_queryset()
        
        # Optional: only featured reviews
        featured_only = request.query_params.get('featured', 'false').lower() == 'true'
        if featured_only:
            queryset = queryset.filter(is_featured=True)
        
        # Limit results
        limit = int(request.query_params.get('limit', 20))
        queryset = queryset[:limit]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'reviews': serializer.data,
            'count': len(serializer.data)
        })
    
    def create(self, request, *args, **kwargs):
        """
        Create a new review after exam completion
        POST /api/reviews/
        
        Body:
        {
            "exam": 1,
            "user_uid": "firebase_uid",
            "user_name": "John Doe",
            "user_photo_url": "https://...",
            "user_email": "john@example.com",
            "rating": 5,
            "comment": "Great exam!",
            "exam_score": 85,
            "passed": true
        }
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Check if user already reviewed this exam
            existing = Review.objects.filter(
                user_uid=serializer.validated_data.get('user_uid'),
                exam=serializer.validated_data.get('exam')
            ).first()
            
            if existing:
                # Update existing review instead of creating duplicate
                for key, value in serializer.validated_data.items():
                    setattr(existing, key, value)
                existing.save()
                return Response({
                    'message': 'Review updated successfully',
                    'review': ReviewSerializer(existing).data
                }, status=status.HTTP_200_OK)
            
            # Create new review
            review = serializer.save()
            return Response({
                'message': 'Review submitted successfully',
                'review': ReviewSerializer(review).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent_reviews(self, request):
        """
        Get recent reviews for homepage
        GET /api/reviews/recent/?limit=5
        """
        limit = int(request.query_params.get('limit', 5))
        reviews = Review.objects.filter(
            is_approved=True
        ).select_related('exam').order_by('-created_at')[:limit]
        
        serializer = self.get_serializer(reviews, many=True)
        return Response({
            'reviews': serializer.data,
            'count': len(serializer.data)
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def review_stats(self, request):
        """
        Get review statistics
        GET /api/reviews/stats/
        """
        from django.db.models import Avg, Count
        
        stats = Review.objects.filter(is_approved=True).aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('rating')
        )
        
        # Get rating distribution
        rating_distribution = {}
        for i in range(1, 6):
            rating_distribution[str(i)] = Review.objects.filter(
                is_approved=True, rating=i
            ).count()
        
        return Response({
            'total_reviews': stats['total_reviews'] or 0,
            'average_rating': round(stats['average_rating'] or 0, 1),
            'rating_distribution': rating_distribution
        })

