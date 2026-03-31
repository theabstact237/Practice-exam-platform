from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='analyticsexamevent',
            name='domain_scores',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
