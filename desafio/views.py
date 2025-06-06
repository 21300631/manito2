from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra
import random
from manito.settings import MANITO_BUCKET_DOMAIN
import time
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

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


@login_required
def generarContrarreloj(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)
    
    # Obtener palabras del usuario excluyendo videos
    palabras_usuario_ids = PalabraUsuario.objects.filter(usuario_id=perfil).values_list('palabra_id', flat=True)
    palabras_filtradas = list(Palabra.objects.filter(id__in=palabras_usuario_ids).exclude(gesto__iendswith='.mp4'))
    
    if not palabras_filtradas:
        return render(request, 'error.html', {'message': 'No tienes palabras disponibles para el desafío'})
    
    random.shuffle(palabras_filtradas)
    
    # Guardar la lista de palabras en la sesión
    request.session['palabras_contrarreloj'] = [p.id for p in palabras_filtradas]
    request.session['indice_palabra_actual'] = 0
    request.session['puntaje_contrarreloj'] = 0
    request.session['tiempo_inicio'] = time.time()
    
    # Redirigir al primer ejercicio
    return redirect('mostrar_ejercicio_contrarreloj')


def mostrar_ejercicio_contrarreloj(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    # Obtener datos de la sesión
    palabras_ids = request.session.get('palabras_contrarreloj', []) #numero de ejercicios
    indice_actual = request.session.get('indice_palabra_actual', 0) #ejercicio actual
    
    print(f"Ejercicio Contrarreloj - Índice: {indice_actual + 1}, Total Palabras: {len(palabras_ids)}")  # Debug


    if indice_actual >= len(palabras_ids):
        return redirect('resultado_contrarreloj')
    
    palabra_actual = Palabra.objects.get(id=palabras_ids[indice_actual])
    
    archivo_url = f"{MANITO_BUCKET_DOMAIN}/{palabra_actual.gesto}"
    
    print("Gesto URL:", archivo_url)
    
    context = {
        'archivo': archivo_url,
        'theme': request.session.get('theme', 'claro'),
        'palabra_correcta': palabra_actual.palabra,  # Asegúrate de usar 'palabra_correcta' aquí
        'tiempo_restante': 180,
        'indice_actual': indice_actual,
        'total_palabras': len(palabras_ids),
        # No necesitas pasar json_url si construyes la URL en el template
    }
    
    return render(request, 'contrarreloj.html', context)


@csrf_exempt
def siguiente_ejercicio_contrarreloj(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'No autenticado'})
    
    if request.method == 'POST':
        # Actualizar puntaje si la respuesta fue correcta
        es_correcto = request.POST.get('es_correcto', 'false') == 'true'
        if es_correcto:
            request.session['puntaje_contrarreloj'] = request.session.get('puntaje_contrarreloj', 0) + 1
        
        # Avanzar al siguiente ejercicio
        request.session['indice_palabra_actual'] = request.session.get('indice_palabra_actual', 0) + 1
        
        return JsonResponse({'status': 'success'})
    
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'})

def resultado_contrarreloj(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    # Calcular tiempo transcurrido
    tiempo_inicio = request.session.get('tiempo_inicio', time.time())
    tiempo_transcurrido = time.time() - tiempo_inicio
    
    # Obtener resultados
    puntaje = request.session.get('puntaje_contrarreloj', 0)
    total_palabras = len(request.session.get('palabras_contrarreloj', []))
    
    # Limpiar la sesión
    for key in ['palabras_contrarreloj', 'indice_palabra_actual', 'puntaje_contrarreloj', 'tiempo_inicio']:
        if key in request.session:
            del request.session[key]
    
    context = {
        'puntaje': puntaje,
        'total_palabras': total_palabras,
        'tiempo_transcurrido': round(tiempo_transcurrido, 2),
        'porcentaje': round((puntaje / total_palabras) * 100, 2) if total_palabras > 0 else 0
    }
    
    return render(request, 'resultado_contrarreloj.html', context)
