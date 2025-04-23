from django.db import models
from registro.models import Profile

# Create your models here.

class Etapa(models.Model): #ya en SQL
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre
    
class EtapaUsuario(models.Model):
    usuario = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='etapas_usuario')
    etapa = models.ForeignKey(Etapa, on_delete=models.CASCADE, related_name='etapas_usuario')

class Categoria(models.Model): #ya en SQL
    nombre = models.CharField(max_length=50)
    etapa = models.ForeignKey(Etapa, on_delete=models.CASCADE, related_name='categorias', null=True, blank=True)

    def __str__(self):
        return self.nombre

class Leccion(models.Model): # ya en SQL
    etapa = models.ForeignKey(Etapa, on_delete=models.CASCADE, related_name='lecciones', null=True, blank=True)

class LeccionUsuario(models.Model):
    usuario = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='lecciones_usuario')
    leccion = models.ForeignKey(Leccion, on_delete=models.CASCADE, related_name='lecciones_usuario')
    completada = models.BooleanField(default=False)  # Para saber si la lección ha sido completada
    fecha_completada = models.DateTimeField(null=True, blank=True)  # Fecha de finalización de la lección


class Palabra(models.Model): #ya en SQL solo faltan los links
    palabra = models.CharField(max_length=50)
    leccion = models.ForeignKey('Leccion', on_delete=models.CASCADE, related_name='palabras')
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='palabras', null=True, blank=True)
    ejemplos = models.TextField(default='')
    gesto = models.URLField(default='', blank=True)  # URL de la imagen o video en S3
    frase = models.TextField(default='')  # Frase de ejemplo con la palabra

    def __str__(self):
        return self.palabra

class PalabraUsuario(models.Model):
    usuario = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='palabras_usuario')
    palabra = models.ForeignKey(Palabra, on_delete=models.CASCADE, related_name='palabras_usuario')
    fecha_completada = models.DateTimeField(null=True, blank=True)  # Fecha de finalización de la palabra


class Instruccion(models.Model): #ya en SQL
    TIPOS_INSTRUCCION = [
        ('seleccion', 'Selecciona el gesto correcto para {palabra}'),
        ('seleccion2', 'Selecciona el gesto correcto a la palabra resaltada'), #En este ejercicio se muestran los ejemplos
        ('emparejar', 'Empareja las palabras con su respectivo texto'),
        ('completar', 'Selecciona el gesto que completa la frase'),
        ('escribir', 'Escribe la palabra que corresponde al gesto'),
        ('gesto', 'Realiza el siguiente gesto para la palabra {palabra}'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPOS_INSTRUCCION)
    
    def generar_texto(self, palabra):
        return self.get_tipo_display().format(palabra=palabra)
    
    def __str__(self):
        return self.get_tipo_display()
    
# from django.db import models
# from django.contrib.auth import get_user_model
# from django.db.models import Count, Avg, F
# from inicio.models import Medalla

# User = get_user_model()

# class ProgresoUsuario(models.Model):
#     perfil = models.ForeignKey(
#         'Profile', 
#         on_delete=models.CASCADE,
#         related_name='progreso_palabras'  # Cambiado para evitar conflicto
#     )
#     palabra = models.ForeignKey('Palabra', on_delete=models.CASCADE)
    
#     # Estadísticas
#     veces_practicada = models.PositiveIntegerField(default=0)
#     veces_acertada = models.PositiveIntegerField(default=0)
#     ultima_actualizacion = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         unique_together = ('perfil', 'palabra')  # Un usuario solo un progreso por palabra
    
#     @property
#     def precision(self):
#         return (self.veces_acertada / self.veces_practicada) * 100 if self.veces_practicada > 0 else 0

# class MedallaUsuario(models.Model):
#     TIPO_MEDALLA = [
#         ('bronce', 'Bronce'),
#         ('plata', 'Plata'),
#         ('oro', 'Oro'),
#     ]
#     perfil = models.ForeignKey(
#         'Profile',
#         on_delete=models.CASCADE,
#         related_name='medallas_usuario'  # Relación separada
#     )
#     tipo = models.CharField(max_length=10, choices=TIPO_MEDALLA)
#     medalla = models.ForeignKey(Medalla, on_delete=models.CASCADE)
#     fecha_obtencion = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         unique_together = ('perfil', 'tipo')  # Cambiado de 'usuario' a 'perfil'