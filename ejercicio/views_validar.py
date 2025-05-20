from django.http import JsonResponse    
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_POST
from .models import Palabra

@csrf_exempt
@require_POST
def verificar_seleccion(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicio_actual = request.session['ejercicios'][index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        # Actualizar progreso si es correcto
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
        
        return JsonResponse({'correcto': es_correcto})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_seleccion2(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicio_actual = request.session['ejercicios'][index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            
        return JsonResponse({'correcto': es_correcto})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_completar(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicio_actual = request.session['ejercicios'][index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            
        return JsonResponse({'correcto': es_correcto})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_escribir(request):
    try:
        respuesta_usuario = request.POST.get('respuesta_usuario', '').strip().lower()
        index = request.session.get('ejercicio_actual', 0)
        ejercicio_actual = request.session['ejercicios'][index]
        palabra_id = ejercicio_actual['palabra']
        palabra_correcta = Palabra.objects.get(id=palabra_id).palabra.strip().lower()
        es_correcto = respuesta_usuario == palabra_correcta
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            
        return JsonResponse({
            'correcto': es_correcto,
            'mensaje': '¡Correcto!' if es_correcto else 'Intenta de nuevo.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@csrf_exempt
@require_POST
def verificar_emparejar(request):
    try:
        data = json.loads(request.body)
        pares = data.get('pares', [])
        index = request.session.get('ejercicio_actual', 0)
        ejercicio_actual = request.session['ejercicios'][index]
        palabra_correcta_id = ejercicio_actual['palabra']
        
        # Obtener todas las palabras y gestos correctos
        palabras_db = Palabra.objects.in_bulk()
        
        # Verificar todos los pares
        todos_correctos = True
        resultado = []
        
        for par in pares:
            palabra_id = int(par.get('palabra_id'))
            gesto_id = int(par.get('gesto_id'))
            
            # Verificar si el gesto corresponde a la palabra
            palabra_db = palabras_db.get(palabra_id)
            es_correcto = (palabra_db and palabra_db.id == gesto_id)
            
            if not es_correcto:
                todos_correctos = False
                
            resultado.append({
                'palabra_id': palabra_id,
                'gesto_id': gesto_id,
                'correcto': es_correcto
            })
        
        if todos_correctos:
            request.session['ejercicio_actual'] = index + 1
            
        return JsonResponse({
            'resultado': resultado,
            'todos_correctos': todos_correctos
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)