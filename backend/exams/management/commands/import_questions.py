import json
import os
from django.core.management.base import BaseCommand
from exams.models import Exam, Question, Answer


class Command(BaseCommand):
    help = 'Import questions from JSON files into the database'

    # Mapping of JSON filenames to exam types
    FILE_TO_EXAM_TYPE = {
        'solutions_architect_100_questions.json': 'solutions_architect',
        'cloud_practitioner_100_questions.json': 'cloud_practitioner',
        'developer_100_questions.json': 'developer',
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing questions before importing',
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Import from a specific JSON file',
        )

    def handle(self, *args, **options):
        # Get the exams directory path
        exams_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing all existing questions...'))
            Question.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('All questions cleared.'))

        # Import from specific file or all files
        if options['file']:
            self.import_file(exams_dir, options['file'])
        else:
            # Import all question files
            for filename in self.FILE_TO_EXAM_TYPE.keys():
                self.import_file(exams_dir, filename)

        # Summary
        total_questions = Question.objects.count()
        self.stdout.write(self.style.SUCCESS(f'\n✅ Total questions in database: {total_questions}'))
        
        for exam in Exam.objects.all():
            count = exam.questions.count()
            self.stdout.write(f'   - {exam.name}: {count} questions')

    def import_file(self, exams_dir, filename):
        filepath = os.path.join(exams_dir, filename)
        
        if not os.path.exists(filepath):
            self.stdout.write(self.style.ERROR(f'File not found: {filepath}'))
            return

        # Get exam type from filename
        exam_type = self.FILE_TO_EXAM_TYPE.get(filename)
        if not exam_type:
            self.stdout.write(self.style.ERROR(f'Unknown file: {filename}'))
            return

        # Get or create the exam
        try:
            exam = Exam.objects.get(exam_type=exam_type)
        except Exam.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Exam not found for type: {exam_type}'))
            return

        self.stdout.write(f'\n📚 Importing questions for: {exam.name}')
        self.stdout.write(f'   Reading from: {filename}')

        # Read JSON file
        with open(filepath, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)

        imported = 0
        skipped = 0

        for q_data in questions_data:
            question_text = q_data.get('question_text', '')
            
            # Skip if question already exists (by text and exam)
            if Question.objects.filter(exam=exam, question_text=question_text).exists():
                skipped += 1
                continue

            # Create question
            question = Question.objects.create(
                exam=exam,
                question_text=question_text,
                domain=q_data.get('domain', ''),
                difficulty=q_data.get('difficulty', 'medium'),
                explanation=q_data.get('explanation', ''),
            )

            # Create answers
            correct_letter = q_data.get('correct_answer_letter', '')
            for option in q_data.get('options', []):
                Answer.objects.create(
                    question=question,
                    letter=option.get('letter', ''),
                    text=option.get('text', ''),
                    is_correct=(option.get('letter', '') == correct_letter),
                )

            imported += 1

        self.stdout.write(self.style.SUCCESS(f'   ✓ Imported: {imported} questions'))
        if skipped > 0:
            self.stdout.write(self.style.WARNING(f'   ⚠ Skipped (duplicates): {skipped}'))

