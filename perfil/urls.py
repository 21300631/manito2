from django.urls import path
from django.contrib.auth.views import LogoutView
from .views import perfil, cambiar_foto_perfil, cambiar_nombre, cambiar_tema, obtener_tema
from login.views import login_usuario
# 

urlpatterns = [
    path('', perfil, name='perfil'), 
    path('cambiar-foto/', cambiar_foto_perfil, name='cambiar_foto_perfil'),
    path('cambiar-nombre/', cambiar_nombre, name='cambiar_nombre'), 
    path("cambiar-tema/", cambiar_tema, name="cambiar_tema"),
    path('obtener-tema/', obtener_tema, name='obtener_tema'),
    path('logout/', LogoutView.as_view(next_page='login'), name='logout'),
    path('login/', login_usuario, name='login'), 

]