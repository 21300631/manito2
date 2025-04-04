from django.db import models

# Create your models here.
class Medalla(models.Model):
    nombre = models.CharField(max_length=50)
    imagen = models.ImageField(upload_to='medallas/')
    
    class Meta:
        ordering = ['nombre']  # Orden natural: Bronce, Plata, Oro
    
    def __str__(self):
        return self.nombre