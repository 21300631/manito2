from django.http import JsonResponse    
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_POST
from .models import Palabra
from django.shortcuts import redirect

@csrf_exempt
@require_POST
def verificar_seleccion(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        ejercicio_actual = ejercicios[index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            request.session.modified = True
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'mensaje': '¡Ejercicio completado correctamente!'
                })
            return JsonResponse({
                'correcto': True,
                'redirect': True,
                'mensaje': '¡Correcto! Pasando al siguiente ejercicio...'
            })
            
        return JsonResponse({
            'correcto': False,
            'mensaje': 'Respuesta incorrecta. Intenta nuevamente.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_seleccion2(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        ejercicio_actual = ejercicios[index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            request.session.modified = True
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'mensaje': '¡Todos los ejercicios completados!'
                })
            return JsonResponse({
                'correcto': True,
                'redirect': True,
                'mensaje': '¡Correcto!'
            })
            
        return JsonResponse({
            'correcto': False,
            'mensaje': 'Esa no es la opción correcta.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_completar(request):
    try:
        opcion_id = int(request.POST.get("opcion_id"))
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        ejercicio_actual = ejercicios[index]
        palabra_correcta_id = ejercicio_actual['palabra']
        es_correcto = opcion_id == palabra_correcta_id
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            request.session.modified = True
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'mensaje': '¡Has completado todos los ejercicios!'
                })
            return JsonResponse({
                'correcto': True,
                'redirect': True,
                'mensaje': '¡Respuesta correcta!'
            })
            
        return JsonResponse({
            'correcto': False,
            'mensaje': 'No es la opción que completa correctamente la frase.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_escribir(request):
    try:
        respuesta_usuario = request.POST.get('respuesta_usuario', '').strip().lower()
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        ejercicio_actual = ejercicios[index]
        palabra_id = ejercicio_actual['palabra']
        palabra_correcta = Palabra.objects.get(id=palabra_id).palabra.strip().lower()
        es_correcto = respuesta_usuario == palabra_correcta
        
        if es_correcto:
            request.session['ejercicio_actual'] = index + 1
            request.session.modified = True
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'respuesta_correcta': palabra_correcta,
                    'mensaje': '¡Felicidades! Curso completado.'
                })
            return JsonResponse({
                'correcto': True,
                'redirect': True,
                'mensaje': '¡Perfecto!'
            })
            
        return JsonResponse({
            'correcto': False,
            'respuesta_correcta': palabra_correcta,
            'mensaje': f'La respuesta correcta es: {palabra_correcta}'
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
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        ejercicio_actual = ejercicios[index]
        palabra_correcta_id = ejercicio_actual['palabra']
        palabras_db = Palabra.objects.in_bulk()
        todos_correctos = True
        
        for par in pares:
            palabra_id = int(par.get('palabra_id'))
            gesto_id = int(par.get('gesto_id'))
            palabra_db = palabras_db.get(palabra_id)
            
            if not (palabra_db and palabra_db.id == gesto_id):
                todos_correctos = False
                break
                
        if todos_correctos:
            request.session['ejercicio_actual'] = index + 1
            request.session.modified = True
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'todos_correctos': True,
                    'completado': True,
                    'mensaje': '¡Emparejamiento perfecto! Curso terminado.'
                })
            return JsonResponse({
                'todos_correctos': True,
                'redirect': True,
                'mensaje': '¡Todo correcto!'
            })
            
        return JsonResponse({
            'todos_correctos': False,
            'mensaje': 'Algunos emparejamientos no son correctos.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_gesto(request):
    try:
        # Aquí normalmente validarías si el usuario hizo el gesto correctamente
        # Como es subjetivo, siempre lo marcamos como correcto
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        if index >= len(ejercicios):
            return JsonResponse({'completado': True})
            
        request.session['ejercicio_actual'] = index + 1
        request.session.modified = True
        
        if request.session['ejercicio_actual'] >= len(ejercicios):
            return JsonResponse({
                'correcto': True,
                'completado': True,
                'mensaje': '¡Has completado todos los ejercicios!'
            })
            
        return JsonResponse({
            'correcto': True,
            'redirect': True,
            'mensaje': '¡Bien hecho! Siguiente ejercicio...'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)