from django.shortcuts import render, redirect
from .models import Publicacion
from django.views.decorators.csrf import csrf_exempt
from registro.models import Profile
from django.http import HttpResponse

MAX_IMAGE_SIZE = 500 * 1024  # 500 KB
MAX_VIDEO_SIZE = 10 * 1024 * 1024  # 10 MB

def pagina(request):
    edad = request.user.profile.edad
    return render(request, 'publicacionNueva.html', {'edad':edad})

@csrf_exempt  
def nueva_publicacion(request):
    if request.method == "POST":
        titulo = request.POST.get("titulo")
        contenido = request.POST.get("contenido")
        media = request.FILES.get("media")  # Puede ser imagen o video
        hashtags = request.POST.get("hashtags")

        usuario = request.user  
        profile = Profile.objects.get(user=usuario)  
        anios = profile.edad
        
        context = {
            'titulo': titulo,
            'contenido': contenido,
            'hashtags': hashtags,
            'edad': anios
        }

        # Validar campos obligatorios
        if not (titulo and contenido and hashtags):
            context['error'] = 'Faltan campos obligatorios'
            return render(request, 'publicacionNueva.html', context)

     
       
        # Guardar la publicación
        nueva_publicacion = Publicacion.objects.create(
            titulo=titulo,
            contenido=contenido,
            imagen=media,  # en tu modelo sigue funcionando aunque el nombre sea imagen
            hashtags=hashtags,
            usuario=profile
        )
        return redirect('/publicacion/')
    
    return HttpResponse("Método no permitido", status=405)
