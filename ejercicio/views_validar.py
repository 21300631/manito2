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
            # Actualizar progreso

            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'redirect_url': '/ejercicio/finalizado/',  # URL explícita
                })
            return JsonResponse({
                'correcto': True,
                'redirect_url': '/ejercicio/siguiente/',  # URL explícita en lugar de True
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
            # Actualizar progreso y contador
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'redirect_url': '/ejercicio/finalizado/',  # URL explícita
                })
            return JsonResponse({
                'correcto': True,
                'redirect_url': '/ejercicio/siguiente/',  # URL explícita en lugar de True
            })
            
        return JsonResponse({
            'correcto': False,
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
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'correcto': True,
                    'completado': True,
                    'redirect_url': '/ejercicio/finalizado/',  # URL explícita
                })
            return JsonResponse({
                'correcto': True,
                'redirect': '/ejercicio/siguiente/',  # URL explícita
            })
            
        return JsonResponse({
            'correcto': False,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verificar_escribir(request):
    try:
        respuesta = request.POST.get('respuesta_usuario', '').strip().lower()
        index = request.session.get('ejercicio_actual', 0)
        ejercicios = request.session.get('ejercicios', [])
        
        ejercicio_actual = ejercicios[index]
        palabra = Palabra.objects.get(id=ejercicio_actual['palabra'])
        es_correcto = respuesta == palabra.palabra.lower()
        
        if es_correcto:
            # Actualizar progreso en sesión
            
            return JsonResponse({
                'correcto': True,
                'redirect_url': '/ejercicio/siguiente/',  # URL explícita
                'completado': request.session['ejercicio_actual'] >= len(ejercicios),
                'mensaje': '¡Respuesta correcta!'
            })
            
        return JsonResponse({
            'correcto': False,
            'mensaje': f'Incorrecto. '
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
            
            if request.session['ejercicio_actual'] >= len(ejercicios):
                return JsonResponse({
                    'todos_correctos': True,
                    'completado': True,
                    'redirect_url': '/ejercicio/finalizado/',  # URL explícita

                    'mensaje': '¡Emparejamiento perfecto! Curso terminado.'
                })
            return JsonResponse({
                'todos_correctos': True,
                'redirect': '/ejercicio/siguiente/',  # URL explícita
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
        request.session['progreso'] = min(request.session['progreso'] + 10, 100)
            
        request.session.modified = True
        
        if request.session['ejercicio_actual'] >= len(ejercicios):
            return JsonResponse({
                'correcto': True,
                'completado': True,
                'mensaje': '¡Has completado todos los ejercicios!'

            })
            
        return JsonResponse({
            'correcto': True,
            'redirect': '/ejercicio/siguiente/',  # URL explícita
            'mensaje': '¡Bien hecho! Siguiente ejercicio...'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)