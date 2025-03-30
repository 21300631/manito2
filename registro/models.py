from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Conexión con User
    edad = models.IntegerField()
    racha = models.IntegerField(default=0)
    imagen = models.ImageField(upload_to='usuario/', default='usuarios/default.jpg')
    puntos = models.IntegerField(default=0)
    medalla = models.ForeignKey('inicio.Medalla', on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def medalla_actual(self):
        """Devuelve la medalla de mayor rango (para templates)"""
        return self.medalla
    
    
    def __str__(self):
        return self.user.username