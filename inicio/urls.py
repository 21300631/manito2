from django.urls import path
from .views import inicioSesion

urlpatterns = [
    path('', inicioSesion)
]