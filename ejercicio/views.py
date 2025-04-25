from django.shortcuts import render, redirect
from registro.models import Profile 
from .models import Leccion,  Instruccion, PalabraUsuario
import random
from django.http import HttpResponseForbidden, HttpResponse


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

