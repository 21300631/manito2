from .views import contrarreloj, memorama, relacion
from django.urls import path

urlpatterns = [
    path('contrarreloj/', contrarreloj, name='contrarreloj'),
    path('memorama/', memorama, name='memorama'),
    path('relacion/', relacion, name='relacion'),
]