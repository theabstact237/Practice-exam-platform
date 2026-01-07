"""
URL configuration for aws_exam_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def root_view(request):
    """Root endpoint - provides API information"""
    return JsonResponse({
        'message': 'AWS Exam Platform API',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'exams': '/api/exams/',
            'health': '/api/exams/'
        },
        'documentation': 'Visit /api/exams/ for exam endpoints'
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('exams.urls')),
]


