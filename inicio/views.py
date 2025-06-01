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
    
    # Definir el número máximo de lecciones por etapa
    etapas_lecciones = {
        'etapa1': 38,
        'etapa2': 22,
        'etapa3': 55,
        'etapa4': 55
    }
    
    # Verificar si ha completado las lecciones de la etapa anterior
    etapa2_completa = usuario.puntos >= 6800 and usuario.leccion >= etapas_lecciones['etapa1']
    etapa3_completa = usuario.puntos >= 10200 and usuario.leccion >= sum(etapas_lecciones[e] for e in ['etapa1', 'etapa2'])
    etapa4_completa = usuario.puntos >= 16200 and usuario.leccion >= sum(etapas_lecciones[e] for e in ['etapa1', 'etapa2', 'etapa3'])
    
    return JsonResponse({
        'puntos': usuario.puntos,
        'leccion_actual': usuario.leccion,
        'unlocked_stages': {
            'etapa1': True,  # Siempre disponible
            'etapa2': etapa2_completa,
            'etapa3': etapa3_completa,
            'etapa4': etapa4_completa,
        },
        'etapas_lecciones': etapas_lecciones
    })