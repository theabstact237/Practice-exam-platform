from django.db import models
from django.utils import timezone


class Exam(models.Model):
    """Exam model representing different AWS certification exams"""
    
    EXAM_TYPE_CHOICES = [
        ('solutions_architect', 'AWS Solutions Architect'),
        ('cloud_practitioner', 'AWS Cloud Practitioner'),
        ('developer', 'AWS Developer'),
        ('devops', 'AWS DevOps Engineer'),
        ('sysops', 'AWS SysOps Administrator'),
        ('security', 'AWS Security Specialty'),
        ('machine_learning', 'AWS Machine Learning'),
        ('python', 'Python Programming'),
        ('prompt_engineering', 'Prompt Engineering'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    exam_type = models.CharField(max_length=50, choices=EXAM_TYPE_CHOICES)
    description = models.TextField(blank=True)
    total_questions = models.IntegerField(default=50)
    time_limit_minutes = models.IntegerField(default=90)
    passing_score = models.IntegerField(default=70)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
    
    def __str__(self):
        return self.name


class Question(models.Model):
    """Question model for exam questions"""
    
    exam = models.ForeignKey(
        Exam, 
        on_delete=models.CASCADE, 
        related_name='questions',
        db_index=True  # Index for faster foreign key lookups
    )
    question_text = models.TextField()
    domain = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="AWS service domain (e.g., EC2, S3, Lambda)",
        db_index=True  # Index for filtering by domain
    )
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('easy', 'Easy'),
            ('medium', 'Medium'),
            ('hard', 'Hard'),
        ],
        default='medium',
        db_index=True  # Index for filtering by difficulty
    )
    explanation = models.TextField(help_text="Explanation of the correct answer")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['exam', 'id']
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        # Composite indexes for common query patterns
        indexes = [
            models.Index(fields=['exam', 'difficulty'], name='exam_difficulty_idx'),
            models.Index(fields=['exam', 'domain'], name='exam_domain_idx'),
            models.Index(fields=['exam', 'created_at'], name='exam_created_idx'),
        ]
    
    def __str__(self):
        return f"{self.exam.name} - Question {self.id}"


class Answer(models.Model):
    """Answer model for multiple choice options"""
    
    question = models.ForeignKey(
        Question, 
        on_delete=models.CASCADE, 
        related_name='answers',
        db_index=True  # Index for faster foreign key lookups (used by prefetch_related)
    )
    letter = models.CharField(max_length=1, help_text="Answer choice letter (A, B, C, D, etc.)")
    text = models.TextField()
    is_correct = models.BooleanField(default=False, db_index=True)  # Index for finding correct answers
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['question', 'letter']
        unique_together = ['question', 'letter']
        verbose_name = 'Answer'
        verbose_name_plural = 'Answers'
        # Index for common query: find correct answer for a question
        indexes = [
            models.Index(fields=['question', 'is_correct'], name='question_correct_idx'),
        ]
    
    def __str__(self):
        return f"{self.question.exam.name} - Q{self.question.id} - {self.letter}) {self.text[:50]}"


class Review(models.Model):
    """User reviews/testimonials after completing an exam"""
    
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='reviews',
        db_index=True
    )
    # User info from Firebase (no Django User model needed)
    user_uid = models.CharField(max_length=128, help_text="Firebase user UID")
    user_name = models.CharField(max_length=100, help_text="User display name")
    user_photo_url = models.URLField(max_length=500, blank=True, help_text="User profile picture URL")
    user_email = models.EmailField(blank=True, help_text="User email (optional)")
    
    # Review content
    rating = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(help_text="User's review comment")
    
    # Exam result info (optional)
    exam_score = models.IntegerField(null=True, blank=True, help_text="User's exam score percentage")
    passed = models.BooleanField(null=True, blank=True, help_text="Whether user passed the exam")
    
    # Moderation
    is_approved = models.BooleanField(default=True, help_text="Approved reviews appear on homepage")
    is_featured = models.BooleanField(default=False, help_text="Featured reviews shown first")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        # Prevent duplicate reviews from same user for same exam
        unique_together = ['user_uid', 'exam']
        indexes = [
            models.Index(fields=['is_approved', '-created_at'], name='approved_reviews_idx'),
            models.Index(fields=['exam', 'rating'], name='exam_rating_idx'),
        ]
    
    def __str__(self):
        return f"{self.user_name} - {self.exam.name} - {self.rating}★"


