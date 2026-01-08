"""
Management command to create initial exam records
"""
from django.core.management.base import BaseCommand
from exams.models import Exam


class Command(BaseCommand):
    help = 'Create initial exam records in the database'

    def handle(self, *args, **options):
        exams_data = [
            {
                'name': 'AWS Solutions Architect',
                'exam_type': 'solutions_architect',
                'description': 'AWS Solutions Architect Associate certification practice exam. Tests knowledge of AWS services, architectures, and best practices.',
                'total_questions': 50,
                'time_limit_minutes': 90,
                'passing_score': 70,
                'is_active': True
            },
            {
                'name': 'AWS Cloud Practitioner',
                'exam_type': 'cloud_practitioner',
                'description': 'AWS Cloud Practitioner foundational certification practice exam. Tests basic understanding of AWS cloud concepts.',
                'total_questions': 50,
                'time_limit_minutes': 90,
                'passing_score': 70,
                'is_active': True
            },
            {
                'name': 'AWS Developer Associate',
                'exam_type': 'developer',
                'description': 'AWS Developer Associate certification practice exam. Tests knowledge of developing, deploying, and debugging cloud-based applications using AWS.',
                'total_questions': 50,
                'time_limit_minutes': 90,
                'passing_score': 70,
                'is_active': True
            }
        ]

        created_count = 0
        updated_count = 0

        for exam_data in exams_data:
            exam, created = Exam.objects.update_or_create(
                name=exam_data['name'],
                defaults={
                    'exam_type': exam_data['exam_type'],
                    'description': exam_data['description'],
                    'total_questions': exam_data['total_questions'],
                    'time_limit_minutes': exam_data['time_limit_minutes'],
                    'passing_score': exam_data['passing_score'],
                    'is_active': exam_data['is_active']
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created exam: {exam.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated exam: {exam.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully processed {len(exams_data)} exams: '
                f'{created_count} created, {updated_count} updated'
            )
        )


