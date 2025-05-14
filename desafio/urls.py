from .views import generarContrarreloj, generarMemorama, generarRelacion
from django.urls import path
# from .views_desafios import obtener_pares

urlpatterns = [
    path('contrarreloj/', generarContrarreloj, name='contrarreloj'),
    path('memorama/', generarMemorama, name='memorama'),
    path('relacion/', generarRelacion, name='relacion'),
    # path('obtener-pares/', obtener_pares, name='obtener-pares'),

]