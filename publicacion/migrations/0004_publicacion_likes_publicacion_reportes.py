# Generated by Django 5.1.6 on 2025-03-17 23:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publicacion', '0003_rename_image_publicacion_imagen'),
    ]

    operations = [
        migrations.AddField(
            model_name='publicacion',
            name='likes',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='publicacion',
            name='reportes',
            field=models.IntegerField(default=0),
        ),
    ]
