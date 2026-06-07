"""
Shared pytest fixtures for the entire backend test suite.
"""
import pytest
from django.test import Client
from django.core.cache import cache
from exams.models import Exam, Question, Answer, Review, ExamAttempt


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear Django's in-memory cache before every test.

    Without this, SQLite's transaction rollback reuses auto-increment IDs,
    causing the question-ID cache from one test to poison the next test that
    creates an object with the same PK.
    """
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return Client()


@pytest.fixture
def exam(db):
    """A single active exam."""
    return Exam.objects.create(
        name="AWS Cloud Practitioner",
        exam_type="cloud_practitioner",
        description="Foundational AWS certification",
        total_questions=50,
        time_limit_minutes=90,
        passing_score=70,
        is_active=True,
    )


@pytest.fixture
def inactive_exam(db):
    """An inactive exam (should not appear in lists)."""
    return Exam.objects.create(
        name="AWS Inactive Exam",
        exam_type="cloud_practitioner",
        is_active=False,
    )


@pytest.fixture
def question_with_answers(db, exam):
    """A question with 4 answer options (A correct)."""
    q = Question.objects.create(
        exam=exam,
        question_text="Which AWS service provides object storage?",
        domain="Storage",
        difficulty="easy",
        explanation="Amazon S3 is AWS's scalable object storage service.",
    )
    Answer.objects.create(question=q, letter="A", text="Amazon S3", is_correct=True)
    Answer.objects.create(question=q, letter="B", text="Amazon EC2", is_correct=False)
    Answer.objects.create(question=q, letter="C", text="Amazon RDS", is_correct=False)
    Answer.objects.create(question=q, letter="D", text="AWS Lambda", is_correct=False)
    return q


@pytest.fixture
def question_pool(db, exam):
    """10 questions with answers for random-questions endpoint tests."""
    questions = []
    for i in range(10):
        q = Question.objects.create(
            exam=exam,
            question_text=f"Sample question {i + 1}?",
            domain="General",
            difficulty="medium",
            explanation=f"Explanation {i + 1}.",
        )
        for letter in ["A", "B", "C", "D"]:
            Answer.objects.create(
                question=q,
                letter=letter,
                text=f"Option {letter} for Q{i + 1}",
                is_correct=(letter == "A"),
            )
        questions.append(q)
    return questions


@pytest.fixture
def review(db, exam):
    """An approved review."""
    return Review.objects.create(
        exam=exam,
        user_uid="firebase_uid_abc123",
        user_name="Jane Doe",
        user_email="jane@example.com",
        rating=5,
        comment="Excellent practice exam!",
        exam_score=85,
        passed=True,
        is_approved=True,
    )


@pytest.fixture
def exam_attempt(db):
    """A saved exam attempt record."""
    return ExamAttempt.objects.create(
        user_uid="firebase_uid_abc123",
        exam_type="cloud_practitioner",
        exam_title="AWS Cloud Practitioner Practice Exam",
        score_percent=82.0,
        correct=41,
        total=50,
        passed=True,
        time_taken_seconds=3240,
        domain_scores={"Storage": {"correct": 8, "total": 10}},
        question_results=[],
    )
