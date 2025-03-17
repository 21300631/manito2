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
            'medalla': perfil.medalla,
            'racha': perfil.racha,
            'puntos': perfil.puntos,
    }
    return render(request, 'inicio.html', contexto)	

# from django.shortcuts import render
# from django.contrib.auth.decorators import login_required
# from registro.models import Profile
# from django.contrib.auth.models import User



# def inicioSesion(request):
#     if request.user.is_authenticated:
#         perfil = Profile.objects.get(usuario=request.user)
#         contexto = {
#             'nombre_usuario': request.user.fitst_name,
#             'medalla': perfil.medalla,
#             'dias_racha': perfil.dias_racha,
#         }
#     else:
#         contexto = {}
#     return render(request, 'inicio.html')	

