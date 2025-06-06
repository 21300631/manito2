from .views import generarContrarreloj, generarMemorama, generarRelacion, mostrar_ejercicio_contrarreloj, siguiente_ejercicio_contrarreloj, resultado_contrarreloj
from django.urls import path
# from .views_desafios import obtener_pares

urlpatterns = [
    path('contrarreloj/', generarContrarreloj, name='contrarreloj'),
    path('memorama/', generarMemorama, name='memorama'),
    path('relacion/', generarRelacion, name='relacion'),
    # path('obtener-pares/', obtener_pares, name='obtener-pares'),

    path('ejercicio/', mostrar_ejercicio_contrarreloj, name='mostrar_ejercicio_contrarreloj'),
    path('siguiente/', siguiente_ejercicio_contrarreloj, name='siguiente_ejercicio_contrarreloj'),
    path('resultado/', resultado_contrarreloj, name='resultado_contrarreloj'),
]