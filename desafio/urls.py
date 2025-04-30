from .views import contrarreloj, generarMemorama, relacion
from django.urls import path

urlpatterns = [
    path('contrarreloj/', contrarreloj, name='contrarreloj'),
    path('memorama/', generarMemorama, name='memorama'),
    path('relacion/', relacion, name='relacion'),
]