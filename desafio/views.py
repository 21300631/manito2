from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra
import random
from manito.settings import MANITO_BUCKET_DOMAIN


# Create your views here.

def generarMemorama(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)

    # A veces da menos pares entonces tenemos que llamarlo despues de verificar si es video o imagen

    palabras_usuario = PalabraUsuario.objects.filter(usuario_id=perfil)[:6]

    # random.shuffle(palabras_usuario)

    pares = []
    for p in palabras_usuario:
        palabra = p.palabra
        gesto = palabra.gesto
        es_video = str(gesto).lower().endswith('.mp4')

        if not es_video:
            pares.append({
                'tipo': 'imagen',
                'contenido': f"{MANITO_BUCKET_DOMAIN}/{gesto}",
                'es_video': False,
                'id': palabra.id,
                'texto': palabra.palabra  # para el alt
            })

            pares.append({
                'tipo': 'palabra',
                'contenido': palabra.palabra,
                'es_video': False,
                'id': palabra.id
            })


    random.shuffle(pares)
    
    
    for i in range(len(pares)):
        print("Elemento {}: {}".format(i, pares[i]))

    return render(request, 'memorama.html', {
        'cartas': pares
    })

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

    random.shuffle(palabras_originales)
    
    # Filtrar palabras sin video y mezclar
    palabras_filtradas = [
        p for p in palabras_originales
        if not str(p.gesto).lower().endswith('.mp4')
    ][:20]
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
        'pares_correctos': pares_correctos[:15],  # 5 pares para mostrar inicialmente
        'pares_reserva': pares_correctos[15:]     # 5 pares de reserva
    }
    return render(request, 'relacion.html', context)