class CachedLecturePlan(models.Model):
    """AI-generated lecture roadmap cached per syllabus to avoid repeated API calls."""

    syllabus = models.CharField(max_length=50, unique=True, db_index=True)
    syllabus_label = models.CharField(max_length=200)
    overview = models.TextField()
    lectures = models.JSONField()
    provider = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    CACHE_TTL_DAYS = 7

    def is_stale(self) -> bool:
        from datetime import timedelta
        return timezone.now() - self.updated_at > timedelta(days=self.CACHE_TTL_DAYS)

    def to_dict(self) -> dict:
        return {
            "syllabus": self.syllabus,
            "syllabus_label": self.syllabus_label,
            "overview": self.overview,
            "lectures": self.lectures,
            "provider": self.provider,
            "cached": True,
        }

    class Meta:
        verbose_name = "Cached Lecture Plan"
        verbose_name_plural = "Cached Lecture Plans"

    def __str__(self):
        return f"LecturePlan: {self.syllabus} (provider: {self.provider})"


class CachedChatResponse(models.Model):
    """Global cache of AI chat responses keyed by (syllabus, question hash).

    Responses for standalone questions (no or minimal history) are stored here
    so subsequent users asking the same question get instant answers without
    hitting the AI provider again.
    """

    syllabus = models.CharField(max_length=50, db_index=True)
    question_hash = models.CharField(max_length=64, db_index=True)
    question_text = models.TextField()
    response_text = models.TextField()
    provider = models.CharField(max_length=50, default="deepseek")
    hit_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    CACHE_TTL_DAYS = 7

    class Meta:
        unique_together = ("syllabus", "question_hash")
        verbose_name = "Cached Chat Response"
        verbose_name_plural = "Cached Chat Responses"
        indexes = [
            models.Index(fields=["syllabus", "question_hash"], name="chat_cache_lookup_idx"),
        ]

    def is_stale(self) -> bool:
        from datetime import timedelta
        return timezone.now() - self.updated_at > timedelta(days=self.CACHE_TTL_DAYS)

    def __str__(self):
        return f"ChatCache: {self.syllabus} | hits={self.hit_count} | {self.question_text[:60]}"


class ExamAttempt(models.Model):
    """Persisted record of one completed exam session for a logged-in user."""

    user_uid = models.CharField(max_length=128, db_index=True)
    exam_type = models.CharField(max_length=64)
    exam_title = models.CharField(max_length=128, default="")
    score_percent = models.FloatField()
    correct = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    passed = models.BooleanField(default=False)
    time_taken_seconds = models.IntegerField(default=0)
    domain_scores = models.JSONField(null=True, blank=True)
    # List of {question_id, question_text, domain, options, correct_letter,
    #          selected_letter, is_correct, timed_out, explanation}
    question_results = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Exam Attempt"
        verbose_name_plural = "Exam Attempts"
        indexes = [
            models.Index(fields=["user_uid", "-created_at"], name="attempt_user_date_idx"),
        ]

    def __str__(self):
        return f"{self.user_uid[:8]}… {self.exam_type} {self.score_percent}%"


class PinnedPlan(models.Model):
    """A user's pinned lecture plan + chat history, stored per syllabus."""

    user_uid = models.CharField(max_length=200, db_index=True)
    syllabus = models.CharField(max_length=50)
    lecture_plan = models.JSONField()
    chat_messages = models.JSONField(default=list)
    pinned_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user_uid", "syllabus")
        verbose_name = "Pinned Plan"
        verbose_name_plural = "Pinned Plans"
        indexes = [
            models.Index(fields=["user_uid", "syllabus"], name="pinned_plan_user_syllabus_idx"),
        ]

    def __str__(self):
        return f"PinnedPlan: {self.user_uid} / {self.syllabus}"


