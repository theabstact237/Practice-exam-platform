"""
Django settings for aws_exam_backend project.
"""

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,*').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'exams',
]

MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',  # GZip compression - reduces response size by 70-90%
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # For static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'aws_exam_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'aws_exam_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# Use PostgreSQL if DATABASE_URL is set (production), otherwise use SQLite (development)
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use PostgreSQL from Render
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development: Use SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise for serving static files in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
if DEBUG:
    # Development: Allow all origins
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
else:
    # Production: Allow Render frontend URL
    CORS_ALLOW_ALL_ORIGINS = False
    
    # Get frontend URL from env var and ensure it has https:// prefix
    frontend_url = os.getenv('FRONTEND_URL', '')
    if frontend_url and not frontend_url.startswith(('http://', 'https://')):
        frontend_url = f'https://{frontend_url}'
    
    CORS_ALLOWED_ORIGINS = [
        "https://aws-exam-frontend.onrender.com",
        "https://freecertify.org",
        "https://www.freecertify.org",
    ]
    
    # Add custom frontend URL if provided
    if frontend_url:
        CORS_ALLOWED_ORIGINS.append(frontend_url)

CORS_ALLOW_CREDENTIALS = True

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}

# API Keys (from environment variables)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
MANUS_API_KEY = os.getenv('MANUS_API_KEY', '')
MANUS_API_URL = os.getenv('MANUS_API_URL', 'https://api.manus.ai/v1')  # Update with actual Manus API URL

# Intelligent Question Pool Enrichment Settings
# Probability of enriching database when pool is full (0.0 to 1.0)
# 0.15 = 15% chance to enrich on each request when pool >= 100
QUESTION_ENRICHMENT_PROBABILITY = float(os.getenv('QUESTION_ENRICHMENT_PROBABILITY', '0.15'))

# Minimum batch size for random enrichment (to make it cost-effective)
# Smaller batches are more cost-efficient for random enrichment
MIN_ENRICHMENT_BATCH = int(os.getenv('MIN_ENRICHMENT_BATCH', '10'))

# =============================================================================
# CACHING CONFIGURATION
# =============================================================================
# Use Redis in production if available, otherwise use local memory cache

REDIS_URL = os.getenv('REDIS_URL', None)

if REDIS_URL:
    # Production: Use Redis for distributed caching
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'aws_exam',
            'TIMEOUT': 3600,  # Default 1 hour cache timeout
        }
    }
else:
    # Development: Use local memory cache (fast, but not shared across processes)
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'TIMEOUT': 3600,  # Default 1 hour cache timeout
            'OPTIONS': {
                'MAX_ENTRIES': 1000,  # Maximum number of cache entries
            }
        }
    }

# Cache timeouts (in seconds) - can be customized per use case
CACHE_TIMEOUT_SHORT = 300      # 5 minutes - for frequently changing data
CACHE_TIMEOUT_MEDIUM = 3600    # 1 hour - for question pools
CACHE_TIMEOUT_LONG = 86400     # 24 hours - for static data

