from django.urls import path
from .views import perfil, cambiar_foto_perfil, cambiar_nombre, cambiar_tema, obtener_tema
# 

urlpatterns = [
    path('', perfil, name='perfil'),  # Cambia 'perfil' por el nombre de tu vista
    path('cambiar-foto/', cambiar_foto_perfil, name='cambiar_foto_perfil'),
    path('cambiar-nombre/', cambiar_nombre, name='cambiar_nombre'), 
    path("cambiar-tema/", cambiar_tema, name="cambiar_tema"),
    path('obtener-tema/', obtener_tema, name='obtener_tema'),  # Cambia 'obtener_tema' por el nombre de tu vista

]