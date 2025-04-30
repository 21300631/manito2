from .views import generarContrarreloj, generarMemorama, generarRelacion
from django.urls import path

urlpatterns = [
    path('contrarreloj/', generarContrarreloj, name='contrarreloj'),
    path('memorama/', generarMemorama, name='memorama'),
    path('relacion/', generarRelacion, name='relacion'),
]