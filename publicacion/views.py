from django.shortcuts import render, redirect
from .models import Publicacion
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from registro.models import Profile
from django.http import HttpResponse


# Create your views here.
def pagina(request):
    return render(request, 'publicacionNueva.html')

@csrf_exempt  
def nueva_publicacion(request):
    if request.method == "POST":
        print(request.POST)  # Muestra los datos en la consola
        titulo = request.POST.get("titulo")
        contenido = request.POST.get("contenido")
        imagen = request.FILES.get("imagen")
        hashtags = request.POST.get("hashtags")

        usuario = request.user  # Obtener el usuario logueado
        profile = Profile.objects.get(user=usuario)  # Obtener el perfil asociado al usuario
        
        nueva_publicacion = Publicacion.objects.create(
            titulo=titulo,
            contenido=contenido,
            imagen=imagen,
            hashtags=hashtags,
            usuario=profile
        )
        return redirect('/publicacion/')
    return HttpResponse("Método no permitido", status=405)



        


