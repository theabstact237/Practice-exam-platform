"""
Integration tests for the Exam API endpoints.
Tests every major endpoint that the frontend and mobile app consume.
"""
import json
import pytest
from django.urls import reverse
from exams.models import Exam, Question, Answer, Review, ExamAttempt


@pytest.mark.django_db
class TestRootEndpoint:
    def test_root_returns_api_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "AWS Exam Platform API"
        assert "endpoints" in data


@pytest.mark.django_db
class TestExamListEndpoint:
    def test_list_returns_active_exams(self, client, exam):
        response = client.get("/api/exams/")
        assert response.status_code == 200
        data = response.json()
        # DRF returns a list or paginated object
        results = data if isinstance(data, list) else data.get("results", data)
        names = [e["name"] for e in results]
        assert "AWS Cloud Practitioner" in names

    def test_inactive_exam_not_in_list(self, client, exam, inactive_exam):
        response = client.get("/api/exams/")
        assert response.status_code == 200
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", data)
        names = [e["name"] for e in results]
        assert "AWS Inactive Exam" not in names

    def test_exam_detail_contains_expected_fields(self, client, exam):
        response = client.get(f"/api/exams/{exam.id}/")
        assert response.status_code == 200
        data = response.json()
        for field in ["id", "name", "exam_type", "passing_score", "is_active"]:
            assert field in data


@pytest.mark.django_db
class TestExamsByTypeEndpoint:
    def test_by_type_returns_matching_exams(self, client, exam):
        response = client.get("/api/exams/by-type/cloud_practitioner/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["exam_type"] == "cloud_practitioner"

    def test_by_type_returns_empty_for_unknown_type(self, client):
        response = client.get("/api/exams/by-type/unknown_exam/")
        assert response.status_code == 200
        assert response.json() == []


@pytest.mark.django_db
class TestRandomQuestionsEndpoint:
    def test_returns_questions_when_available(self, client, exam, question_pool):
        response = client.get(f"/api/exams/{exam.id}/random-questions/")
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert data["count"] > 0

    def test_returns_404_when_no_questions(self, client, exam):
        response = client.get(f"/api/exams/{exam.id}/random-questions/")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data

    def test_respects_limit_param(self, client, exam, question_pool):
        response = client.get(f"/api/exams/{exam.id}/random-questions/?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] <= 5

    def test_question_has_required_fields(self, client, exam, question_pool):
        response = client.get(f"/api/exams/{exam.id}/random-questions/?limit=1")
        assert response.status_code == 200
        questions = response.json()["questions"]
        assert len(questions) >= 1
        q = questions[0]
        for field in ["id", "question_text", "domain", "difficulty", "answers", "correct_answer_letter"]:
            assert field in q

    def test_answers_have_required_fields(self, client, exam, question_pool):
        response = client.get(f"/api/exams/{exam.id}/random-questions/?limit=1")
        data = response.json()
        answer = data["questions"][0]["answers"][0]
        for field in ["letter", "text"]:
            assert field in answer


@pytest.mark.django_db
class TestExamQuestionsEndpoint:
    def test_returns_questions_for_exam(self, client, exam, question_pool):
        response = client.get(f"/api/exams/{exam.id}/questions/")
        assert response.status_code == 200

    def test_returns_404_when_no_questions(self, client, exam):
        response = client.get(f"/api/exams/{exam.id}/questions/")
        assert response.status_code == 404


@pytest.mark.django_db
class TestReviewsEndpoint:
    def test_list_returns_approved_reviews(self, client, review):
        response = client.get("/api/reviews/")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert data["count"] >= 1

    def test_unapproved_review_excluded(self, client, db, exam):
        Review.objects.create(
            exam=exam,
            user_uid="uid_unapproved",
            user_name="Unapproved User",
            rating=2,
            comment="Not yet approved",
            is_approved=False,
        )
        response = client.get("/api/reviews/")
        data = response.json()
        names = [r["user_name"] for r in data["reviews"]]
        assert "Unapproved User" not in names

    def test_create_review_succeeds(self, client, exam):
        payload = {
            "exam": exam.id,
            "user_uid": "new_uid_xyz",
            "user_name": "New Reviewer",
            "user_email": "new@example.com",
            "rating": 4,
            "comment": "Very helpful!",
            "exam_score": 78,
            "passed": True,
        }
        response = client.post(
            "/api/reviews/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Review submitted successfully"
        assert data["review"]["user_name"] == "New Reviewer"

    def test_create_review_missing_required_fields(self, client, exam):
        payload = {"exam": exam.id}
        response = client.post(
            "/api/reviews/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_duplicate_review_updates_existing(self, client, exam, review):
        payload = {
            "exam": exam.id,
            "user_uid": "firebase_uid_abc123",  # same as existing review
            "user_name": "Jane Doe Updated",
            "rating": 4,
            "comment": "Updated comment",
        }
        response = client.post(
            "/api/reviews/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Review updated successfully"

    def test_review_stats_endpoint(self, client, review):
        response = client.get("/api/reviews/stats/")
        assert response.status_code == 200
        data = response.json()
        assert "total_reviews" in data
        assert "average_rating" in data
        assert "rating_distribution" in data
        assert data["total_reviews"] >= 1

    def test_recent_reviews_endpoint(self, client, review):
        response = client.get("/api/reviews/recent/")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data


@pytest.mark.django_db
class TestExamAttemptEndpoints:
    def test_save_attempt_succeeds(self, client, exam):
        payload = {
            "user_uid": "test_firebase_uid",
            "exam_type": "cloud_practitioner",
            "exam_title": "AWS Cloud Practitioner Practice Exam",
            "score_percent": 76.0,
            "correct": 38,
            "total": 50,
            "passed": True,
            "time_taken_seconds": 2700,
            "domain_scores": {"Storage": {"correct": 7, "total": 10}},
            "question_results": [],
        }
        response = client.post(
            "/api/attempts/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 201
        data = response.json()
        assert data["ok"] is True
        assert "id" in data

    def test_save_attempt_requires_user_uid(self, client):
        payload = {
            "exam_type": "cloud_practitioner",
            "score_percent": 76.0,
            "correct": 38,
            "total": 50,
        }
        response = client.post(
            "/api/attempts/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "user_uid" in response.json()["error"]

    def test_get_user_attempts(self, client, exam_attempt):
        response = client.get(
            "/api/attempts/history/?user_uid=firebase_uid_abc123"
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["exam_type"] == "cloud_practitioner"

    def test_get_user_attempts_requires_uid(self, client):
        response = client.get("/api/attempts/history/")
        assert response.status_code == 400

    def test_get_attempt_detail(self, client, exam_attempt):
        response = client.get(
            f"/api/attempts/{exam_attempt.id}/?user_uid=firebase_uid_abc123"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["score_percent"] == 82.0
        assert "question_results" in data

    def test_get_attempt_detail_wrong_uid_returns_404(self, client, exam_attempt):
        response = client.get(
            f"/api/attempts/{exam_attempt.id}/?user_uid=wrong_uid"
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestUpdateReviewProfile:
    def test_update_review_profile_name(self, client, review):
        payload = {
            "user_uid": "firebase_uid_abc123",
            "user_name": "Jane Updated",
        }
        response = client.patch(
            "/api/reviews/update-profile/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json()["updated"] >= 1

    def test_update_review_profile_requires_uid(self, client):
        payload = {"user_name": "No UID"}
        response = client.patch(
            "/api/reviews/update-profile/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_update_review_profile_nothing_to_update(self, client, review):
        payload = {"user_uid": "firebase_uid_abc123"}
        response = client.patch(
            "/api/reviews/update-profile/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400
