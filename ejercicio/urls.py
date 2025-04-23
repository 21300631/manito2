from django.urls import path
from .views import  eje1, eje2, eje3, eje4, eje5, eje6, generarLeccion, siguiente_ejercicio, mostrar_ejercicio
from .views import ejercicio_emparejar, ejercicio_completar, ejercicio_escribir, ejercicio_gesto, ejercicio_seleccion, ejercicio_seleccion2
urlpatterns = [
    path('e01/', eje1),
    path('e02/', eje2),
    path('e03/', eje3),
    path('e04/', eje4),
    path('e05/', eje5),
    path('e06/', eje6),  
    path('generar/', generarLeccion, name='generar_leccion'),  # Cambié la URL a 'generarLeccion' para evitar conflictos con la vista
    path('siguiente/', siguiente_ejercicio, name='siguiente_ejercicio'),  
    path('mostrar/', mostrar_ejercicio, name='mostrar_ejercicio'),
    path('emparejar/', ejercicio_emparejar, name='ejercicio_emparejar'),
    path('completar/', ejercicio_completar, name='ejercicio_completar'),
    path('escribir/', ejercicio_escribir, name='ejercicio_escribir'),
    path('gesto/', ejercicio_gesto, name='ejercicio_gesto'),
    path('seleccion/', ejercicio_seleccion, name='ejercicio_seleccion'),
    path('seleccion2/', ejercicio_seleccion2, name='ejercicio_seleccion2'),

]