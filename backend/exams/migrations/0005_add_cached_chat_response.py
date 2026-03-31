from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0004_add_cached_lecture_plan_and_pinned_plan'),
    ]

    operations = [
        migrations.CreateModel(
            name='CachedChatResponse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('syllabus', models.CharField(db_index=True, max_length=50)),
                ('question_hash', models.CharField(db_index=True, max_length=64)),
                ('question_text', models.TextField()),
                ('response_text', models.TextField()),
                ('provider', models.CharField(default='deepseek', max_length=50)),
                ('hit_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Cached Chat Response',
                'verbose_name_plural': 'Cached Chat Responses',
            },
        ),
        migrations.AddConstraint(
            model_name='cachedchatresponse',
            constraint=models.UniqueConstraint(
                fields=('syllabus', 'question_hash'),
                name='unique_syllabus_question_hash',
            ),
        ),
        migrations.AddIndex(
            model_name='cachedchatresponse',
            index=models.Index(fields=['syllabus', 'question_hash'], name='chat_cache_lookup_idx'),
        ),
    ]
