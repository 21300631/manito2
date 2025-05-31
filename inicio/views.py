from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from inicio.models import Notificacion
from django.shortcuts import render
from registro.models import Profile
from django.http import JsonResponse


@login_required
def inicioSesion(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)  # Obtiene el perfil del usuario
    notificaciones = Notificacion.objects.filter(receptor=request.user).order_by('-fecha')[:10]
    try:
        medalla = perfil.medalla  # Obtiene la medalla del usuario
    except Profile.DoesNotExist:
        medalla = None  # Si el usuario no tiene perfil, medalla será None
    contexto = {
            'usuario': usuario,
            'imagen': perfil.imagen,
            'medalla': perfil.medalla,
            'racha': perfil.racha,
            'puntos': perfil.puntos,
            'notificaciones': notificaciones
    }
    
    return render(request, 'inicio.html', contexto)	

@login_required
def puntosUsuario(request):
    user = request.user
    usuario = get_object_or_404(Profile, user=user)
    return JsonResponse({
        'puntos': usuario.puntos,
        'unlocked_stages':{
            'etapa1': True,
            'etapa2': usuario.puntos >= 6800,
            'etapa3': usuario.puntos >= 10200,
            'etapa4': usuario.puntos >= 16200,

        }
       
    })



