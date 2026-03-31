from django.urls import path

from . import views

urlpatterns = [
    path("session/", views.register_session, name="analytics-register-session"),
    path("events/", views.record_event, name="analytics-record-event"),
    path("dashboard/", views.dashboard, name="analytics-dashboard"),
]
