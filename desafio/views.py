from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra
import random
from manito.settings import MANITO_BUCKET_DOMAIN


# Create your views here.

def contrarreloj(request):
    return render(request, 'contrarreloj.html')

def memorama(request):
    return render(request, 'memorama.html')

def relacion(request):
    return render(request, 'relacion.html')

def generarMemorama(request):
    usuario = request.user
    perfil = Profile.objects.get(user = usuario)

    palabras_ids = list(
        PalabraUsuario.objects.filter(usuario_id = perfil).order_by('?')[:6]
    )

    palabras = list()

    for p in palabras_ids:
        palabra_obj = Palabra.objects.get(id = p.palabra.id)
        palabras.append(palabra_obj)

    # for p in palabras_ids:
    #     palabra_obj = PalabraUsuario.objects.get(id = p.id)
    #     palabras.append(palabra_obj)

    random.shuffle(palabras)

    opciones_gestos_con_url = []
    for gesto_obj in palabras:
        es_video = str(gesto_obj.gesto).lower().endswith('.mp4')
        opciones_gestos_con_url.append({
            'objeto': gesto_obj,
            'url': f"{MANITO_BUCKET_DOMAIN}/{gesto_obj.gesto}",
            'es_video': es_video
        })

    print("Username:", usuario.username)

    print("Profile ID: ", perfil.user_id)
    print("Palabras:", [p.palabra for p in palabras])
    print("Gestos URLs:", opciones_gestos_con_url)

    return render(request, 'memorama.html')
    