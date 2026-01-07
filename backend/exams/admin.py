from django.contrib import admin
from django.shortcuts import render, redirect
from django.urls import path
from django.http import HttpResponse
from django.contrib import messages
from django.utils.html import format_html
import json
from .models import Exam, Question, Answer


class AnswerInline(admin.TabularInline):
    """Inline admin for Answer model"""
    model = Answer
    extra = 4
    fields = ('letter', 'text', 'is_correct')
    ordering = ('letter',)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    """Admin interface for Exam model"""
    list_display = ('name', 'exam_type', 'total_questions', 'question_count', 'is_active', 'created_at', 'upload_json_link')
    list_filter = ('exam_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'exam_type', 'description')
        }),
        ('Exam Settings', {
            'fields': ('total_questions', 'time_limit_minutes', 'passing_score', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:exam_id>/upload-json/', self.admin_site.admin_view(self.upload_json_view), name='exams_exam_upload_json'),
        ]
        return custom_urls + urls
    
    def question_count(self, obj):
        """Display count of questions for this exam"""
        count = obj.questions.count()
        return format_html('<strong>{}</strong>', count)
    question_count.short_description = 'Questions'
    
    def upload_json_link(self, obj):
        """Link to upload JSON file for this exam"""
        return format_html(
            '<a class="button" href="{}">Upload JSON</a>',
            f'/admin/exams/exam/{obj.id}/upload-json/'
        )
    upload_json_link.short_description = 'Upload Questions'
    
    def upload_json_view(self, request, exam_id):
        """Custom view for uploading JSON file"""
        exam = Exam.objects.get(pk=exam_id)
        
        if request.method == 'POST':
            json_file = request.FILES.get('json_file')
            replace_existing = request.POST.get('replace_existing', False)
            
            if not json_file:
                messages.error(request, 'Please select a JSON file to upload.')
                return redirect(f'/admin/exams/exam/{exam_id}/upload-json/')
            
            try:
                # Read and parse JSON file
                file_content = json_file.read().decode('utf-8')
                questions_data = json.loads(file_content)
                
                if not isinstance(questions_data, list):
                    messages.error(request, 'JSON file must contain an array of questions.')
                    return redirect(f'/admin/exams/exam/{exam_id}/upload-json/')
                
                # Replace existing questions if requested
                if replace_existing:
                    Question.objects.filter(exam=exam).delete()
                    messages.info(request, f'Deleted existing questions for {exam.name}')
                
                # Load questions
                created_count = 0
                skipped_count = 0
                errors = []
                
                for idx, q_data in enumerate(questions_data, 1):
                    try:
                        # Check if question already exists
                        existing = Question.objects.filter(
                            exam=exam,
                            question_text=q_data.get('question_text', '')
                        ).first()
                        
                        if existing:
                            skipped_count += 1
                            continue
                        
                        # Validate required fields
                        if not q_data.get('question_text'):
                            errors.append(f'Question {idx}: Missing question_text')
                            continue
                        
                        # Get correct answer letter
                        correct_answer_letter = q_data.get('correct_answer_letter', 'A').upper()
                        
                        # Create question
                        question = Question.objects.create(
                            exam=exam,
                            question_text=q_data.get('question_text', ''),
                            domain=q_data.get('domain', ''),
                            difficulty=q_data.get('difficulty', 'medium'),
                            explanation=q_data.get('explanation', '')
                        )
                        
                        # Create answers
                        options = q_data.get('options', [])
                        if not options and 'answers' in q_data:
                            options = q_data['answers']
                        
                        if not options:
                            errors.append(f'Question {idx}: No options provided')
                            question.delete()
                            continue
                        
                        for opt in options[:4]:  # Max 4 options
                            opt_letter = opt.get('letter', opt.get('text', '')[:1]).upper()
                            Answer.objects.create(
                                question=question,
                                letter=opt_letter,
                                text=opt.get('text', opt.get('label', '')),
                                is_correct=(opt_letter == correct_answer_letter)
                            )
                        
                        created_count += 1
                        
                    except Exception as e:
                        errors.append(f'Question {idx}: {str(e)}')
                        continue
                
                # Show results
                if created_count > 0:
                    messages.success(
                        request, 
                        f'Successfully loaded {created_count} questions for {exam.name}. '
                        f'Skipped {skipped_count} duplicates.'
                    )
                
                if errors:
                    error_msg = f'Errors encountered: {len(errors)} questions failed. First few errors: ' + '; '.join(errors[:5])
                    messages.warning(request, error_msg)
                
                # Update total_questions if needed
                total_questions = exam.questions.count()
                if exam.total_questions != total_questions:
                    exam.total_questions = total_questions
                    exam.save()
                    messages.info(request, f'Updated total_questions to {total_questions}')
                
                return redirect(f'/admin/exams/exam/{exam_id}/change/')
                
            except json.JSONDecodeError as e:
                messages.error(request, f'Invalid JSON file: {str(e)}')
            except Exception as e:
                messages.error(request, f'Error processing file: {str(e)}')
        
        # Render upload form
        context = {
            'title': f'Upload Questions JSON - {exam.name}',
            'exam': exam,
            'opts': self.model._meta,
            'has_view_permission': True,
            'site_header': 'Django administration',
            'site_title': 'Django site admin',
        }
        
        return render(request, 'admin/exams/exam/upload_json.html', context)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """Admin interface for Question model"""
    list_display = ('id', 'exam', 'domain', 'difficulty', 'question_text_preview', 'created_at')
    list_filter = ('exam', 'domain', 'difficulty', 'created_at')
    search_fields = ('question_text', 'domain', 'explanation')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [AnswerInline]
    
    fieldsets = (
        ('Question Information', {
            'fields': ('exam', 'question_text', 'domain', 'difficulty', 'explanation')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def question_text_preview(self, obj):
        """Show preview of question text"""
        return obj.question_text[:100] + '...' if len(obj.question_text) > 100 else obj.question_text
    question_text_preview.short_description = 'Question Preview'


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    """Admin interface for Answer model"""
    list_display = ('id', 'question', 'letter', 'text_preview', 'is_correct', 'created_at')
    list_filter = ('is_correct', 'question__exam', 'created_at')
    search_fields = ('text', 'question__question_text')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Answer Information', {
            'fields': ('question', 'letter', 'text', 'is_correct')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def text_preview(self, obj):
        """Show preview of answer text"""
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Answer Preview'


