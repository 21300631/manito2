# Generated by Django 4.2.20 on 2025-07-02 05:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('perfil', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='insignia',
            name='imagen',
            field=models.CharField(max_length=50),
        ),
    ]
