# Generated by Django 5.1.6 on 2025-04-03 04:33

import publicacion.storages
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publicacion', '0006_comentario_archivo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comentario',
            name='archivo',
            field=models.FileField(blank=True, null=True, storage=publicacion.storages.ImageStorage(), upload_to='posts/'),
        ),
    ]
