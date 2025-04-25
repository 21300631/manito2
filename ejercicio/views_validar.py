from django.http import JsonResponse    
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_POST
from .models import Palabra
# Validacion de ejercicios

@csrf_exempt
def verificar_seleccion(request):
    if request.method == "POST":
        opcion_id = int(request.POST.get("opcion_id"))
        ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        return JsonResponse({'correcto': es_correcto})
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def verificar_seleccion2(request):
    if request.method == "POST":
        opcion_id = int(request.POST.get("opcion_id"))
        ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        return JsonResponse({'correcto': es_correcto})
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def verificar_completar(request):
    if request.method == "POST":
        opcion_id = int(request.POST.get("opcion_id"))
        ejercicio_actual = request.session['ejercicios'][request.session.get('progreso', 0)]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        return JsonResponse({'correcto': es_correcto})
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@require_POST
def verificar_escribir(request):
    respuesta_usuario = request.POST.get('respuesta_usuario', '').strip().lower()

    progreso = request.session.get('progreso', 0)
    ejercicio_actual = request.session['ejercicios'][progreso]
    palabra_id = ejercicio_actual['palabra']
    
    from .models import Palabra
    palabra_correcta = Palabra.objects.get(id=palabra_id).palabra.strip().lower()

    es_correcto = respuesta_usuario == palabra_correcta

    return JsonResponse({
        'correcto': es_correcto,
        'mensaje': '¡Correcto!' if es_correcto else 'Intenta de nuevo.'
    })

@csrf_exempt
def verificar_emparejar(request):
    if request.method == 'POST':
        try:
            datos = json.loads(request.body)
            pares = datos.get('pares', [])
            resultado = []

            # Ejemplo de verificación
            for par in pares:
                palabra_id = par.get('palabra_id')
                gesto_id = par.get('gesto_id')

                # Aquí deberías hacer una comparación real con tu lógica:
                es_correcto = palabra_id == gesto_id  # Suponiendo que IDs iguales son correctos

                resultado.append({
                    'palabra_id': palabra_id,
                    'gesto_id': gesto_id,
                    'correcto': es_correcto
                })

            return JsonResponse({'resultado': resultado})
        except Exception as e:
            return JsonResponse({'error': str(e)})

