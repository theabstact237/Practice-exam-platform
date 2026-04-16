"""
Management command to create/update the superuser non-interactively.
Reads credentials from environment variables:
  DJANGO_ADMIN_USERNAME  (default: admin)
  DJANGO_ADMIN_EMAIL     (default: admin@freecertify.org)
  DJANGO_ADMIN_PASSWORD  (required – no fallback)
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create or update the superuser from environment variables'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_ADMIN_USERNAME', 'admin').strip()
        email    = os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@freecertify.org').strip()
        password = os.environ.get('DJANGO_ADMIN_PASSWORD', '').strip()

        if not password:
            self.stdout.write(self.style.WARNING(
                'DJANGO_ADMIN_PASSWORD is not set – skipping superuser creation.'
            ))
            return

        user, created = User.objects.get_or_create(username=username)
        user.email        = email
        user.is_staff     = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f'{action} superuser "{username}" ({email})'
        ))
