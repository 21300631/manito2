from django.urls import path
from .views import   pagina, estadisticas, siguiente

urlpatterns = [
    path('', pagina, name='pagina'),
    path('estadisticas/', estadisticas, name='estadisticas'),
    path('siguiente/', siguiente, name='siguiente'),


]