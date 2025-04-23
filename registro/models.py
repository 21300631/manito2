from django.contrib.auth.models import User
from django.db import models
from .storages import ImageStorage


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Conexión con User
    edad = models.IntegerField()
    racha = models.IntegerField(default=0)
    imagen = models.ImageField(
        storage=ImageStorage(), 
        upload_to='usuario/', 
        blank=True, 
        null=True,
        default='usuario/default.jpg'
        )
    puntos = models.IntegerField(default=0)
    medalla = models.ForeignKey('inicio.Medalla', on_delete=models.SET_NULL, null=True, blank=True)
    theme = models.CharField(max_length=10, default="light")  # 'light' o 'dark'
    leccion = models.IntegerField(default=1)  # ID de la lección actual

    @property
    def medalla_actual(self):
        """Devuelve la medalla de mayor rango (para templates)"""
        return self.medalla
    
    
    def __str__(self):
        return self.user.username