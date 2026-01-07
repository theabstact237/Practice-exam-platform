"""
Management command to create superuser non-interactively
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser non-interactively'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for superuser'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help='Email for superuser'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=None,
            help='Password for superuser (will prompt if not provided)'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists. Skipping creation.')
            )
            return

        # Create superuser
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password or 'admin123'  # Default password, change in production!
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created superuser: {username}')
        )
        if not password:
            self.stdout.write(
                self.style.WARNING(f'Default password: admin123 - Please change this!')
            )

