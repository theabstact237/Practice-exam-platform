from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0005_add_cached_chat_response'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExamAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_uid', models.CharField(db_index=True, max_length=128)),
                ('exam_type', models.CharField(max_length=64)),
                ('exam_title', models.CharField(default='', max_length=128)),
                ('score_percent', models.FloatField()),
                ('correct', models.IntegerField(default=0)),
                ('total', models.IntegerField(default=0)),
                ('passed', models.BooleanField(default=False)),
                ('time_taken_seconds', models.IntegerField(default=0)),
                ('domain_scores', models.JSONField(blank=True, null=True)),
                ('question_results', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Exam Attempt',
                'verbose_name_plural': 'Exam Attempts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='examattempt',
            index=models.Index(fields=['user_uid', '-created_at'], name='attempt_user_date_idx'),
        ),
    ]
