from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from registro.models import Profile

@login_required
def inicioSesion(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)  # Obtiene el perfil del usuario
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
    }
    
    print(perfil.imagen.url)  # ¿Devuelve una ruta válida?
    print(perfil.racha)      # ¿Tiene un valor numérico?
    print(perfil.medalla)    # ¿Existe la medalla?
    return render(request, 'inicio.html', contexto)	


