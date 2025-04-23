from django.shortcuts import render, redirect
from registro.models import Profile 
from .models import Leccion, Palabra, Instruccion, PalabraUsuario
import random
from django.http import HttpResponseForbidden, HttpResponse
from manito.settings import MANITO_BUCKET_DOMAIN
import re
from django.utils.safestring import mark_safe

# Create your views here.
def eje1(request):
    return render(request, 'seleccion.html')

def eje2(request):
    return render(request, 'seleccion2.html')

def eje3(request):
    return render(request, 'emparejar.html')

def eje4(request):
    return render(request, 'completar.html')

def eje5(request):
    return render(request, 'escribir.html')

def eje6(request):
    return render(request, 'gesto.html')


def generarLeccion(request):
    # datos del usuario
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)

    leccion = int(request.GET.get('leccion_id', 0))  # o POST si decides

    # Validación: no puede entrar a lecciones mayores a su progreso
    if leccion > perfil.leccion:
        return HttpResponseForbidden("No tienes acceso a esta lección todavía.")
    # Obtiene la lección actual
    leccion_obj = Leccion.objects.get(id=leccion)

    # Toma 3 palabras de esa lección
    palabras_nuevas = leccion_obj.palabras.all()[:3]

    #obtener palabras


    if(PalabraUsuario.objects.filter(usuario=perfil).count() < 7):
        # si no hay suficientes de repaso, utiliza las mismas de la leccion para rellenar
        palabras_repaso = list(palabras_nuevas)

        while len(palabras_repaso) < 7:
            palabra_aleatoria = random.choice(palabras_nuevas)
            palabras_repaso.append(palabra_aleatoria)
    else: # si hay suficientes palabras de repaso, selecciona 7 aleatorias
        palabras_repaso = PalabraUsuario.objects.filter(usuario=perfil)
        palabras_repaso_aleatorias = random.sample(list(palabras_repaso), 7) if len(palabras_repaso) >= 7 else list(palabras_repaso)
    
    # instrucciones
    # Instrucciones
    instrucciones_repaso = Instruccion.objects.exclude(tipo='gesto')
    ejercicios = []

    # Palabras nuevas (tipo gesto)
    instruccion_gesto = Instruccion.objects.get(tipo='gesto')
    for palabra in palabras_nuevas:
        ejercicios.append({
            'palabra': palabra,
            'instruccion': instruccion_gesto,
            'texto_instruccion': instruccion_gesto.generar_texto(palabra.palabra)
        })

    # Palabras de repaso (otras instrucciones)
    for palabra in palabras_repaso:
        instruccion_aleatoria = random.choice(instrucciones_repaso)
        ejercicios.append({
            'palabra': palabra if hasattr(palabra, 'palabra') else palabra,
            'instruccion': instruccion_aleatoria,
            'texto_instruccion': instruccion_aleatoria.generar_texto(
                palabra.palabra if hasattr(palabra, 'palabra') else palabra
            )
        })

    # Mezclar los ejercicios
    random.shuffle(ejercicios)

    # Guardar en la sesión
    request.session['ejercicios'] = [
        {
            'palabra': ejercicio['palabra'].id,
            'instruccion': ejercicio['instruccion'].tipo,
            'texto': ejercicio['texto_instruccion']
        } for ejercicio in ejercicios
    ]
    request.session['ejercicio_actual'] = 0  # Comienza en el primero

    print("Ejercicios guardados en la sesión:", request.session['ejercicios'])

    return redirect('mostrar_ejercicio')

def mostrar_ejercicio(request):
    ejercicios = request.session.get('ejercicios', [])
    index = request.session.get('ejercicio_actual', 0)

    if index >= len(ejercicios):
        return render(request, "finalizado.html")

    actual = ejercicios[index]
    instruccion_tipo = actual['instruccion']

    if instruccion_tipo == 'emparejar':
        return redirect('ejercicio_emparejar')
    elif instruccion_tipo == 'seleccion':
        return redirect('ejercicio_seleccion')
    elif instruccion_tipo == 'escribir':
        return redirect('ejercicio_escribir')
    elif instruccion_tipo == 'gesto':
        return redirect('ejercicio_gesto')
    elif instruccion_tipo == 'seleccion2':
        return redirect('ejercicio_seleccion2')
    elif instruccion_tipo == 'completar':
        return redirect('ejercicio_completar')
    else:
        return HttpResponse("Tipo de instrucción no reconocido")


def siguiente_ejercicio(request):
    request.session['ejercicio_actual'] += 1
    return redirect('mostrar_ejercicio')

# ejercicios

def ejercicio_emparejar(request):
    print("Ejercicio Emparejar")
    ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]
    
    palabra_id = ejercicio_actual['palabra']
    palabra_obj = Palabra.objects.get(id=palabra_id)

    # Palabras distractoras
    palabras_distractoras = list(
        Palabra.objects.exclude(id=palabra_obj.id).order_by('?')[:2]
    )

    # Gestos distractores
    gestos_distractores = list(
        Palabra.objects.exclude(id=palabra_obj.id).order_by('?')[:2]
    )

    # Juntas las 3 palabras (1 correcta + 2 distractoras) y las mezclas
    opciones_palabras = palabras_distractoras + [palabra_obj]
    random.shuffle(opciones_palabras)

    # Igual para gestos
    opciones_gestos = gestos_distractores + [palabra_obj]
    random.shuffle(opciones_gestos)

    # Construir URLs completas para los gestos
    opciones_gestos_con_url = []
    for gesto_obj in opciones_gestos:
        es_video = str(gesto_obj.gesto).lower().endswith('.mp4')
        opciones_gestos_con_url.append({
            'objeto': gesto_obj,
            'url': f"{MANITO_BUCKET_DOMAIN}/{gesto_obj.gesto}",
            'es_video': es_video
        })

    context = {
        'theme': request.session.get('theme', 'claro'),
        'texto_instruccion': f"Empareja las palabras con su respectivo gesto",
        'palabras': opciones_palabras,
        'gestos': opciones_gestos_con_url,  # Usamos la nueva lista con URLs
        'palabra_correcta': palabra_obj.palabra,
        'gesto_correcto': f"{MANITO_BUCKET_DOMAIN}/{palabra_obj.gesto}",
    }
    
    print("Palabras:", [p.palabra for p in opciones_palabras])
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


# Validacion de ejercicios

