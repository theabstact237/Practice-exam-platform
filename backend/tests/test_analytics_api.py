"""
Integration tests for the Analytics API endpoints.
"""
import json
import pytest


@pytest.mark.django_db
class TestRegisterSession:
    def test_register_session_succeeds(self, client):
        payload = {"session_key": "test_session_abc123", "device_category": "desktop"}
        response = client.post(
            "/api/analytics/register-session/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_register_session_idempotent(self, client):
        payload = {"session_key": "same_session_key", "device_category": "mobile"}
        client.post("/api/analytics/register-session/", data=json.dumps(payload), content_type="application/json")
        response = client.post("/api/analytics/register-session/", data=json.dumps(payload), content_type="application/json")
        assert response.status_code == 200

    def test_register_session_requires_session_key(self, client):
        payload = {"device_category": "desktop"}
        response = client.post(
            "/api/analytics/register-session/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_register_session_normalizes_device_category(self, client):
        payload = {"session_key": "device_test_key", "device_category": "MOBILE"}
        response = client.post(
            "/api/analytics/register-session/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestRecordEvent:
    def test_record_exam_start_event(self, client):
        # First register session
        client.post(
            "/api/analytics/register-session/",
            data=json.dumps({"session_key": "event_session", "device_category": "desktop"}),
            content_type="application/json",
        )
        payload = {
            "session_key": "event_session",
            "exam_type": "cloud_practitioner",
            "event_type": "exam_start",
        }
        response = client.post(
            "/api/analytics/record-event/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200

    def test_record_exam_complete_with_score(self, client):
        client.post(
            "/api/analytics/register-session/",
            data=json.dumps({"session_key": "complete_session", "device_category": "mobile"}),
            content_type="application/json",
        )
        payload = {
            "session_key": "complete_session",
            "exam_type": "solutions_architect",
            "event_type": "exam_complete",
            "score_percent": 82,
        }
        response = client.post(
            "/api/analytics/record-event/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200

    def test_record_event_requires_all_fields(self, client):
        payload = {"session_key": "incomplete_session"}
        response = client.post(
            "/api/analytics/record-event/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestAnalyticsDashboard:
    def test_dashboard_returns_data(self, client):
        response = client.get("/api/analytics/dashboard/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
