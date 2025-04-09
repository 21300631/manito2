from django.shortcuts import render
from django.views.generic import ListView
# from django.contrib.auth.decorators import login_required
from publicacion.models import Publicacion, Comentario
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from registro.models import Profile
# from .forms import ComentarioForm


# Create your views here.
def foro(request):
    publicaciones = Publicacion.objects.all().order_by("-fecha")  # Ordenar por fecha
    
    return render(request, "foro.html", {"publicaciones": publicaciones})

@login_required
def dar_like(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    if request.user in publicacion.likes.all():
        publicacion.likes.remove(request.user.profile)  # Si ya le dio like, lo quita
    else:
        publicacion.likes.add(request.user.profile)  # Agrega el like
    return redirect('foro')

@login_required
def reportar(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    if request.user not in publicacion.reportes.all():
        publicacion.reportes.add(request.user.profile)  # Agrega el reporte si no lo ha hecho antes
    if publicacion.reportes.count >= 20 :
        publicacion.delete
        print(publicacion_id)
        print("Se elimino")
        
    return redirect('foro')

@login_required
def agregar_comentario(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)

    if request.method == "POST":
        contenido = request.POST.get("contenido")
        archivo = request.FILES.get("archivo")

        if contenido:  # Asegurar que no se envíe un comentario vacío
            Comentario.objects.create(
                publicacion=publicacion,
                usuario=request.user.profile,  # Asumiendo que tienes un `Profile` relacionado con `User`
                contenido=contenido,
                archivo=archivo
            )

    return redirect("foro")  # Redirigir al foro después de comentar

def vista_alguna(request):
    perfil = Profile.objects.get(user=request.user)
    return render(request, 'foro.html', {'theme': perfil.theme})