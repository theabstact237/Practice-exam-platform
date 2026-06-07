"""
Unit tests for Exam, Question, Answer, Review, and ExamAttempt models.
"""
import pytest
from django.utils import timezone
from exams.models import Exam, Question, Answer, Review, ExamAttempt


@pytest.mark.django_db
class TestExamModel:
    def test_exam_str(self, exam):
        assert str(exam) == "AWS Cloud Practitioner"

    def test_exam_defaults(self, exam):
        assert exam.is_active is True
        assert exam.passing_score == 70
        assert exam.total_questions == 50

    def test_inactive_exam_excluded_from_active_queryset(self, exam, inactive_exam):
        active = Exam.objects.filter(is_active=True)
        assert exam in active
        assert inactive_exam not in active

    def test_exam_type_choices(self, exam):
        valid_types = [c[0] for c in Exam.EXAM_TYPE_CHOICES]
        assert exam.exam_type in valid_types


@pytest.mark.django_db
class TestQuestionModel:
    def test_question_str(self, question_with_answers):
        q = question_with_answers
        assert "AWS Cloud Practitioner" in str(q)
        assert str(q.id) in str(q)

    def test_question_has_four_answers(self, question_with_answers):
        assert question_with_answers.answers.count() == 4

    def test_exactly_one_correct_answer(self, question_with_answers):
        correct = question_with_answers.answers.filter(is_correct=True)
        assert correct.count() == 1
        assert correct.first().letter == "A"

    def test_question_difficulty_default(self, db, exam):
        q = Question.objects.create(
            exam=exam,
            question_text="Test question?",
            explanation="Test explanation.",
        )
        assert q.difficulty == "medium"

    def test_question_ordering(self, question_pool):
        ids = list(Question.objects.values_list("id", flat=True).order_by("id"))
        assert ids == sorted(ids)


@pytest.mark.django_db
class TestAnswerModel:
    def test_answer_str(self, question_with_answers):
        answer = question_with_answers.answers.get(letter="A")
        assert "A)" in str(answer)
        assert "Amazon S3" in str(answer)

    def test_unique_letter_per_question(self, question_with_answers, db):
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            Answer.objects.create(
                question=question_with_answers,
                letter="A",
                text="Duplicate letter",
                is_correct=False,
            )


@pytest.mark.django_db
class TestReviewModel:
    def test_review_str(self, review):
        assert "Jane Doe" in str(review)
        assert "5★" in str(review)

    def test_review_defaults(self, review):
        assert review.is_approved is True
        assert review.is_featured is False

    def test_review_unique_per_user_and_exam(self, db, exam, review):
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            Review.objects.create(
                exam=exam,
                user_uid="firebase_uid_abc123",  # same user
                user_name="Duplicate",
                rating=3,
                comment="Duplicate review",
            )


@pytest.mark.django_db
class TestExamAttemptModel:
    def test_attempt_str(self, exam_attempt):
        s = str(exam_attempt)
        assert "cloud_practitioner" in s
        assert "82.0" in s

    def test_attempt_passed_flag(self, exam_attempt):
        assert exam_attempt.passed is True
        assert exam_attempt.score_percent == 82.0

    def test_attempt_ordering(self, db, exam_attempt):
        attempt2 = ExamAttempt.objects.create(
            user_uid="firebase_uid_abc123",
            exam_type="solutions_architect",
            exam_title="AWS Solutions Architect",
            score_percent=65.0,
            correct=33,
            total=50,
            passed=False,
            time_taken_seconds=2800,
        )
        first = ExamAttempt.objects.first()
        assert first == attempt2  # ordered by -created_at
