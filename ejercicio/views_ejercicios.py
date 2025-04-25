from manito.settings import MANITO_BUCKET_DOMAIN
import re
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.shortcuts import render, redirect
from .models import Palabra
import random
from registro.models import Profile
from .models import PalabraUsuario


def ejercicio_emparejar(request):
    print("Ejercicio Selección")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]

    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)
    user = request.user
    perfil = Profile.objects.get(user=user)

    if PalabraUsuario.objects.filter(usuario=perfil).count() < 2:
        # si no hay suficientes de repaso, utiliza las mismas de la leccion para rellenar
        palabras_usuario = list(
            Palabra.objects.filter(leccion=1).exclude(id=palabra_obj.id).order_by('?')[:2]
        )
    else:
        palabras_usuario  = list(
            PalabraUsuario.objects.exclude(id=palabra_obj.id).order_by('?')[:2]
        )

    opciones = palabras_usuario + [palabra_obj]

    random.shuffle(opciones)

    opciones_gestos_con_url = []
    for gesto_obj in opciones:
        es_video = str(gesto_obj.gesto).lower().endswith('.mp4')
        opciones_gestos_con_url.append({
            'objeto': gesto_obj,
            'url': f"{MANITO_BUCKET_DOMAIN}/{gesto_obj.gesto}",
            'es_video': es_video
        })

    context = {
        'theme': request.session.get('theme', 'claro'),
        'texto_instruccion': f"Empareja las palabras con su respectivo gesto",
        'palabras': opciones,
        'gestos': opciones_gestos_con_url,  # Usamos la nueva lista con URLs
        'palabra_correcta': palabra_obj.palabra,
        'gesto_correcto': f"{MANITO_BUCKET_DOMAIN}/{palabra_obj.gesto}",
    }
    print("Leccion:", [l.leccion for l in opciones])
    print("Palabras:", [p.palabra for p in opciones])
    print("Gestos URLs:", [g['url'] for g in opciones_gestos_con_url])
    return render(request, 'emparejar.html', context)

def ejercicio_seleccion(request):
    print("Ejercicio Selección")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]

    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)

    # Distractores (otras palabras)
    gestos_distractores = list(
        Palabra.objects.exclude(id=palabra_obj.id).order_by('?')[:2]
    )

    # Opciones mezcladas
    opciones = gestos_distractores + [palabra_obj]
    random.shuffle(opciones)

    # Creamos una lista de opciones con URL completa y tipo (imagen o video)
    opciones_data = []
    for opcion in opciones:
        url = f"{MANITO_BUCKET_DOMAIN}/{opcion.gesto}"
        es_video = opcion.gesto.lower().endswith('.mp4')
        opciones_data.append({
            'id': opcion.id,
            'palabra': opcion.palabra,
            'url': url,
            'es_video': es_video,
        })

    context = {
        'theme': 'claro',  # o 'oscuro'
        'texto_instruccion': f"Selecciona el gesto correcto para: {palabra_obj.palabra}",
        'opciones': opciones_data,
        'palabra_correcta_id': palabra_obj.id,
    }
    print("Opciones:", opciones_data)
    return render(request, 'seleccion.html', context)

def ejercicio_seleccion2(request):
    print("Ejercicio Selección 2")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]

    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)

    # Obtener ejemplos como lista
    ejemplos_raw = palabra_obj.ejemplos.split(" - ")

    # Resaltar la palabra objetivo en los ejemplos
    palabra_resaltada = palabra_obj.palabra
    ejemplos_resaltados = []
    for ejemplo in ejemplos_raw:
        resaltado = re.sub(
            fr'({re.escape(palabra_resaltada)})',
            r'<span class="resaltado">\1</span>',
            ejemplo,
            flags=re.IGNORECASE
        )
        ejemplos_resaltados.append(mark_safe(resaltado))  # Mark safe para permitir HTML

    # Distractores
    distractores = list(Palabra.objects.exclude(id=palabra_obj.id).order_by('?')[:2])

    # Opciones mezcladas
    opciones = distractores + [palabra_obj]
    random.shuffle(opciones)

    # Preparar URLs y tipo de archivo
    opciones_data = []
    for opcion in opciones:
        url = f"{MANITO_BUCKET_DOMAIN}/{opcion.gesto}"
        es_video = opcion.gesto.lower().endswith('.mp4')
        opciones_data.append({
            'id': opcion.id,
            'palabra': opcion.palabra,
            'url': url,
            'es_video': es_video,
        })

    context = {
        'theme': 'claro',
        'texto_instruccion': "Selecciona el gesto correcto a la palabra resaltada",
        'ejemplos': ejemplos_resaltados,
        'opciones': opciones_data,
        'palabra_correcta_id': palabra_obj.id,
    }

    return render(request, 'seleccion2.html', context)


def ejercicio_completar(request):
    print("Ejercicio Completar")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]

    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)

    # Frase con espacio en blanco
    frase_completar = palabra_obj.frase

    # Gestos distractores
    gestos_distractores = list(
        Palabra.objects.exclude(id=palabra_obj.id).order_by('?')[:2]
    )

    # Opciones mezcladas
    opciones = gestos_distractores + [palabra_obj]
    random.shuffle(opciones)

    # Agregamos URLs y tipo (video o imagen)
    opciones_data = []
    for opcion in opciones:
        url = f"{MANITO_BUCKET_DOMAIN}/{opcion.gesto}"
        es_video = opcion.gesto.lower().endswith('.mp4')
        opciones_data.append({
            'id': opcion.id,
            'palabra': opcion.palabra,
            'url': url,
            'es_video': es_video,
        })

    context = {
        'theme': 'claro',
        'texto_instruccion': "Selecciona el gesto que completa la frase:",
        'frase_completar': frase_completar,
        'opciones': opciones_data,
        'palabra_correcta_id': palabra_obj.id,
    }

    return render(request, 'completar.html', context)


def ejercicio_escribir(request):
    print("Ejercicio Escribir")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]
    
    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)

    archivo_url = f"{MANITO_BUCKET_DOMAIN}/{palabra_obj.gesto}"
    es_video = palabra_obj.gesto.lower().endswith('.mp4')

    context = {
        'theme': 'claro',
        'texto_instruccion': "Escribe la palabra que corresponde al gesto",
        'gesto_url': archivo_url,
        'es_video': es_video,
        'palabra_correcta': palabra_obj.palabra,  # por si lo necesitas validar
    }

    print("Gesto URL:", archivo_url)
    return render(request, 'escribir.html', context)


def ejercicio_gesto(request):
    print("Ejercicio Gesto")
    ejercicio = request.session.get('ejercicio_actual')

    if not ejercicio:
        return redirect('mostrar_ejercicio')

    palabra_id = ejercicio
    palabra = Palabra.objects.get(id=palabra_id)

    # Suponiendo que estás guardando el archivo en S3 con ruta pública
    archivo_url = f"{MANITO_BUCKET_DOMAIN}/{palabra.gesto}"

    contexto = {
        'texto_instruccion': f"Realiza el gesto correspondiente a la palabra: {palabra.palabra}",
        'archivo': archivo_url,
        'video': palabra.gesto.lower().endswith('.mp4'),  # Si es un video, puedes usarlo directamente
        'theme': request.session.get('theme', 'light'),
    }

    print("Url:", archivo_url)

    return render(request, 'gesto.html', contexto)

