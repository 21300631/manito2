from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from registro.models import Profile
from django.contrib import messages

# Create your views here.
@login_required
def perfil(request):
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
    print(perfil.imagen.url)

    return render(request, 'perfil.html', contexto)

@login_required
def cambiar_foto_perfil(request):
    if request.method == 'POST':
        nueva_imagen = request.FILES.get('nueva_imagen')
        if nueva_imagen:
            perfil = Profile.objects.get(user=request.user)
            perfil.imagen = nueva_imagen
            perfil.save()
            messages.success(request, 'Foto de perfil actualizada correctamente')
            print("Imagen subida:", perfil.imagen.url)  # Esta ruta debe apuntar al S3
        else:
            messages.error(request, 'No se seleccionó ninguna imagen')
    return redirect('perfil')
