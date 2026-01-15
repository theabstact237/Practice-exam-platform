from rest_framework import serializers
from .models import Exam, Question, Answer, Review


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for Answer model"""
    
    class Meta:
        model = Answer
        fields = ['id', 'letter', 'text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model with answers"""
    
    answers = AnswerSerializer(many=True, read_only=True)
    options = serializers.SerializerMethodField()
    correct_answer_letter = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()  # Alias for question_text
    
    class Meta:
        model = Question
        fields = [
            'id', 
            'question_text', 
            'question',  # Alias for question_text for frontend compatibility
            'domain', 
            'difficulty', 
            'explanation',
            'answers',
            'options',
            'correct_answer_letter'
        ]
    
    def get_options(self, obj):
        """Convert answers to options format expected by frontend"""
        answers = obj.answers.all().order_by('letter')
        return [
            {
                'letter': answer.letter,
                'text': answer.text
            }
            for answer in answers
        ]
    
    def get_correct_answer_letter(self, obj):
        """Get the letter of the correct answer"""
        correct_answer = obj.answers.filter(is_correct=True).first()
        return correct_answer.letter if correct_answer else None
    
    def get_question(self, obj):
        """Alias for question_text"""
        return obj.question_text


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for Exam model"""
    
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            'id',
            'name',
            'exam_type',
            'description',
            'total_questions',
            'time_limit_minutes',
            'passing_score',
            'is_active',
            'questions_count',
            'created_at',
            'updated_at'
        ]
    
    def get_questions_count(self, obj):
        """Get count of questions for this exam"""
        return obj.questions.count()


class ExamWithQuestionsSerializer(serializers.ModelSerializer):
    """Serializer for Exam with nested questions"""
    
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id',
            'name',
            'exam_type',
            'description',
            'total_questions',
            'time_limit_minutes',
            'passing_score',
            'is_active',
            'questions',
            'created_at',
            'updated_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model"""
    
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    exam_type = serializers.CharField(source='exam.exam_type', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id',
            'exam',
            'exam_name',
            'exam_type',
            'user_uid',
            'user_name',
            'user_photo_url',
            'user_email',
            'rating',
            'comment',
            'exam_score',
            'passed',
            'is_featured',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'exam_name', 'exam_type']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a review"""
    
    class Meta:
        model = Review
        fields = [
            'exam',
            'user_uid',
            'user_name',
            'user_photo_url',
            'user_email',
            'rating',
            'comment',
            'exam_score',
            'passed'
        ]
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


