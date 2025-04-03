from django.db import models

# Create your models here.

class Etapa(models.Model): #ya en SQL
    completada = models.BooleanField(default=False) #Completa True, incompleta False
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class Categoria(models.Model): #ya en SQL
    nombre = models.CharField(max_length=50)
    etapa = models.ForeignKey(Etapa, on_delete=models.CASCADE, related_name='categorias')

    def __str__(self):
        return self.nombre

class Leccion(models.Model): # ya en SQL
    completada = models.BooleanField(default=False) #Estado de la etapa (completa, incompleta)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='lecciones')


class Palabra(models.Model): #ya en SQL solo faltan los links
    palabra = models.CharField(max_length=50)
    leccion = models.ForeignKey('Leccion', on_delete=models.CASCADE, related_name='palabras')
    nueva = models.BooleanField(default=True)  # Ya vista o no vista
    ejemplos = models.TextField(default='')
    gesto = models.URLField(default='', blank=True)  # URL de la imagen o video en S3

    def __str__(self):
        return self.palabra


class Instruccion(models.Model): #ya en SQL
    TIPOS_INSTRUCCION = [
        ('seleccion', 'Selecciona el gesto correcto para {palabra}'),
        ('seleccion2', 'Selecciona el gesto correcto a la palanra resaltada'), #En este ejercicio se muestran los ejemplos
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