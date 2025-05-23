"""
URL configuration for manito project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('registro/', include('registro.urls')),
    path('login/', include('login.urls')),
    path('inicio/', include('inicio.urls')),
    path('calentamiento/', include('calentamiento.urls')),
    path('publicacion/', include('publicacion.urls')),
    path('ejercicio/', include('ejercicio.urls')),
    path('repaso/', include('repaso.urls')),
    path('lecciones/', include('lecciones.urls')),
    path('foro/', include('foro.urls')),
    path('perfil/', include('perfil.urls')),
    path('loteria/', include('loteria.urls')),
    path('desafio/', include('desafio.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Solo en desarrollo (DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)