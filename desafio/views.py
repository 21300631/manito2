from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra
import random
from manito.settings import MANITO_BUCKET_DOMAIN


# Create your views here.


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
    

def generarContrarreloj(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)

    palabras_usuario_ids = PalabraUsuario.objects.filter(usuario_id=perfil).values_list('palabra_id', flat=True)

    palabras_originales = list(Palabra.objects.filter(id__in=palabras_usuario_ids))

    random.shuffle(palabras_originales)

    palabras_filtradas = [
        p for p in palabras_originales
        if not str(p.gesto).lower().endswith('.mp4')
    ]

    imagenes = [p.gesto for p in palabras_filtradas]

    print("Username:", usuario.username)
    print("Profile ID:", perfil.user_id)
    print("Palabras (filtradas):", [p.palabra for p in palabras_filtradas])
    print("Gestos URLs (imágenes):", imagenes)

    context = {
        'palabras': palabras_filtradas, # Pasar la lista filtrada
        'imagenes': imagenes
    }
    return render(request, 'contrarreloj.html', context)
def generarRelacion(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)

    palabras_usuario_ids = PalabraUsuario.objects.filter(usuario_id=perfil).values_list('palabra_id', flat=True)
    palabras_originales = list(Palabra.objects.filter(id__in=palabras_usuario_ids))
    
    # Filtrar palabras sin video y mezclar
    palabras_filtradas = [
        p for p in palabras_originales
        if not str(p.gesto).lower().endswith('.mp4')
    ]
    random.shuffle(palabras_filtradas)
    
    # Tomar 10 palabras (5 pares correctos + 5 para mezclar)
    palabras_seleccionadas = palabras_filtradas[:10]
    
    # Preparar datos
    pares_correctos = [{
        'palabra': {'id': p.id, 'palabra': p.palabra},
        'imagen': {'id': p.id, 'url': p.gesto, 'palabra': p.palabra}
    } for p in palabras_seleccionadas]
    
    # Mezclar los pares pero manteniendo algunas relaciones correctas
    random.shuffle(pares_correctos)
    
    context = {
        'pares_correctos': pares_correctos[:5],  # 5 pares para mostrar inicialmente
        'pares_reserva': pares_correctos[5:10]     # 5 pares de reserva
    }
    return render(request, 'relacion.html', context)