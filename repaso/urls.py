from django.urls import path
from .views import   pagina, estadisticas

urlpatterns = [
    path('', pagina),
    path('estadisticas/', estadisticas, name='estadisticas'),


]