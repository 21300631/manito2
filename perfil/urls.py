from django.urls import path
from .views import perfil, cambiar_foto_perfil
# 

urlpatterns = [
    path('', perfil, name='perfil'),  # Cambia 'perfil' por el nombre de tu vista
    path('cambiar-foto/', cambiar_foto_perfil, name='cambiar_foto_perfil'),

]