from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages

from publicacion.models import Publicacion, Comentario
from registro.models import Profile
from inicio.models import Notificacion
from perfil.models import Insignia, Logro


def foro(request):
    publicaciones = Publicacion.objects.all().order_by("-fecha")

    if request.user.is_authenticated:
        profile = getattr(request.user, "profile", None)
        if profile:
            publicaciones_usuario = Publicacion.objects.filter(usuario=profile)
            if publicaciones_usuario.filter(likes__count__gte=5).exists():
                try:
                    insignia_popular = Insignia.objects.get(imagen="insignias/popular.png")
                    logro_existente = Logro.objects.filter(usuario=profile, insignia=insignia_popular).exists()
                    if not logro_existente:
                        messages.success(request, "¡Vaya que popular!")
                except Insignia.DoesNotExist:
                    messages.error(request, "La insignia no existe")

    return render(request, "foro.html", {
        "publicaciones": publicaciones,
        "theme": request.session.get("theme", "light"),
    })


@login_required
def dar_like(request, publicacion_id):
    if request.method == "POST":
        profile = getattr(request.user, "profile", None)
        if not profile:
            return JsonResponse({'error': 'Perfil no encontrado'}, status=400)

        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        liked = False

        if profile in publicacion.likes.all():
            publicacion.likes.remove(profile)
        else:
            publicacion.likes.add(profile)
            liked = True

            if profile != publicacion.usuario:  # comparar Profile vs Profile
                Notificacion.objects.create(
                    emisor=request.user,
                    receptor=publicacion.usuario.user,
                    tipo='like',
                    publicacion=publicacion
                )

        return JsonResponse({
            'total_likes': publicacion.likes.count(),
            'liked': liked
        })

    return JsonResponse({'error': 'Método no permitido'}, status=405)


@login_required
def reportar(request, publicacion_id):
    if request.method == "POST":
        profile = getattr(request.user, "profile", None)
        if not profile:
            return JsonResponse({'error': 'Perfil no encontrado'}, status=400)

        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        eliminada = False

        if profile not in publicacion.reportes.all():
            publicacion.reportes.add(profile)

            if profile != publicacion.usuario:
                Notificacion.objects.create(
                    emisor=request.user,
                    receptor=publicacion.usuario.user,
                    tipo='reporte',
                    publicacion=publicacion
                )

        if publicacion.reportes.count() >= 15:
            publicacion.delete()
            eliminada = True

        return JsonResponse({
            'total_reportes': 0 if eliminada else publicacion.reportes.count(),
            'eliminada': eliminada
        })

    return JsonResponse({'error': 'Método no permitido'}, status=405)


@login_required
def agregar_comentario(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    profile = getattr(request.user, "profile", None)

    if not profile:
        messages.error(request, 'No se encontró tu perfil.')
        return redirect("foro")

    if request.method == "POST":
        contenido = request.POST.get("contenido")
        archivo = request.FILES.get("archivo")

        # Validar tipo de archivo
        if archivo:
            ALLOWED_TYPES = [
                'image/jpeg', 'image/png', 'image/gif',
                'video/mp4', 'video/webm', 'video/ogg'
            ]
            if archivo.content_type not in ALLOWED_TYPES:
                messages.error(request, 'Tipo de archivo no permitido.')
                return redirect("foro")

        if contenido:
            Comentario.objects.create(
                publicacion=publicacion,
                usuario=profile,
                contenido=contenido,
                archivo=archivo
            )

            if profile != publicacion.usuario:
                Notificacion.objects.create(
                    emisor=request.user,
                    receptor=publicacion.usuario.user,
                    tipo='comentario',
                    publicacion=publicacion
                )

    return redirect("foro")


@login_required
def vista_alguna(request):
    perfil = getattr(request.user, "profile", None)
    return render(request, 'foro.html', {'theme': perfil.theme if perfil else 'light'})
