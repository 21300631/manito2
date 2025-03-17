from django.db import models
from registro.models import Profile
from .storages import ImageStorage 

# Create your models here.
class Publicacion(models.Model):
    titulo = models.CharField(max_length=50)
    contenido = models.TextField()
    hashtags = models.CharField()
    fecha = models.DateTimeField(auto_now_add=True)
    imagen = models.ImageField(storage=ImageStorage(), upload_to='posts/', blank=True, null=True)
    usuario = models.ForeignKey(Profile, on_delete=models.SET_DEFAULT, default='usuario_eliminado')
    
    def __str__(self):
        return self.titulo
    

